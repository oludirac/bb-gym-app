import Link from "next/link";
import { notFound } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { copyProgram, enrollProgram } from "@/app/(app)/programs/actions";
import { getProgramDetail } from "@/lib/programs/queries";
import { requireUser } from "@/lib/auth/session";

type ProgramDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatValue(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

export default async function ProgramDetailPage({
  params
}: ProgramDetailPageProps) {
  const [{ id }, { supabase }] = await Promise.all([params, requireUser()]);
  const program = await getProgramDetail(supabase, id);

  if (!program) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="space-y-4">
        <Link
          href="/programs"
          className="inline-flex min-h-10 items-center text-sm font-semibold text-[color:var(--accent)]"
        >
          Back to plans
        </Link>
        <header className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-[color:var(--accent)]">
              {program.is_public ? "Starter plan" : "My plan"}
            </p>
            <span className="rounded-md border border-[color:var(--panel-border)] px-2 py-1 text-[11px] font-semibold capitalize">
              {formatValue(program.difficulty)}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">
            {program.name}
          </h1>
          {program.description ? (
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              {program.description}
            </p>
          ) : null}
        </header>
      </div>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
            Days
          </p>
          <p className="mt-1 text-lg font-semibold">
            {program.weeks.reduce((total, week) => total + week.days.length, 0)}
          </p>
        </div>
        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
            Weekly
          </p>
          <p className="mt-1 text-lg font-semibold">
            {program.days_per_week ?? "-"}
          </p>
        </div>
        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
            Minutes
          </p>
          <p className="mt-1 text-lg font-semibold">
            {program.avg_session_minutes ?? "-"}
          </p>
        </div>
      </section>

      {program.equipment_required.length > 0 ? (
        <section>
          <h2 className="text-base font-semibold">Equipment</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {program.equipment_required.map((item) => (
              <span
                key={item}
                className="rounded-md bg-zinc-950 px-2 py-1 text-xs font-semibold capitalize"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        {program.weeks.map((week) => (
          <div key={week.id} className="space-y-3">
            <h2 className="text-base font-semibold">Week {week.week_number}</h2>
            {week.days.map((day) => (
              <article
                key={day.id}
                className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{day.name}</h3>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Day {day.day_number}
                      {day.focus ? ` - ${day.focus}` : ""}
                    </p>
                  </div>
                  <span className="rounded-md border border-[color:var(--panel-border)] px-2 py-1 text-[11px] font-semibold">
                    {day.exercises.length} lifts
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {day.exercises.map((exercise) => (
                    <div key={exercise.id} className="rounded-md bg-zinc-950 p-3">
                      <h4 className="text-sm font-semibold">
                        {exercise.sort_order}. {exercise.exercise_name}
                      </h4>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {exercise.sets.length} set
                        {exercise.sets.length === 1 ? "" : "s"}
                        {exercise.notes ? ` - ${exercise.notes}` : ""}
                      </p>
                      <div className="mt-2 grid gap-1">
                        {exercise.sets.map((set) => (
                          <p
                            key={set.id}
                            className="text-xs text-[color:var(--muted)]"
                          >
                            Set {set.sort_order}: {set.target_reps_min ?? "-"}
                            {set.target_reps_max &&
                            set.target_reps_max !== set.target_reps_min
                              ? `-${set.target_reps_max}`
                              : ""}{" "}
                            reps, RPE {set.target_rpe ?? "-"}, rest{" "}
                            {set.rest_seconds ?? "-"}s
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ))}
      </section>

      <div className="fixed inset-x-0 bottom-[4.75rem] z-10 px-4">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2 rounded-md border border-[color:var(--panel-border)] bg-zinc-950/95 p-2 backdrop-blur">
          {program.is_public ? (
            <form action={copyProgram}>
              <input type="hidden" name="programId" value={program.id} />
              <FormSubmitButton pendingLabel="Saving...">
                Save plan
              </FormSubmitButton>
            </form>
          ) : (
            <form action={enrollProgram}>
              <input type="hidden" name="programId" value={program.id} />
              <FormSubmitButton pendingLabel="Starting...">
                Use plan
              </FormSubmitButton>
            </form>
          )}
          <Link
            href="/programs"
            className="flex min-h-12 items-center justify-center rounded-md border border-[color:var(--panel-border)] px-3 text-sm font-semibold"
          >
            Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
