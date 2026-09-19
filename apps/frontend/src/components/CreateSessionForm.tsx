"use client";

import { createSession } from "@/actions/sessionActions";
import { ArrowRight, Globe, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

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

function UrlField() {
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
        placeholder="Paste a URL"
        className="min-w-0 flex-1 bg-transparent text-[16.5px] tracking-[-0.009em] text-fg caret-fg outline-none placeholder:text-fg-3 disabled:cursor-not-allowed disabled:text-fg-3"
      />
    </>
  );
}

export function CreateSessionForm() {
  return (
    <form
      action={createSession}
      className="flex h-[62px] w-full max-w-[540px] items-center gap-3 rounded-full border border-line bg-surface pr-2 pl-[22px] transition-colors duration-200 ease-[var(--ease)] focus-within:border-fg-2 focus-within:bg-bg"
    >
      <UrlField />
      <SubmitButton />
    </form>
  );
}
