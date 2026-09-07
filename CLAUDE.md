# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Secure Browser: isolated, disposable web browsing sessions. A user submits a URL; the backend spins up a short-lived Docker container running Chrome + a VNC server, and the frontend embeds that container's noVNC view in an iframe so the user "browses" inside a sandboxed remote container instead of their own machine.

## Repo layout

- `backend/` — Express + TypeScript API that manages Docker containers and session state (Postgres via Prisma).
- `frontend/` — Next.js (App Router) UI, mostly Server Actions calling the backend API.
- `backend/Dockerfile` + `backend/start.sh` — build the **per-session browser container image** (`vnc-browser-chrome:latest`), not the backend service itself. This image runs Xvfb + openbox + x11vnc + noVNC + Chrome in kiosk mode pointed at the requested URL.

## Commands

Backend (`cd backend`):
- `npm run dev` — build then run (`tsc -b && node dist/index.js`); there's no watch mode.
- `npm run build` — TypeScript build only.
- `npm run db:push` / `npm run db:migrate` / `npm run db:studio` — Prisma schema sync / migration / studio.
- `docker build -t vnc-browser-chrome:latest .` — must be run once (and after any `start.sh`/`Dockerfile` change) so `DockerManager` has an image to launch; container creation fails without it.

Frontend (`cd frontend`):
- `npm run dev` — Next.js dev server with Turbopack, fixed to port **3100** (`next dev -p 3100`).
- `npm run build` / `npm run start -p 3100` — production build/serve.
- `npm run lint` — `next lint`.

There is no test suite configured in either package (no `test` script, no test files).

Env vars: `backend/.env` needs `DATABASE_URL` (Postgres), plus optional `PORT`, `FRONTEND_URL` (for CORS), `HOST_IP` (used to build the VNC URL returned to the frontend). Frontend reads `NEXT_PUBLIC_API_URL` to reach the backend (defaults to `http://localhost:3101` in the code, though the backend itself defaults `PORT` to 3001 — check both when wiring frontend/backend together locally).

## Architecture / request flow

1. `frontend/src/components/CreateSessionForm.tsx` submits a form action to `frontend/src/actions/sessionActions.ts::createSession`, which POSTs `{ url }` (plus the real browser's `User-Agent` header, forwarded manually) to the backend's `POST /api/containers/create`.
2. `backend/src/controllers/containerController.ts` validates the URL and delegates to `backend/src/utils/dockerManager.ts::DockerManager`, the core of the app.
3. `DockerManager.createContainer`:
   - Detects mobile vs desktop from the User-Agent (regex duplicated in both frontend `session/[containerId]/page.tsx` and backend `dockerManager.ts` — keep them in sync if changed) and picks a matching viewport/UA to inject into the container.
   - Launches a `vnc-browser-chrome:latest` container with random host ports bound to the container's `5900` (VNC) and `6080` (noVNC), passing the target URL/UA/viewport as env vars consumed by `start.sh`.
   - Waits a fixed 8s for the container to become ready (no real readiness check is currently wired up — see commented-out polling code).
   - Records the session in Postgres (`ContainerSession` + `ContainerLog` rows via `DatabaseService`, `backend/src/services/databaseService.ts`) and schedules an in-memory 10-minute auto-stop timer.
   - In-memory `activeContainers: Map<containerId, ContainerInfo>` is the source of truth for *running* containers; the DB is the source of truth for historical session/log data. These can drift if the backend process restarts (the map is lost, but DB rows and real containers may persist) — `cleanupOrphanedContainers()` runs on startup to force-remove any leftover `vnc-browser-*` containers.
4. The frontend polls/reads container info via `GET /api/containers/:id` and renders `session.vncUrl` (a `.../vnc_lite.html` URL) inside an iframe (`frontend/src/app/session/[containerId]/page.tsx`).
5. Stopping (`DELETE /api/containers/:id`, or the 10-minute timeout) stops the Docker container and marks the session `ENDED` with a computed duration in Postgres.

## Data model

`backend/prisma/schema.prisma` defines two models: `ContainerSession` (one per browsing session, status `ACTIVE | ENDED | FAILED`) and `ContainerLog` (append-only audit trail per session, `LogAction` enum: `CONTAINER_CREATED`, `CONTAINER_STARTED`, `URL_OPENED`, `CONTAINER_STOPPED`, `CONTAINER_TIMEOUT`, `ERROR_OCCURRED`). Sessions are looked up by `containerId` (a UUID generated per request, not the Docker container ID).
