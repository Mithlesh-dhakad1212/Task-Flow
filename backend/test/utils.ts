import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

export async function createTestApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: ['error'] });
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export async function resetDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "tasks", "projects", "sessions", "users" CASCADE');
}

let counter = 0;

/** Registers a fresh user and returns a supertest agent that carries their cookies. */
export async function registerUser(app: INestApplication, name = 'Test User') {
  counter += 1;
  const email = `user${counter}-${Date.now()}@example.com`;
  const agent = request.agent(app.getHttpServer());
  const res = await agent.post('/api/auth/register').send({ name, email, password: 'Password123' }).expect(201);
  return { agent, email, user: res.body.user as { id: string }, accessToken: res.body.accessToken as string };
}

export function cookieValue(setCookie: string[] | string | undefined, name: string): string | undefined {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const raw = list.find((c) => c.startsWith(`${name}=`));
  return raw?.split(';')[0].slice(name.length + 1);
}
