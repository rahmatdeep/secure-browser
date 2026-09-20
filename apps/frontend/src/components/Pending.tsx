import type { ReactNode } from "react";

interface PendingProps {
  /** Decision id, matching the "Decisions to make" table in TODO.md. */
  id: string;
  children: ReactNode;
}

/**
 * An unfilled decision, rendered loudly on purpose.
 *
 * Legal pages are the one place where a plausible-looking placeholder is
 * dangerous: text that reads as finished can be published and relied on. So
 * these are deliberately impossible to mistake for copy, and each one names
 * the decision it is waiting on so the page and TODO.md stay in step.
 *
 * When every marker is gone, drop the noindex from the page's metadata.
 */
export function Pending({ id, children }: PendingProps) {
  return (
    <mark className="mx-0.5 inline rounded-[4px] border border-dashed border-[oklch(0.62_0.15_65)] bg-[oklch(0.62_0.15_65/0.08)] px-[7px] py-[2px] font-mono text-[12.5px] tracking-[0.01em] text-[oklch(0.48_0.13_65)]">
      {id} · to decide: {children}
    </mark>
  );
}
