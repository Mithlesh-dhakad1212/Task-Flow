import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, registerUser, resetDatabase } from './utils';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns zeros for a brand-new account', async () => {
    const { agent } = await registerUser(app);
    const res = await agent.get('/api/dashboard').expect(200);
    expect(res.body.totals).toEqual({
      projects: 0,
      tasks: 0,
      todo: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      dueToday: 0,
      completionRate: 0,
    });
    expect(res.body.upcoming).toEqual([]);
  });

  it("aggregates only the caller's data and computes overdue relative to the caller's timezone", async () => {
    const { agent } = await registerUser(app, 'Owner');
    const other = await registerUser(app, 'Other');

    // Fix "now" by choosing explicit dates relative to the timezone's today.
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Kiritimati' }).format(new Date());
    const shift = (n: number) => {
      const d = new Date(`${today}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + n);
      return d.toISOString().slice(0, 10);
    };

    const p1 = (await agent.post('/api/projects').send({ name: 'One' })).body.id;
    const p2 = (await agent.post('/api/projects').send({ name: 'Two' })).body.id;
    const tasks = [
      { projectId: p1, title: 'a', status: 'DONE', dueDate: shift(-2) }, // done, not overdue
      { projectId: p1, title: 'b', status: 'TODO', dueDate: shift(-1) }, // overdue
      { projectId: p1, title: 'c', status: 'IN_PROGRESS', dueDate: shift(0) }, // due today
      { projectId: p2, title: 'd', status: 'TODO', dueDate: shift(5) },
    ];
    for (const t of tasks) await agent.post('/api/tasks').send(t).expect(201);

    // Noise from another user must not leak into the numbers.
    const otherProject = (await other.agent.post('/api/projects').send({ name: 'Noise' })).body.id;
    await other.agent.post('/api/tasks').send({ projectId: otherProject, title: 'x', dueDate: shift(-10) });

    // UTC+14: the earliest timezone on Earth, to prove the header is honoured.
    const res = await agent.get('/api/dashboard').set('X-Timezone', 'Pacific/Kiritimati').expect(200);

    expect(res.body.totals).toEqual({
      projects: 2,
      tasks: 4,
      todo: 2,
      inProgress: 1,
      completed: 1,
      overdue: 1,
      dueToday: 1,
      completionRate: 25,
    });
    expect(res.body.overdue.map((t: { title: string }) => t.title)).toEqual(['b']);
    expect(res.body.upcoming.map((t: { title: string }) => t.title)).toEqual(['c', 'd']);
    const one = res.body.projects.find((p: { name: string }) => p.name === 'One');
    expect(one.stats).toMatchObject({ total: 3, done: 1, overdue: 1, progress: 33 });
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer()).get('/api/dashboard').expect(401);
  });
});
