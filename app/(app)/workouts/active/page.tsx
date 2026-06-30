import Link from "next/link";
import {
  Check,
  Dumbbell,
  Flag,
  History,
  Plus,
  Repeat2,
  Trash2
} from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  addExerciseToWorkout,
  addWorkoutSet,
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function completedCount(exercise: WorkoutExercise) {
  return exercise.sets.filter((set) => set.completed_at).length;
}

function SetRow({ set }: { set: WorkoutSet }) {
  const isDone = Boolean(set.completed_at);

  return (
    <form
      action={saveWorkoutSet}
      className={`grid w-full grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)] items-end gap-2 overflow-hidden rounded-xl border p-2 ${
        isDone
          ? "border-[color:var(--success)]/55 bg-emerald-500/10"
          : "border-[color:var(--panel-border)] bg-[#0d1117]"
      }`}
    >
      <input type="hidden" name="setId" value={set.id} />
      <input type="hidden" name="setType" value="working" />
      <div className="grid min-h-11 place-items-center rounded-lg border border-[color:var(--panel-border)] text-sm font-black">
        {set.sort_order}
      </div>
      <label className="grid min-w-0 gap-1">
        <span className="text-[10px] font-black uppercase text-[color:var(--muted)]">
          kg
        </span>
        <input
          name="weightKg"
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          defaultValue={set.weight_kg ?? set.target_weight_kg ?? ""}
          className="field-base min-h-11 w-full min-w-0 px-1 text-center text-sm font-black"
        />
      </label>
      <label className="grid min-w-0 gap-1">
        <span className="text-[10px] font-black uppercase text-[color:var(--muted)]">
          reps
        </span>
        <input
          name="reps"
          type="number"
          inputMode="numeric"
          min="0"
          defaultValue={
            set.reps ?? set.target_reps_min ?? set.target_reps_max ?? ""
          }
          className="field-base min-h-11 w-full min-w-0 px-1 text-center text-sm font-black"
        />
      </label>
      <FormSubmitButton
        pendingLabel="Saving..."
        className={`col-span-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-black text-zinc-950 transition active:scale-[0.96] disabled:cursor-wait disabled:opacity-70 ${
          isDone ? "bg-[color:var(--success)]" : "bg-[color:var(--accent)]"
        }`}
      >
        <Check aria-hidden="true" className="size-5" strokeWidth={3} />
        {isDone ? "Done" : "Save set"}
      </FormSubmitButton>
    </form>
  );
}

function WorkoutExerciseCard({ exercise }: { exercise: WorkoutExercise }) {
  const lastSet = exercise.sets.at(-1);
  const done = completedCount(exercise);

  return (
    <article className="app-card-flat overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-[color:var(--panel-border)] p-4">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-black">
            {exercise.exercise_name_snapshot}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {done}/{exercise.sets.length} sets done
          </p>
        </div>
        <form action={removeWorkoutExercise}>
          <input
            type="hidden"
            name="workoutExerciseId"
            value={exercise.id}
          />
          <FormSubmitButton
            pendingLabel="..."
            className="inline-flex size-11 items-center justify-center rounded-xl border border-[color:var(--danger)]/40 text-red-300 transition active:scale-[0.96] disabled:cursor-wait disabled:opacity-70"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </FormSubmitButton>
        </form>
      </div>

      <div className="space-y-2 p-3">
        {exercise.sets.map((set) => (
          <SetRow key={set.id} set={set} />
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
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--panel-border)] px-3 text-sm font-black transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
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
            pendingLabel="Copying..."
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--panel-border)] px-3 text-sm font-black transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <Repeat2 aria-hidden="true" className="size-4" />
            Copy last
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
            Start today&apos;s planned workout from Today, or start a blank one.
          </p>
          <div className="mt-5 grid gap-2">
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[color:var(--accent)] px-4 text-base font-extrabold text-zinc-950"
            >
              Go to Today
            </Link>
            <form action={startBlankWorkout}>
              <FormSubmitButton
                pendingLabel="Starting..."
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--panel-border)] px-4 text-base font-extrabold"
              >
                <Plus aria-hidden="true" className="size-5" />
                Blank workout
              </FormSubmitButton>
            </form>
          </div>
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

  const totalSets = activeWorkout.workoutExercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0
  );
  const doneSets = activeWorkout.workoutExercises.reduce(
    (total, exercise) => total + completedCount(exercise),
    0
  );

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
          Started {formatDate(activeWorkout.started_at)} - {doneSets}/{totalSets}{" "}
          sets done
        </p>
      </header>

      <details className="app-card-flat p-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-black">
          Add lift
          <Plus aria-hidden="true" className="size-4 text-[color:var(--accent)]" />
        </summary>
        <form action={addExerciseToWorkout} className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <input type="hidden" name="workoutId" value={activeWorkout.id} />
          <label className="grid gap-1">
            <span className="sr-only">Exercise</span>
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
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[color:var(--accent)] px-4 text-sm font-black text-zinc-950 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            Add
          </FormSubmitButton>
        </form>
      </details>

      <section className="space-y-4">
        {activeWorkout.workoutExercises.length === 0 ? (
          <div className="app-card-flat p-4">
            <h2 className="text-base font-black">No lifts yet</h2>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              Add the first lift above.
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
            <FormSubmitButton pendingLabel="Completing...">
              <Flag aria-hidden="true" className="size-5" />
              Complete workout
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
