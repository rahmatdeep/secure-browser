"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import {
  StatusScreen,
  statusActionClass,
  statusLinkClass,
} from "@/components/StatusScreen";

/**
 * Catches anything thrown while rendering a route or running a server action —
 * in practice, most often a session that could not be created, since
 * createSession rethrows and the handoff overlay is covering the screen when
 * it happens.
 *
 * `error.message` is deliberately not shown. Next replaces server-side
 * messages with a generic string plus a digest in production, so printing it
 * would show users something meaningless while risking detail leaking in
 * development. The digest is the part worth surfacing: it is what ties this
 * screen to a line in the server log.
 */
export default function Error({
  error,
  reset,
}: {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      kicker="Something went wrong"
      title="That didn't start."
      body="The session could not be created. This is usually temporary — the host may be busy, or the address may not be reachable. Nothing was left running."
    >
      <button type="button" onClick={reset} className={statusActionClass}>
        Try again
        <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <Link href="/" className={statusLinkClass}>
        Back to the start
      </Link>
      {error.digest && (
        <span className="w-full font-mono text-[11px] tracking-[0.04em] text-on-ink-3">
          reference {error.digest}
        </span>
      )}
    </StatusScreen>
  );
}
