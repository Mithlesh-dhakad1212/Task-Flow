import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';
import { type DashboardDto } from './dto/dashboard.dto';

const PROJECTS_SHOWN = 5;
const TASKS_SHOWN = 5;

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
  async summary(userId: string, today: Date): Promise<DashboardDto> {
    const owned = { project: { userId } };
    const open = { not: TaskStatus.DONE };

    const [projectCount, byStatus, overdue, dueToday, recentProjects] = await this.prisma.$transaction([
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
    ]);

    const count = (s: TaskStatus) =>
      (byStatus.find((r) => r.status === s)?._count as { _all: number } | undefined)?._all ?? 0;
    const todo = count(TaskStatus.TODO);
    const inProgress = count(TaskStatus.IN_PROGRESS);
    const completed = count(TaskStatus.DONE);
    const total = todo + inProgress + completed;

    const [stats, upcoming, overdueTasks] = await Promise.all([
      this.projects.statsFor(
        recentProjects.map((p) => p.id),
        today,
      ),
      this.tasks.list(
        userId,
        { status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS], overdue: false, sortBy: 'dueDate', order: 'asc', page: 1, limit: TASKS_SHOWN },
        today,
      ),
      this.tasks.list(
        userId,
        { overdue: true, sortBy: 'dueDate', order: 'asc', page: 1, limit: TASKS_SHOWN },
        today,
      ),
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
    };
  }
}
