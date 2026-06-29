import Link from "next/link";
import { getCompletedWorkouts } from "@/lib/workouts/queries";
import { requireUser } from "@/lib/auth/session";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default async function WorkoutsPage() {
  const { supabase } = await requireUser();
  const workouts = await getCompletedWorkouts(supabase);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--accent)]">
          History
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Workouts</h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Finished workouts.
        </p>
      </header>

      <Link
        href="/workouts/active"
        className="flex min-h-12 items-center justify-center rounded-md bg-[color:var(--accent)] px-4 text-base font-semibold text-zinc-950"
      >
        Current workout
      </Link>

      <section className="grid gap-3">
        {workouts.length === 0 ? (
          <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
            <h2 className="text-base font-semibold">No completed workouts</h2>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              Finish your first workout and it will appear here.
            </p>
          </div>
        ) : (
          workouts.map((workout) => (
            <Link
              key={workout.id}
              href={`/workouts/${workout.id}`}
              className="block rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4"
            >
              <h2 className="text-base font-semibold">
                {workout.name ?? "Workout"}
              </h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {formatDate(workout.started_at)}
              </p>
              <p className="mt-3 text-sm font-semibold">
                {Number(workout.total_volume_kg ?? 0).toLocaleString()} kg
                volume
              </p>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
