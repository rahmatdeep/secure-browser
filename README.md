# Secure Browser

A secure containerized browser solution that provides isolated web browsing sessions through Docker containers with VNC access.

## What it does

- Browse websites safely in isolated Docker containers
- Each session runs in its own secure environment
- Access browser sessions remotely via VNC
- Track and log all browsing activities for security

## Quick Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/fal4782/secure-browser.git
cd secure-browser/backend
npm install
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

4. Build the Docker image for browser containers:

```bash
cd ../backend
docker build -t vnc-browser-chrome:latest .
```

5. Set up your database URL in `backend/.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/your_db_name"
```

6. Run database migrations:

```bash
npx prisma migrate dev --name init
```

7. Start the backend server:

```bash
npm run dev
```

8. Start the frontend (in a new terminal):

```bash
cd ../frontend
npm run dev
```

## Access Points

- **Frontend Interface**: `http://localhost:3000` - Main web interface for managing browser sessions
- **Backend API**: `http://localhost:3101` - REST API server
- **VNC Sessions**: Fixed pool of ports/subdomains assigned per container for secure browsing (see below)

## About this branch (`port`)

This branch changes how you connect to a container's VNC (remote desktop) view, moving away from random ports toward fixed ports mapped to subdomains, so sessions can be reached over HTTPS via real domain names instead of raw IP:port links.

- **Fixed port pool**: Instead of Docker picking a random open port for each container, there's now a fixed list of 12 "slots" (ports `25101`–`25112`), each permanently tied to a subdomain like `vnc1.secure-browser.rahmatdeep.com`, `vnc2...`, etc. Starting a session grabs a free slot; stopping a session returns it to the pool. This caps concurrent sessions at 12.
- **Session length**: Auto-disconnect timeout was shortened from 10 minutes to 2 minutes (likely for testing).
- **Backend default port**: Changed from `3001` to `3101`.
- **Frontend**: The "Active Sessions" list on the homepage is temporarily hidden (commented out, not removed) while this is in progress. A `.env.example` was added for `NEXT_PUBLIC_API_URL`.

This is a work-in-progress toward proper domain + HTTPS access for VNC sessions instead of exposing raw server IPs and ports.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma
- **Containers**: Docker
- **Security**: Rate limiting, CORS, Helmet
- **Remote Access**: VNC + noVNC web client
