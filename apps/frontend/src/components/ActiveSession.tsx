import type { ContainerSummary } from "@secure-browser/shared";
import { SessionCountdown } from "./SessionCountdown";
import { StopSessionButton } from "./StopSessionButton";

/** ContainerSummary as it survives JSON: createdAt arrives as a string. */
export type Session = Omit<ContainerSummary, "createdAt"> & {
  createdAt: string;
};

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

/** Renders a list. Whether there is a list to render is the page's call — an
 *  empty state belongs to the section, not to the component that draws rows.
 *
 *  The page also fetches once and passes the result down; this used to fetch
 *  for itself, which meant two calls per render once the hero needed a count.
 */
export function ActiveSessions({ sessions }: { sessions: Session[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-line">
      {sessions.map((session, index) => {
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
      })}
    </div>
  );
}
