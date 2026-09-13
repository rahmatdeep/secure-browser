/**
 * The hero's optical frame: four concentric hairline rings with the contained
 * page floating at their centre, anchored so the outer rings crop off the
 * right edge of the viewport.
 *
 * Decorative only. The skeleton inside the card is the same vocabulary as
 * IsolationSequence's frame, one beat earlier in the story — the page exists,
 * but you are looking at it from four rings away.
 */
export function Aperture() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-[-252px] hidden h-[880px] w-[880px] -translate-y-1/2 xl:block"
    >
      <span className="absolute top-1/2 left-1/2 h-[880px] w-[880px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/50" />
      <span className="absolute top-1/2 left-1/2 h-[712px] w-[712px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/75" />
      <span className="absolute top-1/2 left-1/2 h-[556px] w-[556px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/15 bg-accent/[0.025]" />
      <span className="absolute top-1/2 left-1/2 h-[412px] w-[412px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-accent/20" />

      {/* orbit marker, sitting on the second ring */}
      <span className="absolute top-1/2 left-1/2 h-[7px] w-[7px] -translate-y-1/2 translate-x-[352px] rounded-full bg-accent" />

      <div className="absolute top-1/2 left-1/2 w-[468px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-line bg-bg shadow-[0_28px_64px_-28px_oklch(0.2_0.01_255/0.16),0_2px_6px_-2px_oklch(0.2_0.01_255/0.06)]">
        <div className="flex items-center justify-between border-b border-line bg-surface px-[15px] py-[11px]">
          <div className="flex gap-[5px]">
            <span className="h-[7px] w-[7px] rounded-full bg-[oklch(0.86_0.004_255)]" />
            <span className="h-[7px] w-[7px] rounded-full bg-[oklch(0.86_0.004_255)]" />
            <span className="h-[7px] w-[7px] rounded-full bg-[oklch(0.86_0.004_255)]" />
          </div>
          <span className="font-mono text-[10.5px] tracking-[0.02em] text-fg-3">
            vnc-browser-a3f9c1d2
          </span>
        </div>

        <div className="flex flex-col gap-5 px-7 py-[26px]">
          <div className="flex items-center justify-between gap-4">
            <div className="h-2.5 w-24 rounded-[3px] bg-[oklch(0.86_0.004_255)]" />
            <div className="flex gap-[13px]">
              <div className="h-[7px] w-10 rounded-[3px] bg-[oklch(0.90_0.004_255)]" />
              <div className="h-[7px] w-8 rounded-[3px] bg-[oklch(0.90_0.004_255)]" />
              <div className="h-[7px] w-[46px] rounded-[3px] bg-[oklch(0.90_0.004_255)]" />
            </div>
          </div>
          <div className="flex flex-col gap-[9px]">
            <div className="h-[22px] w-[62%] rounded-[5px] bg-[oklch(0.84_0.005_255)]" />
            <div className="h-[22px] w-[44%] rounded-[5px] bg-[oklch(0.88_0.004_255)]" />
          </div>
          <div className="grid grid-cols-3 gap-[13px]">
            <div className="h-[72px] rounded-lg bg-[oklch(0.915_0.003_255)]" />
            <div className="h-[72px] rounded-lg bg-[oklch(0.915_0.003_255)]" />
            <div className="h-[72px] rounded-lg bg-[oklch(0.915_0.003_255)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
