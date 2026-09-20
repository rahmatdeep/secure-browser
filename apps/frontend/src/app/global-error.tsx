"use client";

/**
 * Last resort: this replaces the root layout, so it renders its own <html> and
 * <body> and inherits neither the font variables nor the theme tokens. It is
 * therefore written with literal colours and a system font stack — if the
 * failure was the stylesheet or the layout itself, anything depending on those
 * would render this screen unstyled.
 *
 * Colours are the --ink / --on-ink values from globals.css, inlined.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "oklch(0.115 0.006 255)",
          color: "oklch(0.965 0.002 255)",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "440px", textAlign: "center" }}>
          <h1
            style={{
              margin: "0 0 14px",
              fontSize: "30px",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              fontWeight: 600,
            }}
          >
            SafeWeb could not load.
          </h1>
          <p
            style={{
              margin: "0 0 26px",
              fontSize: "15px",
              lineHeight: 1.55,
              color: "oklch(0.700 0.008 255)",
            }}
          >
            Something failed before the page could be built. Reloading usually
            clears it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              height: "44px",
              padding: "0 22px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 500,
              background: "oklch(0.965 0.002 255)",
              color: "oklch(0.115 0.006 255)",
            }}
          >
            Reload
          </button>
          {error.digest && (
            <p
              style={{
                margin: "22px 0 0",
                fontSize: "11px",
                letterSpacing: "0.04em",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                color: "oklch(0.540 0.008 255)",
              }}
            >
              reference {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
