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
      className="pointer-events-none absolute top-1/2 right-[-252px] -z-[10] hidden h-[880px] w-[880px] -translate-y-1/2 xl:block"
    >
      <span className="absolute top-1/2 left-1/2 h-[880px] w-[880px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-on-ink/25" />
      <span className="absolute top-1/2 left-1/2 h-[712px] w-[712px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-on-ink/35" />
      <span className="absolute top-1/2 left-1/2 h-[556px] w-[556px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-on-ink/20 bg-on-ink/[0.05]" />
      <span className="absolute top-1/2 left-1/2 h-[412px] w-[412px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-on-ink/25" />

      {/* orbit marker, sitting on the second ring */}
      <span className="absolute top-1/2 left-1/2 h-[7px] w-[7px] -translate-y-1/2 translate-x-[352px] rounded-full bg-on-ink" />

      {/* Dark glass rather than a white card: a bright panel punched a hole in
          the footage and read as pasted on top of it. Tinted and blurred, it
          sits IN the scene — you see the video through the page it contains. */}
      <div className="absolute top-1/2 left-1/2 w-[468px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-on-ink/15 bg-ink/45 shadow-[0_28px_64px_-28px_oklch(0.1_0.01_255/0.55)] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-on-ink/10 bg-on-ink/[0.06] px-[15px] py-[11px]">
          <div className="flex gap-[5px]">
            <span className="h-[7px] w-[7px] rounded-full bg-on-ink/25" />
            <span className="h-[7px] w-[7px] rounded-full bg-on-ink/25" />
            <span className="h-[7px] w-[7px] rounded-full bg-on-ink/25" />
          </div>
          <span className="font-mono text-[10.5px] tracking-[0.02em] text-on-ink/45">
            vnc-browser-a3f9c1d2
          </span>
        </div>

        <div className="flex flex-col gap-5 px-7 py-[26px]">
          <div className="flex items-center justify-between gap-4">
            <div className="h-2.5 w-24 rounded-[3px] bg-on-ink/20" />
            <div className="flex gap-[13px]">
              <div className="h-[7px] w-10 rounded-[3px] bg-on-ink/12" />
              <div className="h-[7px] w-8 rounded-[3px] bg-on-ink/12" />
              <div className="h-[7px] w-[46px] rounded-[3px] bg-on-ink/12" />
            </div>
          </div>
          <div className="flex flex-col gap-[9px]">
            <div className="h-[22px] w-[62%] rounded-[5px] bg-on-ink/20" />
            <div className="h-[22px] w-[44%] rounded-[5px] bg-on-ink/14" />
          </div>
          <div className="grid grid-cols-3 gap-[13px]">
            <div className="h-[72px] rounded-lg bg-on-ink/10" />
            <div className="h-[72px] rounded-lg bg-on-ink/10" />
            <div className="h-[72px] rounded-lg bg-on-ink/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
