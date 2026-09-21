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
   - In production (e.g. via Coolify), backend port `3001` is not published to the host interfaces. Requests route via your reverse proxy (Traefik) or directly to the frontend.
   - All VNC streams route through the backend proxy (`/api/containers/:id/vnc/*`) with **0 extra firewall ports** needed.

---

## Production Hardening & Coolify Deployment

When deploying Secure Browser to production using **Coolify** or a Linux server, follow these hardening practices to ensure full session isolation.

### 1. Coolify Architecture & Reverse Proxy
- **Zero Exposed Backend Ports**: `docker-compose.yml` does not publish port `3001` on host interfaces (`ports:` is dropped). Public traffic is routed through Coolify's Traefik reverse proxy by domain.
- **Docker Socket Access**: The backend mounts `/var/run/docker.sock` to orchestrate disposable browser containers. Ensure your Coolify host allows this volume mount.
- **Preserve Sessions Network**: The backend dynamically creates and manages `secure-browser-sessions` with inter-container communication disabled (`enable_icc: false`). Ensure Coolify does not rewrite or detach this bridge.

### 2. Linux Firewall: Automated In-Code & Host Rules (`INPUT` & `DOCKER-USER`)
> [!WARNING]
> **UFW Does Not Filter Docker-Published Ports**:
> Standard `ufw` rules operate on the `INPUT` and `OUTPUT` chains. Docker manipulates `iptables` directly by inserting `PREROUTING` and `FORWARD` rules, which divert packets before `ufw` rules are evaluated. Any port mapped in Docker (`-p` / `PortBindings`) bypasses `ufw` unless filtered in the `DOCKER-USER` chain.

To enforce kernel-level boundaries for session containers on a Linux host, rules are applied automatically by the `firewall` service. Do not add iptables rules by hand: the service owns them and re-applies them every 30 seconds.

Both `docker-compose.yml` and `docker-compose.dev.yml` include a lightweight `firewall` service with `network_mode: host` and `cap_add: [NET_ADMIN]` (built from `docker/firewall/`). It discovers the `secure-browser-sessions` bridge interface (`br-<id>`) and, in a single atomic `iptables-restore` transaction, maintains two chains:
- **`SB-EGRESS`** (attached to `DOCKER-USER`, traffic forwarded out of the session network): accepts `ESTABLISHED,RELATED`, then drops new connections to private, loopback, link-local (including cloud metadata `169.254.0.0/16`), CGNAT, test-net and multicast/reserved ranges, plus the IPv6 equivalents.
- **`SB-INPUT`** (attached to `INPUT`, traffic addressed to the host itself): accepts `ESTABLISHED,RELATED`, drops everything else, so a session cannot reach the backend or any other host service.

The `ESTABLISHED,RELATED` accept must stay first: the backend proxies noVNC to the published session port, and the container's replies travel from the session bridge to the backend's private address.

If the rules do not appear on the host, check that the Alpine `iptables` in the service and the host use the same backend (nft vs legacy). Rules persist only while the service runs, which is why it uses `restart: unless-stopped`.

### 2.0 Fail-closed egress guard
The `firewall` service is labelled `sb.egress-guard=true` and has a healthcheck that passes only once its `SB-EGRESS` and `SB-INPUT` chains are installed. With `EGRESS_GUARD_REQUIRED=true` (the default in `docker-compose.yml`; `false` in `docker-compose.dev.yml`), the backend refuses to start a session and returns `503` unless a running, healthy guard exists. After a cold start expect `503` for up to ~30-60 seconds until the guard's first reconciliation pass finishes. On non-Linux hosts (Docker Desktop) the guard cannot manage iptables, so leave the flag off there.

### 2.1 Runtime Verification Suite
To verify the 4 core runtime security criteria on a real session (Chrome sandbox/seccomp, noVNC proxying, port isolation, and iptables egress blocking), execute:
```bash
./scripts/verify-runtime.sh
```

### 3. Cloud Provider Security Groups
- On your cloud provider (AWS EC2 Security Group, Hetzner Firewall, DigitalOcean Cloud Firewall), restrict inbound traffic to **only ports 80 and 443** (plus port 22 restricted to your management IP).
- Even if any service or dev container binds to host ports, the provider firewall ensures they are unreachable from the public internet.

### 4. Cloud Metadata Protection (AWS IMDSv2)
If hosting on AWS EC2, enforce IMDSv2 and restrict the HTTP PUT hop limit to 1:
```bash
aws ec2 modify-instance-metadata-options \
    --instance-id <INSTANCE_ID> \
    --http-tokens required \
    --http-put-response-hop-limit 1 \
    --http-endpoint enabled
```
A hop limit of `1` ensures that while the EC2 host itself can access instance metadata, packets forwarded from Docker containers (which require at least 2 hops through the bridge) are dropped by the kernel.

