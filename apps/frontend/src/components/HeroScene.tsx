"use client";

import { useEffect, useRef } from "react";

/**
 * The hero's backdrop scene.
 *
 * The outer layer reads --p for a parallax nudge as the hero leaves the
 * viewport (a Scrub ancestor supplies it; without one the registered
 * property's initial 0 means no parallax rather than a broken layout). The
 * video carries its own motion, so nothing else is animated on top of it —
 * a ken-burns drift over moving footage reads as a wobble.
 *
 * Playback stops whenever nothing is watching: off-screen, on a hidden tab,
 * and under prefers-reduced-motion, where it holds the first frame so the
 * hero keeps its image and loses only the movement.
 *
 * The ink backdrop is what shows until the first frame paints. There is no
 * poster attribute because this machine has no ffmpeg to cut one; adding one
 * later is a drop-in and would remove that gap.
 */
/**
 * Where the clip's subject sits, as a percentage nudge.
 *
 * The frame is wider than 16:9, so object-cover crops top and bottom only and
 * object-position has no horizontal effect — moving a subject sideways means
 * scaling up and translating.
 *
 * Order matters, and getting it wrong exposed the clip's left edge: in
 * `scale() translateX()` the translate happens inside the scaled coordinate
 * system, so a 13% nudge really moves 1.28 x 13%. Translating FIRST keeps the
 * percentage honest against the element's own width. Scale then only has to
 * out-run the shift itself — 1.32 overflows 16% a side against a 13% nudge.
 *
 * This is the one number to retune when the footage changes. Positive moves
 * the subject RIGHT, away from the headline.
 */
const FOCUS_SHIFT = "13%";

export function HeroScene() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }

    let visible = document.visibilityState === "visible";
    let onScreen = true;

    const sync = () => {
      if (visible && onScreen) {
        // Autoplay can still be refused (power saving, platform policy); the
        // backdrop and scrim stand on their own if it is.
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0 }
    );
    observer.observe(video);

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-[30] overflow-hidden bg-ink"
    >
      <div
        className="absolute inset-0"
        style={{ transform: "translate3d(0, calc(var(--p, 0) * 44px), 0)" }}
      >
        <video
          ref={ref}
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={-1}
          style={{ transform: `translateX(${FOCUS_SHIFT}) scale(1.32)` }}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
