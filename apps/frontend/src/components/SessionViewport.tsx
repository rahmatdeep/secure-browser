"use client";

import { Expand, Maximize2, Minimize2, Monitor } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NOVNC_BAR = 25;

type ViewMode = "default" | "theatre";

interface SessionViewportProps {
  src: string;
  isMobile: boolean;
}

export function SessionViewport({ src, isMobile }: SessionViewportProps) {
  const [mode, setMode] = useState<ViewMode>("default");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement === rootRef.current) {
      await document.exitFullscreen();
      return;
    }

    await rootRef.current?.requestFullscreen();
  };

  const selectMode = async (nextMode: ViewMode) => {
    setMode(nextMode);
    if (document.fullscreenElement === rootRef.current) {
      await document.exitFullscreen();
    }
  };

  const playerClass = isFullscreen
    ? isMobile
      ? "h-full max-h-screen max-w-full"
      : "w-full max-w-[calc(100vh*16/9)]"
    : mode === "theatre"
      ? isMobile
        ? "h-[min(78svh,800px)] max-w-full"
        : "w-full"
      : isMobile
        ? "h-[min(68svh,667px)] max-w-full"
        : "w-full max-w-[1024px]";

  return (
    <div
      ref={rootRef}
      className={`bg-black ${
        isFullscreen
          ? "flex h-screen w-screen flex-col"
          : `mx-auto rounded-xl transition-[max-width] duration-300 ease-[var(--ease)] ${
              mode === "default" && !isMobile ? "max-w-[1056px]" : "max-w-none"
            }`
      }`}
    >
      <div
        className={`flex items-center justify-end gap-1.5 bg-ink-2 px-2 py-2 ${
          isFullscreen ? "absolute top-3 right-3 z-20 rounded-xl border border-ink-line/80 bg-ink/90 backdrop-blur-md" : "rounded-t-xl border-x border-t border-ink-line"
        }`}
        aria-label="Stream view"
      >
        <button
          type="button"
          onClick={() => void selectMode("default")}
          aria-label="Default view"
          aria-pressed={!isFullscreen && mode === "default"}
          className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-[12.5px] font-medium text-on-ink-2 transition-colors hover:bg-ink-3 hover:text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:bg-on-ink aria-pressed:text-ink"
        >
          <Minimize2 className="h-4 w-4" strokeWidth={1.6} />
          <span className="hidden sm:inline">Default</span>
        </button>
        <button
          type="button"
          onClick={() => void selectMode("theatre")}
          aria-label="Theatre view"
          aria-pressed={!isFullscreen && mode === "theatre"}
          className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-[12.5px] font-medium text-on-ink-2 transition-colors hover:bg-ink-3 hover:text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:bg-on-ink aria-pressed:text-ink"
        >
          <Expand className="h-4 w-4" strokeWidth={1.6} />
          <span className="hidden sm:inline">Theatre</span>
        </button>
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
          aria-pressed={isFullscreen}
          className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-[12.5px] font-medium text-on-ink-2 transition-colors hover:bg-ink-3 hover:text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:bg-on-ink aria-pressed:text-ink"
        >
          <Maximize2 className="h-4 w-4" strokeWidth={1.6} />
          <span className="hidden sm:inline">Full screen</span>
        </button>
      </div>

      <div className={`flex min-h-0 flex-1 items-center justify-center ${isFullscreen ? "h-full" : "border-x border-ink-line p-3 sm:p-4"}`}>
        <div
          className={`relative overflow-hidden bg-[oklch(0.965_0.002_255)] ${playerClass}`}
          style={{ aspectRatio: isMobile ? "375 / 667" : "16 / 9" }}
        >
          <iframe
            src={src}
            className="absolute left-0 w-full border-0"
            title="VNC Session"
            style={{
              top: `-${NOVNC_BAR}px`,
              height: `calc(100% + ${NOVNC_BAR}px)`,
              minHeight: isMobile ? "200px" : "300px",
            }}
          />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="stream-sweep h-[120px]" />
          </div>
        </div>
      </div>

      {!isFullscreen && (
        <div className="flex flex-col justify-between gap-2 rounded-b-xl border-x border-b border-ink-line px-4 pt-1 pb-4 text-on-ink-3 sm:flex-row sm:items-center sm:px-5">
          <div className="flex items-center gap-2.5">
            <Monitor className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span className="text-[12.5px] tracking-[-0.004em]">
              Keystrokes and clicks travel to the container. Nothing travels
              back but pixels.
            </span>
          </div>
          <span className="shrink-0 font-mono text-[11.5px]">
            streamed over websockify
          </span>
        </div>
      )}
    </div>
  );
}
