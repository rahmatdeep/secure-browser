import Link from "next/link";
import type { CSSProperties } from "react";
import { SessionCountdown } from "@/components/SessionCountdown";
import { StopSessionButton } from "@/components/StopSessionButton";
import { SessionViewport } from "@/components/SessionViewport";
import {
  StatusScreen,
  statusActionClass,
  statusLinkClass,
} from "@/components/StatusScreen";
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
      <StatusScreen
        kicker="Session unavailable"
        title="This browser isn't available."
        body="It may have reached its ten-minute limit, been closed, or lost its connection. Try again or start a new session."
      >
        <Link href="/" className={statusActionClass}>
          Start a new session
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
        <a
          href={`/session/${encodeURIComponent(containerId)}`}
          className={statusLinkClass}
        >
          Try this session again
        </a>
      </StatusScreen>
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
