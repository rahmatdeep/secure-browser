import { CreateSessionForm } from "@/components/CreateSessionForm";
import { ActiveSessions } from "@/components/ActiveSession";
import { Reveal } from "@/components/Reveal";
import { SessionCountdown } from "@/components/SessionCountdown";
import { ArrowRight, Shield } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-bg text-fg">
      <nav className="flex items-center justify-between border-b border-line px-5 py-[22px] sm:px-[72px]">
        <a href="#" className="flex items-center gap-2.5 hover:no-underline">
          <Shield className="h-[19px] w-[19px]" strokeWidth={1.5} />
          <span className="text-[15px] font-medium tracking-[-0.017em]">
            SafeWeb
          </span>
        </a>
        <div className="hidden items-center gap-9 text-[14px] tracking-[-0.008em] text-fg-2 sm:flex">
          <a href="#isolation">Isolation</a>
          <a href="#sessions">Sessions</a>
          <a href="#create">Create</a>
        </div>
      </nav>

      <section className="flex flex-col items-center gap-[30px] px-5 pt-24 text-center sm:px-[72px] sm:pt-[132px]">
        <div className="rise flex items-center gap-[9px] rounded-full border border-line bg-surface py-[7px] pl-[11px] pr-[15px]">
          <span className="h-1.5 w-1.5 rounded-full bg-fg-3" />
          <span className="text-[12.5px] tracking-[-0.004em] text-fg-2">
            One container per URL. No reuse.
          </span>
        </div>

        <h1
          className="rise max-w-[940px] text-[clamp(48px,9vw,84px)] font-semibold leading-[0.95] tracking-[-0.045em]"
          style={{ animationDelay: "90ms" }}
        >
          A browser that doesn&apos;t outlive the tab.
        </h1>

        <p
          className="rise max-w-[588px] text-[17px] leading-[1.55] tracking-[-0.009em] text-fg-2 sm:text-[19px]"
          style={{ animationDelay: "180ms" }}
        >
          SafeWeb opens any link inside a throwaway Docker container running
          real Chrome. You watch the page over a WebSocket stream. Your machine
          never loads it.
        </p>

        <div
          className="rise mt-3 flex flex-col items-center gap-3.5 sm:flex-row"
          style={{ animationDelay: "270ms" }}
        >
          <a
            href="#create"
            className="flex h-12 items-center justify-center rounded-full bg-accent px-[26px] text-[15px] font-medium tracking-[-0.011em] text-white transition-[filter] duration-200 ease-[var(--ease)] hover:brightness-95 hover:no-underline"
          >
            Open a session
          </a>
          <a
            href="#isolation"
            className="flex h-12 items-center gap-[7px] rounded-full border border-line px-[22px] text-[15px] tracking-[-0.011em] text-fg hover:no-underline"
          >
            How isolation works
            <ArrowRight className="h-[15px] w-[15px]" strokeWidth={1.5} />
          </a>
        </div>
      </section>

      <section className="lift px-5 pt-[84px] sm:px-[72px]">
        <div className="mx-auto max-w-[1024px] overflow-hidden rounded-[18px] bg-ink shadow-[0_1px_2px_oklch(0.2_0.01_255_/_0.10),0_22px_44px_-14px_oklch(0.2_0.01_255_/_0.22),0_56px_90px_-32px_oklch(0.2_0.01_255_/_0.26)]">
          <div className="flex items-center justify-between border-b border-ink-line px-[18px] py-[13px]">
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
                07:36
              </span>
            </div>
          </div>

          <div className="relative h-[360px] overflow-hidden bg-[oklch(0.965_0.002_255)] sm:h-[512px]">
            <div className="absolute inset-0 flex flex-col gap-[26px] p-8 sm:p-[46px_54px]">
              <div className="flex items-center justify-between gap-5">
                <div className="h-[13px] w-32 rounded bg-[oklch(0.86_0.004_255)]" />
                <div className="hidden gap-[18px] sm:flex">
                  <div className="h-2.5 w-14 rounded bg-[oklch(0.90_0.004_255)]" />
                  <div className="h-2.5 w-11 rounded bg-[oklch(0.90_0.004_255)]" />
                  <div className="h-2.5 w-[62px] rounded bg-[oklch(0.90_0.004_255)]" />
                </div>
              </div>
              <div className="mt-[22px] flex flex-col gap-[13px]">
                <div className="h-[30px] w-[62%] rounded-md bg-[oklch(0.84_0.005_255)]" />
                <div className="h-[30px] w-[44%] rounded-md bg-[oklch(0.88_0.004_255)]" />
              </div>
              <div className="mt-[26px] grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="h-[148px] rounded-[10px] bg-[oklch(0.915_0.003_255)]" />
                <div className="h-[148px] rounded-[10px] bg-[oklch(0.915_0.003_255)]" />
                <div className="h-[148px] rounded-[10px] bg-[oklch(0.915_0.003_255)]" />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="stream-sweep h-[140px]" />
            </div>
          </div>
        </div>
        <p className="mt-6 px-4 text-center text-[13px] leading-[1.45] tracking-[-0.004em] text-fg-3">
          Rendered in the container. Delivered to you as pixels over WebSocket.
        </p>
      </section>

      <Reveal className="px-5 pt-28 sm:px-[72px] sm:pt-32">
        <div className="mx-auto grid max-w-[1024px] grid-cols-1 overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {[
            ["0", "host ports bound. Port 6080 never leaves the bridge network."],
            [
              "10:00",
              "until the container stops itself, whether you closed the tab or not.",
            ],
            ["1:1", "containers to sessions. Nothing is pooled, nothing is reused."],
          ].map(([value, label]) => (
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

      <section
        id="isolation"
        className="mx-auto grid max-w-[1024px] items-center gap-12 px-5 pt-32 sm:px-[72px] sm:pt-[148px] lg:grid-cols-[minmax(0,1fr)_268px] lg:gap-16"
      >
        <Reveal className="flex flex-col gap-6">
          <h2 className="max-w-[520px] text-[44px] font-semibold leading-[1.04] tracking-[-0.038em] sm:text-[54px] sm:leading-[1.02]">
            Ten minutes, then nothing.
          </h2>
          <p className="max-w-[468px] text-[17.5px] leading-[1.6] tracking-[-0.008em] text-fg-2">
            Every session is born with a timer. When it reaches zero the
            container is stopped and the session is marked ended; no cleanup
            task to forget, no orphaned process quietly holding a page open.
          </p>
          <p className="max-w-[468px] text-[17.5px] leading-[1.6] tracking-[-0.008em] text-fg-2">
            Cookies, cache, downloads and history die with it. There is nowhere
            for them to persist to.
          </p>
        </Reveal>
        <Reveal delay={60} className="flex justify-center lg:justify-start">
          <SessionCountdown variant="ring" size="lg" />
        </Reveal>
      </section>

      <section
        id="create"
        className="mx-auto flex max-w-[1024px] flex-col gap-[22px] px-5 pt-32 sm:px-[72px]"
      >
        <Reveal className="flex flex-col gap-3.5">
          <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-fg-3">
            Create session
          </span>
          <h2 className="max-w-[620px] text-[44px] font-semibold leading-[1.04] tracking-[-0.038em]">
            One field. That is the entire interface.
          </h2>
        </Reveal>
        <Reveal
          delay={60}
          className="rounded-2xl border border-line bg-bg p-5 sm:p-[34px_38px]"
        >
          <CreateSessionForm />
        </Reveal>
      </section>

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
