import { getActiveSessions } from "@/actions/sessionActions";
import { SessionCountdown } from "./SessionCountdown";
import { StopSessionButton } from "./StopSessionButton";
import { Monitor } from "lucide-react";

function parseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      path: `${parsed.pathname}${parsed.search}` || "/",
    };
  } catch {
    return { host: url, path: "/" };
  }
}

export async function ActiveSessions() {
  const sessions = await getActiveSessions();

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-[18px] rounded-2xl border border-line bg-bg px-10 py-24 text-center sm:py-32">
        <Monitor className="h-[34px] w-[34px] text-fg-3" strokeWidth={1.5} />
        <h3 className="text-[21px] font-medium leading-[1.25] tracking-[-0.022em] text-fg">
          Nothing is running.
        </h3>
        <p className="max-w-[340px] text-[14.5px] leading-[1.55] tracking-[-0.008em] text-fg-2">
          That is the resting state, and the one you should see most of the
          time.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-line">
      {sessions.map(
        (
          session: {
            containerId: string;
            url: string;
            vncPort: string | number;
            createdAt: string;
          },
          index: number
        ) => {
          const url = parseUrl(session.url);

          return (
            <div
              key={session.containerId}
              className="rise grid grid-cols-1 items-center gap-5 bg-bg px-[30px] py-[26px] lg:grid-cols-[minmax(0,1fr)_148px_124px_152px] lg:gap-8"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="live-dot h-[7px] w-[7px] shrink-0 rounded-full bg-accent" />
                <div className="flex min-w-0 flex-col gap-1">
                  <span
                    className="truncate text-[16px] font-medium tracking-[-0.013em] text-fg"
                    title={session.url}
                  >
                    {url.host}
                  </span>
                  <span className="truncate font-mono text-[12px] text-fg-3">
                    {url.path}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[12px] tracking-[-0.002em] text-fg-3">
                  Container
                </span>
                <span className="font-mono text-[13px] text-fg-2">
                  {session.containerId.slice(0, 8)}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[12px] tracking-[-0.002em] text-fg-3">
                  Remaining
                </span>
                <span className="font-mono text-[13px]">
                  <SessionCountdown createdAt={session.createdAt} />
                </span>
              </div>

              <div className="flex items-center gap-2.5 lg:justify-end">
                <a
                  href={`/session/${session.containerId}`}
                  className="flex h-9 items-center justify-center rounded-full border border-line px-4 text-[13.5px] font-medium tracking-[-0.008em] text-fg transition-[background,border-color] duration-200 ease-[var(--ease)] hover:bg-surface hover:no-underline"
                >
                  View
                </a>
                <StopSessionButton containerId={session.containerId} />
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}
