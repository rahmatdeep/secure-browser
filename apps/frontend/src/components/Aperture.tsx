"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Four concentric isolation rings with a remote browser tab at their centre.
 * The composition is decorative; the real session controls remain in the form.
 */
export function Aperture() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    let onScreen = true;
    let pageVisible = document.visibilityState === "visible";
    const sync = () => setIsPlaying(onScreen && pageVisible);

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    observer.observe(node);

    const onVisibilityChange = () => {
      pageVisible = document.visibilityState === "visible";
      sync();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`aperture pointer-events-none absolute top-1/2 right-[-252px] hidden h-[880px] w-[880px] -translate-y-1/2 xl:block ${isPlaying ? "" : "aperture--paused"}`}
    >
      <span className="aperture-ring aperture-ring-1 absolute top-1/2 left-1/2 h-[880px] w-[880px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/50" />
      <span className="aperture-ring aperture-ring-2 absolute top-1/2 left-1/2 h-[712px] w-[712px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/75" />
      <span className="aperture-ring aperture-ring-3 absolute top-1/2 left-1/2 h-[556px] w-[556px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/15 bg-accent/[0.025]" />
      <span className="aperture-ring aperture-ring-4 absolute top-1/2 left-1/2 h-[412px] w-[412px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-accent/20" />

      <div className="aperture-tab absolute top-1/2 left-1/2 w-[468px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-line bg-bg shadow-[0_28px_64px_-28px_oklch(0.2_0.01_255/0.16),0_2px_6px_-2px_oklch(0.2_0.01_255/0.06)]">
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
