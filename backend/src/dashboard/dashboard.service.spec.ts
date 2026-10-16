import { TaskStatus } from '@prisma/client';
import { type PrismaService } from '../prisma/prisma.service';
import { type ProjectsService } from '../projects/projects.service';
import { type TasksService } from '../tasks/tasks.service';
import { ACTIVITY_DAYS, DashboardService } from './dashboard.service';

describe('DashboardService.completionActivity', () => {
  const findMany = jest.fn();
  const service = new DashboardService(
    { task: { findMany } } as unknown as PrismaService,
    {} as ProjectsService,
    {} as TasksService,
  );
  const today = new Date('2026-10-16T00:00:00.000Z');

  beforeEach(() => findMany.mockReset());

  it('buckets completions by the caller-timezone day, including legacy IANA aliases', async () => {
    findMany.mockResolvedValue([
      // 20:00 UTC on the 15th is 01:30 on the 16th in India.
      { completedAt: new Date('2026-10-15T20:00:00.000Z') },
      { completedAt: new Date('2026-10-15T10:00:00.000Z') },
      { completedAt: new Date('2026-10-16T05:00:00.000Z') },
    ]);

    // "Asia/Calcutta" is what many browsers report; Postgres on Debian 13 rejects it.
    const activity = await service.completionActivity('user-1', today, 'Asia/Calcutta');

    expect(activity).toHaveLength(ACTIVITY_DAYS);
    expect(activity.at(-1)).toEqual({ date: '2026-10-16', completed: 2 });
    expect(activity.at(-2)).toEqual({ date: '2026-10-15', completed: 1 });
    expect(activity[0].date).toBe('2026-10-03');
  });

  it('only asks the database for owned, done tasks in a window that covers any UTC offset', async () => {
    findMany.mockResolvedValue([]);
    await service.completionActivity('user-1', today, 'UTC');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        project: { userId: 'user-1' },
        status: TaskStatus.DONE,
        completedAt: { gte: new Date('2026-10-02T00:00:00.000Z'), lt: new Date('2026-10-18T00:00:00.000Z') },
      },
      select: { completedAt: true },
    });
  });

  it('ignores completions outside the 14-day window', async () => {
    findMany.mockResolvedValue([{ completedAt: new Date('2026-10-02T12:00:00.000Z') }]);
    const activity = await service.completionActivity('user-1', today, 'UTC');
    expect(activity.every((d) => d.completed === 0)).toBe(true);
  });
});
