/**
 * Shown while the session page's server component fetches session info.
 *
 * The handoff overlay covers the create-then-redirect path, but not someone
 * opening a session URL directly or coming back to one. Without this, that
 * route paints the default white until the ink page resolves. It mirrors the
 * real header's geometry so the arrival is a fill-in rather than a re-layout.
 */
export default function SessionLoading() {
  return (
    <div className="min-h-screen bg-ink text-on-ink" aria-busy="true">
      <div className="border-b border-ink-line">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-[34px] w-[34px] shrink-0 rounded-full border border-ink-line" />
            <div className="flex min-w-0 flex-col gap-[7px]">
              <div className="h-[13px] w-40 rounded bg-ink-3" />
              <div className="h-[10px] w-56 rounded bg-ink-2" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-9 w-[104px] rounded-full border border-ink-line" />
            <div className="h-9 w-[116px] rounded-full border border-ink-line" />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-[26px_28px_22px]">
        <div className="flex aspect-[16/10] w-full items-center justify-center rounded-[14px] border border-ink-line bg-ink-2">
          <div className="flex items-center gap-3">
            <span className="live-dot h-[5px] w-[5px] rounded-full bg-accent" />
            <span className="font-mono text-[12px] uppercase tracking-[0.09em] text-on-ink-3">
              Connecting to the container
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
