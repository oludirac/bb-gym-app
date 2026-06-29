import Link from "next/link";
import {
  BarChart3,
  Dumbbell,
  Flame,
  LibraryBig,
  Play,
  TimerReset,
  Trophy
} from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { startBlankWorkout } from "@/app/(app)/workouts/actions";
import { getBodyweightLogs } from "@/lib/tracking/queries";
import { getActiveProgramEnrollment } from "@/lib/programs/queries";
import { getProgressSummary } from "@/lib/progress/queries";
import { getActiveWorkout } from "@/lib/workouts/queries";
import { requireUser } from "@/lib/auth/session";
import { formatWeight } from "@/lib/unit-conversion";

const quickActions = [
  { href: "/workouts/active", icon: Dumbbell, label: "Workout", meta: "Log now" },
  { href: "/exercises", icon: LibraryBig, label: "Exercises", meta: "Find lifts" },
  { href: "/templates", icon: TimerReset, label: "Routines", meta: "Saved days" },
  { href: "/programs", icon: Trophy, label: "Plans", meta: "Run a plan" }
];

function firstName(value: string) {
  return value.split("@")[0]?.split(" ")[0] || value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const { profile, supabase, user } = await requireUser();
  const displayName = firstName(profile?.display_name || user.email || "there");
  const unit = profile?.unit_preference ?? "kg";
  const [activeWorkout, progress, bodyweightLogs, activePlan] =
    await Promise.all([
      getActiveWorkout(supabase),
      getProgressSummary(supabase),
      getBodyweightLogs(supabase),
      getActiveProgramEnrollment(supabase)
    ]);
  const latestWeight = bodyweightLogs[0];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-bold text-[color:var(--accent)]">Today</p>
        <h1 className="text-4xl font-black tracking-normal">
          Ready, {displayName}?
        </h1>
      </header>

      <section className="app-card overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="app-chip border-[color:var(--accent)]/40 text-[color:var(--accent)]">
              {activeWorkout ? "In progress" : "Next up"}
            </p>
            <h2 className="mt-4 text-2xl font-black">
              {activeWorkout?.name ?? "Start a workout"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              {activeWorkout
                ? `Started ${formatDate(activeWorkout.started_at)}`
                : "Blank session. Add lifts as you train."}
            </p>
          </div>
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-zinc-950">
            <Flame aria-hidden="true" className="size-7" strokeWidth={2.6} />
          </div>
        </div>

        <div className="mt-5">
          {activeWorkout ? (
            <Link
              href="/workouts/active"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--accent)] px-4 text-base font-extrabold text-zinc-950 shadow-[0_14px_34px_rgba(245,158,11,0.22)] transition active:scale-[0.99]"
            >
              <Play aria-hidden="true" className="size-5 fill-current" />
              Resume workout
            </Link>
          ) : (
            <form action={startBlankWorkout}>
              <FormSubmitButton pendingLabel="Starting...">
                <Play aria-hidden="true" className="size-5 fill-current" />
                Start workout
              </FormSubmitButton>
            </form>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="app-card-flat p-4">
          <p className="text-xs font-bold uppercase text-[color:var(--muted)]">
            This week
          </p>
          <p className="mt-2 text-3xl font-black">
            {progress.this_week_workouts}
          </p>
          <p className="text-sm text-[color:var(--muted)]">workouts</p>
        </div>
        <div className="app-card-flat p-4">
          <p className="text-xs font-bold uppercase text-[color:var(--muted)]">
            Volume
          </p>
          <p className="mt-2 text-3xl font-black">
            {Math.round(progress.total_volume_kg).toLocaleString()}
          </p>
          <p className="text-sm text-[color:var(--muted)]">kg total</p>
        </div>
        <div className="app-card-flat p-4">
          <p className="text-xs font-bold uppercase text-[color:var(--muted)]">
            Weight
          </p>
          <p className="mt-2 text-2xl font-black">
            {latestWeight ? formatWeight(latestWeight.weight_kg, unit) : "-"}
          </p>
          <p className="text-sm text-[color:var(--muted)]">latest</p>
        </div>
        <div className="app-card-flat p-4">
          <p className="text-xs font-bold uppercase text-[color:var(--muted)]">
            Plan
          </p>
          <p className="mt-2 truncate text-2xl font-black">
            {activePlan ? `${activePlan.current_week}.${activePlan.current_day}` : "-"}
          </p>
          <p className="truncate text-sm text-[color:var(--muted)]">
            {activePlan?.program_name ?? "none"}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">Quick start</h2>
          <Link
            href="/progress"
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[color:var(--panel-border)] px-3 text-xs font-extrabold text-[color:var(--muted)]"
          >
            <BarChart3 aria-hidden="true" className="size-4" />
            Stats
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="app-card-flat min-h-28 p-4 transition active:scale-[0.99] active:border-[color:var(--accent)]"
              >
                <Icon
                  aria-hidden="true"
                  className="size-6 text-[color:var(--accent)]"
                  strokeWidth={2.5}
                />
                <h3 className="mt-4 text-base font-black">{action.label}</h3>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {action.meta}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
