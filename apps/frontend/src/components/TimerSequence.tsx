import { Scrub } from "./Scrub";
import { Reveal } from "./Reveal";

const R = 120;
const C = 2 * Math.PI * R; // 753.98

/**
 * The questions the ring alone left open. Each is checked against the backend
 * rather than asserted: the timer is SESSION_TIMEOUT_MS in @secure-browser/
 * shared, and the container is created with AutoRemove and no Binds/Volumes.
 */
const FACTS = [
  {
    label: "Stop it sooner",
    body: "The stop button ends the session the moment you are done. You never have to wait the clock out.",
  },
  {
    label: "Or do nothing",
    body: "At zero the backend stops the container on its own and marks the session ended. Forgetting is the safe path.",
  },
  {
    label: "Nothing to wipe",
    body: "No volume is mounted from your machine, and the container is removed on stop — its writable layer goes with it.",
  },
];

/**
 * Scrubs the ten-minute lifetime against scroll position: the ring drains, the
 * minute readout steps 10→0, and at zero the container itself fades out. The
 * motion is the product's actual behaviour rather than decoration.
 *
 * The supporting facts sit after the pinned track rather than inside it. The
 * stage is one viewport tall and already holds a 268px ring; anything more
 * clips on a short laptop screen, and this is material to read at your own
 * pace rather than something to scrub past.
 */
export function TimerSequence() {
  return (
    <>
      <Scrub variant="pin" counter className="relative h-[260svh]">
        <div className="pin-stage">
          <div className="mx-auto flex w-full max-w-[1024px] flex-col items-center gap-10 px-5 sm:px-[72px]">
            <div className="flex flex-col items-center gap-3.5 text-center">
              <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-fg-3">
                Session lifetime
              </span>
              <h2 className="max-w-[560px] text-[40px] font-semibold leading-[1.04] tracking-[-0.038em] sm:text-[54px] sm:leading-[1.02]">
                Ten minutes, then nothing.
              </h2>
              {/* The reviewer's question, answered where it is asked: the ring
                  showed a countdown but never said why ten. */}
              <p className="max-w-[440px] text-[15px] leading-[1.55] tracking-[-0.008em] text-fg-2">
                Long enough to read a page, sign in, or pull down a file. Short
                enough that whatever you opened never gets a place to settle.
              </p>
            </div>

            {/* Ring and closing line share one centred box so the second can
                fade in exactly where the first fades out. */}
            <div className="relative flex h-[300px] w-full items-center justify-center">
              <div
                className="absolute h-[268px] w-[268px]"
                style={{
                  opacity: "clamp(0, calc((0.97 - var(--p)) / 0.07), 1)",
                  transform:
                    "scale(calc(1 - 0.06 * clamp(0, calc((var(--p) - 0.9) / 0.1), 1)))",
                }}
              >
                <svg
                  width="268"
                  height="268"
                  viewBox="0 0 268 268"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="134"
                    cy="134"
                    r={R}
                    stroke="var(--line)"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="134"
                    cy="134"
                    r={R}
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={C.toFixed(2)}
                    transform="rotate(-90 134 134)"
                    style={{
                      strokeDashoffset: `calc(${C.toFixed(2)}px * clamp(0, calc((var(--p) - 0.1) / 0.75), 1))`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  <span className="mm font-mono text-[56px] font-medium leading-none tracking-[-0.03em]" />
                  <span className="text-[12.5px] tracking-[-0.002em] text-fg-3">
                    minutes remaining
                  </span>
                </div>
              </div>

              {/* what is left afterwards */}
              <p
                className="absolute max-w-[420px] px-5 text-center text-[19px] leading-[1.5] tracking-[-0.011em] text-fg-2"
                style={{
                  opacity: "clamp(0, calc((var(--p) - 0.93) / 0.06), 1)",
                }}
              >
                The container is stopped. Cookies, cache, downloads and history
                went with it — there was nowhere for them to persist to.
              </p>
            </div>
          </div>
        </div>
      </Scrub>

      <section className="px-5 sm:px-[72px]">
        <Reveal className="mx-auto grid max-w-[1024px] gap-x-12 gap-y-9 border-t border-line pt-11 sm:grid-cols-3">
          {FACTS.map((f) => (
            <div key={f.label} className="flex flex-col gap-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.09em] text-fg-3">
                {f.label}
              </span>
              <p className="text-[14.5px] leading-[1.55] tracking-[-0.006em] text-fg-2">
                {f.body}
              </p>
            </div>
          ))}
        </Reveal>
      </section>
    </>
  );
}
