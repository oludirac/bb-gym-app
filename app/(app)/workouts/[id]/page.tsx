import Link from "next/link";
import { notFound } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { deleteWorkout } from "@/app/(app)/workouts/actions";
import { getWorkoutDetail } from "@/lib/workouts/queries";
import { requireUser } from "@/lib/auth/session";

type WorkoutDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return "-";
  }

  return `${Number(seconds / 60).toLocaleString(undefined, {
    maximumFractionDigits: 1
  })} min`;
}

function completedSetCount(workout: Awaited<ReturnType<typeof getWorkoutDetail>>) {
  if (!workout) {
    return 0;
  }

  return workout.workoutExercises.reduce(
    (total, exercise) =>
      total + exercise.sets.filter((set) => set.completed_at).length,
    0
  );
}

export default async function WorkoutDetailPage({
  params
}: WorkoutDetailPageProps) {
  const [{ id }, { supabase }] = await Promise.all([params, requireUser()]);
  const workout = await getWorkoutDetail(supabase, id);

  if (!workout) {
    notFound();
  }

  const isCompleted = workout.status === "completed";
  const completedSets = completedSetCount(workout);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href="/workouts"
          className="inline-flex min-h-10 items-center text-sm font-semibold text-[color:var(--accent)]"
        >
          Back to history
        </Link>
        <header className="space-y-2">
          <p className="text-sm font-medium capitalize text-[color:var(--accent)]">
            {isCompleted ? "Workout complete" : workout.status}
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            {workout.name ?? "Workout"}
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Started {formatDate(workout.started_at)}
            {workout.finished_at ? ` - Finished ${formatDate(workout.finished_at)}` : ""}
          </p>
        </header>
      </div>

      <section className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
        <h2 className="text-base font-semibold">Summary</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {workout.workoutExercises.length} exercise
          {workout.workoutExercises.length === 1 ? "" : "s"} -{" "}
          {completedSets} completed set{completedSets === 1 ? "" : "s"} -{" "}
          {Number(workout.total_volume_kg ?? 0).toLocaleString()} kg volume
        </p>
        {isCompleted ? (
          <Link
            href="/dashboard"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[color:var(--accent)] px-4 text-sm font-black text-zinc-950"
          >
            Back to Today
          </Link>
        ) : null}
      </section>

      <section className="space-y-3">
        {workout.workoutExercises.map((exercise) => (
          <article
            key={exercise.id}
            className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4"
          >
            <h2 className="text-lg font-semibold">
              {exercise.exercise_name_snapshot}
            </h2>
            <div className="mt-3 grid gap-2">
              {exercise.sets.map((set) => (
                <div
                  key={set.id}
                  className="grid gap-1 rounded-md bg-zinc-950 p-3 text-sm"
                >
                  {exercise.exercise_category === "cardio" ? (
                    <div className="grid grid-cols-4 gap-2">
                      <span className="font-semibold">#{set.sort_order}</span>
                      <span>{formatDuration(set.duration_seconds)}</span>
                      <span>{set.distance_km ?? "-"} km</span>
                      <span>{set.intensity ?? (set.completed_at ? "done" : "-")}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      <span className="font-semibold">#{set.sort_order}</span>
                      <span>{set.weight_kg ?? "-"} kg</span>
                      <span>{set.reps ?? "-"} reps</span>
                      <span>{set.completed_at ? "done" : "-"}</span>
                    </div>
                  )}
                  {set.notes ? (
                    <p className="text-xs text-[color:var(--muted)]">
                      {set.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <form action={deleteWorkout}>
        <input type="hidden" name="workoutId" value={workout.id} />
        <FormSubmitButton
          pendingLabel="Deleting..."
          className="min-h-12 w-full rounded-md border border-red-500/40 px-4 text-base font-semibold text-red-200 disabled:cursor-wait disabled:opacity-70"
        >
          Delete from history
        </FormSubmitButton>
      </form>
    </div>
  );
}
