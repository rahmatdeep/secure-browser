import { CreateSessionForm } from "@/components/CreateSessionForm";
import { ActiveSessions } from "@/components/ActiveSession";
import { IsolationSequence } from "@/components/IsolationSequence";
import { TimerSequence } from "@/components/TimerSequence";
import { Lines } from "@/components/Lines";
import { Reveal } from "@/components/Reveal";
import { ArrowDown } from "lucide-react";
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

      {/* ── Hero: the tool itself, not a pitch for it ──────────────── */}
      <section
        id="create"
        className="mx-auto flex max-w-[1024px] flex-col items-center gap-[30px] px-5 pt-24 text-center sm:px-[72px] sm:pt-[120px]"
      >
        <div className="rise flex items-center gap-[9px] rounded-full border border-line bg-surface py-[7px] pl-[11px] pr-[15px]">
          <span className="h-1.5 w-1.5 rounded-full bg-fg-3" />
          <span className="text-[12.5px] tracking-[-0.004em] text-fg-2">
            One container per URL. No reuse.
          </span>
        </div>

        <h1 className="max-w-[940px] text-[clamp(44px,8.5vw,84px)] font-semibold leading-[0.95] tracking-[-0.045em]">
          <Lines
            lines={["A browser that doesn't", "outlive the tab."]}
            stagger={90}
          />
        </h1>

        <p
          className="rise max-w-[560px] text-[17px] leading-[1.55] tracking-[-0.009em] text-fg-2 sm:text-[19px]"
          style={{ animationDelay: "260ms" }}
        >
          Paste anything you would rather not open yourself. It loads inside a
          throwaway container and reaches you as pixels.
        </p>

        <div
          className="rise mt-2 w-full max-w-[620px]"
          style={{ animationDelay: "340ms" }}
        >
          <CreateSessionForm />
        </div>

        <a
          href="#isolation"
          className="rise mt-10 flex flex-col items-center gap-2 text-[13px] tracking-[-0.004em] text-fg-3 hover:no-underline"
          style={{ animationDelay: "460ms" }}
        >
          See what happens to it
          <ArrowDown className="h-[15px] w-[15px] animate-[breathe_2600ms_ease-in-out_infinite]" strokeWidth={1.5} />
        </a>
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
