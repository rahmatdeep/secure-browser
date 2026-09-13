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
 * and under prefers-reduced-motion, where the poster stands in for the video
 * so the hero keeps its image and loses only the movement.
 */

/**
 * Where the clip's subject sits, as a percentage nudge. Positive moves it
 * RIGHT, away from the headline.
 *
 * The frame is wider than 16:9, so object-cover crops top and bottom only and
 * object-position has no horizontal effect — moving a subject sideways means
 * scaling up and translating, which costs sharpness. Abstract footage has no
 * subject to dodge, so this is 0 and OVERSCAN stays near 1: the frame is seen
 * whole. Retune only if a clip puts something identifiable behind the type.
 *
 * Order matters. In `scale() translateX()` the translate happens inside the
 * scaled coordinate system, so the nudge is silently multiplied by the scale
 * and can overrun the overflow meant to hide the clip's edge. Translating
 * first keeps the percentage honest against the element's own width — and
 * keeps "positive means right" true regardless of MIRROR.
 */
const FOCUS_SHIFT = "0%";

/** Just enough overscan to keep the clip's own edges out of frame. */
const OVERSCAN = 1.04;

/**
 * Flip the clip horizontally. Safe for abstract footage; never enable it for
 * anything with text, faces, or a handedness to get wrong.
 */
const MIRROR = false;

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
        // poster and scrim stand on their own if it is.
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
          poster="/hero-poster.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={-1}
          style={{
            transform: `translateX(${FOCUS_SHIFT}) scale(${
              MIRROR ? -OVERSCAN : OVERSCAN
            }, ${OVERSCAN})`,
          }}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
