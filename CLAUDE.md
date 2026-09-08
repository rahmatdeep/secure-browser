# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Secure Browser: isolated, disposable web browsing sessions. A user submits a URL; the backend spins up a short-lived Docker container running Chrome + a VNC server, and the frontend embeds that container's noVNC view in an iframe so the user "browses" inside a sandboxed remote container instead of their own machine.

## Repo layout (pnpm + Turborepo Monorepo)

- `apps/backend/` — Express + TypeScript API that manages Docker containers, session state (Postgres via Prisma), and dynamic HTTP/WebSocket proxying.
- `apps/frontend/` — Next.js 15 (App Router) UI.
- `packages/shared/` (`@secure-browser/shared`) — Shared TypeScript types (`ContainerInfo`, `ApiResponse`) and device detection (`isMobileUserAgent`, `getChromeUserAgent`, `getViewport`).
- `docker/browser/` — Contains `Dockerfile` and `start.sh` for the **per-session browser container image** (`vnc-browser-chrome:latest`), cleanly separated from the backend service image.
- `docker-compose.yml` — Full-stack orchestration (PostgreSQL, Backend with Docker socket mount, Frontend).

## Commands

Root monorepo commands:
- `pnpm dev` — Start backend and frontend concurrently via Turborepo.
- `pnpm build` — Build shared package, backend, and frontend with Turbo caching.
- `pnpm test` — Run all Vitest regression tests across workspaces.
- `pnpm db:migrate` / `pnpm db:push` / `pnpm db:studio` — Prisma database commands.
- `pnpm docker:build-browser` — Builds `vnc-browser-chrome:latest` from `docker/browser/`.

Docker Compose:
- `docker compose up -d --build` — Starts Postgres, Backend, and Frontend.

## Architecture / Request Flow

1. `apps/frontend/src/components/CreateSessionForm.tsx` submits a form action to `apps/frontend/src/actions/sessionActions.ts::createSession`, which POSTs `{ url }` (plus the real browser's `User-Agent` header) to the backend's `POST /api/containers/create`.
2. `apps/backend/src/controllers/containerController.ts` validates the URL and delegates to `apps/backend/src/utils/dockerManager.ts::DockerManager`.
3. `DockerManager.createContainer`:
   - Uses `@secure-browser/shared` to detect mobile vs desktop and pick the appropriate viewport and user agent.
   - Attaches the container to the internal Docker bridge network (`secure-browser-net`).
   - **Zero Host Port Bindings**: Container port 6080 is internal-only.
   - Waits for container initialization, logs the session in Postgres, schedules a 10-minute auto-termination timer, and stores internal IP.
   - Returns a path-based proxy URL: `/api/containers/${containerId}/vnc/vnc_lite.html`.
4. `apps/backend/src/index.ts` runs a dynamic reverse proxy (`http-proxy-middleware`):
   - Proxies `/api/containers/:id/vnc/*` directly to `http://vnc-browser-${containerId}:6080` (or container IP).
   - Handles the WebSocket `upgrade` event on the HTTP server, streaming VNC over WebSocket without opening random firewall ports.
5. The frontend embeds the VNC stream in an iframe:
   `${API_BASE}${session.vncUrl}?path=api/containers/${containerId}/vnc/websockify`
6. Stopping (`DELETE /api/containers/:id`, or the 10-minute timeout) stops the container and marks the session `ENDED` in Postgres.
