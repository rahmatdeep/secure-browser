# TODO

Known issues, found while reworking the landing page and session view.
Ordered by severity within each group.

## Security

- [ ] **Host ports are published by default, contradicting the isolation claim.**
      `dockerManager.ts:63` reads `ENABLE_HOST_PORT_BINDINGS !== "false"`, so the
      default is on and every session publishes `6080` and `5900` to random host
      ports. `docker-compose.dev.yml` sets it `"true"` explicitly;
      `docker-compose.yml` sets nothing, so it is on in both stacks.
      `IsolationSequence.tsx:14` tells visitors the container has "no published
      ports", and `CLAUDE.md` says the same. Either set the flag to `false` in
      both compose files — the proxy path does not need the bindings, which is
      the point of the bridge-network design — or change the copy.

- [ ] **Port 5900 is unauthenticated VNC.** `docker/browser/start.sh:44` runs
      `x11vnc -nopw`. With the bindings above, every live session exposes
      full keyboard-and-mouse control of a browser on a host port with no
      password. 5900 should not be published even if 6080 is kept for host dev.

## Session lifecycle

The 10-minute kill works in the normal case. It stops working under crash,
restart, or a container exiting on its own.

- [ ] **A failed stop leaks the session forever.** In `stopContainer`,
      `activeContainers.delete()` (`dockerManager.ts:190`) sits inside the `try`,
      after `container.stop()`. Containers run with `AutoRemove: true`, so if
      Chrome crashes and Docker reaps the container, `stop()` throws and the
      entry is never removed. The session then lists forever, counting past
      `00:00`, and the timeout has already fired so nothing retries.
      Smallest fix of the group: move the delete into a `finally`.

- [ ] **Restart-cleanup never closes database rows.**
      `cleanupOrphanedContainers` (`dockerManager.ts:211`) force-removes
      containers and logs, but never calls `db.endSession()`. Every session
      alive at restart stays `ACTIVE` in Postgres with no `endedAt` and no
      `duration`, permanently.

- [ ] **A backend restart kills every live session instantly.** The same
      cleanup removes all `vnc-browser-*` containers on boot regardless of age,
      so a session five seconds old dies with the rest. Nothing leaks, but a
      deploy is a user-visible outage.

- [ ] **The kill timer is in-memory only.** `dockerManager.ts:129` schedules a
      `setTimeout` on the instance; a crash or reload loses every pending timer.
      Today the boot-time cleanup masks this by killing everything instead.

- [ ] **The session list reads memory, not the database.**
      `listActiveContainers` (`dockerManager.ts:202`) returns the in-process
      `Map`. `db.getActiveSessions()` exists and is never called by the API, so
      after a restart the API reports zero while Postgres still says active —
      and only one backend process can ever know what is running. Blocks running
      a second replica.

## Session page

- [ ] **The "Streaming" pill is decorative.** `page.tsx:137` is static markup
      with a pulsing dot; it says "Streaming" whether or not anything is. It is
      now the only connection indicator on the page, because clipping noVNC's
      status bar (commit 89cc092) also hid the errors noVNC rendered there.
      Wire it to the real connection state.

- [ ] **The remote view does not use the viewport.** The frame is a fixed
      `56.25%` padding box (`page.tsx:155`), so on a tall window the remote
      browser is smaller than it needs to be with dead space beneath it.

- [ ] **`stream-sweep` animates over live content.** `page.tsx:190` drifts a
      gradient across a browser someone is reading and clicking. It suits the
      hero's static mockup, not an interactive stream.

- [ ] **The header reads like debug output.** `page.tsx:126` prints `internal
      address pending` — a hardcoded string that never resolves — beside a port number.
      Neither means anything to a user, and the port contradicts the isolation
      copy.

## Frontend, smaller

- [ ] **The landing page can serve a stale session list.** It is server
      rendered, so Next's client router cache can show a session that was
      already stopped when navigating back to `/`. `router.refresh()` on expiry
      (commit dd119aa) covers the timer case only. Fix with
      `export const dynamic = "force-dynamic"` on the page, or by fetching the
      list client-side.

- [ ] **`alert()` on stop failure.** `StopSessionButton.tsx:48` uses a native
      blocking dialog on an otherwise designed page. Needs an inline error state.

## Assets

- [ ] **No webm for the hero video.** Only H.264 is shipped. A VP9 webm served
      first is usually 30-40% smaller again.
