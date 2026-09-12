"use client";

import { stopSession } from "@/actions/sessionActions";
import { Loader2, X } from "lucide-react";
import { useState } from "react";

interface StopSessionButtonProps {
  containerId: string;
  variant?: "icon" | "light";
}

export function StopSessionButton({
  containerId,
  variant = "icon",
}: StopSessionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStop = async () => {
    setIsLoading(true);
    try {
      const result = await stopSession(containerId);
      if (!result.success) {
        console.error(
          `Failed to stop session: ${result.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error stopping session:", error);
      alert(
        `Failed to stop session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleStop}
      disabled={isLoading}
      aria-label="End session"
      title="End session"
      className={
        variant === "light"
          ? "flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-on-ink px-[17px] text-[13.5px] font-medium tracking-[-0.009em] text-ink transition-[filter] duration-200 ease-[var(--ease)] hover:brightness-95 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-fg-2 transition-[background,border-color,color] duration-200 ease-[var(--ease)] hover:bg-surface focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      {isLoading ? (
        <>
          <Loader2 className="spin h-[15px] w-[15px]" strokeWidth={1.5} />
          {variant === "light" ? <span>Ending</span> : null}
        </>
      ) : (
        <>
          {variant === "icon" ? (
            <X className="h-[15px] w-[15px]" strokeWidth={1.5} />
          ) : (
            <span>End session</span>
          )}
        </>
      )}
    </button>
  );
}
