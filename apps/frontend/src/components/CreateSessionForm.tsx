"use client";

import { createSession } from "@/actions/sessionActions";
import { ArrowRight, Globe, Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { SessionHandoff } from "./SessionHandoff";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Open a session"
      className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-ink text-on-ink transition-[filter] duration-200 ease-[var(--ease)] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="spin h-[18px] w-[18px]" strokeWidth={1.5} />
      ) : (
        <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.5} />
      )}
    </button>
  );
}

function UrlField({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (next: string) => void;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <label htmlFor="url" className="sr-only">
        Website URL
      </label>
      <Globe
        className="pointer-events-none h-[18px] w-[18px] shrink-0 text-fg-3"
        strokeWidth={1.5}
      />
      <input
        type="url"
        id="url"
        name="url"
        required
        disabled={pending}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Paste a URL"
        className="min-w-0 flex-1 bg-transparent text-[16.5px] tracking-[-0.009em] text-fg caret-fg outline-none placeholder:text-fg-3 disabled:cursor-not-allowed disabled:text-fg-3"
      />
    </>
  );
}

export function CreateSessionForm() {
  // Controlled only so the handoff overlay can show which URL is being opened
  // while the container starts. The form still posts the field by name.
  const [url, setUrl] = useState("");

  return (
    <form
      action={createSession}
      className="flex h-[62px] w-full max-w-[540px] items-center gap-3 rounded-full border border-line bg-surface pr-2 pl-[22px] transition-colors duration-200 ease-[var(--ease)] focus-within:border-fg-2 focus-within:bg-bg"
    >
      <UrlField value={url} onValueChange={setUrl} />
      <SubmitButton />
      {/* Rendered inside the form because useFormStatus only reports for an
          ancestor form; it is position: fixed, so it escapes this layout. */}
      <SessionHandoff url={url} />
    </form>
  );
}
