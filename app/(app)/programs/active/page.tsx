import Link from "next/link";
import { CalendarDays, Play } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  completeProgramEnrollment,
  setActiveProgramDay,
  startWorkoutFromProgramDay
} from "@/app/(app)/programs/actions";
import {
  getActiveProgramEnrollment,
  getProgramDetail,
  type ProgramScheduleType,
  type ProgramDay
} from "@/lib/programs/queries";
import { formatWeekdays } from "@/lib/scheduling/weekdays";
import { requireUser } from "@/lib/auth/session";

function DayCard({
  day,
  enrollmentId,
  isCurrent,
  scheduleType,
  weekNumber
}: {
  day: ProgramDay;
  enrollmentId: string;
  isCurrent: boolean;
  scheduleType: ProgramScheduleType;
  weekNumber: number;
}) {
  return (
    <article
      className={`rounded-md border bg-[color:var(--panel)] p-4 ${
        isCurrent
          ? "border-[color:var(--accent)]"
          : "border-[color:var(--panel-border)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
            Week {weekNumber}, day {day.day_number}
          </p>
          <h2 className="mt-1 text-lg font-semibold">{day.name}</h2>
          {day.focus ? (
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {day.focus}
            </p>
          ) : null}
          {scheduleType === "calendar" ? (
            <p className="mt-2 inline-flex min-h-7 items-center gap-1 rounded-lg border border-[color:var(--panel-border)] px-2 text-xs font-black text-[color:var(--accent)]">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              {formatWeekdays(day.schedule_weekdays)}
            </p>
          ) : null}
        </div>
        {scheduleType === "sequence" && isCurrent ? (
          <span className="rounded-md bg-[color:var(--accent)] px-2 py-1 text-[11px] font-semibold text-zinc-950">
            Current
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2">
        <form action={startWorkoutFromProgramDay}>
          <input type="hidden" name="enrollmentId" value={enrollmentId} />
          <input type="hidden" name="programDayId" value={day.id} />
          <FormSubmitButton pendingLabel="Starting...">
            <Play aria-hidden="true" className="size-4 fill-current" />
            Start workout
          </FormSubmitButton>
        </form>
        {scheduleType === "sequence" && !isCurrent ? (
          <form action={setActiveProgramDay}>
            <input type="hidden" name="enrollmentId" value={enrollmentId} />
            <input type="hidden" name="weekNumber" value={weekNumber} />
            <input type="hidden" name="dayNumber" value={day.day_number} />
            <FormSubmitButton
              pendingLabel="Setting..."
              className="min-h-11 w-full rounded-md border border-[color:var(--panel-border)] px-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
            >
              Make current
            </FormSubmitButton>
          </form>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2">
        {day.exercises.map((exercise) => (
          <p key={exercise.id} className="text-sm text-[color:var(--muted)]">
            {exercise.sort_order}. {exercise.exercise_name} -{" "}
            {exercise.sets.length} set{exercise.sets.length === 1 ? "" : "s"}
          </p>
        ))}
      </div>
    </article>
  );
}

export default async function ActiveProgramPage() {
  const { supabase } = await requireUser();
  const enrollment = await getActiveProgramEnrollment(supabase);

  if (!enrollment) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-[color:var(--accent)]">
            Current split
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            No split yet
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Pick a starter plan or build one of yours.
          </p>
        </header>
        <Link
          href="/programs"
          className="flex min-h-12 items-center justify-center rounded-md bg-[color:var(--accent)] px-4 text-base font-semibold text-zinc-950"
        >
          Pick a starter plan
        </Link>
      </div>
    );
  }

  const program = await getProgramDetail(supabase, enrollment.program_id);

  if (!program) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-normal">
          Split unavailable
        </h1>
        <Link
          href="/programs"
          className="flex min-h-12 items-center justify-center rounded-md bg-[color:var(--accent)] px-4 text-base font-semibold text-zinc-950"
        >
          Back to plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--accent)]">
          Current split
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          {program.name}
        </h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          {program.schedule_type === "calendar"
            ? "Scheduled days. Today decides what is due."
            : `Week ${enrollment.current_week}, day ${enrollment.current_day}. Advances when you finish.`}
        </p>
      </header>

      <section className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            {program.schedule_type === "calendar" ? "Logged" : "Done"}
          </h2>
          <p className="text-sm font-semibold">
            {enrollment.completed_workouts}
            {program.schedule_type === "sequence"
              ? `/${enrollment.total_days}`
              : " workouts"}
          </p>
        </div>
        {program.schedule_type === "sequence" ? (
          <div className="mt-3 h-3 rounded-full bg-zinc-950">
            <div
              className="h-3 rounded-full bg-[color:var(--accent)]"
              style={{ width: `${enrollment.percent_complete}%` }}
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        {program.weeks.map((week) => (
          <div key={week.id} className="space-y-3">
            <h2 className="text-base font-semibold">Week {week.week_number}</h2>
            {week.days.map((day) => (
              <DayCard
                key={day.id}
                day={day}
                enrollmentId={enrollment.id}
                isCurrent={
                  week.week_number === enrollment.current_week &&
                  day.day_number === enrollment.current_day
                }
                scheduleType={program.schedule_type}
                weekNumber={week.week_number}
              />
            ))}
          </div>
        ))}
      </section>

      <form action={completeProgramEnrollment}>
        <input type="hidden" name="enrollmentId" value={enrollment.id} />
        <FormSubmitButton
          pendingLabel="Completing..."
          className="min-h-12 w-full rounded-md border border-[color:var(--panel-border)] px-4 text-base font-semibold disabled:cursor-wait disabled:opacity-70"
        >
          Mark split done
        </FormSubmitButton>
      </form>
    </div>
  );
}
