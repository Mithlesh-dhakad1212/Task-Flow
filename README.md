# TaskFlow

A project-management workspace inspired by ClickUp: register, create projects, plan tasks on a drag-and-drop Kanban board, and track progress on a live dashboard. It ships in light and dark mode with selectable accent colours.

**Stack:** Next.js 15 (React 19, TanStack Query, Tailwind) · NestJS 11 · PostgreSQL 16 + Prisma 6 · Docker Compose · GitHub Actions

![Dashboard](docs/screenshots/dashboard.png)

| Kanban board: group by status, priority or project | Task side panel with inline editing |
| --- | --- |
| ![Board](docs/screenshots/tasks-board.png) | ![Task drawer](docs/screenshots/task-drawer.png) |
| **Dark mode** | **⌘K command palette** |
| ![Dark board](docs/screenshots/dark-board.png) | ![Command palette](docs/screenshots/command-palette.png) |
| **Projects** | **Project page** |
| ![Projects](docs/screenshots/projects.png) | ![Project detail](docs/screenshots/project-detail.png) |

<details>
<summary><b>More screenshots</b>: dark dashboard, board grouped by priority, list view, empty state, settings, mobile, login</summary>

| | |
| --- | --- |
| ![Dark dashboard](docs/screenshots/dark-dashboard.png) | ![Board grouped by priority](docs/screenshots/board-by-priority.png) |
| ![List view](docs/screenshots/tasks-list.png) | ![Empty state](docs/screenshots/empty-state.png) |
| ![Settings](docs/screenshots/settings.png) | ![Login](docs/screenshots/login.png) |
| ![Mobile dashboard](docs/screenshots/mobile.png) | ![Mobile board](docs/screenshots/mobile-board.png) |

</details>

---

## Contents

- [Quick start (Docker)](#quick-start-docker)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Testing](#testing)
- [API documentation](#api-documentation)
- [Features](#features)
- [Project structure](#project-structure)
- [Requirements checklist](#requirements-checklist)
- [Known limitations & trade-offs](#known-limitations--trade-offs)

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** covers the stack, database design, auth approach and key decisions.
- **[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)** maps every line of the brief to its implementation and the test that proves it.

---

## Quick start (Docker)

Requires Docker Desktop (or Docker Engine with Compose v2).

```bash
docker compose up --build
```

| Service | URL |
| --- | --- |
| Web app | http://localhost:3000 |
| REST API | http://localhost:4000/api |
| Swagger UI | http://localhost:4000/api/docs |
| PostgreSQL | `localhost:5433` (user / password / db: `taskflow`) |

On start-up the API container applies database migrations and seeds a demo workspace:

> **Demo login:** `demo@taskflow.dev` / `Password123!` (or click the hint on the login page)

You can also register a fresh account. To turn off seeding, set `SEED_DEMO=false`. Run `docker compose down -v` to stop everything and wipe the database.

> **"Bind for 0.0.0.0:5433 failed: port is already allocated"?** Another process or container is using port 5433. Pick a different host port with `DB_PORT=5544 docker compose up --build`. The app containers talk to the database over the internal Docker network, so they are unaffected. Ports 3000 and 4000 must also be free.

---

## Local development

Prerequisites: **Node.js 20+** (22 recommended) and a PostgreSQL 14+ database. The easiest database is the Compose one:

```bash
docker compose up -d db          # Postgres on localhost:5433
```

**Backend** (http://localhost:4000)

```bash
cd backend
cp .env.example .env             # then set JWT_ACCESS_SECRET (openssl rand -base64 48)
npm install
npm run db:deploy                # apply migrations (or `npm run db:migrate` while changing the schema)
npm run db:seed                  # optional demo data
npm run start:dev                # watch mode
```

**Frontend** (http://localhost:3000)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Useful scripts

| Where | Command | What it does |
| --- | --- | --- |
| backend | `npm run start:dev` | API in watch mode |
| backend | `npm run db:migrate` | Create/apply a migration after editing `prisma/schema.prisma` |
| backend | `npm run db:reset` | Drop, re-migrate and re-seed the dev database |
| backend | `SEED_RESET=true npm run db:seed` | Rebuild the demo workspace |
| backend | `npm run openapi:export` | Regenerate [`docs/openapi.json`](docs/openapi.json) and the Postman collection |
| both | `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |
| both | `npm test` | Unit tests |
| backend | `npm run test:e2e` | API integration tests against Postgres |

---

## Environment variables

Secrets are never committed. Only `*.example` files are tracked.

### Backend (`backend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | — (required) | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | — (required, ≥ 32 chars) | HMAC secret for access tokens |
| `JWT_ACCESS_TTL` | `15m` | Access-token lifetime (`30s`, `15m`, `1h`, `1d`) |
| `REFRESH_TOKEN_TTL_DAYS` | `7` | Session / refresh-token lifetime |
| `BCRYPT_ROUNDS` | `12` | Password hashing cost |
| `PORT` | `4000` | HTTP port |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated origins allowed to call the API with credentials |
| `COOKIE_SECURE` | `false` | Set to `true` when served over HTTPS |
| `RATE_LIMIT_GLOBAL` | `300` | Requests per minute per IP, all routes |
| `RATE_LIMIT_AUTH` | `10` | Requests per minute per IP for login / register / refresh |
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |

The API validates its environment at boot and refuses to start with a missing or weak value, such as a JWT secret shorter than 32 characters.

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Public API base URL (built into the browser bundle at build time) |

### Docker Compose (optional `.env` at the repo root)

See [`.env.example`](.env.example): `POSTGRES_*`, `DB_PORT`, `JWT_ACCESS_SECRET` and `SEED_DEMO`. The Compose file has local-only defaults so it works with no setup.

---

## Testing

```bash
# Backend: unit tests (services, guards, filter, config)
cd backend && npm test

# Backend: integration tests. These boot the real Nest app (same pipes, filters and guards
# as production) against a real PostgreSQL database.
# They use TEST_DATABASE_URL, default postgresql://taskflow:taskflow@localhost:5433/taskflow_test
docker compose up -d db
docker compose exec db psql -U taskflow -c 'CREATE DATABASE taskflow_test;'   # first time only
npm run test:e2e

# Frontend: unit/component tests (Vitest + Testing Library)
cd frontend && npm test
```

| Suite | Tests | Highlights |
| --- | --- | --- |
| Backend unit | 40 | refresh-token rotation and reuse detection, timing-safe login, ownership checks, `completedAt` transitions, timezone-aware "today", error envelope |
| Backend e2e | 31 | auth flows, cookie flags, logout revoking tokens, **cross-user isolation (another user's data → 404)**, combined filters + search, overdue logic, pagination, cascade delete, dashboard numbers and daily activity |
| Frontend | 45 | API client (single-flight refresh, error mapping), board drag-and-drop for each grouping, quick-add, collapse, complete toggle, theme boot script, command palette matching, open-redirect guard, accessible fields |

The Postman collection is also run end to end with Newman (17/17 requests pass):

```bash
docker compose up -d   # or run the API locally
npx newman run docs/taskflow.postman_collection.json
```

### Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request:

| Job | What it checks |
| --- | --- |
| **Backend** | `npm ci` → Prisma generate → ESLint → `tsc` → build → unit tests → e2e tests against a Postgres 16 service container |
| **Frontend** | `npm ci` → ESLint → `tsc` → Vitest → production `next build` |
| **Full stack** (after both pass) | `docker compose up --build --wait` (health-checked db → api → web), checks that the web app and Swagger respond, runs the **Postman collection with Newman** (every request asserts success), prints container logs on failure, tears down |

Before submission, all three jobs were replayed locally on a fresh clone with an empty database, and the workflow was checked with [`actionlint`](https://github.com/rhysd/actionlint).

---

## API documentation

- **Swagger UI:** http://localhost:4000/api/docs. Call `POST /api/auth/login` and the httpOnly cookies make "Try it out" work on every other endpoint.
- **OpenAPI spec:** [`docs/openapi.json`](docs/openapi.json).
- **Postman collection:** [`docs/taskflow.postman_collection.json`](docs/taskflow.postman_collection.json). Run the requests top to bottom: login is pre-filled with the demo account and stores the token, and creating a project or task stores its id for the requests that follow.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account, start a session (201, 409 if the email is taken) |
| `POST` | `/api/auth/login` | Log in (200, 401) |
| `POST` | `/api/auth/refresh` | Rotate the refresh token, issue a new access token |
| `POST` | `/api/auth/logout` | Revoke the session server-side, clear cookies (204) |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/projects` | List: `search`, `sortBy=createdAt\|updatedAt\|name`, `order`, `page`, `limit`. Each project includes task counts and progress |
| `POST` | `/api/projects` | Create |
| `GET` / `PATCH` / `DELETE` | `/api/projects/:id` | Retrieve / update / delete (cascades to tasks) |
| `GET` | `/api/tasks` | List: `projectId`, `status` (multi), `priority` (multi), `search` (title), `overdue`, `sortBy=dueDate\|priority\|createdAt\|updatedAt\|title\|status`, `order`, `page`, `limit` |
| `POST` | `/api/tasks` | Create in a project you own |
| `GET` / `PATCH` / `DELETE` | `/api/tasks/:id` | Retrieve / update (any field, e.g. only `status`) / delete |
| `GET` | `/api/dashboard` | Totals (projects, tasks, by status, overdue, due today, completion rate), project progress, upcoming and overdue tasks, completions per day (14 days), open tasks by priority |
| `GET` | `/api/health` | Liveness + database check |

**Example:**

```bash
curl -c jar -H 'Content-Type: application/json' \
  -d '{"email":"demo@taskflow.dev","password":"Password123!"}' localhost:4000/api/auth/login
curl -b jar 'localhost:4000/api/tasks?status=TODO,IN_PROGRESS&priority=HIGH&search=design'
```

**Every error uses the same shape:**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [{ "field": "dueDate", "messages": ["dueDate must be a valid calendar date"] }],
  "path": "/api/tasks",
  "timestamp": "2026-10-15T10:47:23.129Z",
  "requestId": "dfe41585-0975-4140-a7ec-8b8816f7ac36"
}
```

The `requestId` is also returned in the `X-Request-Id` header and appears in the server's access log, so a user-reported error can be traced to its log lines.

---

## Features

**Authentication & security**
- Email/password registration and login. Passwords are hashed with bcrypt (cost 12).
- Short-lived JWT access token plus a **rotating refresh token** with reuse detection, both in `httpOnly`, `SameSite=Lax` cookies. Tokens are never placed in `localStorage`.
- **Logout takes effect immediately:** the session is revoked server-side and previously issued access tokens stop working.
- Every project and task query is **scoped to the owner in the database query**. Another user's resources return `404`, so their IDs cannot be probed.
- Strict input validation (unknown fields are rejected), helmet headers, a CORS allowlist, stricter rate limiting on credential endpoints, and timing-safe login (no user enumeration).

**Projects:** create, edit and delete with confirmation; colour labels; search, sort and pagination. Cards show a segmented status bar, completion %, creation date and overdue count. Each project has a banner page with its own board.

**Tasks: a ClickUp-style board**
- Kanban **grouped by Status, Priority or Project**. Dragging a card to another column updates that field (status, priority, or moves the task to another project).
- Coloured status columns that collapse, an inline **"+ Add task"** in every column (Enter to save, stays open for the next), and a one-click round "complete" checkbox.
- Cards show priority flags, red/amber due-date chips, an overdue edge and a description indicator. "Move to…" menu actions give keyboard and touch users the same moves.
- **Task side panel** with inline editing (title, status, priority, due date, project, description, auto-saved). It is deep-linkable: `/tasks?task=<id>` opens a task directly, with a "copy link" button.
- List view with inline status changes and pagination.
- Search by title combined with status, priority, project and overdue filters, plus sorting. All filters live in the URL, so a filtered view can be bookmarked and shared.
- Optimistic updates everywhere, rolled back if the server rejects the change.

**Dashboard:** a greeting hero with today's summary, the four required totals, a 14-day completed-tasks chart, a status donut, open tasks by priority, per-project progress, and "up next" / overdue lists that you can tick off in place.

**Productivity:** a **⌘K / Ctrl+K command palette** (jump to any project, search tasks, create things, switch theme) and shortcuts: `N` new task, `P` new project, `/` focus search, `Esc` close.

**Theming:** light, dark or system mode and five accent colours (Settings → Appearance), applied before first paint so there is no flash. The status colours were checked with a palette validator for contrast and colour-blind separation in both themes.

**UX & accessibility:** responsive down to phone width (navigation drawer, horizontally scrolling board), skeleton loading, retryable error states, contextual empty states, toasts, focus-managed dialogs and panels, labelled fields with inline errors, and screen-reader tables behind the charts.

---

## Project structure

```
.
├── backend/                     NestJS API
│   ├── prisma/                  schema.prisma, migrations/, seed.ts
│   ├── src/
│   │   ├── auth/                controller, service, sessions (refresh rotation), global JWT guard
│   │   ├── projects/            CRUD + per-project stats (grouped queries)
│   │   ├── tasks/               CRUD, filtering, search, sorting, pagination
│   │   ├── dashboard/           aggregate statistics
│   │   ├── common/              error filter, validation pipe, request-id/logging middleware, decorators
│   │   ├── config/              typed, validated environment
│   │   └── app.setup.ts         HTTP setup shared by main.ts and the e2e tests
│   └── test/                    e2e specs (supertest + real Postgres)
├── frontend/                    Next.js app (App Router)
│   └── src/
│       ├── app/(auth)/          login, register
│       ├── app/(app)/           dashboard, projects, projects/[id], tasks, settings (guarded layout)
│       ├── components/          ui/ primitives · layout/ · projects/ · tasks/ (board, drawer) · dashboard/ (charts)
│       │                        · command-palette.tsx
│       ├── context/             Auth, Theme (mode + accent), UI (drawer, dialogs, palette)
│       ├── hooks/               TanStack Query hooks, URL filter state, hotkeys
│       └── lib/                 API client, types, validation schemas, theme tokens, date helpers
├── docs/                        ARCHITECTURE.md, REQUIREMENTS.md, openapi.json, Postman collection, screenshots
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Requirements checklist

A summary is below. The line-by-line version with test references is in [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).

| Requirement | Status |
| --- | --- |
| Register / login / logout | ✅ Logout also revokes the session server-side |
| Protected endpoints, users see only their own data | ✅ Global guard + owner-scoped queries, covered by e2e tests |
| Project CRUD with name, description, created date, task counts, progress | ✅ |
| Task CRUD with title, description, status, priority, due date | ✅ |
| Change status, filter by status / priority | ✅ Board drag-and-drop, menu, inline select |
| Dashboard: projects, tasks, completed, overdue | ✅ Plus due today, completion rate, per-project progress |
| Search by title combined with filters, empty state | ✅ |
| REST, status codes, validation, consistent errors, logging | ✅ |
| PostgreSQL schema, relations, indexes, migrations, seed | ✅ |
| Hashed passwords, protected routes, server-side authorization | ✅ |
| Unit + integration tests | ✅ 116 automated tests (+ Postman collection verified with Newman) |
| Dockerfiles + Docker Compose | ✅ |
| GitHub Actions (lint + tests) | ✅ Plus typecheck, builds, and a full Docker Compose stack smoke test with Newman |
| README, API docs (Swagger + OpenAPI + Postman), architecture note | ✅ |
| *Optional:* drag-and-drop Kanban, pagination & sorting, refresh-token rotation, rate limiting, loading/error/empty states, more tests | ✅ |
| *Beyond the brief:* dark mode + accents, board grouping, task drawer, command palette, activity chart | ➕ |
| *Optional:* public deployment | ❌ Not deployed. Runs locally with one `docker compose up` |

## Known limitations & trade-offs

- **Not deployed publicly.** The stack is containerized and ready for any Docker host. For a cross-site deployment (web and API on different registrable domains), cookies would need `SameSite=None; Secure` and a CSRF token. Today's same-site setup relies on `SameSite=Lax`, a CORS allowlist and JSON-only endpoints.
- **The client-side route guard is a UX feature, not a security boundary.** The session cookies belong to the API origin, so Next.js middleware cannot reliably read them. Every request is still authorized by the API.
- **Rate limiting is in-memory per instance.** Running several API replicas would need a shared store such as Redis.
- **Theme and accent are per-browser preferences** (localStorage), not stored on the user account.
- **Cards can't be manually reordered within a column.** That needs a persisted `position` column. The board sorts by the chosen sort key instead.
- **The board loads up to 200 tasks per view.** Beyond that it shows a notice and points to filters or the paginated list view. A very large board would need column-level pagination or virtualization.
- **Single-user workspaces only:** no teams, sharing, password reset or email verification. These are out of scope for the brief.
- No browser end-to-end tests (e.g. Playwright) in CI. User flows are covered by API integration tests and component tests.
