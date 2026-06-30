import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  Dumbbell,
  Flame,
  History,
  Play,
  Trophy
} from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { startBlankWorkout } from "@/app/(app)/workouts/actions";
import { startWorkoutFromProgramDay } from "@/app/(app)/programs/actions";
import { getTodayPlanOverview } from "@/lib/programs/queries";
import { getActiveWorkout } from "@/lib/workouts/queries";
import { requireUser } from "@/lib/auth/session";
import { weekdayLabel } from "@/lib/scheduling/weekdays";

const quickActions = [
  { href: "/workouts/active", icon: Dumbbell, label: "Workout", meta: "Current" },
  { href: "/progress", icon: BarChart3, label: "Progress", meta: "Stats" },
  { href: "/programs", icon: Trophy, label: "Plans", meta: "Splits" },
  { href: "/workouts", icon: History, label: "History", meta: "Finished" }
];

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

export default async function DashboardPage() {
  const { supabase } = await requireUser();
  const [activeWorkout, todayPlan] = await Promise.all([
    getActiveWorkout(supabase),
    getTodayPlanOverview(supabase)
  ]);
  const dueDay = todayPlan?.program_day;
  const isCalendar = todayPlan?.schedule_type === "calendar";
  const heroTitle = activeWorkout
    ? activeWorkout.name ?? "Workout"
    : dueDay
      ? dueDay.name
      : todayPlan?.status === "rest"
        ? "Rest day"
        : "Start a workout";
  const heroMeta = activeWorkout
    ? `Started ${formatDate(activeWorkout.started_at)}`
    : todayPlan
      ? `${todayPlan.program_name} - ${
          isCalendar ? "Fixed weekdays" : "Next in order"
        }`
      : "No plan selected";
  const todayDate = formatTodayDate();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-bold text-[color:var(--accent)]">
          {todayDate}
        </p>
        <h1 className="text-4xl font-black tracking-normal">Today</h1>
      </header>

      <section className="app-card overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="app-chip border-[color:var(--accent)]/40 text-[color:var(--accent)]">
              {activeWorkout
                ? "In progress"
                : todayPlan?.status === "done"
                  ? "Done today"
                  : todayPlan?.status === "rest"
                    ? "No scheduled lift"
                    : todayPlan
                      ? todayPlan.schedule_type === "calendar"
                        ? "Fixed weekdays"
                        : "Next in order"
                      : "Quick start"}
            </p>
            <h2 className="mt-4 text-2xl font-black">{heroTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              {heroMeta}
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
          ) : dueDay && todayPlan?.status !== "done" ? (
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

      {todayPlan?.status === "done" && dueDay ? (
        <section className="app-card-flat p-4">
          <h2 className="text-base font-black">{dueDay.name} done</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Scheduled for {formatDayDate(todayPlan.scheduled_for)}.
          </p>
        </section>
      ) : null}

      {todayPlan?.missed ? (
        <section className="app-card-flat p-4">
          <div className="flex items-start gap-3">
            <CalendarDays
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-[color:var(--accent)]"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black">
                Missed {todayPlan.missed.day.name}
              </h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {formatDayDate(todayPlan.missed.scheduled_for)}. Train it now
                or leave it missed.
              </p>
              <form action={startWorkoutFromProgramDay} className="mt-3">
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
                  Start missed lift
                </FormSubmitButton>
              </form>
            </div>
          </div>
        </section>
      ) : null}

      {isCalendar && dueDay?.schedule_weekdays.length ? (
        <section className="app-card-flat p-4">
          <h2 className="text-base font-black">Fixed days</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {dueDay.name}:{" "}
            {dueDay.schedule_weekdays
              .map((weekday) => weekdayLabel(weekday, "short"))
              .join(", ")}
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-black">Shortcuts</h2>
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
