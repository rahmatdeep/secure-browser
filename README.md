# Secure Browser

A secure, containerized Remote Browser Isolation (RBI) solution that runs web browsing sessions inside disposable, sandboxed Docker containers streamed directly to your browser via noVNC over WebSockets.

---

## Features

- **Isolated Browsing**: Untrusted websites execute inside sandboxed Docker containers rather than on your local machine.
- **Single-Port Dynamic Proxy**: Streams VNC sessions over standard HTTP/WebSocket routes without opening random firewall ports.
- **Responsive Viewport Support**: Automatically detects mobile vs. desktop devices and adjusts display resolution accordingly (1280x720 desktop / 375x667 mobile).
- **Session Audit Logging**: Complete activity logging and automatic 10-minute session termination via PostgreSQL & Prisma.
- **Turborepo Monorepo**: Built with `pnpm` workspaces, shared TypeScript packages, and multi-stage Docker builds.

---

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind CSS
- **Backend API**: Node.js + Express + TypeScript + `http-proxy-middleware`
- **Database**: PostgreSQL + Prisma ORM
- **Browser Container**: Ubuntu 20.04 + Google Chrome (Kiosk) + Xvfb + Openbox + x11vnc + noVNC + websockify
- **Security**: Zero exposed host ports for browser sessions, Helmet, Rate Limiting, CORS

---

## Quick Start with Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/fal4782/secure-browser.git
   cd secure-browser
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your desired database password
   ```

3. **Build the browser image**:
   ```bash
   # Native build for current host (Apple Silicon ARM64, Intel/AMD64 Linux & Mac):
   docker build -t vnc-browser-chrome:latest docker/browser
   # Or via pnpm / compose shortcut:
   pnpm docker:build-browser
   ```

4. **Launch the entire stack**:
   ```bash
   docker compose up -d --build
   ```

5. **Access the application**:
   - **Frontend Interface**: `http://localhost:3000`
   - **Backend API**: `http://localhost:3001`
   - All VNC streams route through the backend proxy (`/api/containers/:id/vnc/*`) with **0 extra firewall ports** needed!

---

## Local Development (Without Docker Compose)

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up PostgreSQL and run migrations**:
   ```bash
   pnpm db:migrate
   ```

3. **Start all services concurrently**:
   ```bash
   pnpm dev
   ```

4. **Run the test suite**:
   ```bash
   pnpm test
   ```
