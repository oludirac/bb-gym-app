import Link from "next/link";
import {
  Check,
  Dumbbell,
  Flag,
  History,
  Plus,
  Repeat2,
  Trash2,
  X
} from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  addExerciseToWorkout,
  addWorkoutSet,
  deleteWorkoutSet,
  finishWorkout,
  removeWorkoutExercise,
  saveWorkoutSet,
  startBlankWorkout
} from "@/app/(app)/workouts/actions";
import {
  getActiveWorkout,
  getExerciseOptions,
  type WorkoutExercise,
  type WorkoutSet
} from "@/lib/workouts/queries";
import { requireUser } from "@/lib/auth/session";

const setTypes = ["warmup", "working", "drop", "failure"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function SetEditor({ set }: { set: WorkoutSet }) {
  return (
    <div className="rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] p-3">
      <form action={saveWorkoutSet} className="space-y-3">
        <input type="hidden" name="setId" value={set.id} />

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black">Set {set.sort_order}</p>
          <FormSubmitButton
            pendingLabel="Saving..."
            className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-[color:var(--success)] px-3 text-sm font-black text-zinc-950 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <Check aria-hidden="true" className="size-4" strokeWidth={3} />
            Save
          </FormSubmitButton>
        </div>

        <fieldset className="grid grid-cols-4 gap-1.5">
          <legend className="sr-only">Set type</legend>
          {setTypes.map((setType) => (
            <label key={setType} className="relative">
              <input
                type="radio"
                name="setType"
                value={setType}
                defaultChecked={set.set_type === setType}
                className="peer sr-only"
              />
              <span className="flex min-h-9 items-center justify-center rounded-lg border border-[color:var(--panel-border)] px-2 text-[11px] font-black capitalize text-[color:var(--muted)] peer-checked:border-[color:var(--accent)] peer-checked:bg-[color:var(--accent)] peer-checked:text-zinc-950">
                {setType === "working" ? "work" : setType}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="grid grid-cols-5 gap-2">
          <label className="grid gap-1">
            <span className="text-[11px] font-black text-[color:var(--muted)]">
              kg
            </span>
            <input
              name="weightKg"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              defaultValue={set.weight_kg ?? ""}
              className="field-base min-h-12 px-2 text-center text-base font-black"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-black text-[color:var(--muted)]">
              reps
            </span>
            <input
              name="reps"
              type="number"
              inputMode="numeric"
              min="0"
              defaultValue={set.reps ?? ""}
              className="field-base min-h-12 px-2 text-center text-base font-black"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-black text-[color:var(--muted)]">
              RPE
            </span>
            <input
              name="rpe"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              max="10"
              defaultValue={set.rpe ?? ""}
              className="field-base min-h-12 px-2 text-center text-base font-black"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-black text-[color:var(--muted)]">
              RIR
            </span>
            <input
              name="rir"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              defaultValue={set.rir ?? ""}
              className="field-base min-h-12 px-2 text-center text-base font-black"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-black text-[color:var(--muted)]">
              rest
            </span>
            <input
              name="restSeconds"
              type="number"
              inputMode="numeric"
              step="5"
              min="0"
              defaultValue={set.rest_seconds ?? ""}
              className="field-base min-h-12 px-2 text-center text-base font-black"
            />
          </label>
        </div>

        <input
          name="notes"
          defaultValue={set.notes ?? ""}
          placeholder="Notes"
          className="field-base w-full text-sm"
        />
      </form>

      <form action={deleteWorkoutSet} className="mt-2">
        <input type="hidden" name="setId" value={set.id} />
        <FormSubmitButton
          pendingLabel="Deleting..."
          className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-[color:var(--danger)]/40 px-3 text-xs font-black text-red-200 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
          Delete
        </FormSubmitButton>
      </form>
    </div>
  );
}

function WorkoutExerciseCard({ exercise }: { exercise: WorkoutExercise }) {
  const lastSet = exercise.sets.at(-1);

  return (
    <article className="app-card-flat overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-[color:var(--panel-border)] p-4">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-black">
            {exercise.exercise_name_snapshot}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {exercise.sets.length} set{exercise.sets.length === 1 ? "" : "s"}
          </p>
        </div>
        <form action={removeWorkoutExercise}>
          <input
            type="hidden"
            name="workoutExerciseId"
            value={exercise.id}
          />
          <FormSubmitButton
            pendingLabel="Removing..."
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[color:var(--danger)]/40 px-3 text-sm font-black text-red-200 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <X aria-hidden="true" className="size-4" />
          </FormSubmitButton>
        </form>
      </div>

      <div className="space-y-3 p-3">
        {exercise.sets.map((set) => (
          <SetEditor key={set.id} set={set} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-[color:var(--panel-border)] p-3">
        <form action={addWorkoutSet}>
          <input
            type="hidden"
            name="workoutExerciseId"
            value={exercise.id}
          />
          <FormSubmitButton
            pendingLabel="Adding..."
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--accent)] px-3 text-sm font-black text-zinc-950 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add set
          </FormSubmitButton>
        </form>

        <form action={addWorkoutSet}>
          <input
            type="hidden"
            name="workoutExerciseId"
            value={exercise.id}
          />
          <input type="hidden" name="copySetId" value={lastSet?.id ?? ""} />
          <FormSubmitButton
            pendingLabel="Repeating..."
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--panel-border)] px-3 text-sm font-black transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <Repeat2 aria-hidden="true" className="size-4" />
            Repeat
          </FormSubmitButton>
        </form>
      </div>
    </article>
  );
}

export default async function ActiveWorkoutPage() {
  const { supabase } = await requireUser();
  const [activeWorkout, exerciseOptions] = await Promise.all([
    getActiveWorkout(supabase),
    getExerciseOptions(supabase)
  ]);

  if (!activeWorkout) {
    return (
      <div className="space-y-6">
        <section className="app-card p-5">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-zinc-950">
            <Dumbbell aria-hidden="true" className="size-7" strokeWidth={2.6} />
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-normal">
            No workout running
          </h1>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Start from scratch and add lifts as you go.
          </p>
          <form action={startBlankWorkout} className="mt-5">
            <FormSubmitButton pendingLabel="Starting...">
              <Plus aria-hidden="true" className="size-5" />
              Start workout
            </FormSubmitButton>
          </form>
        </section>

        <Link
          href="/workouts"
          className="app-card-flat flex min-h-12 items-center justify-center gap-2 px-4 text-sm font-black"
        >
          <History aria-hidden="true" className="size-4" />
          History
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-32">
      <header className="app-card p-5">
        <p className="app-chip border-[color:var(--accent)]/40 text-[color:var(--accent)]">
          Workout
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-normal">
          {activeWorkout.name ?? "Workout"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
          Started {formatDate(activeWorkout.started_at)}
        </p>
      </header>

      <form action={addExerciseToWorkout} className="app-card-flat p-3">
        <input type="hidden" name="workoutId" value={activeWorkout.id} />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <label className="grid gap-1">
            <span className="sr-only">Add lift</span>
            <select name="exerciseId" className="field-base text-base" required>
              {exerciseOptions.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                  {exercise.is_builtin ? "" : " (custom)"}
                </option>
              ))}
            </select>
          </label>
          <FormSubmitButton
            pendingLabel="Adding..."
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[color:var(--accent)] px-4 text-sm font-black text-zinc-950 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add
          </FormSubmitButton>
        </div>
      </form>

      <section className="space-y-4">
        {activeWorkout.workoutExercises.length === 0 ? (
          <div className="app-card-flat p-4">
            <h2 className="text-base font-black">No lifts yet</h2>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              Pick the first lift above.
            </p>
          </div>
        ) : (
          activeWorkout.workoutExercises.map((exercise) => (
            <WorkoutExerciseCard key={exercise.id} exercise={exercise} />
          ))
        )}
      </section>

      <div className="fixed inset-x-0 bottom-[5.75rem] z-20 px-4">
        <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] gap-2 rounded-2xl border border-[color:var(--panel-border)] bg-[#080a0d]/95 p-2 shadow-[0_16px_42px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <form action={finishWorkout}>
            <input type="hidden" name="workoutId" value={activeWorkout.id} />
            <FormSubmitButton pendingLabel="Finishing...">
              <Flag aria-hidden="true" className="size-5" />
              Finish
            </FormSubmitButton>
          </form>
          <Link
            href="/workouts"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[color:var(--panel-border)] px-4 text-sm font-black"
          >
            <History aria-hidden="true" className="size-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
