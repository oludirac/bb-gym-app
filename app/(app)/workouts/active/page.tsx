import Link from "next/link";
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
    <div className="rounded-md border border-[color:var(--panel-border)] bg-zinc-950 p-3">
      <form action={saveWorkoutSet}>
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
              Kg
            </span>
            <input
              name="weightKg"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              defaultValue={set.weight_kg ?? ""}
              className="min-h-10 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold text-[color:var(--muted)]">
              Reps
            </span>
            <input
              name="reps"
              type="number"
              inputMode="numeric"
              min="0"
              defaultValue={set.reps ?? ""}
              className="min-h-10 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold text-[color:var(--muted)]">
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
              className="min-h-10 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold text-[color:var(--muted)]">
              RIR
            </span>
            <input
              name="rir"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              defaultValue={set.rir ?? ""}
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
              step="5"
              min="0"
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
      <form action={deleteWorkoutSet} className="mt-2">
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

function WorkoutExerciseCard({ exercise }: { exercise: WorkoutExercise }) {
  const lastSet = exercise.sets.at(-1);

  return (
    <article className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {exercise.exercise_name_snapshot}
          </h2>
          <p className="text-sm text-[color:var(--muted)]">
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
            className="min-h-10 rounded-md border border-red-500/40 px-3 text-sm font-semibold text-red-200 disabled:cursor-wait disabled:opacity-70"
          >
            Remove
          </FormSubmitButton>
        </form>
      </div>

      <div className="mt-4 space-y-3">
        {exercise.sets.map((set) => (
          <SetEditor key={set.id} set={set} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <form action={addWorkoutSet}>
          <input
            type="hidden"
            name="workoutExerciseId"
            value={exercise.id}
          />
          <FormSubmitButton
            pendingLabel="Adding..."
            className="min-h-11 w-full rounded-md bg-[color:var(--accent)] px-3 text-sm font-semibold text-zinc-950 disabled:cursor-wait disabled:opacity-70"
          >
            Add Set
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
            className="min-h-11 w-full rounded-md border border-[color:var(--panel-border)] px-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
          >
            Copy Last
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
        <header className="space-y-2">
          <p className="text-sm font-medium text-[color:var(--accent)]">
            Workout
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            No active workout
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Start a blank session and add exercises as you train.
          </p>
        </header>

        <form action={startBlankWorkout}>
          <FormSubmitButton pendingLabel="Starting...">
            Start Blank Workout
          </FormSubmitButton>
        </form>

        <Link
          href="/workouts"
          className="flex min-h-12 items-center justify-center rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-semibold"
        >
          Workout History
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--accent)]">
          Active workout
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          {activeWorkout.name ?? "Workout"}
        </h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Started {formatDate(activeWorkout.started_at)}
        </p>
      </header>

      <form action={addExerciseToWorkout} className="space-y-2">
        <input type="hidden" name="workoutId" value={activeWorkout.id} />
        <label className="grid gap-2">
          <span className="text-sm font-medium">Add exercise</span>
          <select
            name="exerciseId"
            className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base"
            required
          >
            {exerciseOptions.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
                {exercise.is_builtin ? "" : " (custom)"}
              </option>
            ))}
          </select>
        </label>
        <FormSubmitButton pendingLabel="Adding exercise...">
          Add Exercise
        </FormSubmitButton>
      </form>

      <section className="space-y-3">
        {activeWorkout.workoutExercises.length === 0 ? (
          <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
            <h2 className="text-base font-semibold">No exercises yet</h2>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              Add your first movement above.
            </p>
          </div>
        ) : (
          activeWorkout.workoutExercises.map((exercise) => (
            <WorkoutExerciseCard key={exercise.id} exercise={exercise} />
          ))
        )}
      </section>

      <div className="fixed inset-x-0 bottom-[4.75rem] z-10 px-4">
        <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] gap-2 rounded-md border border-[color:var(--panel-border)] bg-zinc-950/95 p-2 backdrop-blur">
          <form action={finishWorkout}>
            <input type="hidden" name="workoutId" value={activeWorkout.id} />
            <FormSubmitButton pendingLabel="Finishing...">
              Finish Workout
            </FormSubmitButton>
          </form>
          <Link
            href="/workouts"
            className="flex min-h-12 items-center justify-center rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-semibold"
          >
            History
          </Link>
        </div>
      </div>
    </div>
  );
}
