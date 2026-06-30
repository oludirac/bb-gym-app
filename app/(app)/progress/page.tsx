import Link from "next/link";
import { Activity, BarChart3, Trophy } from "lucide-react";
import { getProgressSummary } from "@/lib/progress/queries";
import { requireUser } from "@/lib/auth/session";
import { formatWeight } from "@/lib/unit-conversion";

function formatNumber(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 1
  });
}

function MetricCard({
  label,
  volume,
  workouts,
  unit
}: {
  label: string;
  unit: "kg" | "lb";
  volume: number;
  workouts: number;
}) {
  return (
    <div className="app-card-flat p-4">
      <p className="text-xs font-black uppercase text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{workouts}</p>
      <p className="mt-1 text-sm text-[color:var(--muted)]">
        {formatWeight(volume, unit)}
      </p>
    </div>
  );
}

function ActivityGraph({
  activity
}: {
  activity: { label: string; volume_kg: number; workouts: number }[];
}) {
  const maxWorkouts = Math.max(1, ...activity.map((item) => item.workouts));

  return (
    <section className="app-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black">Last 8 weeks</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Completed workouts.
          </p>
        </div>
        <BarChart3 aria-hidden="true" className="size-5 text-[color:var(--accent)]" />
      </div>

      <div className="mt-5 flex h-36 items-end gap-2">
        {activity.map((item) => {
          const height = item.workouts
            ? Math.max(12, (item.workouts / maxWorkouts) * 100)
            : 4;

          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end rounded-xl bg-[#0d1117] p-1">
                <div
                  className="w-full rounded-lg bg-[color:var(--accent)]"
                  style={{ height: `${height}%` }}
                />
              </div>
              <p className="max-w-full truncate text-[10px] font-bold text-[color:var(--muted)]">
                {item.label}
              </p>
              <p className="text-xs font-black">{item.workouts}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function ProgressPage() {
  const { profile, supabase } = await requireUser();
  const unit = profile?.unit_preference ?? "kg";
  const summary = await getProgressSummary(supabase);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-bold text-[color:var(--accent)]">Progress</p>
        <h1 className="text-3xl font-black tracking-normal">Training log</h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Workouts, volume, and best lifts from finished sessions.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <MetricCard
          label="This week"
          unit={unit}
          volume={summary.periods.week.volume_kg}
          workouts={summary.periods.week.workouts}
        />
        <MetricCard
          label="This month"
          unit={unit}
          volume={summary.periods.month.volume_kg}
          workouts={summary.periods.month.workouts}
        />
        <MetricCard
          label="This year"
          unit={unit}
          volume={summary.periods.year.volume_kg}
          workouts={summary.periods.year.workouts}
        />
        <MetricCard
          label="All time"
          unit={unit}
          volume={summary.periods.all.volume_kg}
          workouts={summary.periods.all.workouts}
        />
      </section>

      <ActivityGraph activity={summary.weekly_activity} />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Best lifts</h2>
        {summary.best_lifts.length === 0 ? (
          <div className="app-card-flat p-4">
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
                className="app-card-flat p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#0d1117] text-[color:var(--accent)]">
                    <Trophy aria-hidden="true" className="size-5" />
                  </div>
                  <h3 className="text-base font-black">{lift.exercise_name}</h3>
                </div>
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
          <div className="app-card-flat p-4">
            <p className="text-sm text-[color:var(--muted)]">
              This fills in after finished workouts.
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {summary.muscle_groups.map((group) => (
              <div
                key={group.muscle_group}
                className="app-card-flat p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-2 text-sm font-black capitalize">
                    <Activity
                      aria-hidden="true"
                      className="size-4 text-[color:var(--accent)]"
                    />
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
        className="app-card-flat flex min-h-12 items-center justify-center gap-2 px-4 text-sm font-black"
      >
        <BarChart3 aria-hidden="true" className="size-4 text-[color:var(--accent)]" />
        Export data
      </Link>
    </div>
  );
}
