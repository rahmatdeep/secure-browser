# Secure Browser

A secure, containerized Remote Browser Isolation (RBI) solution that runs web browsing sessions inside disposable, sandboxed Docker containers streamed directly to your browser via noVNC over WebSockets.

---

## Features

- **Isolated Browsing**: Untrusted websites execute inside sandboxed Docker containers rather than on your local machine.
- **Single-Port Dynamic Proxy**: Streams VNC sessions over standard HTTP/WebSocket routes without opening random firewall ports.
- **Multi-Architecture Support**: Builds and runs natively on Apple Silicon ARM64 (M1/M2/M3/M4), Intel/AMD64 macOS, and Linux x86_64/ARM64.
- **Responsive Viewport Support**: Automatically detects mobile vs. desktop devices and adjusts display resolution accordingly (1280x720 desktop / 375x667 mobile).
- **Session Audit Logging**: Complete activity logging and automatic 10-minute session termination via PostgreSQL & Prisma.
- **Turborepo Monorepo**: Built with `pnpm` workspaces, shared TypeScript packages, and multi-stage Docker builds.
- **Docker-First Live Development**: Full hot-reloading for both Next.js Turbopack and Express (`tsx watch`) inside a unified Docker network.

---

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind CSS
- **Backend API**: Node.js + Express 5 + TypeScript + `http-proxy-middleware`
- **Database**: PostgreSQL 16 + Prisma ORM 6
- **Browser Container**: Ubuntu 22.04 LTS + Google Chrome (Native ARM64 / AMD64) + Xvfb + Openbox + x11vnc + noVNC + websockify
- **Security**: Zero exposed host ports for browser sessions, Helmet, Rate Limiting, CORS

---

## Project Structure

```text
secure-browser/
├── apps/
│   ├── backend/         # Express API, Prisma ORM, WebSocket proxy
│   └── frontend/        # Next.js 15 App Router web interface
├── packages/
│   └── shared/          # Shared TypeScript models, contracts & utilities
├── docker/
│   └── browser/         # Per-session browser container image (Chrome + noVNC)
├── docker-compose.yml   # Production stack definition
└── docker-compose.dev.yml # Live hot-reloading development stack
```

---

## Quick Start (Docker-First Development)

The development environment runs entirely inside Docker with live volume syncing and instant hot-reloading for both the frontend (Turbopack) and backend (`tsx watch`).

### 1. Build the browser image:
```bash
pnpm docker:build-browser
```
*(Builds `vnc-browser-chrome:latest` natively for your machine's CPU architecture).*

### 2. Start the live development stack:
```bash
pnpm dev
```
- Automatically boots PostgreSQL, applies Prisma migrations, and launches Next.js and Express with live hot-reloading.
- **Frontend**: `http://localhost:3000`
- **Backend API & Proxy**: `http://localhost:3001`
- Any code changes to `apps/frontend/src`, `apps/backend/src`, or `packages/shared/src` reflect immediately!

### 3. Stop the development stack:
```bash
pnpm dev:down
```

---

## Useful Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the live hot-reloading development stack in Docker (`docker-compose.dev.yml`) |
| `pnpm dev:build` | Rebuilds the development images with fresh dependencies |
| `pnpm dev:down` | Stops and removes development containers |
| `pnpm dev:host` | (Optional) Runs native host processes via Turborepo (`turbo dev`) |
| `pnpm docker:build-browser` | Builds the browser session image (`vnc-browser-chrome:latest`) |
| `pnpm test` | Runs the Vitest test suite across all packages |
| `pnpm build` | Compiles production builds for all workspaces |
| `pnpm db:generate` | Automatically regenerates the Prisma Client |
| `pnpm db:migrate` | Applies Prisma migrations to PostgreSQL |
| `pnpm db:studio` | Launches Prisma Studio GUI for database inspection |

---

## Production Deployment with Docker Compose

For a production deployment with optimized, standalone builds:

1. **(Optional) Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your desired production passwords and settings
   ```
   *(Zero-config safe defaults are built in if .env is omitted).*

2. **Build the browser image**:
   ```bash
   pnpm docker:build-browser
   ```

3. **Launch the production stack**:
   ```bash
   docker compose up -d --build
   ```

4. **Access the application**:
   - **Frontend**: `http://localhost:3000`
   - **Backend & VNC Proxy**: `http://localhost:3001`
   - All VNC streams route through the backend proxy (`/api/containers/:id/vnc/*`) with **0 extra firewall ports** needed.
