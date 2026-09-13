import { CreateSessionForm } from "@/components/CreateSessionForm";
import { ActiveSessions } from "@/components/ActiveSession";
import { IsolationSequence } from "@/components/IsolationSequence";
import { TimerSequence } from "@/components/TimerSequence";
import { Lines } from "@/components/Lines";
import { Reveal } from "@/components/Reveal";
import { Aperture } from "@/components/Aperture";
import { HeroScene } from "@/components/HeroScene";
import { Scrub } from "@/components/Scrub";
const SPECS: { label: string; value: string; accent?: boolean }[] = [
  { label: "Ports published", value: "0" },
  { label: "Session ttl", value: "10:00", accent: true },
  { label: "Containers", value: "1 per session" },
  { label: "Reuse", value: "Never" },
];

/** One spec, in the chrome vocabulary the rest of the page already uses:
 *  mono, uppercase, wide tracking, label over value. */
function Spec({ label, value, accent }: (typeof SPECS)[number]) {
  return (
    <div className="flex flex-col gap-[5px]">
      <span className="font-mono text-[10px] tracking-[0.09em] uppercase text-on-ink/40">
        {label}
      </span>
      <span
        /* A lighter tint of --accent: the token is mixed for near-white and
           goes muddy against the footage. */
        className={`font-mono text-[12px] tracking-[0.04em] uppercase ${
          accent ? "text-[oklch(0.74_0.13_255)]" : "text-on-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      {/* ── Hero: nav and hero share one field, so the colour runs to the
             top of the page instead of starting under a white strip ────── */}
      <Scrub className="relative isolate flex min-h-svh flex-col overflow-hidden text-on-ink">
        <HeroScene />
        {/* Scrim, weighted to the left where the type sits. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-[20] bg-[linear-gradient(100deg,oklch(0.13_0.02_265/0.86)_0%,oklch(0.13_0.02_265/0.60)_30%,oklch(0.13_0.02_265/0.20)_62%,oklch(0.13_0.02_265/0.26)_100%)]"
        />

        {/* No rule under the nav: a line ruled across footage was the one piece
            of chrome that still read as a template. The items float instead. */}
        <nav className="px-5 pt-5 sm:px-[72px] sm:pt-7">
          <div className="mx-auto flex max-w-[1024px] items-center justify-between">
            <a
              href="#create"
              className="text-[15px] font-semibold leading-none tracking-[-0.018em] hover:no-underline"
            >
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

          {/* The rail sits at the page's outer padding edge, outside the 1024
              track, so it reads as marginalia rather than part of the column. */}
          <div className="absolute top-1/2 left-[72px] hidden -translate-y-1/2 flex-col gap-[18px] 2xl:flex">
            {SPECS.map((spec) => (
              <Spec key={spec.label} {...spec} />
            ))}
          </div>

          {/* Padding sits OUTSIDE the 1024 track, as it does in the nav — with
              border-box sizing, putting both on one element insets the content
              by another 72px and the headline stops hanging on the same left
              line as the logo and the section rules. */}
          <div className="relative z-10 w-full px-5 pt-24 pb-28 sm:px-[72px] sm:pt-[132px] sm:pb-[148px] xl:py-0">
            <div className="mx-auto flex w-full max-w-[1024px] flex-col">
              <div className="flex max-w-[560px] flex-col gap-[26px]">
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

                {/* Below 2xl there is no room for the rail beside the content
                    column, so the same specs run as a row under the form. */}
                <div
                  className="rise mt-3 flex flex-wrap gap-x-9 gap-y-4 2xl:hidden"
                  style={{ animationDelay: "420ms" }}
                >
                  {SPECS.map((spec) => (
                    <Spec key={spec.label} {...spec} />
                  ))}
                </div>
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
