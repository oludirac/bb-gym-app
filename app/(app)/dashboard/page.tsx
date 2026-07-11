import Link from "next/link";
import {
  CalendarDays,
  Dumbbell,
  FileUp,
  History,
  Play,
  Plus,
  Trophy
} from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { startBlankWorkout } from "@/app/(app)/workouts/actions";
import {
  dismissMissedProgramDay,
  startWorkoutFromProgramDay
} from "@/app/(app)/programs/actions";
import { getTodayPlanOverview, type ProgramDay } from "@/lib/programs/queries";
import { groupedSetSummaries } from "@/lib/programs/set-summary";
import { getActiveWorkoutSummary } from "@/lib/workouts/queries";
import { requireUser } from "@/lib/auth/session";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function formatDayDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${value}T00:00:00`));
}

function formatTodayDate() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    weekday: "long"
  }).format(new Date());
}

function daySummary(day: ProgramDay | null) {
  if (!day) {
    return {
      exercises: [] as {
        id: string;
        name: string;
        prescription: string;
      }[],
      setCount: 0
    };
  }

  return {
    exercises: day.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.exercise_name,
      prescription: groupedSetSummaries(
        exercise.sets,
        exercise.exercise_category
      ).join(", ")
    })),
    setCount: day.exercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0
    )
  };
}

function scheduleLabel(value: string) {
  return value === "calendar" ? "Scheduled days" : "Rotating split";
}

export default async function DashboardPage() {
  const { supabase } = await requireUser();
  const [activeWorkout, todayPlan] = await Promise.all([
    getActiveWorkoutSummary(supabase),
    getTodayPlanOverview(supabase)
  ]);
  const dueDay = todayPlan?.program_day ?? null;
  const dueSummary = daySummary(dueDay);
  const missedSummary = daySummary(todayPlan?.missed?.day ?? null);
  const todayDate = formatTodayDate();

  return (
    <div className="space-y-6">
      <header className="border-b border-[color:var(--panel-border)] pb-4">
        <p className="text-sm font-bold text-[color:var(--accent)]">
          {todayDate}
        </p>
        <h1 className="mt-1 text-4xl font-black tracking-normal">Today</h1>
      </header>

      {activeWorkout ? (
        <section className="space-y-5">
          <div>
            <p className="text-sm font-bold text-[color:var(--success)]">
              In progress
            </p>
            <h2 className="mt-2 text-3xl font-black">
              {activeWorkout.name ?? "Workout"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Started {formatDate(activeWorkout.started_at)}.{" "}
              {activeWorkout.sets_completed}/{activeWorkout.sets_total} sets
              done.
            </p>
          </div>
          <Link
            href="/workouts/active"
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-md bg-[color:var(--accent)] px-4 text-base font-black text-zinc-950 transition active:scale-[0.99]"
          >
            <Play aria-hidden="true" className="size-5 fill-current" />
            Resume workout
          </Link>
        </section>
      ) : todayPlan?.status === "done" && dueDay ? (
        <section className="space-y-5">
          <div>
            <p className="text-sm font-bold text-[color:var(--success)]">
              Done today
            </p>
            <h2 className="mt-2 text-3xl font-black">{dueDay.name}</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Scheduled for {formatDayDate(todayPlan.scheduled_for)}.
            </p>
          </div>
          <div className="grid gap-2">
            <Link
              href="/workouts"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-black"
            >
              <History aria-hidden="true" className="size-4" />
              View history
            </Link>
            <form action={startBlankWorkout}>
              <FormSubmitButton
                pendingLabel="Starting..."
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-black transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
              >
                <Plus aria-hidden="true" className="size-4" />
                Start extra workout
              </FormSubmitButton>
            </form>
          </div>
        </section>
      ) : dueDay && todayPlan ? (
        <section className="space-y-5">
          <div>
            <p className="text-sm font-bold text-[color:var(--accent)]">
              {scheduleLabel(todayPlan.schedule_type)}
            </p>
            <h2 className="mt-2 text-3xl font-black">
              {dueDay.name} is up
            </h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              {dueSummary.exercises.length} lifts, {dueSummary.setCount} sets.
            </p>
          </div>

          {dueSummary.exercises.length > 0 ? (
            <div className="divide-y divide-[color:var(--panel-border)] border-y border-[color:var(--panel-border)]">
              {dueSummary.exercises.map((exercise) => (
                <div key={exercise.id} className="py-3">
                  <p className="text-sm font-black">{exercise.name}</p>
                  {exercise.prescription ? (
                    <p className="mt-1 text-xs font-bold text-[color:var(--muted)]">
                      {exercise.prescription}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <form action={startWorkoutFromProgramDay}>
            <input
              type="hidden"
              name="enrollmentId"
              value={todayPlan.enrollment_id}
            />
            <input type="hidden" name="programDayId" value={dueDay.id} />
            <input
              type="hidden"
              name="scheduledFor"
              value={todayPlan.scheduled_for}
            />
            <FormSubmitButton pendingLabel="Starting...">
              <Play aria-hidden="true" className="size-5 fill-current" />
              Start {dueDay.name}
            </FormSubmitButton>
          </form>
        </section>
      ) : todayPlan ? (
        <section className="space-y-5">
          <div>
            <p className="text-sm font-bold text-[color:var(--muted)]">
              Rest day
            </p>
            <h2 className="mt-2 text-3xl font-black">No lift due</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              {todayPlan.program_name} is still your active split.
            </p>
          </div>
          <Link
            href="/programs/active"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-black"
          >
            <Trophy aria-hidden="true" className="size-4" />
            View split
          </Link>
        </section>
      ) : (
        <section className="space-y-5">
          <div>
            <p className="text-sm font-bold text-[color:var(--accent)]">
              Start fresh
            </p>
            <h2 className="mt-2 text-3xl font-black">No split yet</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Pick a starter plan, build your own, or log a blank session.
            </p>
          </div>
          <div className="grid gap-2">
            <Link
              href="/programs"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[color:var(--accent)] px-4 text-sm font-black text-zinc-950"
            >
              <Trophy aria-hidden="true" className="size-4" />
              Pick starter plan
            </Link>
            <Link
              href="/programs/new"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-black"
            >
              <Plus aria-hidden="true" className="size-4" />
              Build my split
            </Link>
            <form action={startBlankWorkout}>
              <FormSubmitButton
                pendingLabel="Starting..."
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-black transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
              >
                <Dumbbell aria-hidden="true" className="size-4" />
                Start blank workout
              </FormSubmitButton>
            </form>
          </div>
        </section>
      )}

      {todayPlan?.missed ? (
        <section className="border-t border-[color:var(--panel-border)] pt-5">
          <div className="flex items-start gap-3">
            <CalendarDays
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-[color:var(--muted)]"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black">
                Missed {todayPlan.missed.day.name}
              </h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {formatDayDate(todayPlan.missed.scheduled_for)}.{" "}
                {missedSummary.setCount} planned sets.
              </p>
              {missedSummary.exercises.length > 0 ? (
                <div className="mt-3 divide-y divide-[color:var(--panel-border)] border-y border-[color:var(--panel-border)]">
                  {missedSummary.exercises.map((exercise) => (
                    <div key={exercise.id} className="py-2">
                      <p className="text-sm font-black">{exercise.name}</p>
                      {exercise.prescription ? (
                        <p className="mt-1 text-xs font-bold text-[color:var(--muted)]">
                          {exercise.prescription}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <form action={startWorkoutFromProgramDay}>
                  <input
                    type="hidden"
                    name="enrollmentId"
                    value={todayPlan.enrollment_id}
                  />
                  <input
                    type="hidden"
                    name="programDayId"
                    value={todayPlan.missed.day.id}
                  />
                  <input
                    type="hidden"
                    name="scheduledFor"
                    value={todayPlan.missed.scheduled_for}
                  />
                  <FormSubmitButton pendingLabel="Starting...">
                    Train missed day
                  </FormSubmitButton>
                </form>
                <form action={dismissMissedProgramDay}>
                  <input
                    type="hidden"
                    name="enrollmentId"
                    value={todayPlan.enrollment_id}
                  />
                  <input
                    type="hidden"
                    name="programDayId"
                    value={todayPlan.missed.day.id}
                  />
                  <input
                    type="hidden"
                    name="scheduledFor"
                    value={todayPlan.missed.scheduled_for}
                  />
                  <FormSubmitButton
                    pendingLabel="Skipping..."
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-4 text-base font-black text-[color:var(--foreground)] transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
                  >
                    Skip this missed day
                  </FormSubmitButton>
                </form>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-2 border-t border-[color:var(--panel-border)] pt-5">
        <Link
          href="/import/programs"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-3 text-sm font-black text-[color:var(--muted)]"
        >
          <FileUp aria-hidden="true" className="size-4" />
          Import CSV
        </Link>
        <Link
          href="/progress"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-3 text-sm font-black text-[color:var(--muted)]"
        >
          <History aria-hidden="true" className="size-4" />
          Your numbers
        </Link>
      </section>
    </div>
  );
}
