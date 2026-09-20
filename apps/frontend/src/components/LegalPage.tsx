import Link from "next/link";
import type { ReactNode } from "react";
import { SafeWebMark } from "./SafeWebMark";
import { SiteFooter } from "./SiteFooter";

interface LegalPageProps {
  title: string;
  /** One-line statement of what this document is for. */
  intro: string;
  children: ReactNode;
}

/**
 * Shell for the written pages: privacy, terms, abuse.
 *
 * White rather than ink, following the rule the app already uses — white is
 * the site speaking to a reader, ink is the running system. These are the site
 * speaking.
 */
export function LegalPage({ title, intro, children }: LegalPageProps) {
  return (
    <main className="flex min-h-svh flex-col bg-bg text-fg">
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

      <div className="flex-1 px-5 pt-20 pb-28 sm:px-[72px] sm:pt-24">
        <div className="mx-auto flex w-full max-w-[1024px] flex-col">
          <div className="flex max-w-[680px] flex-col gap-[22px]">
            <h1 className="text-[clamp(38px,5.5vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
              {title}
            </h1>
            <p className="max-w-[560px] text-[17px] leading-[1.55] tracking-[-0.009em] text-fg-2">
              {intro}
            </p>
          </div>

          <div className="legal mt-14 flex max-w-[680px] flex-col gap-11">
            {children}
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}

/** One titled block of a written page. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3.5">
      <h2 className="text-[19px] font-semibold leading-[1.25] tracking-[-0.02em]">
        {heading}
      </h2>
      {children}
    </section>
  );
}
