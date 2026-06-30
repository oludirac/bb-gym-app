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

export default async function WorkoutDetailPage({
  params
}: WorkoutDetailPageProps) {
  const [{ id }, { supabase }] = await Promise.all([params, requireUser()]);
  const workout = await getWorkoutDetail(supabase, id);

  if (!workout) {
    notFound();
  }

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
            {workout.status}
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            {workout.name ?? "Workout"}
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Started {formatDate(workout.started_at)}
          </p>
        </header>
      </div>

      <section className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
        <h2 className="text-base font-semibold">Summary</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {workout.workoutExercises.length} exercise
          {workout.workoutExercises.length === 1 ? "" : "s"} -{" "}
          {Number(workout.total_volume_kg ?? 0).toLocaleString()} kg volume
        </p>
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
                  <div className="grid grid-cols-4 gap-2">
                    <span className="font-semibold">#{set.sort_order}</span>
                    <span>{set.weight_kg ?? "-"} kg</span>
                    <span>{set.reps ?? "-"} reps</span>
                    <span>{set.completed_at ? "done" : "-"}</span>
                  </div>
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
          Delete Workout
        </FormSubmitButton>
      </form>
    </div>
  );
}
