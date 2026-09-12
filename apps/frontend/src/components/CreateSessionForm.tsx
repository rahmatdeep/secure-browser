"use client";

import { createSession } from "@/actions/sessionActions";
import { Globe, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-accent px-6 text-[15px] font-medium tracking-[-0.011em] text-white transition-[filter,background] duration-200 ease-[var(--ease)] hover:brightness-95 focus:outline-none disabled:cursor-not-allowed disabled:brightness-90 sm:w-auto"
    >
      {pending ? (
        <>
          <Loader2 className="spin h-4 w-4" strokeWidth={1.5} />
          <span>Starting container</span>
        </>
      ) : (
        <span>Open</span>
      )}
    </button>
  );
}

function UrlField() {
  const { pending } = useFormStatus();

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <label htmlFor="url" className="text-[12px] tracking-[-0.002em] text-fg-3">
        Website URL
      </label>
      <div className="relative">
        <Globe
          className="pointer-events-none absolute left-[18px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-fg-3"
          strokeWidth={1.5}
        />
        <input
          type="url"
          id="url"
          name="url"
          required
          disabled={pending}
          placeholder="Paste a URL"
          className="h-14 w-full rounded-xl border border-line bg-surface px-[46px] text-[16px] tracking-[-0.009em] text-fg outline-none transition-[border-color,background,color] duration-200 ease-[var(--ease)] placeholder:text-fg-3 focus:border-accent focus:bg-bg disabled:cursor-not-allowed disabled:text-fg-2"
        />
      </div>
    </div>
  );
}

export function CreateSessionForm() {
  return (
    <form
      action={createSession}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <UrlField />
      <SubmitButton />
    </form>
  );
}
