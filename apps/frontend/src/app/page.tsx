import { CreateSessionForm } from "@/components/CreateSessionForm";
import { ActiveSessions, type Session } from "@/components/ActiveSession";
import { getActiveSessions } from "@/actions/sessionActions";
import { IsolationSequence } from "@/components/IsolationSequence";
import { TimerSequence } from "@/components/TimerSequence";
import { Lines } from "@/components/Lines";
import { Reveal } from "@/components/Reveal";
import { Aperture } from "@/components/Aperture";
import { HeroScene } from "@/components/HeroScene";
import { Scrub } from "@/components/Scrub";
import { LanternMark } from "@/components/LanternMark";
import { ArrowRight } from "lucide-react";
export default async function Home() {
  const sessions: Session[] = await getActiveSessions();
  const running = sessions.length;

  return (
    <main className="min-h-screen bg-bg text-fg">
      {/* ── Hero: nav and hero share one field, so the colour runs to the
             top of the page instead of starting under a white strip ────── */}
      <Scrub className="relative isolate flex min-h-svh flex-col overflow-hidden text-on-ink">
        <HeroScene />
        {/* Scrim, weighted to the left where the type sits. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-[20] bg-[linear-gradient(100deg,oklch(0.12_0.004_60/0.72)_0%,oklch(0.12_0.004_60/0.44)_30%,oklch(0.12_0.004_60/0.10)_60%,oklch(0.12_0.004_60/0.16)_100%)]"
        />

        {/* No rule under the nav: a line ruled across footage was the one piece
            of chrome that still read as a template. The items float instead. */}
        <nav className="px-5 pt-5 sm:px-[72px] sm:pt-7">
          <div className="mx-auto flex max-w-[1024px] items-center justify-between">
            <a
              href="#create"
              className="flex items-center gap-[11px] text-[15px] font-semibold leading-none tracking-[-0.018em] hover:no-underline"
            >
              <LanternMark />
              SafeWeb
            </a>

            <div className="hidden items-center gap-8 sm:flex">
              <a
                href="#isolation"
                className="font-mono text-[11px] tracking-[0.09em] uppercase text-on-ink-2 transition-colors duration-200 hover:text-on-ink hover:no-underline"
              >
                How it works
              </a>
              <a
                href="#sessions"
                className="font-mono text-[11px] tracking-[0.09em] uppercase text-on-ink-2 transition-colors duration-200 hover:text-on-ink hover:no-underline"
              >
                Sessions
              </a>
            </div>

            {/* TODO: point at the real account once it exists. */}
            <a
              href="#"
              aria-label="SafeWeb on X"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-on-ink/25 bg-on-ink/[0.06] backdrop-blur-md transition-colors duration-200 hover:border-on-ink/45 hover:bg-on-ink/[0.12] hover:no-underline"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-[13px] w-[13px] fill-on-ink"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </nav>

        {/* ── Hero: the tool, seen from four rings away ─────────────── */}
        <section
          id="create"
          className="relative flex flex-1 items-center overflow-hidden"
        >
          <Aperture />

          {/* Padding sits OUTSIDE the 1024 track, as it does in the nav — with
              border-box sizing, putting both on one element insets the content
              by another 72px and the headline stops hanging on the same left
              line as the logo and the section rules. */}
          <div className="relative z-10 w-full px-5 pt-24 pb-28 sm:px-[72px] sm:pt-[132px] sm:pb-[148px] xl:py-0">
            <div className="mx-auto flex w-full max-w-[1024px] flex-col">
              <div className="flex max-w-[560px] flex-col gap-[26px] [text-shadow:0_1px_32px_oklch(0.1_0.01_60/0.6)]">
                <div className="rise flex items-center gap-3.5">
                  <span className="h-px w-8 bg-on-ink/40" />
                  <span className="font-mono text-[11px] tracking-[0.09em] uppercase text-on-ink-2">
                    Disposable browser sessions
                  </span>
                </div>

                <h1 className="text-[clamp(44px,7vw,72px)] font-semibold leading-[0.95] tracking-[-0.045em]">
                  <Lines
                    lines={["Borrow a", "browser for", "ten minutes."]}
                    stagger={90}
                  />
                </h1>

                <p
                  className="rise max-w-[430px] text-[17px] leading-[1.55] tracking-[-0.009em] text-on-ink-2 sm:text-[18px]"
                  style={{ animationDelay: "260ms" }}
                >
                  Paste anything you would rather not open yourself. It loads
                  inside a throwaway container and reaches you as pixels.
                </p>

                <div className="rise mt-2.5" style={{ animationDelay: "340ms" }}>
                  <CreateSessionForm />
                </div>

                {/* Only for the person it matters to. The list lives seven
                    screens down, which is right for a first visit and useless
                    for someone coming back to a session they left open. */}
                {running > 0 && (
                  <a
                    href="#sessions"
                    className="rise flex items-center gap-2.5 font-mono text-[11px] tracking-[0.09em] uppercase text-on-ink-2 transition-colors duration-200 hover:text-on-ink hover:no-underline"
                    style={{ animationDelay: "420ms" }}
                  >
                    <span className="live-dot h-[6px] w-[6px] rounded-full bg-[oklch(0.74_0.13_255)]" />
                    {running} session{running === 1 ? "" : "s"} running
                    <ArrowRight className="h-[13px] w-[13px]" strokeWidth={1.5} />
                  </a>
                )}

              </div>
            </div>
          </div>
        </section>
      </Scrub>

      {/* ── Pinned: how isolation actually works ───────────────────── */}
      <div id="isolation">
        <IsolationSequence />
      </div>

      {/* ── Scrubbed: the ten minutes, spent ───────────────────────── */}
      <div id="lifetime">
        <TimerSequence />
      </div>

      {/* ── Sessions ───────────────────────────────────────────────── */}
      <section id="sessions" className="px-5 pt-24 sm:px-[72px]">
        <div className="mx-auto flex max-w-[1024px] flex-col gap-[22px]">
          <Reveal className="flex flex-col gap-3.5">
            <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-fg-3">
              Sessions
            </span>
            {/* The heading used to promise a list and then be contradicted by
                an empty box directly under it. */}
            <h2 className="max-w-[620px] text-[44px] font-semibold leading-[1.04] tracking-[-0.038em]">
              {running > 0
                ? "Everything currently running."
                : "Nothing is running."}
            </h2>
          </Reveal>
          {/* Nothing follows the heading when nothing is running. "Nothing is
              running." is the whole statement; the note that used to sit under
              it explained something no one had asked. */}
          {running > 0 && (
            <Reveal delay={60}>
              <ActiveSessions sessions={sessions} />
            </Reveal>
          )}
        </div>
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
          {/* Deliberately a link to the field, not a second copy of it. Two
              uncontrolled inputs share no state, so a URL typed in the hero
              leaves this one empty and the page appears to have lost it. The
              anchor is instant and lands on a hero that is one viewport tall,
              with the field already in view. */}
          <a
            href="#create"
            className="mt-2 flex h-12 items-center justify-center rounded-full bg-on-ink px-[26px] text-[15px] font-medium tracking-[-0.011em] text-ink hover:no-underline"
          >
            Open a session
          </a>
        </Reveal>
      </div>

      <footer className="mt-14 px-5 sm:px-[72px]">
        <div className="mx-auto flex max-w-[1024px] flex-col justify-between gap-4 border-t border-line pb-11 pt-[30px] sm:flex-row">
          <span className="text-[13px] tracking-[-0.004em] text-fg-3">
            SafeWeb - isolated, disposable browsing.
          </span>
          <span className="font-mono text-[12px] text-fg-3">
            vnc-browser-chrome:latest
          </span>
        </div>
      </footer>
    </main>
  );
}
