import Link from "next/link";
import type { CSSProperties } from "react";
import { SessionCountdown } from "@/components/SessionCountdown";
import { StopSessionButton } from "@/components/StopSessionButton";
import {
  ArrowLeft,
  Monitor,
  AlertCircle,
  Home,
  Smartphone,
} from "lucide-react";
import { headers } from "next/headers";
import axios from "axios";
import { isMobileUserAgent } from "@secure-browser/shared";
import { getGuestToken } from "@/lib/auth";

/** Height of vnc_lite.html's status bar: 12px bold Helvetica in a 6px/4px
 *  padding box over a 1px border. */
const NOVNC_BAR = 25;

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

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink p-5 text-on-ink">
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-ink-line bg-ink-2">
            <AlertCircle className="h-8 w-8 text-on-ink-3" strokeWidth={1.5} />
          </div>

          <h1 className="text-[32px] font-semibold leading-[1.04] tracking-[-0.038em]">
            Session not found.
          </h1>
          <p className="text-[16px] leading-[1.55] tracking-[-0.008em] text-on-ink-2">
            The session you are looking for does not exist or has expired. This
            could happen if the session was terminated or timed out.
          </p>

          <Link
            href="/"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-on-ink px-5 text-[15px] font-medium tracking-[-0.011em] text-ink hover:no-underline"
          >
            <Home className="h-4 w-4" strokeWidth={1.5} />
            Back to home
          </Link>
        </div>
      </div>
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
        <div className="relative overflow-hidden rounded-xl border border-ink-line bg-black">
          <div className="relative w-full bg-[oklch(0.965_0.002_255)]">
            <div
              className="w-full overflow-hidden"
              style={{
                paddingBottom: isMobile ? "177.87%" : "56.25%",
              }}
            >
              {(() => {
                const apiBase =
                  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                const vncTargetUrl = session.vncUrl.startsWith("http")
                  ? session.vncUrl
                  : `${apiBase}${session.vncUrl}`;
                return (
                  <iframe
                    /* vnc_lite.html reads exactly six query variables: host,
                       port, password, path, view_only and scale. `resize`,
                       `autoconnect`, `quality` and `compression` are vnc.html
                       options — they were silently ignored here, which is why
                       the desktop rendered 1:1 and letterboxed itself. */
                    src={`${vncTargetUrl}?path=api/containers/${containerId}/vnc/websockify&token=${encodeURIComponent(guestToken)}&scale=true`}
                    className="absolute left-0 w-full border-0"
                    title="VNC Session"
                    /* vnc_lite.html puts a status bar above the canvas, so the
                       canvas gets the frame height minus the bar and then
                       letterboxes itself sideways to keep 16:9. Pulling the
                       iframe up by the bar's height and growing it to match
                       clips the bar off the top and hands the canvas the whole
                       box. NB: noVNC's own connection errors are rendered in
                       that bar and are now hidden with it. */
                    style={{
                      top: `-${NOVNC_BAR}px`,
                      height: `calc(100% + ${NOVNC_BAR}px)`,
                      minHeight: isMobile ? "200px" : "300px",
                    }}
                  />
                );
              })()}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="stream-sweep h-[120px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rise flex flex-col justify-between gap-3 px-5 pb-[30px] text-on-ink-3 sm:flex-row sm:px-[30px]">
        <div className="flex items-center gap-[9px]">
          <Monitor className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="text-[12.5px] tracking-[-0.004em]">
            Keystrokes and clicks travel to the container. Nothing travels back
            but pixels.
          </span>
        </div>
        <span className="font-mono text-[11.5px]">streamed over websockify</span>
      </div>
    </div>
  );
}
