/**
 * Persistent beta marker, rendered from the root layout so it appears on every
 * page — landing, session, written pages, 404 and the error boundary.
 *
 * Amber rather than the product palette, matching <Pending>: in this codebase
 * amber means "not finished yet".
 *
 * pointer-events-none on purpose. It sits over a live session viewport where a
 * stray click target could swallow input meant for the remote browser, and it
 * has nothing to click anyway. It is also below the handoff overlay's z-50, so
 * the wipe covers it rather than leaving a badge floating over the transition.
 */
export function BetaBadge() {
  return (
    <div
      role="note"
      aria-label="SafeWeb is in beta. Sessions are not private from other users yet."
      className="pointer-events-none fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-[oklch(0.62_0.15_65/0.45)] bg-[oklch(0.62_0.15_65)] px-[11px] py-[5px] shadow-[0_2px_10px_-2px_oklch(0.2_0.01_255/0.25)] sm:bottom-5 sm:left-5"
    >
      <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[oklch(0.20_0.05_65)]" />
      <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.09em] text-[oklch(0.20_0.05_65)]">
        Beta
      </span>
    </div>
  );
}
