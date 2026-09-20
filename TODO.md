# SafeWeb — road to a public deployment

Ordered by what blocks what. P0 items are not "before launch polish" — they are
things a stranger can exploit the moment the URL is public.

Code references are to the state at commit 5084088.

## P0 — blocks putting this on a public URL

- [ ] **Stop `GET /api/containers` returning every session when no token is sent.** `dockerManager.ts:265` only applies the guest-token filter `if (guestToken)`, so a request with no `x-guest-token` header skips filtering entirely and returns all active sessions — including each one's `url` and its `guestToken`, which the response puts in the payload. Backend port 3001 is published (`docker-compose.yml:27`) and the browser talks to it directly via `NEXT_PUBLIC_API_URL`, so this is an internet-facing endpoint, not an internal one: an unauthenticated request lists what every current visitor is browsing. The leaked token is then usable — `getContainerInfo` accepts `?token=` as a query parameter (`containerController.ts:96`), so it works from a plain navigation. Treat missing token as "show nothing" rather than "show everything", and stop returning `guestToken` in the payload at all.

- [ ] **Restrict URL schemes to http/https.** `apps/backend/src/controllers/containerController.ts:30` validates with a bare `new URL(url)`, which accepts `file://`, `data:`, `chrome://` and anything else Chrome will open. An allowlist is a three-line change and closes the easiest hole.
- [ ] **Block private, loopback, link-local and cloud-metadata addresses.** `http://169.254.169.254/latest/meta-data/iam/security-credentials/` renders cloud credentials on screen over VNC to whoever typed it. How exposed this is depends on where it runs: a container reaches the metadata service through the same default route it uses to browse at all, so it is reachable unless specifically blocked — on AWS that means IMDSv1 disabled and hop limit 1, which is the setting that exists to stop containers reaching it, while DigitalOcean and Hetzner serve metadata with no auth at all. Resolve DNS first and check the resolved address, not the hostname string — checking the string alone is bypassed by a hostname that resolves to a private IP.
- [ ] **Move session containers off `secure-browser-net`.** `docker-compose.yml` puts postgres, backend, frontend and every session container on one bridge, so a visitor's Chrome can reach `postgres:5432`, `backend:3001` and `frontend:3000` by hostname. Running the page inside a container isolates the host's filesystem, not the network the container sits on. A separate network for session containers, with only the proxy path back, is the structural fix — address filtering alone does not survive a redirect chain followed inside the container.
- [ ] **Cap concurrent containers, globally and per guest token.** Nothing limits this today; each container is 512MB (`dockerManager.ts` HostConfig), so a handful of requests exhausts the host.
- [ ] **Add a strict rate limit on session creation specifically.** The global limiter (`apps/backend/src/index.ts:38`) is 500 requests / 15 min per IP, deliberately loose so VNC asset and WebSocket polling are not throttled — so it does not meaningfully limit creating sessions. Creation needs its own much tighter bucket.
- [ ] **Harden the session container.** `no-new-privileges`, dropped capabilities, read-only rootfs where possible, a pids limit and a CPU quota. Cheap, and shrinks what a browser exploit inside the container can do next.
- [ ] **Reconsider mounting the Docker socket into the backend.** `docker-compose.yml` mounts `/var/run/docker.sock` into the backend container, which is root-equivalent on the host: any RCE in the backend is a full host compromise. A socket proxy limited to the container endpoints actually used would bound this.

## P1 — before taking real users

- [ ] **Stop retaining every visited URL forever.** `ContainerSession.targetUrl` is stored in full and rows are only ever `update`d to `ENDED` (`apps/backend/src/services/databaseService.ts:49`), never deleted, with `guestToken` indexed. Today that is a permanent per-visitor browsing log. Either purge the row when the session ends, or keep hostname only.
- [ ] **Add a retention/purge job** for old `container_sessions` rows; `ContainerLog` cascades on delete, so it follows automatically.
- [ ] **Write the privacy policy — after the two items above, not before.** A policy describes the system; written against today's behaviour it commits you in writing to keeping browsing history indefinitely, and you would rewrite it a week later. Cover: the `sb_guest_token` cookie, what is stored and for how long, IPs in server logs, and that there are no accounts.
- [ ] **Write terms with an acceptable-use section.** For a tool that fetches arbitrary URLs on your infrastructure this is the operationally useful document — it is what lets you refuse and block, and evidence that you act on abuse.
- [ ] **Publish an abuse contact and takedown route.** You are running an open proxy: complaints will go to your hosting provider, and providers suspend first and investigate later. Being reachable directly is what prevents that.
- [ ] **Decide the jurisdiction question.** India (DPDP 2023) is the likely baseline; any EU visitors pull in GDPR. This one needs an actual lawyer, not an engineering guess.

## P2 — product and UI

- [ ] **Colour.** The palette is entirely black/white/grey. `globals.css` is already fully tokenised and `--accent` exists and is wired to the ring and live dots, so this is a contained change rather than a refactor. No coupling to anything above — safe to do at any point.
- [ ] Handoff overlay is vertically sparse — a lot of empty space above and below the stage list.
- [ ] ~260px of dead space between the lifetime ring and the notes row, inherited from the tail of the pinned track.
- [ ] The evidence strip's mono text on ink (`oklch(0.52 …)`) is dim enough to be borderline for legibility.
- [ ] **Error states.** `createSession` rethrows on failure — check what a user actually sees when container creation fails, since the handoff overlay covers the screen while it happens.
- [ ] Check the rebuilt isolation and lifetime sections at phone width.

## Decisions to make

The written pages at `/privacy`, `/terms` and `/abuse` are drafted from what
the code actually does. Everything that could not be derived from the code is
left in the page as a visible `Pending` marker carrying the id below, so a
half-written policy cannot quietly ship looking finished.

To close one: decide it, replace every `<Pending id="Dn">…</Pending>` with the
answer, and tick it here. When a page has no markers left, drop the
`robots: { index: false }` from its `metadata` — that is what keeps unfinished
legal text out of search results.

| id | decision | appears on | blocked by |
| --- | --- | --- | --- |
| D1 | Who operates the service — person or company, and the country it operates from. This is the data controller, so it needs settling between you and the repo owner before anything is published. | privacy, abuse | — |
| D2 | Contact address for privacy and general legal questions. | privacy, terms | — |
| D3 | Monitored contact address for abuse and takedown reports. Providers will use this instead of suspending you, so it has to be real and watched. | abuse | — |
| D4 | How long session records and activity logs are kept. Note the target URL is stored twice — `ContainerSession.targetUrl` and again in the `ContainerLog` details string — so any retention rule has to clear both. | privacy | the retention work in P1 |
| D5 | Which access, correction and deletion rights are offered, and how a request is authenticated. There is no account: the only identifier is a session cookie the visitor has probably already discarded, so a right to deletion may be one you cannot operationally deliver. Retaining less makes this question smaller. | privacy | D4 |
| D6 | Governing law and where disputes are heard. | terms | D1 |
| D7 | Which limits to state publicly — session length, sessions per visitor, any daily cap. Ten minutes is real today; the per-visitor cap is not implemented yet. | terms | the concurrency cap in P0 |
| D8 | Effective date for the first published version of each document. Set this last, when the rest are settled. | privacy, terms | D1–D7 |
| D9 | Whether the hosting provider keeps access logs containing IP addresses, and for how long. Depends on where this is deployed; the app itself only holds IPs in memory for rate limiting. | privacy | choice of host |
| D10 | What response time to promise abuse reporters, and whether they get a reply confirming the outcome. Promise only what you will actually do. | abuse | D3 |

Two of these are worth deciding early because other things wait on them: D1,
because it decides whose name is on the documents, and D4, because the privacy
page cannot be finished until retention is settled and every other date and
right depends on it.

## P3 — operations

- [ ] Reap orphaned containers on backend restart; the ten-minute timer lives in memory (`dockerManager.ts:130`) and does not survive a process restart.
- [ ] CSP and frame policy: `helmet` currently runs with `contentSecurityPolicy: false` and `frameguard: false` (`apps/backend/src/index.ts:32`) to allow iframing the VNC view. Worth replacing with a real policy rather than disabled.
- [ ] TLS termination and `wss://` for the VNC stream.
- [ ] A spend/resource ceiling and basic monitoring, so a burst is capped by something other than the host falling over.
