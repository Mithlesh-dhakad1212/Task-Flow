import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Project, TaskStatus } from '@prisma/client';
import { pageMeta } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  type CreateProjectDto,
  type ListProjectsQueryDto,
  type ProjectDto,
  type ProjectListDto,
  type ProjectStatsDto,
  type UpdateProjectDto,
} from './dto/project.dto';

const emptyStats = (): ProjectStatsDto => ({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0, progress: 0 });

/**
 * Every query is scoped by `userId`. A project that exists but belongs to
 * someone else is indistinguishable from one that does not exist (404), so
 * ids of other users' data cannot be probed.
 */
@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, q: ListProjectsQueryDto, today: Date): Promise<ProjectListDto> {
    const where: Prisma.ProjectWhereInput = {
      userId,
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { description: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, projects] = await this.prisma.$transaction([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        orderBy: [{ [q.sortBy]: q.order }, { id: 'asc' }],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    const stats = await this.statsFor(
      projects.map((p) => p.id),
      today,
    );
    return {
      data: projects.map((p) => this.toDto(p, stats.get(p.id))),
      meta: pageMeta(q.page, q.limit, total),
    };
  }

  async get(userId: string, id: string, today: Date): Promise<ProjectDto> {
    const project = await this.prisma.project.findFirst({ where: { id, userId } });
    if (!project) throw new NotFoundException('Project not found');
    const stats = await this.statsFor([id], today);
    return this.toDto(project, stats.get(id));
  }

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectDto> {
    const project = await this.prisma.project.create({
      data: { userId, name: dto.name, description: dto.description ?? '', color: dto.color ?? 'blue' },
    });
    return this.toDto(project);
  }

  async update(userId: string, id: string, dto: UpdateProjectDto, today: Date): Promise<ProjectDto> {
    try {
      // Owner is part of the unique filter, so this is a single atomic, scoped write.
      await this.prisma.project.update({ where: { id, userId }, data: dto });
    } catch (err) {
      throw this.mapNotFound(err);
    }
    return this.get(userId, id, today);
  }

  async remove(userId: string, id: string): Promise<void> {
    // Tasks are removed by the ON DELETE CASCADE foreign key.
    const { count } = await this.prisma.project.deleteMany({ where: { id, userId } });
    if (count === 0) throw new NotFoundException('Project not found');
  }

  /** Throws 404 unless the project exists and belongs to the user. */
  async assertOwned(userId: string, projectId: string): Promise<void> {
    const exists = await this.prisma.project.count({ where: { id: projectId, userId } });
    if (!exists) throw new NotFoundException('Project not found');
  }

  /**
   * Task counters for a page of projects in two grouped queries
   * (instead of N+1 per-project counts).
   */
  async statsFor(projectIds: string[], today: Date): Promise<Map<string, ProjectStatsDto>> {
    const result = new Map<string, ProjectStatsDto>();
    if (projectIds.length === 0) return result;

    const [byStatus, overdue] = await this.prisma.$transaction([
      this.prisma.task.groupBy({
        by: ['projectId', 'status'],
        where: { projectId: { in: projectIds } },
        _count: { _all: true },
        orderBy: { projectId: 'asc' },
      }),
      this.prisma.task.groupBy({
        by: ['projectId'],
        where: { projectId: { in: projectIds }, status: { not: TaskStatus.DONE }, dueDate: { lt: today } },
        _count: { _all: true },
        orderBy: { projectId: 'asc' },
      }),
    ]);

    for (const row of byStatus) {
      const s = result.get(row.projectId) ?? emptyStats();
      const n = (row._count as { _all: number })._all;
      s.total += n;
      if (row.status === TaskStatus.TODO) s.todo += n;
      if (row.status === TaskStatus.IN_PROGRESS) s.inProgress += n;
      if (row.status === TaskStatus.DONE) s.done += n;
      result.set(row.projectId, s);
    }
    for (const row of overdue) {
      const s = result.get(row.projectId) ?? emptyStats();
      s.overdue = (row._count as { _all: number })._all;
      result.set(row.projectId, s);
    }
    for (const s of result.values()) {
      s.progress = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100);
    }
    return result;
  }

  private toDto(project: Project, stats: ProjectStatsDto = emptyStats()): ProjectDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      stats,
    };
  }

  private mapNotFound(err: unknown): unknown {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return new NotFoundException('Project not found');
    }
    return err;
  }
}
