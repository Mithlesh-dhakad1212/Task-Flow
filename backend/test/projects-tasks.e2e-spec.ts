import { type INestApplication } from '@nestjs/common';
import type TestAgent from 'supertest/lib/agent';
import { type PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, registerUser, resetDatabase } from './utils';

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

describe('Projects & Tasks (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let alice: TestAgent;
  let bob: TestAgent;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDatabase(prisma);
    alice = (await registerUser(app, 'Alice')).agent;
    bob = (await registerUser(app, 'Bob')).agent;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('project CRUD', () => {
    let projectId: string;

    it('creates a project with defaults', async () => {
      const res = await alice.post('/api/projects').send({ name: '  Website  ' }).expect(201);
      projectId = res.body.id;
      expect(res.body).toMatchObject({
        name: 'Website',
        description: '',
        color: 'blue',
        stats: { total: 0, done: 0, progress: 0 },
      });
      expect(new Date(res.body.createdAt).getTime()).not.toBeNaN();
    });

    it('lists, retrieves and updates it', async () => {
      const list = await alice.get('/api/projects').expect(200);
      expect(list.body.meta).toMatchObject({ total: 1, page: 1 });

      await alice.get(`/api/projects/${projectId}`).expect(200);

      const updated = await alice
        .patch(`/api/projects/${projectId}`)
        .send({ description: 'New site', color: 'violet' })
        .expect(200);
      expect(updated.body).toMatchObject({ name: 'Website', description: 'New site', color: 'violet' });
    });

    it('rejects unknown fields and invalid values', async () => {
      const res = await alice.post('/api/projects').send({ name: '', userId: 'hijack' }).expect(400);
      expect(res.body.details.map((d: { field: string }) => d.field).sort()).toEqual(['name', 'userId']);
    });

    it('searches and paginates', async () => {
      await alice.post('/api/projects').send({ name: 'Mobile App' }).expect(201);
      await alice.post('/api/projects').send({ name: 'Marketing', description: 'mobile ads' }).expect(201);

      const search = await alice.get('/api/projects?search=MOBILE&sortBy=name&order=asc').expect(200);
      expect(search.body.data.map((p: { name: string }) => p.name)).toEqual(['Marketing', 'Mobile App']);

      const page2 = await alice.get('/api/projects?limit=2&page=2&sortBy=name&order=asc').expect(200);
      expect(page2.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
      expect(page2.body.data).toHaveLength(1);
    });

    it('deletes a project and cascades its tasks', async () => {
      const p = await alice.post('/api/projects').send({ name: 'Temp' }).expect(201);
      const t = await alice
        .post('/api/tasks')
        .send({ projectId: p.body.id, title: 'Doomed', dueDate: daysFromNow(1) })
        .expect(201);

      await alice.delete(`/api/projects/${p.body.id}`).expect(204);
      await alice.get(`/api/projects/${p.body.id}`).expect(404);
      await alice.get(`/api/tasks/${t.body.id}`).expect(404);
      expect(await prisma.task.count({ where: { id: t.body.id } })).toBe(0);
    });
  });

  describe('ownership isolation', () => {
    let aliceProject: string;
    let aliceTask: string;

    beforeAll(async () => {
      aliceProject = (await alice.post('/api/projects').send({ name: 'Secret plans' })).body.id;
      aliceTask = (
        await alice.post('/api/tasks').send({ projectId: aliceProject, title: 'Secret task', dueDate: daysFromNow(3) })
      ).body.id;
    });

    it("hides another user's projects (404, not 403, so ids cannot be probed)", async () => {
      await bob.get(`/api/projects/${aliceProject}`).expect(404);
      await bob.patch(`/api/projects/${aliceProject}`).send({ name: 'pwned' }).expect(404);
      await bob.delete(`/api/projects/${aliceProject}`).expect(404);
      const list = await bob.get('/api/projects').expect(200);
      expect(list.body.data).toHaveLength(0);
    });

    it("hides another user's tasks", async () => {
      await bob.get(`/api/tasks/${aliceTask}`).expect(404);
      await bob.patch(`/api/tasks/${aliceTask}`).send({ status: 'DONE' }).expect(404);
      await bob.delete(`/api/tasks/${aliceTask}`).expect(404);
      const list = await bob.get('/api/tasks').expect(200);
      expect(list.body.meta.total).toBe(0);
    });

    it("prevents creating tasks in, or moving tasks into, another user's project", async () => {
      await bob.post('/api/tasks').send({ projectId: aliceProject, title: 'Intrusion', dueDate: daysFromNow(1) }).expect(404);

      const bobProject = (await bob.post('/api/projects').send({ name: 'Bob project' })).body.id;
      const bobTask = (
        await bob.post('/api/tasks').send({ projectId: bobProject, title: 'Mine', dueDate: daysFromNow(1) })
      ).body.id;
      await bob.patch(`/api/tasks/${bobTask}`).send({ projectId: aliceProject }).expect(404);
    });

    it('leaves the victim data untouched', async () => {
      const task = await alice.get(`/api/tasks/${aliceTask}`).expect(200);
      expect(task.body).toMatchObject({ title: 'Secret task', status: 'TODO' });
    });
  });

  describe('task lifecycle, filtering and search', () => {
    let projectId: string;

    beforeAll(async () => {
      projectId = (await alice.post('/api/projects').send({ name: 'Filters' })).body.id;
      const seed = [
        { title: 'Design homepage', status: 'TODO', priority: 'HIGH', dueDate: daysFromNow(-3) },
        { title: 'Design logo', status: 'IN_PROGRESS', priority: 'LOW', dueDate: daysFromNow(2) },
        { title: 'Write copy', status: 'DONE', priority: 'HIGH', dueDate: daysFromNow(-5) },
        { title: 'Set up analytics', status: 'TODO', priority: 'MEDIUM', dueDate: daysFromNow(7) },
      ];
      for (const t of seed) await alice.post('/api/tasks').send({ projectId, ...t }).expect(201);
    });

    const titles = (body: { data: { title: string }[] }) => body.data.map((t) => t.title).sort();

    it('validates task fields', async () => {
      const res = await alice
        .post('/api/tasks')
        .send({ projectId, title: '', status: 'BLOCKED', priority: 'URGENT', dueDate: '15/10/2026' })
        .expect(400);
      expect(res.body.details.map((d: { field: string }) => d.field).sort()).toEqual([
        'dueDate',
        'priority',
        'status',
        'title',
      ]);
    });

    it('filters by status, priority and title search — combined', async () => {
      const q = (s: string) => alice.get(`/api/tasks?projectId=${projectId}&${s}`).expect(200);

      expect(titles((await q('status=TODO')).body)).toEqual(['Design homepage', 'Set up analytics']);
      expect(titles((await q('priority=HIGH')).body)).toEqual(['Design homepage', 'Write copy']);
      expect(titles((await q('search=design')).body)).toEqual(['Design homepage', 'Design logo']);
      expect(titles((await q('search=DESIGN&status=TODO&priority=HIGH')).body)).toEqual(['Design homepage']);
      expect(titles((await q('status=TODO,IN_PROGRESS&priority=LOW')).body)).toEqual(['Design logo']);
      expect((await q('search=nothing-matches')).body.data).toEqual([]);
    });

    it('computes overdue as "not done and due before today"', async () => {
      const res = await alice.get(`/api/tasks?projectId=${projectId}&overdue=true`).expect(200);
      // "Write copy" is past due but DONE, so it is not overdue.
      expect(titles(res.body)).toEqual(['Design homepage']);
      expect(res.body.data[0].isOverdue).toBe(true);
    });

    it('sorts by priority', async () => {
      const res = await alice.get(`/api/tasks?projectId=${projectId}&sortBy=priority&order=desc`).expect(200);
      expect(res.body.data.map((t: { priority: string }) => t.priority)).toEqual(['HIGH', 'HIGH', 'MEDIUM', 'LOW']);
    });

    it('rejects invalid filter values', async () => {
      await alice.get('/api/tasks?status=SOMEDAY').expect(400);
      await alice.get('/api/tasks?limit=1000').expect(400);
      await alice.get('/api/tasks?projectId=123').expect(400);
    });

    it('tracks completedAt when status changes and updates project progress', async () => {
      const created = await alice
        .post('/api/tasks')
        .send({ projectId, title: 'Ship it', dueDate: daysFromNow(1) })
        .expect(201);
      expect(created.body).toMatchObject({ status: 'TODO', priority: 'MEDIUM', completedAt: null });

      const done = await alice.patch(`/api/tasks/${created.body.id}`).send({ status: 'DONE' }).expect(200);
      expect(done.body.completedAt).not.toBeNull();

      const project = await alice.get(`/api/projects/${projectId}`).expect(200);
      expect(project.body.stats).toMatchObject({ total: 5, done: 2, todo: 2, inProgress: 1, overdue: 1, progress: 40 });

      const reopened = await alice.patch(`/api/tasks/${created.body.id}`).send({ status: 'IN_PROGRESS' }).expect(200);
      expect(reopened.body.completedAt).toBeNull();

      await alice.delete(`/api/tasks/${created.body.id}`).expect(204);
      await alice.get(`/api/tasks/${created.body.id}`).expect(404);
    });
  });
});
