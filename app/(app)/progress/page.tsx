import Link from "next/link";
import { getProgressSummary } from "@/lib/progress/queries";
import { requireUser } from "@/lib/auth/session";
import { formatWeight } from "@/lib/unit-conversion";

function formatNumber(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 1
  });
}

export default async function ProgressPage() {
  const { profile, supabase } = await requireUser();
  const unit = profile?.unit_preference ?? "kg";
  const summary = await getProgressSummary(supabase);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--accent)]">
          Progress
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Progress
        </h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          From finished workouts.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
            Workouts
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {summary.workout_count}
          </p>
        </div>
        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
            This week
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {summary.this_week_workouts}
          </p>
        </div>
        <div className="col-span-2 rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
            Total volume
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {formatWeight(summary.total_volume_kg, unit)}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Best lifts</h2>
        {summary.best_lifts.length === 0 ? (
          <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
            <h3 className="text-base font-semibold">No lifting data yet</h3>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Log weight and reps in a finished workout.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {summary.best_lifts.map((lift) => (
              <article
                key={lift.exercise_id}
                className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4"
              >
                <h3 className="text-base font-semibold">
                  {lift.exercise_name}
                </h3>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  Est. 1RM {formatWeight(lift.estimated_one_rep_max, unit)}
                </p>
                <p className="mt-2 text-sm">
                  Best set: {formatWeight(lift.weight_kg, unit)} x {lift.reps}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Muscles trained</h2>
        {summary.muscle_groups.length === 0 ? (
          <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
            <p className="text-sm text-[color:var(--muted)]">
              This fills in after finished workouts.
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {summary.muscle_groups.map((group) => (
              <div
                key={group.muscle_group}
                className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold capitalize">
                    {group.muscle_group}
                  </p>
                  <p className="text-sm text-[color:var(--muted)]">
                    {formatNumber(group.count)} sets
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link
        href="/export"
        className="flex min-h-12 items-center justify-center rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-semibold"
      >
        Export data
      </Link>
    </div>
  );
}
