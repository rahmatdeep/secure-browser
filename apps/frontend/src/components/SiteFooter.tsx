import Link from "next/link";

const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/abuse", label: "Report abuse" },
];

/**
 * Shared footer. The written pages are reachable from here and only from here
 * — the nav bar is for the product's own flow, and legal links there would
 * crowd the one place people actually navigate from.
 */
export function SiteFooter() {
  return (
    <footer className="mt-14 px-5 sm:px-[72px]">
      <div className="mx-auto flex max-w-[1024px] flex-col gap-5 border-t border-line pb-11 pt-[30px]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <span className="text-[13px] tracking-[-0.004em] text-fg-3">
            SafeWeb - isolated, disposable browsing.
          </span>
          <nav className="flex flex-wrap items-center gap-x-7 gap-y-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] tracking-[-0.004em] text-fg-3 transition-colors duration-200 hover:text-fg hover:no-underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <span className="font-mono text-[12px] text-fg-3">
          vnc-browser-chrome:latest
        </span>
      </div>
    </footer>
  );
}
