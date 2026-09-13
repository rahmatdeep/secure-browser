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
      className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-on-ink/30 bg-on-ink/10 text-on-ink transition-colors duration-200 ease-[var(--ease)] hover:border-on-ink/55 hover:bg-on-ink/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
        className="pointer-events-none h-[18px] w-[18px] shrink-0 text-on-ink/50"
        strokeWidth={1.5}
      />
      <input
        type="url"
        id="url"
        name="url"
        required
        disabled={pending}
        placeholder="Paste a URL"
        className="min-w-0 flex-1 bg-transparent text-[16.5px] tracking-[-0.009em] text-on-ink caret-on-ink outline-none placeholder:text-on-ink/50 disabled:cursor-not-allowed disabled:text-on-ink/60"
      />
    </>
  );
}

export function CreateSessionForm() {
  return (
    <form
      action={createSession}
      /* One pill, drawn as glass rather than a solid panel: the submit sits
         inside the field, so an outlined button needs an outlined field or the
         white arrow lands on white. Blurred, so type stays legible wherever
         the footage happens to be bright. */
      className="flex h-[62px] w-full max-w-[540px] items-center gap-3 rounded-full border border-on-ink/25 bg-on-ink/[0.07] pr-2 pl-[22px] backdrop-blur-md transition-colors duration-200 ease-[var(--ease)] focus-within:border-on-ink/55 focus-within:bg-on-ink/[0.11]"
    >
      <UrlField />
      <SubmitButton />
    </form>
  );
}
