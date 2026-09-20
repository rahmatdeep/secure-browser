"use client";

import { SESSION_TIMEOUT_MS } from "@secure-browser/shared";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface SessionCountdownProps {
  createdAt?: string | Date;
  variant?: "text" | "ring" | "pill";
  size?: "sm" | "lg";
}

function getRemaining(createdAt?: string | Date) {
  if (!createdAt) return SESSION_TIMEOUT_MS - 144000;
  const started = new Date(createdAt).getTime();
  if (Number.isNaN(started)) return SESSION_TIMEOUT_MS;
  return Math.max(0, started + SESSION_TIMEOUT_MS - Date.now());
}

function formatTime(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function SessionCountdown({
  createdAt,
  variant = "text",
  size = "sm",
}: SessionCountdownProps) {
  const [remaining, setRemaining] = useState(() => getRemaining(createdAt));

  useEffect(() => {
    setRemaining(getRemaining(createdAt));
    const interval = window.setInterval(() => {
      setRemaining(getRemaining(createdAt));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [createdAt]);

  /**
   * The list and the session header are server-rendered and only re-render
   * when revalidatePath fires — which createSession and stopSession do, but
   * the backend's own ten-minute timer does not. Left alone, an expired
   * session sits there reading 00:00 with a live dot and a View button
   * pointing at a container that is gone.
   *
   * Refreshing the route when the clock runs out lets the server drop the row.
   * Once per mount: the guard stops a session the server has not yet reaped
   * from refreshing in a loop. Decorative countdowns have no createdAt and
   * must not touch the router.
   */
  const router = useRouter();
  const refreshed = useRef(false);

  useEffect(() => {
    if (!createdAt || remaining > 0 || refreshed.current) return;
    refreshed.current = true;
    router.refresh();
  }, [createdAt, remaining, router]);

  const ended = remaining <= 0;
  const fraction = Math.max(0, Math.min(1, remaining / SESSION_TIMEOUT_MS));
  const label = formatTime(remaining);
  const isLarge = size === "lg";
  const diameter = isLarge ? 268 : 18;
  const radius = isLarge ? 120 : 7.5;
  const stroke = isLarge ? 2.5 : 2;
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const dashOffset = circumference * (1 - fraction);

  if (variant === "text") {
    return (
      <span className={`font-mono ${ended ? "text-fg-3" : "text-fg-2"}`}>
        {label}
      </span>
    );
  }

  const ring = (
    <svg
      width={diameter}
      height={diameter}
      viewBox={`0 0 ${diameter} ${diameter}`}
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx={diameter / 2}
        cy={diameter / 2}
        r={radius}
        stroke={isLarge ? "var(--line)" : "currentColor"}
        strokeWidth={isLarge ? 1.5 : stroke}
      />
      <circle
        cx={diameter / 2}
        cy={diameter / 2}
        r={radius}
        stroke={ended ? "currentColor" : "var(--accent)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
      />
    </svg>
  );

  if (variant === "pill") {
    return (
      <div className="flex h-9 items-center gap-2.5 rounded-full border border-ink-line px-3 py-0 text-on-ink-3">
        <span className="relative h-[18px] w-[18px]">{ring}</span>
        <span className="font-mono text-[12.5px] tracking-[-0.004em] text-on-ink">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-[268px] w-[268px] text-fg-3">
      {ring}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        <span className="font-mono text-[42px] font-medium leading-none tracking-[-0.03em] text-fg">
          {label}
        </span>
        <span className="text-[12.5px] tracking-[-0.002em] text-fg-3">
          remaining
        </span>
      </div>
    </div>
  );
}
