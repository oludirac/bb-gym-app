import Link from "next/link";
import { Copy, Play, Plus, TimerReset, Trash2 } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  deleteTemplate,
  duplicateTemplate,
  startWorkoutFromTemplate
} from "@/app/(app)/templates/actions";
import { getTemplateSummaries } from "@/lib/templates/queries";
import { requireUser } from "@/lib/auth/session";

export default async function TemplatesPage() {
  const { supabase } = await requireUser();
  const templates = await getTemplateSummaries(supabase);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--accent)]">
          Routines
        </p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-normal">Routines</h1>
          <Link
            href="/templates/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[color:var(--accent)] px-3 text-sm font-black text-zinc-950"
          >
            <Plus aria-hidden="true" className="size-4" />
            New
          </Link>
        </div>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Save the sessions you repeat.
        </p>
      </header>

      <section className="grid gap-3">
        {templates.length === 0 ? (
          <div className="app-card-flat p-4">
            <h2 className="text-base font-semibold">No routines yet</h2>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              Add your push, pull, legs, or whatever you actually run.
            </p>
          </div>
        ) : (
          templates.map((template) => (
            <article
              key={template.id}
              className="app-card-flat p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0d1117] text-[color:var(--accent)]">
                    <TimerReset aria-hidden="true" className="size-5" />
                  </div>
                  <div className="min-w-0">
                  <h2 className="text-lg font-semibold">{template.name}</h2>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {template.exercise_count} exercise
                    {template.exercise_count === 1 ? "" : "s"}
                    {template.estimated_minutes
                      ? ` - ${template.estimated_minutes} min`
                      : ""}
                  </p>
                  </div>
                </div>
                <Link
                  href={`/templates/${template.id}/edit`}
                  className="flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--panel-border)] px-3 text-sm font-black"
                >
                  Edit
                </Link>
              </div>

              {template.notes ? (
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                  {template.notes}
                </p>
              ) : null}

              <div className="mt-4 grid gap-2">
                <form action={startWorkoutFromTemplate}>
                  <input type="hidden" name="templateId" value={template.id} />
                  <FormSubmitButton pendingLabel="Starting...">
                    <Play aria-hidden="true" className="size-4 fill-current" />
                    Start workout
                  </FormSubmitButton>
                </form>
                <div className="grid grid-cols-2 gap-2">
                  <form action={duplicateTemplate}>
                    <input
                      type="hidden"
                      name="templateId"
                      value={template.id}
                    />
                    <FormSubmitButton
                      pendingLabel="Duplicating..."
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--panel-border)] px-3 text-sm font-black disabled:cursor-wait disabled:opacity-70"
                    >
                      <Copy aria-hidden="true" className="size-4" />
                      Duplicate
                    </FormSubmitButton>
                  </form>
                  <form action={deleteTemplate}>
                    <input
                      type="hidden"
                      name="templateId"
                      value={template.id}
                    />
                    <FormSubmitButton
                      pendingLabel="Deleting..."
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--danger)]/40 px-3 text-sm font-black text-red-200 disabled:cursor-wait disabled:opacity-70"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      Delete
                    </FormSubmitButton>
                  </form>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
