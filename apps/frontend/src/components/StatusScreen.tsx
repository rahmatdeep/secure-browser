import Link from "next/link";
import type { ReactNode } from "react";
import { SafeWebMark } from "./SafeWebMark";

interface StatusScreenProps {
  /** Small mono line above the headline, e.g. "Session unavailable". */
  kicker: string;
  title: string;
  body: string;
  /** Buttons and links for this particular state. */
  children?: ReactNode;
}

/**
 * The full-page state screen: session unavailable, 404, unhandled error.
 *
 * Ink rather than the landing page's white, because that is the rule the rest
 * of the app already follows — white is the landing surface, ink is anything
 * that is the running system talking. It also means arriving here from the
 * session page or from the handoff overlay does not flip luminance.
 *
 * Deliberately not a client component and holding no state, so error.tsx can
 * pull it into the client bundle unchanged.
 */
export function StatusScreen({
  kicker,
  title,
  body,
  children,
}: StatusScreenProps) {
  return (
    <main className="flex min-h-svh flex-col bg-ink text-on-ink">
      <nav className="px-5 pt-5 sm:px-[72px] sm:pt-7">
        <div className="mx-auto flex max-w-[1024px] items-center">
          <Link
            href="/"
            className="flex items-center gap-[11px] text-[15px] font-semibold leading-none tracking-[-0.018em] hover:no-underline"
          >
            <SafeWebMark />
            SafeWeb
          </Link>
        </div>
      </nav>

      <section className="flex flex-1 items-center px-5 py-24 sm:px-[72px]">
        <div className="mx-auto w-full max-w-[1024px]">
          <div className="flex max-w-[580px] flex-col gap-[26px]">
            <div className="flex items-center gap-3.5">
              <span className="h-px w-8 bg-ink-line" />
              <span className="font-mono text-[11px] uppercase tracking-[0.09em] text-on-ink-2">
                {kicker}
              </span>
            </div>

            <h1 className="max-w-[560px] text-[clamp(44px,7vw,72px)] font-semibold leading-[0.95] tracking-[-0.045em]">
              {title}
            </h1>
            <p className="max-w-[440px] text-[17px] leading-[1.55] tracking-[-0.009em] text-on-ink-2 sm:text-[18px]">
              {body}
            </p>

            {children && (
              <div className="flex flex-wrap items-center gap-5 pt-2.5">
                {children}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/** The filled pill used as the primary action on a status screen. */
export const statusActionClass =
  "inline-flex h-12 items-center gap-3 rounded-full bg-on-ink px-[22px] text-[15px] font-medium tracking-[-0.011em] text-ink hover:no-underline";

/** The quieter underlined secondary action. */
export const statusLinkClass =
  "text-[14px] tracking-[-0.008em] text-on-ink-2 underline decoration-on-ink/40 underline-offset-4 transition-colors hover:text-on-ink";
