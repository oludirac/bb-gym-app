import Link from "next/link";
import { notFound } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  addTemplateExercise,
  addTemplateSet,
  deleteTemplate,
  deleteTemplateExercise,
  deleteTemplateSet,
  duplicateTemplate,
  startWorkoutFromTemplate,
  updateTemplate,
  updateTemplateSet
} from "@/app/(app)/templates/actions";
import { getExerciseOptions } from "@/lib/workouts/queries";
import {
  getTemplateDetail,
  type TemplateExercise,
  type TemplateSet
} from "@/lib/templates/queries";
import { requireUser } from "@/lib/auth/session";

const setTypes = ["warmup", "working", "drop", "failure"];

type EditTemplatePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function PlannedSetEditor({
  set,
  templateId
}: {
  set: TemplateSet;
  templateId: string;
}) {
  return (
    <div className="rounded-md border border-[color:var(--panel-border)] bg-zinc-950 p-3">
      <form action={updateTemplateSet}>
        <input type="hidden" name="templateId" value={templateId} />
        <input type="hidden" name="setId" value={set.id} />

        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <p className="text-sm font-semibold">Set {set.sort_order}</p>
          <select
            name="setType"
            defaultValue={set.set_type}
            className="min-h-10 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-2 text-sm capitalize"
          >
            {setTypes.map((setType) => (
              <option key={setType} value={setType}>
                {setType}
              </option>
            ))}
          </select>
          <FormSubmitButton
            pendingLabel="Saving..."
            className="min-h-10 rounded-md bg-[color:var(--accent)] px-3 text-sm font-semibold text-zinc-950 disabled:cursor-wait disabled:opacity-70"
          >
            Save
          </FormSubmitButton>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold text-[color:var(--muted)]">
              Reps Min
            </span>
            <input
              name="targetRepsMin"
              type="number"
              inputMode="numeric"
              min="0"
              defaultValue={set.target_reps_min ?? ""}
              className="min-h-10 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold text-[color:var(--muted)]">
              Reps Max
            </span>
            <input
              name="targetRepsMax"
              type="number"
              inputMode="numeric"
              min="0"
              defaultValue={set.target_reps_max ?? ""}
              className="min-h-10 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold text-[color:var(--muted)]">
              Kg
            </span>
            <input
              name="targetWeightKg"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.25"
              defaultValue={set.target_weight_kg ?? ""}
              className="min-h-10 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold text-[color:var(--muted)]">
              RPE
            </span>
            <input
              name="targetRpe"
              type="number"
              inputMode="decimal"
              min="0"
              max="10"
              step="0.5"
              defaultValue={set.target_rpe ?? ""}
              className="min-h-10 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold text-[color:var(--muted)]">
              RIR
            </span>
            <input
              name="targetRir"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              defaultValue={set.target_rir ?? ""}
              className="min-h-10 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold text-[color:var(--muted)]">
              Rest Sec
            </span>
            <input
              name="restSeconds"
              type="number"
              inputMode="numeric"
              min="0"
              step="5"
              defaultValue={set.rest_seconds ?? ""}
              className="min-h-10 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-2 text-sm"
            />
          </label>
        </div>

        <input
          name="notes"
          defaultValue={set.notes ?? ""}
          placeholder="Set notes"
          className="mt-2 min-h-10 w-full rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-2 text-sm"
        />
      </form>

      <form action={deleteTemplateSet} className="mt-2">
        <input type="hidden" name="templateId" value={templateId} />
        <input type="hidden" name="setId" value={set.id} />
        <FormSubmitButton
          pendingLabel="Deleting..."
          className="min-h-9 rounded-md border border-red-500/40 px-3 text-xs font-semibold text-red-200 disabled:cursor-wait disabled:opacity-70"
        >
          Delete Set
        </FormSubmitButton>
      </form>
    </div>
  );
}

function TemplateExerciseCard({
  exercise,
  templateId
}: {
  exercise: TemplateExercise;
  templateId: string;
}) {
  return (
    <article className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{exercise.exercise_name}</h2>
          <p className="text-sm text-[color:var(--muted)]">
            {exercise.sets.length} planned set
            {exercise.sets.length === 1 ? "" : "s"}
          </p>
        </div>
        <form action={deleteTemplateExercise}>
          <input type="hidden" name="templateId" value={templateId} />
          <input
            type="hidden"
            name="templateExerciseId"
            value={exercise.id}
          />
          <FormSubmitButton
            pendingLabel="Removing..."
            className="min-h-10 rounded-md border border-red-500/40 px-3 text-sm font-semibold text-red-200 disabled:cursor-wait disabled:opacity-70"
          >
            Remove
          </FormSubmitButton>
        </form>
      </div>

      <div className="mt-4 space-y-3">
        {exercise.sets.map((set) => (
          <PlannedSetEditor key={set.id} set={set} templateId={templateId} />
        ))}
      </div>

      <form action={addTemplateSet} className="mt-3">
        <input type="hidden" name="templateId" value={templateId} />
        <input type="hidden" name="templateExerciseId" value={exercise.id} />
        <FormSubmitButton
          pendingLabel="Adding..."
          className="min-h-11 w-full rounded-md bg-[color:var(--accent)] px-3 text-sm font-semibold text-zinc-950 disabled:cursor-wait disabled:opacity-70"
        >
          Add Planned Set
        </FormSubmitButton>
      </form>
    </article>
  );
}

export default async function EditTemplatePage({
  params
}: EditTemplatePageProps) {
  const [{ id }, { supabase }] = await Promise.all([params, requireUser()]);
  const [template, exerciseOptions] = await Promise.all([
    getTemplateDetail(supabase, id),
    getExerciseOptions(supabase)
  ]);

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="space-y-4">
        <Link
          href="/templates"
          className="inline-flex min-h-10 items-center text-sm font-semibold text-[color:var(--accent)]"
        >
          Back to routines
        </Link>
        <header className="space-y-2">
          <p className="text-sm font-medium text-[color:var(--accent)]">
            Edit routine
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            {template.name}
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Add exercises, then set the work.
          </p>
        </header>
      </div>

      <form action={updateTemplate} className="space-y-3">
        <input type="hidden" name="templateId" value={template.id} />
        <label className="grid gap-2">
          <span className="text-sm font-medium">Name</span>
          <input
            name="name"
            required
            defaultValue={template.name}
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
            defaultValue={template.estimated_minutes ?? ""}
            className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base outline-none focus:border-[color:var(--accent)]"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={template.notes ?? ""}
            className="rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 py-3 text-base outline-none focus:border-[color:var(--accent)]"
          />
        </label>
        <FormSubmitButton pendingLabel="Saving...">
          Save routine
        </FormSubmitButton>
      </form>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Add exercise</h2>
        <form action={addTemplateExercise} className="space-y-2">
          <input type="hidden" name="templateId" value={template.id} />
          <select
            name="exerciseId"
            required
            className="min-h-12 w-full rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base"
          >
            {exerciseOptions.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
                {exercise.is_builtin ? "" : " (custom)"}
              </option>
            ))}
          </select>
          <FormSubmitButton pendingLabel="Adding...">
            Add Exercise
          </FormSubmitButton>
        </form>
      </section>

      <section className="space-y-3">
        {template.exercises.length === 0 ? (
          <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
            <h2 className="text-base font-semibold">No exercises yet</h2>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              Add the first lift above.
            </p>
          </div>
        ) : (
          template.exercises.map((exercise) => (
            <TemplateExerciseCard
              key={exercise.id}
              exercise={exercise}
              templateId={template.id}
            />
          ))
        )}
      </section>

      <div className="fixed inset-x-0 bottom-[4.75rem] z-10 px-4">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2 rounded-md border border-[color:var(--panel-border)] bg-zinc-950/95 p-2 backdrop-blur">
          <form action={startWorkoutFromTemplate}>
            <input type="hidden" name="templateId" value={template.id} />
            <FormSubmitButton
              pendingLabel="Starting..."
              className="min-h-12 w-full rounded-md bg-[color:var(--accent)] px-2 text-sm font-semibold text-zinc-950 disabled:cursor-wait disabled:opacity-70"
            >
              Start
            </FormSubmitButton>
          </form>
          <form action={duplicateTemplate}>
            <input type="hidden" name="templateId" value={template.id} />
            <FormSubmitButton
              pendingLabel="Duplicating..."
              className="min-h-12 w-full rounded-md border border-[color:var(--panel-border)] px-2 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
            >
              Duplicate
            </FormSubmitButton>
          </form>
          <form action={deleteTemplate}>
            <input type="hidden" name="templateId" value={template.id} />
            <FormSubmitButton
              pendingLabel="Deleting..."
              className="min-h-12 w-full rounded-md border border-red-500/40 px-2 text-sm font-semibold text-red-200 disabled:cursor-wait disabled:opacity-70"
            >
              Delete
            </FormSubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
