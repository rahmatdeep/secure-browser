# SafeWeb — road to a public deployment

Ordered by what blocks what. P0 items are not "before launch polish" — they are
things a stranger can exploit the moment the URL is public.

Code references are to the state at commit 5084088.

## P0 — blocks putting this on a public URL

- [ ] **Fix the missing-token check in `getContainerInfo`, which lets a stranger watch and control any live session.** `dockerManager.ts:209` reads `if (guestToken && info.guestToken && info.guestToken !== guestToken)` — when no token is supplied the comparison is skipped and the session is returned. The VNC proxy's authorisation middleware (`index.ts:107`) treats that as permission and proxies the stream. Verified against a running instance: a request with **no** token returns 200 and the real noVNC viewer, while a request with a **wrong** token correctly returns 403. Absent credentials succeed where wrong ones fail. Keystrokes and clicks travel to the container, so this is interactive control of someone else's session, not just a view of it. Combined with the unauthenticated listing below — which hands out both the container id and the victim's guest token — the whole chain is reachable from the internet with two `curl` commands and no credentials. Treat a missing token as deny in both `getContainerInfo` and `listActiveContainers`.
- [ ] **Remove `--disable-web-security` from the session browser.** `docker/browser/start.sh` launches Chrome with it, which turns off the same-origin policy inside the container. Any page a visitor opens can then read cross-origin responses — including `http://backend:3001/api/containers` on the shared bridge — so the session listing and the takeover above become scriptable from a hostile page rather than needing someone to type a URL. Nothing in the product appears to need this flag.
- [ ] **Give the session VNC server a password, or stop exposing 5900 on the shared network.** `start.sh` runs `x11vnc -nopw -shared`, so port 5900 accepts any client on `secure-browser-net` with no credential, and `-shared` means several at once. The backend proxy only fronts 6080; 5900 is reachable directly by any other container on that bridge.
- [ ] **Stop running the session browser as root with `--no-sandbox`.** `docker/browser/Dockerfile` sets no `USER`, so everything runs as root, and `start.sh` disables Chrome's own sandbox. A browser exploit therefore lands as root inside a container that has no hardening flags either. These two belong together with the container-hardening item below.
- [ ] **Stop `GET /api/containers` returning every session when no token is sent.** `dockerManager.ts:265` only applies the guest-token filter `if (guestToken)`, so a request with no `x-guest-token` header skips filtering entirely and returns all active sessions — including each one's `url` and its `guestToken`, which the response puts in the payload. Backend port 3001 is published (`docker-compose.yml:27`) and the browser talks to it directly via `NEXT_PUBLIC_API_URL`, so this is an internet-facing endpoint, not an internal one: an unauthenticated request lists what every current visitor is browsing. The leaked token is then usable — `getContainerInfo` accepts `?token=` as a query parameter (`containerController.ts:96`), so it works from a plain navigation. Treat missing token as "show nothing" rather than "show everything", and stop returning `guestToken` in the payload at all. This is the same absent-check inversion as `getContainerInfo` above, and the two compose: this endpoint supplies the container ids that the other one then serves without a credential.

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
| D11 | Whether to disclose that the session browser is Google Chrome, which may contact Google (for example Safe Browsing lookups) with addresses you open. `start.sh` passes `--disable-background-networking`, `--disable-sync` and `--disable-component-update`, which suppress much but not provably all of it. Either verify what it still sends and disclose that, or disable the remainder. | privacy | — |
| D9 | Whether the hosting provider keeps access logs containing IP addresses, and for how long. Depends on where this is deployed; the app itself only holds IPs in memory for rate limiting. | privacy | choice of host |
| D10 | What response time to promise abuse reporters, and whether they get a reply confirming the outcome. Promise only what you will actually do. | abuse | D3 |

Two of these are worth deciding early because other things wait on them: D1,
because it decides whose name is on the documents, and D4, because the privacy
page cannot be finished until retention is settled and every other date and
right depends on it.

## P3 — operations

- [ ] Reap orphaned containers on backend restart; the ten-minute timer lives in memory (`dockerManager.ts:130`) and does not survive a process restart.
- [ ] CSP and frame policy: `helmet` currently runs with `contentSecurityPolicy: false` and `frameguard: false` (`apps/backend/src/index.ts:32`) to allow iframing the VNC view. Worth replacing with a real policy rather than disabled.
- [ ] Pin the noVNC and websockify checkouts. `docker/browser/Dockerfile` does `git clone` of both with no tag or commit, so every image build pulls whatever HEAD is that day — builds are not reproducible, and the contents of the session viewer are whatever upstream last pushed.
- [ ] TLS termination and `wss://` for the VNC stream.
- [ ] A spend/resource ceiling and basic monitoring, so a burst is capped by something other than the host falling over.
