import { Scrub } from "./Scrub";

const BEATS = [
  {
    at: 0.16,
    kicker: "01",
    title: "You paste a link.",
    body: "Nothing has loaded yet. The URL is a string on your machine and nothing more.",
  },
  {
    at: 0.5,
    kicker: "02",
    title: "A container wakes up.",
    body: "Real Chrome, its own filesystem, its own network namespace, attached to an internal bridge with no published ports.",
  },
  {
    at: 0.84,
    kicker: "03",
    title: "The page opens in there.",
    body: "Scripts, trackers and downloads all run — inside the container. You are watching pixels over a WebSocket.",
  },
];

/**
 * The pinned sequence. A tall track scrubs --p while a sticky stage holds the
 * frame in place; the frame scales and gains its container chrome as the three
 * captions cross-fade. Everything reads var(--p), so this behaves identically
 * on the native timeline and on the JS fallback.
 */
export function IsolationSequence() {
  return (
    <Scrub variant="pin" className="relative h-[320svh]">
      <div className="pin-stage">
        <div className="mx-auto flex w-full max-w-[1024px] flex-col items-center gap-10 px-5 sm:px-[72px]">
          {/* captions */}
          <div className="beats relative h-[132px] w-full max-w-[520px] sm:h-[116px]">
            {BEATS.map((b) => (
              <div
                key={b.kicker}
                className="beat absolute inset-0 flex flex-col items-center gap-3 text-center"
                style={{ "--at": b.at } as React.CSSProperties}
              >
                <span className="font-mono text-[12px] tracking-[0.06em] text-accent">
                  {b.kicker}
                </span>
                <h3 className="text-[26px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[32px]">
                  {b.title}
                </h3>
                <p className="max-w-[460px] text-[14.5px] leading-[1.5] tracking-[-0.006em] text-fg-2">
                  {b.body}
                </p>
              </div>
            ))}
          </div>

          {/* the frame */}
          <div
            className="w-full origin-top"
            style={{
              transform:
                "scale(calc(0.84 + 0.16 * min(1, var(--p) / 0.5)))",
            }}
          >
            <div
              className="relative overflow-hidden rounded-[18px] bg-ink"
              style={{
                boxShadow:
                  "0 24px 60px -20px oklch(0.2 0.01 255 / calc(0.06 + 0.22 * var(--p)))",
              }}
            >
              {/* container chrome — fades in as the container takes over */}
              <div
                className="flex items-center justify-between border-b border-ink-line px-[18px] py-[13px]"
                style={{
                  opacity:
                    "clamp(0, calc((var(--p) - 0.26) / 0.2), 1)",
                }}
              >
                <div className="flex min-w-0 items-center gap-[11px]">
                  <div className="flex gap-1.5">
                    <span className="h-[9px] w-[9px] rounded-full bg-[oklch(0.34_0.008_255)]" />
                    <span className="h-[9px] w-[9px] rounded-full bg-[oklch(0.34_0.008_255)]" />
                    <span className="h-[9px] w-[9px] rounded-full bg-[oklch(0.34_0.008_255)]" />
                  </div>
                  <span className="truncate font-mono text-[11.5px] tracking-[0.005em] text-[oklch(0.60_0.008_255)]">
                    vnc-browser-a3f9c1d2
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-[oklch(0.22_0.006_255)] px-[11px] py-[5px]">
                  <span className="live-dot h-[5px] w-[5px] rounded-full bg-accent" />
                  <span className="font-mono text-[11px] text-[oklch(0.72_0.006_255)]">
                    isolated
                  </span>
                </div>
              </div>

              {/* the page inside — resolves from blank to rendered */}
              <div className="relative h-[300px] bg-[oklch(0.965_0.002_255)] sm:h-[420px]">
                <div
                  className="absolute inset-0 flex flex-col gap-[26px] p-8 sm:p-[46px_54px]"
                  style={{
                    opacity: "clamp(0, calc((var(--p) - 0.6) / 0.22), 1)",
                    transform:
                      "translateY(calc(14px * (1 - clamp(0, calc((var(--p) - 0.6) / 0.22), 1))))",
                  }}
                >
                  <div className="flex items-center justify-between gap-5">
                    <div className="h-[13px] w-32 rounded bg-[oklch(0.86_0.004_255)]" />
                    <div className="hidden gap-[18px] sm:flex">
                      <div className="h-2.5 w-14 rounded bg-[oklch(0.90_0.004_255)]" />
                      <div className="h-2.5 w-11 rounded bg-[oklch(0.90_0.004_255)]" />
                      <div className="h-2.5 w-[62px] rounded bg-[oklch(0.90_0.004_255)]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-[13px]">
                    <div className="h-[30px] w-[62%] rounded-md bg-[oklch(0.84_0.005_255)]" />
                    <div className="h-[30px] w-[44%] rounded-md bg-[oklch(0.88_0.004_255)]" />
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="h-[110px] rounded-[10px] bg-[oklch(0.915_0.003_255)]" />
                    <div className="h-[110px] rounded-[10px] bg-[oklch(0.915_0.003_255)]" />
                    <div className="h-[110px] rounded-[10px] bg-[oklch(0.915_0.003_255)]" />
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="stream-sweep h-[140px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Scrub>
  );
}
