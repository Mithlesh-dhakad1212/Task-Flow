/**
 * Demo data. Idempotent: re-running leaves an existing demo workspace alone
 * unless SEED_RESET=true, in which case the demo user's projects are rebuilt.
 *
 *   Login: demo@taskflow.dev / Password123!
 */
import { PrismaClient, TaskPriority as P, TaskStatus as S } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@taskflow.dev';
const DEMO_PASSWORD = 'Password123!';

/** YYYY-MM-DD `offset` days from today (UTC) as a DATE value. */
function day(offset: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

type SeedTask = [title: string, status: S, priority: P, dueInDays: number, description?: string];

const projects: { name: string; description: string; color: string; tasks: SeedTask[] }[] = [
  {
    name: 'Website Redesign',
    description: 'Modernize the company website with a new design system and faster pages.',
    color: 'blue',
    tasks: [
      ['Audit current site analytics', S.DONE, P.MEDIUM, -20],
      ['Define information architecture', S.DONE, P.HIGH, -16],
      ['Create wireframes', S.DONE, P.MEDIUM, -12],
      ['Design system tokens', S.DONE, P.LOW, -10],
      ['Design homepage', S.DONE, P.HIGH, -7, 'Hero, social proof, features and pricing sections.'],
      ['Design pricing page', S.DONE, P.MEDIUM, -5],
      ['Responsive navigation', S.DONE, P.MEDIUM, -4],
      ['Accessibility review', S.DONE, P.HIGH, -2],
      ['Implement UI components', S.IN_PROGRESS, P.HIGH, 3],
      ['Migrate blog content', S.IN_PROGRESS, P.LOW, 9],
      ['Set up analytics', S.TODO, P.LOW, -1, 'Overdue: needs the new tag manager container.'],
      ['Launch checklist', S.TODO, P.MEDIUM, 14],
    ],
  },
  {
    name: 'Mobile App',
    description: 'iOS and Android companion application for TaskFlow.',
    color: 'violet',
    tasks: [
      ['Project setup', S.DONE, P.LOW, -18],
      ['Design system', S.DONE, P.LOW, -11],
      ['Push notifications spike', S.DONE, P.MEDIUM, -9],
      ['Offline storage', S.DONE, P.HIGH, -6],
      ['Login screen', S.DONE, P.MEDIUM, -3],
      ['Integrate APIs', S.IN_PROGRESS, P.MEDIUM, 2],
      ['Task list screen', S.IN_PROGRESS, P.HIGH, 0],
      ['App store assets', S.TODO, P.LOW, 21],
    ],
  },
  {
    name: 'Marketing Campaign',
    description: 'Launch campaign for the Q4 product release.',
    color: 'emerald',
    tasks: [
      ['Campaign brief', S.DONE, P.HIGH, -14],
      ['Landing page copy', S.DONE, P.MEDIUM, -8],
      ['Email sequence', S.DONE, P.MEDIUM, -3],
      ['Paid social creatives', S.TODO, P.HIGH, -2, 'Blocked on final product screenshots.'],
    ],
  },
  {
    name: 'Internal Tools',
    description: 'Build internal tools to improve team productivity.',
    color: 'amber',
    tasks: [
      ['User authentication', S.DONE, P.HIGH, -10],
      ['Admin audit log', S.DONE, P.MEDIUM, -6],
      ['Build dashboard', S.IN_PROGRESS, P.MEDIUM, 5],
      ['CSV export', S.TODO, P.LOW, 10],
      ['Role-based access', S.TODO, P.HIGH, 12],
      ['On-call rota bot', S.TODO, P.LOW, -5],
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: 'Alex Morgan', passwordHash },
  });

  const existing = await prisma.project.count({ where: { userId: user.id } });
  if (existing > 0 && process.env.SEED_RESET !== 'true') {
    console.log(`Demo workspace already present (${existing} projects). Set SEED_RESET=true to rebuild.`);
    return;
  }
  await prisma.project.deleteMany({ where: { userId: user.id } });

  // Stagger timestamps so "recently updated" ordering looks natural.
  for (const [i, p] of projects.entries()) {
    const touched = new Date(Date.now() - i * 3_600_000);
    await prisma.project.create({
      data: {
        userId: user.id,
        name: p.name,
        description: p.description,
        color: p.color,
        createdAt: day(-30 + i),
        updatedAt: touched,
        tasks: {
          create: p.tasks.map(([title, status, priority, due, description]) => ({
            title,
            status,
            priority,
            description: description ?? '',
            dueDate: day(due),
            // Spread completions over the last two weeks so the activity chart has shape.
            completedAt: status === S.DONE ? new Date(day(Math.max(due, -13)).getTime() + 15 * 3_600_000) : null,
          })),
        },
      },
    });
  }

  const tasks = projects.reduce((n, p) => n + p.tasks.length, 0);
  console.log(`Seeded ${projects.length} projects and ${tasks} tasks for ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
