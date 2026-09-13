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
          className="h-full w-full scale-105 object-cover"
        />
      </div>
    </div>
  );
}
