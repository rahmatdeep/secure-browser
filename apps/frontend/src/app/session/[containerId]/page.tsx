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
import { validateContainerId } from "@/lib/validation";

interface SessionPageProps {
  params: Promise<{
    containerId: string;
  }>;
}

async function getSessionInfo(containerId: string, guestToken: string) {
  const safeId = validateContainerId(containerId);
  const API_BASE =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";

  try {
    const response = await axios.get(
      `${API_BASE}/api/containers/${safeId}`,
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

async function getSessionTicket(containerId: string, guestToken: string): Promise<string | null> {
  const safeId = validateContainerId(containerId);
  const API_BASE =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";

  try {
    const response = await axios.post(
      `${API_BASE}/api/containers/${safeId}/vnc-ticket`,
      {},
      {
        headers: {
          "Cache-Control": "no-cache",
          "x-guest-token": guestToken,
        },
      }
    );

    return response.data.success ? response.data.data?.vncTicket || null : null;
  } catch {
    return null;
  }
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { containerId } = await params;

  // Validate containerId format to prevent path traversal
  try {
    validateContainerId(containerId);
  } catch {
    return (
      <StatusScreen
        kicker="Invalid session"
        title="Invalid session identifier."
        body="The session ID format is not valid. Please start a new session."
      >
        <Link href="/" className={statusActionClass}>
          Start a new session
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </StatusScreen>
    );
  }

  const guestToken = await getGuestToken();
  const session = await getSessionInfo(containerId, guestToken);
  let vncTicket = session?.vncTicket;
  if (session && !vncTicket) {
    vncTicket = await getSessionTicket(containerId, guestToken);
  }

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

  if (!session || !vncTicket) {
    return (
      <StatusScreen
        kicker={!session ? "Session unavailable" : "Connection unavailable"}
        title={!session ? "This browser isn't available." : "Could not obtain session connection ticket."}
        body={
          !session
            ? "It may have reached its ten-minute limit, been closed, or lost its connection. Try again or start a new session."
            : "A temporary connection ticket could not be issued for this browser session. Please try again."
        }
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

  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "";
  const proto = headersList.get("x-forwarded-proto") || "http";
  const frontendOrigin = host
    ? `${proto}://${host}`
    : process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  return (
    <div
      className="min-h-screen bg-ink text-on-ink"
      style={{ "--accent": "oklch(0.62 0.16 255)" } as CSSProperties}
    >
      <div className="flex flex-col gap-6 p-4 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              aria-label="Back to home"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line-weak bg-panel text-on-ink-2 transition-colors hover:border-line hover:text-on-ink"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <div className="min-w-0">
              <p className="type-meta text-on-ink-3">Live isolation</p>
              <h1 className="truncate font-sans text-base font-medium tracking-tight text-on-ink sm:text-lg">
                {sessionUrl}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SessionCountdown createdAt={session.createdAt} variant="pill" />

            <div className="flex items-center gap-2 rounded-lg border border-line-weak bg-panel/50 px-2.5 py-1">
              {isMobile ? (
                <Smartphone
                  className="h-3.5 w-3.5 text-on-ink-3"
                  strokeWidth={1.5}
                />
              ) : (
                <Monitor
                  className="h-3.5 w-3.5 text-on-ink-3"
                  strokeWidth={1.5}
                />
              )}
              <span className="type-meta text-on-ink-2">
                {isMobile ? "Mobile" : "Desktop"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent-soft/30 px-2.5 py-1">
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
            src={`${vncTargetUrl}?path=api/containers/${containerId}/vnc/websockify&ticket=${encodeURIComponent(vncTicket)}&parent_origin=${encodeURIComponent(frontendOrigin)}&scale=true`}
            vncPassword={session.vncPassword}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}
