import Link from "next/link";
import { BarChart3, Dumbbell, Scale, Trophy } from "lucide-react";
import { restartActiveProgramBlock } from "@/app/(app)/programs/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  getProgressSummary,
  type MainLiftProgress
} from "@/lib/progress/queries";
import { requireUser } from "@/lib/auth/session";
import { formatWeight, kgToDisplayUnit } from "@/lib/unit-conversion";

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

function WeightTrend({
  lift,
  unit
}: {
  lift: MainLiftProgress;
  unit: "kg" | "lb";
}) {
  const values = lift.weekly_weights
    .map((point) =>
      point.value === null ? null : kgToDisplayUnit(point.value, unit)
    )
    .filter((value): value is number => value !== null);

  if (values.length < 2) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(1, (max - min) * 0.15);
  const chartMin = min - padding;
  const chartMax = max + padding;
  const chartRange = chartMax - chartMin;
  const totalWeeks = Math.max(2, lift.weekly_weights.length);
  const segments: { x: number; y: number }[][] = [];
  let segment: { x: number; y: number }[] = [];

  lift.weekly_weights.forEach((point, index) => {
    if (point.value === null) {
      if (segment.length > 0) {
        segments.push(segment);
        segment = [];
      }
      return;
    }

    const displayValue = kgToDisplayUnit(point.value, unit);
    segment.push({
      x: 12 + (index / (totalWeeks - 1)) * 276,
      y: 10 + ((chartMax - displayValue) / chartRange) * 72
    });
  });

  if (segment.length > 0) {
    segments.push(segment);
  }

  return (
    <div className="mt-4 border-t border-[color:var(--panel-border)] pt-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-black text-[color:var(--muted)]">
        <span>Working weight</span>
        <span>{unit}</span>
      </div>
      <svg
        viewBox="0 0 300 104"
        role="img"
        aria-label={`${lift.exercise_name} working weight over ${lift.weekly_weights.length} weeks`}
        className="h-28 w-full overflow-visible"
      >
        <line
          x1="12"
          x2="288"
          y1="82"
          y2="82"
          stroke="var(--panel-border)"
          strokeWidth="1"
        />
        {segments.map((points, segmentIndex) => (
          <g key={segmentIndex}>
            {points.length > 1 ? (
              <polyline
                points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="none"
                stroke="var(--accent)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
            ) : null}
            {points.map((point) => (
              <circle
                key={`${point.x}:${point.y}`}
                cx={point.x}
                cy={point.y}
                r="3.5"
                fill="var(--background)"
                stroke="var(--accent)"
                strokeWidth="2.5"
              />
            ))}
          </g>
        ))}
        <text x="12" y="100" fill="var(--muted)" fontSize="9">
          W1
        </text>
        <text
          x="288"
          y="100"
          fill="var(--muted)"
          fontSize="9"
          textAnchor="end"
        >
          W{lift.weekly_weights.length}
        </text>
      </svg>
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
        <div className="shrink-0 rounded-md bg-[color:var(--accent)] px-3 py-2 text-right text-zinc-950">
          <p className="text-[10px] font-black uppercase">Next</p>
          <p className="text-sm font-black">
            {lift.current_weight_kg === null
              ? "-"
              : formatWeight(lift.current_weight_kg, unit)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel-raised)] p-3">
          <p className="text-[11px] font-black uppercase text-[color:var(--muted)]">
            Start
          </p>
          <p className="mt-1 text-sm font-black">
            {formatWeight(lift.start_weight_kg, unit)}
          </p>
        </div>
        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel-raised)] p-3">
          <p className="text-[11px] font-black uppercase text-[color:var(--muted)]">
            Latest
          </p>
          <p className="mt-1 text-sm font-black">
            {lift.last_result
              ? `${formatWeight(lift.last_result.weight_kg, unit)} x ${
                  lift.last_result.reps
                }`
              : "No sets"}
          </p>
        </div>
        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel-raised)] p-3">
          <p className="text-[11px] font-black uppercase text-[color:var(--muted)]">
            Change
          </p>
          <p className="mt-1 text-sm font-black">
            {formatSignedKg(lift.change_kg, unit)}
          </p>
        </div>
      </div>

      <WeightTrend lift={lift} unit={unit} />
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
              <p className="mt-1 text-xs font-bold text-[color:var(--muted)]">
                Week is based on when this block started.
              </p>
            </div>
            <Dumbbell
              aria-hidden="true"
              className="size-8 shrink-0 text-[color:var(--accent)]"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-raised)] p-3">
              <p className="text-[11px] font-black uppercase text-[color:var(--muted)]">
                Workouts this week
              </p>
              <p className="mt-1 text-3xl font-black">
                {summary.active_block.workouts_completed_this_week}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-raised)] p-3">
              <p className="text-[11px] font-black uppercase text-[color:var(--muted)]">
                Workouts on split
              </p>
              <p className="mt-1 text-3xl font-black">
                {summary.active_block.workouts_completed_block}
              </p>
            </div>
          </div>
          <form action={restartActiveProgramBlock} className="mt-4">
            <FormSubmitButton
              pendingLabel="Restarting..."
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-black text-[color:var(--foreground)] transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
            >
              Restart 12-week block from today
            </FormSubmitButton>
          </form>
        </section>
      ) : (
        <section className="app-card p-5">
          <h2 className="text-xl font-black">No active plan</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Choose a plan to track main lifts and planned progression.
          </p>
          <Link
            href="/programs"
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[color:var(--accent)] px-4 text-base font-black text-zinc-950"
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
              Finish weighted sets and your main lifts will show here.
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
              <h2 className="text-base font-black">Latest bodyweight</h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Latest {formatDate(latestWeight.logged_on)}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border border-[color:var(--panel-border)] px-3 py-2 text-sm font-black">
              <Scale aria-hidden="true" className="size-4 text-[color:var(--accent)]" />
              {formatWeight(latestWeight.weight_kg, unit)}
            </div>
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
