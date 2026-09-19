"use client";

import { useEffect, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { SafeWebMark } from "./SafeWebMark";

/**
 * The stages DockerManager.createContainer actually moves through, in the
 * order it moves through them. They light up on a CSS stagger rather than from
 * real progress — the server action is a single blocking POST, so there is no
 * progress signal to read. Each label is therefore phrased as a stage that is
 * under way, never as one that has provably finished, and the last one simply
 * stays lit: the only honest "done" is the navigation itself.
 */
const STAGES = [
  { label: "Allocating a container", detail: "vnc-browser-chrome:latest" },
  { label: "Starting Chrome inside it", detail: "own filesystem, own network namespace" },
  { label: "Attaching to the bridge", detail: "secure-browser-net — no published ports" },
  { label: "Opening your link in there", detail: "streaming back over WebSocket" },
];

interface SessionHandoffProps {
  /** Shown so the user can confirm what is being opened while they wait. */
  url: string;
}

/**
 * Covers the gap between submitting a URL and the session page rendering.
 *
 * It does two jobs at once. It fills the multi-second Docker wait, which was
 * previously represented by a spinner inside the submit button and nothing
 * else; and it carries the page from the landing theme's white to the session
 * theme's ink, so the two pages no longer swap luminance in a single frame.
 *
 * Two constraints shape this component, both found by measuring it:
 *
 * It must sit inside <form> in the React tree, because useFormStatus only
 * reports for an ancestor form — but it is portalled to <body> in the DOM. A
 * fixed element is positioned against the nearest ancestor that has a
 * transform or filter, and the hero wraps this form in .rise, whose keyframes
 * end at `filter: blur(0)`. A non-none filter creates a containing block
 * permanently, so rendering in place pinned the overlay to the form's wrapper
 * instead of the viewport.
 *
 * And it must not setState while the action is pending. A re-render inside the
 * form during a pending action makes useFormStatus report pending: false, which
 * unmounted this overlay about two seconds into a seven-second wait. The stage
 * sequence is therefore a pure CSS stagger holding no React state.
 */
export function SessionHandoff({ url }: SessionHandoffProps) {
  const { pending } = useFormStatus();
  // document does not exist during the server render. Set once on mount, well
  // before any submit, so it never re-renders during a pending action.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!pending) return;
    // The wipe covers the viewport; a scrollbar moving underneath it shows as
    // a seam at the edge.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [pending]);

  if (!pending || !mounted) return null;

  return createPortal(
    <div
      className="handoff fixed inset-0 z-50 flex flex-col items-center justify-center gap-11 bg-ink px-6 text-on-ink"
      role="status"
      aria-live="polite"
      aria-label="Starting your session"
    >
      <div className="handoff-in flex items-center gap-[11px] text-[15px] font-semibold leading-none tracking-[-0.018em]">
        <SafeWebMark />
        SafeWeb
      </div>

      <div
        className="handoff-in flex w-full max-w-[420px] flex-col gap-7"
        style={{ animationDelay: "400ms" }}
      >
        <div className="flex flex-col items-center gap-2.5 text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.09em] text-on-ink-3">
            Preparing an isolated browser
          </span>
          {url && (
            <span className="max-w-full truncate font-mono text-[13px] tracking-[-0.002em] text-on-ink-2">
              {url}
            </span>
          )}
        </div>

        {/* Indeterminate by design: a determinate bar would have to invent a
            percentage, and this wait has no measurable one. */}
        <div className="h-px w-full overflow-hidden bg-ink-line">
          <div className="handoff-bar h-full w-1/3 bg-accent" />
        </div>

        <ol className="flex flex-col gap-[13px]">
          {STAGES.map((s, i) => (
            <li
              key={s.label}
              className="handoff-stage flex items-baseline gap-3.5"
              style={{ "--i": i } as React.CSSProperties}
            >
              <span className="live-dot mt-[5px] h-[5px] w-[5px] shrink-0 rounded-full bg-accent" />
              <span className="flex min-w-0 flex-col gap-[3px]">
                <span className="text-[14px] tracking-[-0.009em] text-on-ink">
                  {s.label}
                </span>
                <span className="font-mono text-[11px] tracking-[0.004em] text-on-ink-3">
                  {s.detail}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <p
        className="handoff-in max-w-[340px] text-center text-[12.5px] leading-[1.5] text-on-ink-3"
        style={{ animationDelay: "480ms" }}
      >
        Nothing has touched your machine. The page loads in the container and
        reaches you as pixels.
      </p>
    </div>,
    document.body
  );
}
