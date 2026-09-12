"use client";

import { ReactNode, useEffect, useRef } from "react";

interface ScrubProps {
  children: ReactNode;
  className?: string;
  /** "view" scrubs while the element crosses the viewport; "pin" is for tall
   *  tracks holding a sticky stage. Both cover the same 0→1 range. */
  variant?: "view" | "pin";
  /** Also drive --mm, the 10→0 minute counter, over cover 20%–85%. */
  counter?: boolean;
}

/**
 * Drives --p from 0 to 1 across the element's pass through the viewport.
 *
 * Where `animation-timeline` is supported (Chrome/Edge 115+, Safari 26+) the
 * CSS in globals.css does this off the main thread and this component adds
 * nothing. Firefox still ships it behind a flag, so there we drive the same
 * custom property from a rAF-throttled scroll listener. Either way the rest of
 * the page only ever reads var(--p).
 */
export function Scrub({
  children,
  className = "",
  variant = "view",
  counter = false,
}: ScrubProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const native =
      typeof CSS !== "undefined" &&
      CSS.supports?.("animation-timeline: view()");

    if (native) {
      // Set longhands directly. Written as CSS they get merged back into the
      // `animation` shorthand by Lightning CSS, which Chrome then rejects.
      // `contain` spans exactly the window where a track taller than the
      // viewport fully covers it — i.e. the duration its sticky stage is
      // pinned. `cover` would also count the slide-in and slide-out.
      const range =
        variant === "pin" ? "contain 0% contain 100%" : "entry 0% exit 100%";
      const s = node.style;
      s.setProperty("animation-name", counter ? "scrub-p, scrub-mm" : "scrub-p");
      s.setProperty("animation-duration", counter ? "auto, auto" : "auto");
      s.setProperty("animation-timing-function", counter ? "linear, linear" : "linear");
      s.setProperty("animation-fill-mode", counter ? "both, both" : "both");
      s.setProperty("animation-timeline", counter ? "view(), view()" : "view()");
      s.setProperty(
        "animation-range",
        counter ? `${range}, contain 10% contain 85%` : range
      );
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;

      // Mirror the native range: "contain" for pinned tracks, "cover" otherwise.
      let p: number;
      if (variant === "pin" && rect.height > vh) {
        const span = rect.height - vh;
        p = span > 0 ? -rect.top / span : 0;
      } else {
        const span = vh + rect.height;
        p = span > 0 ? (vh - rect.top) / span : 0;
      }
      const clamped = Math.min(1, Math.max(0, p));

      node.style.setProperty("--p", clamped.toFixed(4));

      if (counter) {
        const t = Math.min(1, Math.max(0, (clamped - 0.1) / 0.75));
        node.style.setProperty("--mm", String(Math.round(10 * (1 - t))));
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [counter, variant]);

  const cls = variant === "pin" ? "scrub-pin" : "scrub-view";

  return (
    <div ref={ref} className={`${cls} ${counter ? "scrub-mm" : ""} ${className}`}>
      {children}
    </div>
  );
}
