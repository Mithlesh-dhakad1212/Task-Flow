import { Injectable } from '@nestjs/common';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { addDays, formatDateOnly } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';
import { type ActivityPointDto, type DashboardDto } from './dto/dashboard.dto';

const PROJECTS_SHOWN = 5;
const TASKS_SHOWN = 5;
export const ACTIVITY_DAYS = 14;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly tasks: TasksService,
  ) {}

  /**
   * All counters are computed in the database (COUNT / GROUP BY) within one
   * read transaction, so the numbers are mutually consistent.
   */
  async summary(userId: string, today: Date, timeZone = 'UTC'): Promise<DashboardDto> {
    const owned = { project: { userId } };
    const open = { not: TaskStatus.DONE };

    const [projectCount, byStatus, overdue, dueToday, recentProjects, byPriority] = await this.prisma.$transaction([
      this.prisma.project.count({ where: { userId } }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: owned,
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
      this.prisma.task.count({ where: { ...owned, status: open, dueDate: { lt: today } } }),
      this.prisma.task.count({ where: { ...owned, status: open, dueDate: today } }),
      this.prisma.project.findMany({
        where: { userId },
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        take: PROJECTS_SHOWN,
        select: { id: true, name: true, color: true },
      }),
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { ...owned, status: open },
        _count: { _all: true },
        orderBy: { priority: 'asc' },
      }),
    ]);

    const count = (s: TaskStatus) =>
      (byStatus.find((r) => r.status === s)?._count as { _all: number } | undefined)?._all ?? 0;
    const openCount = (p: TaskPriority) =>
      (byPriority.find((r) => r.priority === p)?._count as { _all: number } | undefined)?._all ?? 0;
    const todo = count(TaskStatus.TODO);
    const inProgress = count(TaskStatus.IN_PROGRESS);
    const completed = count(TaskStatus.DONE);
    const total = todo + inProgress + completed;

    const [stats, upcoming, overdueTasks, activity] = await Promise.all([
      this.projects.statsFor(
        recentProjects.map((p) => p.id),
        today,
      ),
      this.tasks.list(
        userId,
        {
          status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
          overdue: false,
          sortBy: 'dueDate',
          order: 'asc',
          page: 1,
          limit: TASKS_SHOWN,
        },
        today,
      ),
      this.tasks.list(userId, { overdue: true, sortBy: 'dueDate', order: 'asc', page: 1, limit: TASKS_SHOWN }, today),
      this.completionActivity(userId, today, timeZone),
    ]);

    return {
      totals: {
        projects: projectCount,
        tasks: total,
        todo,
        inProgress,
        completed,
        overdue,
        dueToday,
        completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
      },
      projects: recentProjects.map((p) => ({
        ...p,
        stats: stats.get(p.id) ?? { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0, progress: 0 },
      })),
      upcoming: upcoming.data,
      overdue: overdueTasks.data,
      activity,
      openByPriority: {
        HIGH: openCount(TaskPriority.HIGH),
        MEDIUM: openCount(TaskPriority.MEDIUM),
        LOW: openCount(TaskPriority.LOW),
      },
    };
  }

  /**
   * Tasks completed per calendar day (in the caller's timezone) over the last
   * ACTIVITY_DAYS days. The day bucketing has to happen in SQL with
   * `AT TIME ZONE`, so this is a parameterised raw query; days with no
   * completions are filled with zeros in code.
   */
  async completionActivity(userId: string, today: Date, timeZone: string): Promise<ActivityPointDto[]> {
    const since = addDays(today, -(ACTIVITY_DAYS - 1));
    const rows = await this.prisma.$queryRaw<{ day: Date; completed: number }[]>`
      SELECT (t.completed_at AT TIME ZONE ${timeZone})::date AS day, COUNT(*)::int AS completed
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE p.user_id = ${userId}::uuid
        AND t.status = 'DONE'
        AND t.completed_at IS NOT NULL
        AND (t.completed_at AT TIME ZONE ${timeZone})::date BETWEEN ${formatDateOnly(since)}::date AND ${formatDateOnly(today)}::date
      GROUP BY day
      ORDER BY day`;

    const byDay = new Map(rows.map((r) => [formatDateOnly(r.day), r.completed]));
    return Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
      const date = formatDateOnly(addDays(since, i));
      return { date, completed: byDay.get(date) ?? 0 };
    });
  }
}
