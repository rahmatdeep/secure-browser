import { CreateSessionForm } from "@/components/CreateSessionForm";
import { ActiveSessions } from "@/components/ActiveSession";
import { IsolationSequence } from "@/components/IsolationSequence";
import { TimerSequence } from "@/components/TimerSequence";
import { Lines } from "@/components/Lines";
import { Reveal } from "@/components/Reveal";
import { Aperture } from "@/components/Aperture";
const STATS: [string, string][] = [
  ["0", "host ports bound. Port 6080 never leaves the bridge network."],
  ["10:00", "until the container stops itself, whether you closed the tab or not."],
  ["1:1", "containers to sessions. Nothing is pooled, nothing is reused."],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <nav className="px-5 pt-5 sm:px-[72px] sm:pt-7">
        <div className="mx-auto flex max-w-[1024px] items-center justify-between border-b border-line pb-4">
          <a
            href="#create"
            className="group flex items-baseline gap-3 hover:no-underline"
            aria-label="SafeWeb home"
          >
            <span className="text-[15px] font-semibold leading-none tracking-[-0.018em]">
              SafeWeb
            </span>
            <span className="hidden text-[12.5px] leading-none tracking-[-0.006em] text-fg-3 sm:inline">
              disposable browser sessions
            </span>
          </a>

          <span className="hidden font-mono text-[11px] text-fg-3 sm:block">
            bridge-only / 10:00 ttl / no reuse
          </span>
        </div>
      </nav>

      {/* ── Hero: the tool, seen from four rings away ─────────────── */}
      <section
        id="create"
        className="relative flex items-center overflow-hidden xl:min-h-[900px]"
      >
        <Aperture />

        {/* Padding sits OUTSIDE the 1024 track, as it does in the nav — with
            border-box sizing, putting both on one element insets the content
            by another 72px and the headline stops hanging on the same left
            line as the logo and the section rules. */}
        <div className="relative z-10 w-full px-5 pt-24 pb-28 sm:px-[72px] sm:pt-[132px] sm:pb-[148px] xl:py-0">
          <div className="mx-auto flex w-full max-w-[1024px] flex-col">
            <div className="flex max-w-[560px] flex-col gap-[26px]">
              <h1 className="text-[clamp(44px,7vw,72px)] font-semibold leading-[0.95] tracking-[-0.045em]">
                <Lines
                  lines={["Borrow a", "browser for", "ten minutes."]}
                  stagger={90}
                />
              </h1>

              <p
                className="rise max-w-[430px] text-[17px] leading-[1.55] tracking-[-0.009em] text-fg-2 sm:text-[18px]"
                style={{ animationDelay: "260ms" }}
              >
                Paste anything you would rather not open yourself. It loads
                inside a throwaway container and reaches you as pixels.
              </p>

              <div className="rise mt-2.5" style={{ animationDelay: "340ms" }}>
                <CreateSessionForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pinned: how isolation actually works ───────────────────── */}
      <div id="isolation">
        <IsolationSequence />
      </div>

      {/* ── Numbers ────────────────────────────────────────────────── */}
      <Reveal className="px-5 sm:px-[72px]">
        <div className="mx-auto grid max-w-[1024px] grid-cols-1 overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {STATS.map(([value, label]) => (
            <div key={value} className="flex flex-col gap-[9px] bg-bg p-[34px]">
              <span className="text-[46px] font-semibold leading-none tracking-[-0.042em]">
                {value}
              </span>
              <span className="text-[14.5px] tracking-[-0.008em] text-fg-2">
                {label}
              </span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── Scrubbed: the ten minutes, spent ───────────────────────── */}
      <div id="lifetime">
        <TimerSequence />
      </div>

      {/* ── Sessions ───────────────────────────────────────────────── */}
      <section
        id="sessions"
        className="mx-auto flex max-w-[1024px] flex-col gap-[22px] px-5 pt-24 sm:px-[72px]"
      >
        <Reveal className="flex flex-col gap-3.5">
          <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-fg-3">
            Sessions
          </span>
          <h2 className="max-w-[620px] text-[44px] font-semibold leading-[1.04] tracking-[-0.038em]">
            Everything currently running.
          </h2>
        </Reveal>
        <Reveal delay={60}>
          <ActiveSessions />
        </Reveal>
      </section>

      {/* ── Closing ────────────────────────────────────────────────── */}
      <div className="mt-32 px-5 sm:px-[72px]">
        <Reveal className="mx-auto flex max-w-[1024px] flex-col items-center gap-[26px] rounded-[20px] bg-ink px-6 py-20 text-center sm:px-[72px] sm:py-[92px]">
          <h2 className="max-w-[660px] text-[42px] font-semibold leading-[1.04] tracking-[-0.038em] text-on-ink sm:text-[50px]">
            Paste a link you don&apos;t trust.
          </h2>
          <p className="max-w-[460px] text-[17px] leading-[1.55] tracking-[-0.008em] text-on-ink-2">
            That is the whole workflow. Close the tab whenever you like; the
            container stops either way.
          </p>
          <a
            href="#create"
            className="mt-2 flex h-12 items-center justify-center rounded-full bg-on-ink px-[26px] text-[15px] font-medium tracking-[-0.011em] text-ink hover:no-underline"
          >
            Open a session
          </a>
        </Reveal>
      </div>

      <footer className="mx-auto mt-14 flex max-w-[1024px] flex-col justify-between gap-4 border-t border-line px-5 pb-11 pt-[30px] sm:flex-row sm:px-[72px]">
        <span className="text-[13px] tracking-[-0.004em] text-fg-3">
          SafeWeb - isolated, disposable browsing.
        </span>
        <span className="font-mono text-[12px] text-fg-3">
          vnc-browser-chrome:latest
        </span>
      </footer>
    </main>
  );
}
