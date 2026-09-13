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
      className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-accent text-white transition-[filter] duration-200 ease-[var(--ease)] hover:brightness-95 focus:outline-none disabled:cursor-not-allowed disabled:brightness-90"
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
        className="min-w-0 flex-1 bg-transparent text-[16.5px] tracking-[-0.009em] text-fg outline-none placeholder:text-fg-3 disabled:cursor-not-allowed disabled:text-fg-2"
      />
    </>
  );
}

export function CreateSessionForm() {
  return (
    <form
      action={createSession}
      /* One pill: the field and its action read as a single object rather than
         a labelled form, which is what kept the old hero looking like a pitch. */
      className="flex h-[62px] w-full max-w-[540px] items-center gap-2.5 rounded-full border border-line bg-bg pr-2 pl-[22px] shadow-[0_1px_2px_oklch(0.2_0.01_255/0.05),0_16px_34px_-22px_oklch(0.2_0.01_255/0.24)] transition-[border-color] duration-200 ease-[var(--ease)] focus-within:border-accent"
    >
      <UrlField />
      <SubmitButton />
    </form>
  );
}
