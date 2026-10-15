import { NotFoundException } from '@nestjs/common';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { type PrismaService } from '../prisma/prisma.service';
import { type ProjectsService } from '../projects/projects.service';
import { type ListTasksQueryDto } from './dto/task.dto';
import { TasksService } from './tasks.service';

const TODAY = new Date('2026-10-15T00:00:00.000Z');

function taskRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 't1',
    projectId: 'p1',
    project: { id: 'p1', name: 'Project', color: 'blue' },
    title: 'Task',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2026-10-14T00:00:00.000Z'),
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('TasksService', () => {
  let prisma: {
    task: { findFirst: jest.Mock; findMany: jest.Mock; count: jest.Mock; update: jest.Mock; create: jest.Mock };
    project: { update: jest.Mock };
    $transaction: jest.Mock;
  };
  let projects: { assertOwned: jest.Mock };
  let service: TasksService;

  beforeEach(() => {
    prisma = {
      task: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn(),
        create: jest.fn(),
      },
      project: { update: jest.fn() },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    projects = { assertOwned: jest.fn().mockResolvedValue(undefined) };
    service = new TasksService(prisma as unknown as PrismaService, projects as unknown as ProjectsService);
  });

  const baseQuery: ListTasksQueryDto = { page: 1, limit: 20, order: 'desc', sortBy: 'createdAt' };

  describe('list', () => {
    it('always scopes the query to the owner', async () => {
      await service.list('user-1', baseQuery, TODAY);
      const where = prisma.task.findMany.mock.calls[0][0].where;
      expect(where.AND[0]).toEqual({ project: { userId: 'user-1' } });
    });

    it('combines search, status and priority filters with AND', async () => {
      await service.list(
        'user-1',
        { ...baseQuery, search: 'design', status: [TaskStatus.TODO], priority: [TaskPriority.HIGH] },
        TODAY,
      );
      const { AND } = prisma.task.findMany.mock.calls[0][0].where;
      expect(AND).toEqual(
        expect.arrayContaining([
          { status: { in: [TaskStatus.TODO] } },
          { priority: { in: [TaskPriority.HIGH] } },
          { title: { contains: 'design', mode: 'insensitive' } },
        ]),
      );
    });

    it('defines overdue as not done and due strictly before today', async () => {
      await service.list('user-1', { ...baseQuery, overdue: true }, TODAY);
      const { AND } = prisma.task.findMany.mock.calls[0][0].where;
      expect(AND).toContainEqual({ status: { not: TaskStatus.DONE }, dueDate: { lt: TODAY } });
    });

    it('marks tasks overdue in the response and serializes due dates as YYYY-MM-DD', async () => {
      prisma.task.findMany.mockResolvedValue([
        taskRow({ id: 'late' }),
        taskRow({ id: 'done-late', status: TaskStatus.DONE }),
        taskRow({ id: 'today', dueDate: TODAY }),
      ]);
      const { data } = await service.list('user-1', baseQuery, TODAY);
      expect(data.map((t) => [t.id, t.isOverdue])).toEqual([
        ['late', true],
        ['done-late', false],
        ['today', false],
      ]);
      expect(data[0].dueDate).toBe('2026-10-14');
    });
  });

  describe('update', () => {
    it("returns 404 for a task the user doesn't own", async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      await expect(service.update('user-1', 't1', { status: TaskStatus.DONE }, TODAY)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.task.findFirst.mock.calls[0][0].where).toEqual({ id: 't1', project: { userId: 'user-1' } });
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('verifies ownership of the destination project when moving a task', async () => {
      prisma.task.findFirst.mockResolvedValue(taskRow());
      projects.assertOwned.mockRejectedValue(new NotFoundException('Project not found'));
      await expect(service.update('user-1', 't1', { projectId: 'p2' }, TODAY)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(projects.assertOwned).toHaveBeenCalledWith('user-1', 'p2');
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('sets completedAt when moving to DONE and clears it when leaving DONE', async () => {
      prisma.task.findFirst.mockResolvedValue(taskRow());
      prisma.task.update.mockResolvedValue(taskRow({ status: TaskStatus.DONE }));
      await service.update('user-1', 't1', { status: TaskStatus.DONE }, TODAY);
      expect(prisma.task.update.mock.calls[0][0].data).toMatchObject({
        status: TaskStatus.DONE,
        completedAt: expect.any(Date),
      });

      prisma.task.findFirst.mockResolvedValue(taskRow({ status: TaskStatus.DONE, completedAt: new Date() }));
      await service.update('user-1', 't1', { status: TaskStatus.TODO }, TODAY);
      expect(prisma.task.update.mock.calls[1][0].data).toMatchObject({ status: TaskStatus.TODO, completedAt: null });
    });

    it('does not reset completedAt when an unrelated field changes', async () => {
      prisma.task.findFirst.mockResolvedValue(taskRow({ status: TaskStatus.DONE, completedAt: new Date() }));
      prisma.task.update.mockResolvedValue(taskRow({ status: TaskStatus.DONE }));
      await service.update('user-1', 't1', { title: 'Renamed', status: TaskStatus.DONE }, TODAY);
      expect(prisma.task.update.mock.calls[0][0].data).toEqual({ title: 'Renamed' });
    });
  });

  it('create refuses a project the user does not own', async () => {
    projects.assertOwned.mockRejectedValue(new NotFoundException('Project not found'));
    await expect(
      service.create('user-1', { projectId: 'p9', title: 'x', dueDate: '2026-10-20' }, TODAY),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.task.create).not.toHaveBeenCalled();
  });
});
