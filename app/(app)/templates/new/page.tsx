import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { createTemplate } from "@/app/(app)/templates/actions";
import { requireUser } from "@/lib/auth/session";

export default async function NewTemplatePage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href="/templates"
          className="inline-flex min-h-10 items-center text-sm font-semibold text-[color:var(--accent)]"
        >
          Back to routines
        </Link>
        <header className="space-y-2">
          <p className="text-sm font-medium text-[color:var(--accent)]">
            New routine
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Create routine
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Name it, then add exercises and sets.
          </p>
        </header>
      </div>

      <form action={createTemplate} className="space-y-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Name</span>
          <input
            name="name"
            required
            placeholder="Push Day"
            className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base outline-none focus:border-[color:var(--accent)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Estimated minutes</span>
          <input
            name="estimatedMinutes"
            type="number"
            inputMode="numeric"
            min="1"
            placeholder="60"
            className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base outline-none focus:border-[color:var(--accent)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            name="notes"
            rows={4}
            placeholder="Anything you want to remember before starting this session."
            className="rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 py-3 text-base outline-none focus:border-[color:var(--accent)]"
          />
        </label>

        <FormSubmitButton pendingLabel="Creating...">
          Create routine
        </FormSubmitButton>
      </form>
    </div>
  );
}
