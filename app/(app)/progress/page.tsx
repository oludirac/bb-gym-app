import Link from "next/link";
import { BarChart3, Dumbbell, Scale, Trophy } from "lucide-react";
import {
  getProgressSummary,
  type MainLiftProgress
} from "@/lib/progress/queries";
import { requireUser } from "@/lib/auth/session";
import { formatWeight } from "@/lib/unit-conversion";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function formatSignedKg(value: number | null, unit: "kg" | "lb") {
  if (value === null) {
    return "No baseline";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${formatWeight(value, unit)}`;
}

function MiniTrend({ lift }: { lift: MainLiftProgress }) {
  const values = lift.trend
    .map((point) => point.value)
    .filter((value): value is number => value !== null);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 1;
  const range = Math.max(1, max - min);

  return (
    <div className="mt-4 flex h-20 items-end gap-1">
      {lift.trend.map((point) => {
        const height =
          point.value === null ? 4 : Math.max(12, ((point.value - min) / range) * 64 + 12);

        return (
          <div key={point.week} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-16 w-full items-end rounded-lg bg-[#0d1117] p-1">
              <div
                className={`w-full rounded-md ${
                  point.value === null
                    ? "bg-[color:var(--panel-border)]"
                    : "bg-[color:var(--accent)]"
                }`}
                style={{ height }}
              />
            </div>
            <p className="text-[9px] font-black text-[color:var(--muted)]">
              {point.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function MainLiftCard({
  lift,
  unit
}: {
  lift: MainLiftProgress;
  unit: "kg" | "lb";
}) {
  return (
    <article className="app-card-flat p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black">{lift.exercise_name}</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {lift.rep_range} reps
          </p>
        </div>
        <div className="rounded-xl bg-[color:var(--accent)] px-3 py-2 text-sm font-black text-zinc-950">
          {lift.current_weight_kg === null
            ? "-"
            : formatWeight(lift.current_weight_kg, unit)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] p-3">
          <p className="text-[11px] font-black uppercase text-[color:var(--muted)]">
            Last
          </p>
          <p className="mt-1 text-sm font-black">
            {lift.last_result
              ? `${formatWeight(lift.last_result.weight_kg, unit)} x ${
                  lift.last_result.reps
                }`
              : "No sets"}
          </p>
        </div>
        <div className="rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] p-3">
          <p className="text-[11px] font-black uppercase text-[color:var(--muted)]">
            Since W1
          </p>
          <p className="mt-1 text-sm font-black">
            {formatSignedKg(lift.change_kg, unit)}
          </p>
        </div>
      </div>

      <MiniTrend lift={lift} />
    </article>
  );
}

export default async function ProgressPage() {
  const { profile, supabase } = await requireUser();
  const unit = profile?.unit_preference ?? "kg";
  const summary = await getProgressSummary(supabase);
  const latestWeight = summary.bodyweight.at(-1);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-bold text-[color:var(--accent)]">
          Progress
        </p>
        <h1 className="text-3xl font-black tracking-normal">Your numbers</h1>
      </header>

      {summary.active_block ? (
        <section className="app-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="app-chip border-[color:var(--accent)]/40 text-[color:var(--accent)]">
                Week {summary.active_block.week_number} of{" "}
                {summary.active_block.block_length_weeks}
              </p>
              <h2 className="mt-4 text-2xl font-black">
                {summary.active_block.program_name}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Started {formatDate(summary.active_block.started_on)}
              </p>
            </div>
            <Dumbbell
              aria-hidden="true"
              className="size-8 shrink-0 text-[color:var(--accent)]"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[color:var(--panel-border)] bg-[#0d1117] p-3">
              <p className="text-[11px] font-black uppercase text-[color:var(--muted)]">
                Workouts this week
              </p>
              <p className="mt-1 text-3xl font-black">
                {summary.active_block.workouts_completed_this_week}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--panel-border)] bg-[#0d1117] p-3">
              <p className="text-[11px] font-black uppercase text-[color:var(--muted)]">
                Workouts in block
              </p>
              <p className="mt-1 text-3xl font-black">
                {summary.active_block.workouts_completed_block}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="app-card p-5">
          <h2 className="text-xl font-black">No active plan</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Choose a plan to track main lifts and planned progression.
          </p>
          <Link
            href="/programs"
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[color:var(--accent)] px-4 text-base font-black text-zinc-950"
          >
            Open plans
          </Link>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">Main lifts</h2>
          <Trophy aria-hidden="true" className="size-5 text-[color:var(--accent)]" />
        </div>
        {summary.main_lifts.length === 0 ? (
          <div className="app-card-flat p-4">
            <p className="text-sm text-[color:var(--muted)]">
              Mark lifts as main lifts in your plan to track them here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {summary.main_lifts.map((lift) => (
              <MainLiftCard
                key={lift.program_exercise_id}
                lift={lift}
                unit={unit}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="app-card-flat p-3">
          <p className="text-[11px] font-black uppercase text-[color:var(--muted)]">
            This week
          </p>
          <p className="mt-1 text-2xl font-black">
            {summary.periods.week.workouts}
          </p>
          <p className="text-[10px] font-bold text-[color:var(--muted)]">
            workouts
          </p>
        </div>
        <div className="app-card-flat p-3">
          <p className="text-[11px] font-black uppercase text-[color:var(--muted)]">
            This month
          </p>
          <p className="mt-1 text-2xl font-black">
            {summary.periods.month.workouts}
          </p>
          <p className="text-[10px] font-bold text-[color:var(--muted)]">
            workouts
          </p>
        </div>
        <div className="app-card-flat p-3">
          <p className="text-[11px] font-black uppercase text-[color:var(--muted)]">
            This year
          </p>
          <p className="mt-1 text-2xl font-black">
            {summary.periods.year.workouts}
          </p>
          <p className="text-[10px] font-bold text-[color:var(--muted)]">
            workouts
          </p>
        </div>
      </section>

      {latestWeight ? (
        <section className="app-card-flat p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black">Bodyweight</h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Latest {formatDate(latestWeight.logged_on)}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--panel-border)] px-3 py-2 text-sm font-black">
              <Scale aria-hidden="true" className="size-4 text-[color:var(--accent)]" />
              {formatWeight(latestWeight.weight_kg, unit)}
            </div>
          </div>
        </section>
      ) : null}

      {summary.recent_bests.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-black">Recent bests</h2>
          <div className="grid gap-2">
            {summary.recent_bests.map((best) => (
              <article
                key={`${best.exercise_id}-${best.achieved_at}-${best.weight_kg}-${best.reps}`}
                className="app-card-flat flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black">
                    {best.exercise_name}
                  </h3>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    {formatDate(best.achieved_at)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-black">
                  {formatWeight(best.weight_kg, unit)} x {best.reps}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

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
