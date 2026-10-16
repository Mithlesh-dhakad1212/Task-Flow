# Requirements Traceability

Every line of the TaskFlow brief, mapped to where it is implemented and how it is verified.

**Legend:** ✅ done · ➕ goes beyond the brief · ❌ not done (with reason)
**Test suites:** `be-unit` = `backend/src/**/*.spec.ts` · `be-e2e` = `backend/test/*.e2e-spec.ts` (real Postgres) · `fe` = `frontend/src/**/*.test.ts(x)`

---

## 1. Project overview

| Requirement | Status | Where |
| --- | --- | --- |
| Frontend in Next.js | ✅ | `frontend/` (Next.js 15 App Router, React 19) |
| Backend in Node.js / NestJS | ✅ | `backend/` (NestJS 11) |
| Persistent data in a database | ✅ | PostgreSQL 16 via Prisma, `backend/prisma/` |

## 2. Functional requirements

### A. User authentication

| Requirement | Status | Implementation | Verified by |
| --- | --- | --- | --- |
| Register with email + password | ✅ | `POST /api/auth/register` (`auth.controller.ts`, `auth.service.ts`), `/register` page | be-e2e `auth` "creates a user…", be-unit `AuthService register` |
| Log in with email + password | ✅ | `POST /api/auth/login`, `/login` page | be-e2e `auth` "logs in…", "same 401 for wrong password and unknown email" |
| Protect project and task endpoints | ✅ | Global `JwtAuthGuard` (`APP_GUARD`); only `@Public()` routes are open | be-e2e "rejects requests without a token", "rejects a tampered token" |
| Users access only their own projects and tasks | ✅ | Owner filter in every query (`projects.service.ts`, `tasks.service.ts`) | be-e2e `ownership isolation` (5 cases), be-unit `TasksService` "always scopes the query to the owner" |
| Logout mechanism | ✅ | `POST /api/auth/logout` revokes the session server-side and clears cookies; sidebar and settings sign-out | be-e2e "logout revokes the session…, invalidating the access token immediately" |

### B. Project management

| Requirement | Status | Implementation | Verified by |
| --- | --- | --- | --- |
| Create / view / edit / delete projects | ✅ | `/api/projects` CRUD; projects grid, project page, dialogs | be-e2e `project CRUD` |
| Name, description, creation date | ✅ | `projects.name`, `description`, `created_at`; creation date shown on cards and the project banner | be-e2e "creates a project with defaults" |
| Task counts + completion progress per project | ✅ | `ProjectsService.statsFor()` (2 grouped queries for a page of projects); segmented status bar and % on cards; banner stats | be-e2e "tracks completedAt … and updates project progress" |
| Prevent access to other users' projects | ✅ | Scoped queries return 404 | be-e2e "hides another user's projects (404, not 403…)" |

### C. Task management

| Requirement | Status | Implementation | Verified by |
| --- | --- | --- | --- |
| Create / edit / view / delete tasks within projects | ✅ | `/api/tasks` CRUD (create requires a `projectId` you own); task dialog, side drawer, board quick-add | be-e2e `task lifecycle…`, "prevents creating tasks in … another user's project" |
| Title, description, status, priority, due date | ✅ | `tasks` table; `CreateTaskDto` validation | be-e2e "validates task fields" |
| Statuses To Do / In Progress / Done; priorities Low / Medium / High | ✅ | Postgres enums `TaskStatus`, `TaskPriority` | be-e2e "rejects invalid filter values" |
| Change task status | ✅ | Board drag-and-drop, complete checkbox, "Move to…" menu, list status select, drawer | fe `task-board.test.tsx` (drop, checkbox, menu), be-unit `completedAt` transitions |
| Filter by status or priority | ✅ | `GET /api/tasks?status=&priority=` (multi-value); filter dropdowns synced to the URL | be-e2e "filters by status, priority and title search — combined" |

### D. Dashboard and search

| Requirement | Status | Implementation | Verified by |
| --- | --- | --- | --- |
| Total projects, total tasks, completed tasks, overdue tasks | ✅ | `GET /api/dashboard` (`COUNT` / `GROUP BY` in one transaction); four stat tiles | be-e2e `dashboard` "aggregates only the caller's data…" (exact numbers) |
| Search tasks by title, combined with status + priority filters | ✅ | `search` (ILIKE on a trigram GIN index) ANDed with filters | be-e2e "filters by status, priority and title search — combined" |
| Useful empty state when no tasks match | ✅ | "No tasks match your filters" with the search term and a **Clear filters** action; separate first-run empty states | Screenshot `docs/screenshots/empty-state.png` |

## 3. Technical requirements

| Area | Expectation | Status | How |
| --- | --- | --- | --- |
| Frontend | Next.js + React, responsive, reusable components | ✅ | `components/ui/*` primitives; layouts tested at 390 px and 1440 px; mobile nav drawer; horizontally scrolling board |
| Backend | Node.js with NestJS | ✅ | Feature modules: controller → service → Prisma |
| API design | REST, correct methods, status codes, validation | ✅ | 201 / 204 / 400 / 401 / 404 / 409 / 429; global strict `ValidationPipe` (unknown fields rejected) |
| Database | PostgreSQL, sensible schema and relations | ✅ | FKs with cascade, enums, CHECK constraints — see [ARCHITECTURE §2](ARCHITECTURE.md#2-database-design) |
| State management | Hooks + Context / other justified solution | ✅ | TanStack Query (server state) + Context (auth, theme, UI overlays) + URL (filters); justified in [ARCHITECTURE §1](ARCHITECTURE.md#1-overview) |
| Authentication | Secure hashing, protected routes, server-side authorization | ✅ | bcrypt (cost 12), JWT + rotating refresh sessions, global guard, owner-scoped queries |
| Error handling | Consistent error responses, useful logging | ✅ | `AllExceptionsFilter` envelope with `requestId`; per-request access log; 5xx stack traces only in logs |
| Git | Meaningful commits + README | ✅ | Conventional commits; `README.md` |
| Testing | Unit or integration tests for important functionality | ✅ | 43 be-unit + 31 be-e2e + 50 fe = **124 tests**; backend suite runs on PostgreSQL 16 and 18 |
| Docker | Dockerfile, preferably Compose | ✅ | `backend/Dockerfile`, `frontend/Dockerfile` (multi-stage, non-root), `docker-compose.yml` with health checks |
| CI/CD | GitHub Actions for lint + tests | ✅ | `.github/workflows/ci.yml`: backend (lint, typecheck, build, unit, e2e on a Postgres service) · frontend (lint, typecheck, tests, build) · full stack (Compose up with health checks + Newman run of the Postman collection). Replayed on a fresh clone and checked with actionlint |

## 4. Required API capabilities

| Feature | Expected operations | Endpoints |
| --- | --- | --- |
| Authentication | Register, login, logout / invalidation | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh` (rotation), `GET /auth/me` |
| Projects | Create, list, retrieve, update, delete | `POST/GET /projects`, `GET/PATCH/DELETE /projects/:id` |
| Tasks | Create, list, retrieve, update, delete | `POST/GET /tasks`, `GET/PATCH/DELETE /tasks/:id` |
| Filtering | Status, priority, title search | `GET /tasks?status=TODO,DONE&priority=HIGH&search=design` (+ `projectId`, `overdue`, sort, paging) |
| Dashboard | Task counts, overdue / completion stats | `GET /dashboard` (+ 14-day activity, open-by-priority) |
| **Security:** ownership enforced on the server for every operation | ✅ | Ownership is in the `WHERE` clause; moving a task re-checks the destination project. Verified by be-e2e `ownership isolation` |

## 5. Database and engineering expectations

| Expectation | Status | How |
| --- | --- | --- |
| Suggested model (User / Project / Task) | ✅ ➕ | Same model plus `sessions` (refresh-token rotation), `color`, `updated_at`, `completed_at` |
| Validate required fields and invalid values | ✅ | DTO validation + DB CHECK constraints; strict ISO dates (`2026-02-30` is rejected) |
| Indexes and efficient queries | ✅ | Owner/sort composite indexes, `(project_id, status)`, `(project_id, due_date)`, trigram GIN for search; grouped stats queries (no N+1) |
| Missing records / invalid requests handled consistently | ✅ | 404 for missing or foreign records, 400 for malformed UUIDs / bodies, one error envelope |
| Overdue and dashboard stats calculated correctly | ✅ | Overdue = not DONE and `due_date < today` in the caller's timezone (`X-Timezone`); tested at UTC+14 |
| Secrets in environment variables | ✅ | Validated at boot (refuses JWT secrets under 32 chars); only `*.example` files committed. The Compose file carries a clearly labelled local-only default so one command works |

## 6. Optional enhancements

| Enhancement | Status | Notes |
| --- | --- | --- |
| Drag-and-drop Kanban | ✅ ➕ | Group by status, priority **or project**; a drop updates that field. Collapsible columns, inline quick-add |
| Pagination and sorting | ✅ | Projects and tasks: `page` / `limit`, multiple sort keys, stable tie-breakers |
| Refresh-token rotation / advanced sessions | ✅ | Rotation, reuse detection (revokes the session), multi-tab grace window, immediate logout |
| Rate limiting and security controls | ✅ | Global + stricter auth throttler, helmet, CORS allowlist, timing-safe login |
| Deployment to a public host | ❌ | Not deployed (no hosting account in scope). Runs with one `docker compose up --build` |
| More comprehensive automated tests | ✅ | 124 tests; e2e runs against a real database |
| Thoughtful loading, error and empty states | ✅ | Skeletons, retryable error states, context-specific empty states, optimistic updates with rollback |
| *Not asked for:* | ➕ | Dark mode + accent themes, ⌘K command palette, keyboard shortcuts, task side drawer with shareable links, completion-activity chart |

## 7. Submission requirements

| # | Item | Where |
| --- | --- | --- |
| 1 | Source code (frontend + backend) | This repository |
| 2 | README: setup, env vars, DB config, run commands | [`README.md`](../README.md) |
| 3 | Working application: deployed URL or clear local instructions | README → *Quick start (Docker)* and *Local development* |
| 4 | API documentation | Swagger UI at `/api/docs`; [`openapi.json`](openapi.json); [`taskflow.postman_collection.json`](taskflow.postman_collection.json) (run end to end with Newman: 17/17 requests pass) |
| 5 | Database setup: migrations / schema / seed | `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/prisma/seed.ts` (applied automatically in Docker) |
| 6 | Tests + how to run them | README → *Testing* |
| 7 | Architecture note | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| — | No real credentials or secrets committed | Only placeholder values in `*.example` files and the Compose dev default |

## 8. Follow-up discussion prep

The brief's review process asks the candidate to explain **one database query, one security decision, and one bug or trade-off**:

- **Query:** per-project progress in two grouped queries instead of N+1. See [ARCHITECTURE §2](ARCHITECTURE.md#example-query-per-project-progress-without-n1).
- **Security decision:** rotating refresh tokens with reuse detection and session-bound access tokens, so logout takes effect immediately. See [ARCHITECTURE §3](ARCHITECTURE.md#3-authentication--authorization).
- **Bug / trade-off:** a production-only 500 (PostgreSQL 18 on Debian rejected the `Asia/Calcutta` timezone alias), now fixed and covered by testing on Postgres 16 and 18; cookies breaking across two `*.up.railway.app` domains, fixed with a same-origin proxy; the multi-tab refresh race. See [ARCHITECTURE §2 and §4](ARCHITECTURE.md#completions-per-day-in-the-users-timezone-and-a-production-bug).
