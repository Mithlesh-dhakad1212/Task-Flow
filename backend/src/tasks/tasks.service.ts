import { Injectable, NotFoundException } from '@nestjs/common';
import { type Prisma, TaskStatus } from '@prisma/client';
import { pageMeta } from '../common/dto/pagination.dto';
import { formatDateOnly, parseDateOnly } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import {
  type CreateTaskDto,
  type ListTasksQueryDto,
  type TaskDto,
  type TaskListDto,
  type UpdateTaskDto,
} from './dto/task.dto';

const taskInclude = { project: { select: { id: true, name: true, color: true } } } as const;
type TaskWithProject = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

/**
 * Tasks have no owner column of their own: ownership is always checked
 * through `project.userId`, so a task can never be orphaned from, or
 * disagree with, its project's owner.
 */
@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  async list(userId: string, q: ListTasksQueryDto, today: Date): Promise<TaskListDto> {
    const where = this.buildWhere(userId, q, today);
    const orderBy: Prisma.TaskOrderByWithRelationInput[] = [{ [q.sortBy]: q.order }];
    // Stable secondary ordering so pagination never skips or repeats rows.
    if (q.sortBy !== 'createdAt') orderBy.push({ createdAt: 'desc' });
    orderBy.push({ id: 'asc' });

    const [total, tasks] = await this.prisma.$transaction([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        include: taskInclude,
        orderBy,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return { data: tasks.map((t) => this.toDto(t, today)), meta: pageMeta(q.page, q.limit, total) };
  }

  async get(userId: string, id: string, today: Date): Promise<TaskDto> {
    return this.toDto(await this.findOwned(userId, id), today);
  }

  async create(userId: string, dto: CreateTaskDto, today: Date): Promise<TaskDto> {
    await this.projects.assertOwned(userId, dto.projectId);
    const status = dto.status ?? TaskStatus.TODO;

    const [task] = await this.prisma.$transaction([
      this.prisma.task.create({
        data: {
          projectId: dto.projectId,
          title: dto.title,
          description: dto.description ?? '',
          status,
          priority: dto.priority,
          dueDate: parseDateOnly(dto.dueDate),
          completedAt: status === TaskStatus.DONE ? new Date() : null,
        },
        include: taskInclude,
      }),
      this.touchProject(dto.projectId),
    ]);
    return this.toDto(task, today);
  }

  async update(userId: string, id: string, dto: UpdateTaskDto, today: Date): Promise<TaskDto> {
    const current = await this.findOwned(userId, id);
    if (dto.projectId && dto.projectId !== current.projectId) {
      // Moving a task: the destination must belong to the same user too.
      await this.projects.assertOwned(userId, dto.projectId);
    }

    const data: Prisma.TaskUncheckedUpdateInput = {
      ...(dto.projectId !== undefined && { projectId: dto.projectId }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.dueDate !== undefined && { dueDate: parseDateOnly(dto.dueDate) }),
    };
    if (dto.status !== undefined && dto.status !== current.status) {
      data.status = dto.status;
      data.completedAt = dto.status === TaskStatus.DONE ? new Date() : null;
    }

    const touched = new Set([current.projectId, dto.projectId ?? current.projectId]);
    const [task] = await this.prisma.$transaction([
      this.prisma.task.update({ where: { id: current.id }, data, include: taskInclude }),
      ...[...touched].map((pid) => this.touchProject(pid)),
    ]);
    return this.toDto(task, today);
  }

  async remove(userId: string, id: string): Promise<void> {
    const task = await this.findOwned(userId, id);
    await this.prisma.$transaction([
      this.prisma.task.delete({ where: { id: task.id } }),
      this.touchProject(task.projectId),
    ]);
  }

  private async findOwned(userId: string, id: string): Promise<TaskWithProject> {
    const task = await this.prisma.task.findFirst({ where: { id, project: { userId } }, include: taskInclude });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  /** Keeps "recently updated" project ordering meaningful when its tasks change. */
  private touchProject(projectId: string) {
    return this.prisma.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } });
  }

  private buildWhere(userId: string, q: ListTasksQueryDto, today: Date): Prisma.TaskWhereInput {
    const and: Prisma.TaskWhereInput[] = [{ project: { userId } }];
    if (q.projectId) and.push({ projectId: q.projectId });
    if (q.status?.length) and.push({ status: { in: q.status } });
    if (q.priority?.length) and.push({ priority: { in: q.priority } });
    if (q.search) and.push({ title: { contains: q.search, mode: 'insensitive' } });
    if (q.overdue === true) and.push({ status: { not: TaskStatus.DONE }, dueDate: { lt: today } });
    if (q.overdue === false) and.push({ OR: [{ status: TaskStatus.DONE }, { dueDate: { gte: today } }] });
    return { AND: and };
  }

  private toDto(task: TaskWithProject, today: Date): TaskDto {
    return {
      id: task.id,
      projectId: task.projectId,
      project: task.project,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: formatDateOnly(task.dueDate),
      isOverdue: task.status !== TaskStatus.DONE && task.dueDate < today,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
