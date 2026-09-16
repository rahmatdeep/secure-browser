import Link from "next/link";
import type { CSSProperties } from "react";
import { SessionCountdown } from "@/components/SessionCountdown";
import { StopSessionButton } from "@/components/StopSessionButton";
import { SessionViewport } from "@/components/SessionViewport";
import { SafeWebMark } from "@/components/SafeWebMark";
import {
  ArrowLeft,
  ArrowRight,
  Monitor,
  Smartphone,
} from "lucide-react";
import { headers } from "next/headers";
import axios from "axios";
import { isMobileUserAgent } from "@secure-browser/shared";
import { getGuestToken } from "@/lib/auth";

interface SessionPageProps {
  params: Promise<{
    containerId: string;
  }>;
}

async function getSessionInfo(containerId: string, guestToken: string) {
  const API_BASE =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";

  try {
    const response = await axios.get(
      `${API_BASE}/api/containers/${containerId}`,
      {
        headers: {
          "Cache-Control": "no-cache",
          "x-guest-token": guestToken,
        },
      }
    );

    return response.data.success ? response.data.data : null;
  } catch {
    return null;
  }
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { containerId } = await params;
  const guestToken = await getGuestToken();
  const session = await getSessionInfo(containerId, guestToken);
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isMobile = isMobileUserAgent(userAgent);
  const sessionUrl = session?.url
    ? (() => {
        try {
          return new URL(session.url).hostname;
        } catch {
          return session.url;
        }
      })()
    : "";

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const vncTargetUrl = session
    ? session.vncUrl.startsWith("http")
      ? session.vncUrl
      : `${apiBase}${session.vncUrl}`
    : "";

  if (!session) {
    return (
      <main className="relative isolate flex min-h-svh flex-col overflow-hidden bg-ink text-on-ink">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-[20] bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-poster.webp')" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-[10] bg-[linear-gradient(100deg,oklch(0.12_0.004_60/0.78)_0%,oklch(0.12_0.004_60/0.50)_38%,oklch(0.12_0.004_60/0.20)_100%)]"
        />

        <nav className="px-5 pt-5 sm:px-[72px] sm:pt-7">
          <div className="mx-auto flex max-w-[1024px] items-center">
            <Link
              href="/"
              className="flex items-center gap-[11px] text-[15px] font-semibold leading-none tracking-[-0.018em] hover:no-underline"
            >
              <SafeWebMark />
              SafeWeb
            </Link>
          </div>
        </nav>

        <section className="flex flex-1 items-center px-5 py-24 sm:px-[72px]">
          <div className="mx-auto w-full max-w-[1024px]">
            <div className="flex max-w-[580px] flex-col gap-[26px] [text-shadow:0_1px_32px_oklch(0.1_0.01_60/0.6)]">
              <div className="flex items-center gap-3.5">
                <span className="h-px w-8 bg-on-ink/40" />
                <span className="font-mono text-[11px] uppercase tracking-[0.09em] text-on-ink-2">
                  Session unavailable
                </span>
              </div>

              <h1 className="max-w-[560px] text-[clamp(44px,7vw,72px)] font-semibold leading-[0.95] tracking-[-0.045em]">
                This browser isn&apos;t available.
              </h1>
              <p className="max-w-[440px] text-[17px] leading-[1.55] tracking-[-0.009em] text-on-ink-2 sm:text-[18px]">
                It may have reached its ten-minute limit, been closed, or lost
                its connection. Try again or start a new session.
              </p>

              <div className="flex flex-wrap items-center gap-5 pt-2.5">
                <Link
                  href="/"
                  className="inline-flex h-12 items-center gap-3 rounded-full bg-on-ink px-[22px] text-[15px] font-medium tracking-[-0.011em] text-ink hover:no-underline"
                >
                  Start a new session
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
                <a
                  href={`/session/${encodeURIComponent(containerId)}`}
                  className="text-[14px] tracking-[-0.008em] text-on-ink-2 underline decoration-on-ink/40 underline-offset-4 transition-colors hover:text-on-ink"
                >
                  Try this session again
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div
      className="min-h-screen bg-ink text-on-ink"
      style={{ "--accent": "oklch(0.62 0.16 255)" } as CSSProperties}
    >
      <div className="rise border-b border-ink-line">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/"
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-ink-line text-on-ink-2 hover:no-underline"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-[15px] w-[15px]" strokeWidth={1.5} />
            </Link>

            <div className="flex min-w-0 flex-col gap-[3px]">
              <div className="flex min-w-0 flex-wrap items-center gap-[9px]">
                <h1
                  className="truncate text-[14.5px] font-medium tracking-[-0.013em] text-on-ink"
                  title={session.url}
                >
                  {sessionUrl}
                </h1>
                <div className="flex items-center gap-1.5 rounded-[5px] bg-ink-3 px-[7px] py-0.5 font-mono text-[10.5px] uppercase tracking-[0.02em] text-on-ink-2">
                  {isMobile ? (
                    <Smartphone className="h-3 w-3" strokeWidth={1.5} />
                  ) : (
                    <Monitor className="h-3 w-3" strokeWidth={1.5} />
                  )}
                  {isMobile ? "Mobile 375x667" : "Desktop 1280x720"}
                </div>
              </div>
              <span className="truncate font-mono text-[11.5px] text-on-ink-3">
                vnc-browser-{containerId.slice(0, 8)} - internal address
                pending - {session.vncPort ? `${session.vncPort}` : "port pending"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SessionCountdown createdAt={session.createdAt} variant="pill" />
            <div className="flex h-9 items-center gap-2 rounded-full border border-ink-line px-3.5">
              <span className="live-dot h-[5px] w-[5px] rounded-full bg-accent" />
              <span className="text-[12.5px] tracking-[-0.006em] text-on-ink-2">
                Streaming
              </span>
            </div>
            <StopSessionButton
              containerId={containerId}
              variant="light"
              redirectTo="/"
            />
          </div>
        </div>
      </div>

      <div className="lift p-4 sm:p-[26px_28px_22px]">
        <SessionViewport
          src={`${vncTargetUrl}?path=api/containers/${containerId}/vnc/websockify&token=${encodeURIComponent(guestToken)}&scale=true`}
          isMobile={isMobile}
        />
      </div>

    </div>
  );
}
