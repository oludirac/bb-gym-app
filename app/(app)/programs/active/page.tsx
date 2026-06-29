import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  completeProgramEnrollment,
  setActiveProgramDay,
  startWorkoutFromProgramDay
} from "@/app/(app)/programs/actions";
import {
  getActiveProgramEnrollment,
  getProgramDetail,
  type ProgramDay
} from "@/lib/programs/queries";
import { requireUser } from "@/lib/auth/session";

function DayCard({
  day,
  enrollmentId,
  isCurrent,
  weekNumber
}: {
  day: ProgramDay;
  enrollmentId: string;
  isCurrent: boolean;
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
        </div>
        {isCurrent ? (
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
            Start workout
          </FormSubmitButton>
        </form>
        {!isCurrent ? (
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
            Current plan
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            No current plan
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Save a starter plan or use one of yours.
          </p>
        </header>
        <Link
          href="/programs"
          className="flex min-h-12 items-center justify-center rounded-md bg-[color:var(--accent)] px-4 text-base font-semibold text-zinc-950"
        >
          Choose a plan
        </Link>
      </div>
    );
  }

  const program = await getProgramDetail(supabase, enrollment.program_id);

  if (!program) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-normal">
          Plan unavailable
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
          Current plan
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          {program.name}
        </h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Week {enrollment.current_week}, day {enrollment.current_day}.{" "}
          {enrollment.completed_workouts}/{enrollment.total_days} workouts done.
        </p>
      </header>

      <section className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Done</h2>
          <p className="text-sm font-semibold">
            {enrollment.percent_complete}%
          </p>
        </div>
        <div className="mt-3 h-3 rounded-full bg-zinc-950">
          <div
            className="h-3 rounded-full bg-[color:var(--accent)]"
            style={{ width: `${enrollment.percent_complete}%` }}
          />
        </div>
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
          Mark plan done
        </FormSubmitButton>
      </form>
    </div>
  );
}
