import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Play, Trash2 } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  copyProgram,
  enrollProgram,
  removeProgram
} from "@/app/(app)/programs/actions";
import { getProgramDetail } from "@/lib/programs/queries";
import { formatWeekdays } from "@/lib/scheduling/weekdays";
import { requireUser } from "@/lib/auth/session";

type ProgramDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatValue(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

type SetTarget = {
  sort_order: number;
  target_distance_km: number | null;
  target_duration_seconds: number | null;
  target_intensity: string | null;
  target_reps_max: number | null;
  target_reps_min: number | null;
  target_weight_kg: number | null;
};

function formatKg(value: number | null) {
  if (value === null) {
    return "no kg";
  }

  return `${Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2
  })}kg`;
}

function formatProgressionStyle(value: string) {
  return value.replaceAll("_", " ");
}

function formatReps(min: number | null, max: number | null) {
  if (min !== null && max !== null) {
    return min === max ? `${min}` : `${min}-${max}`;
  }

  return `${min ?? max ?? "-"}`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return null;
  }

  const minutes = seconds / 60;
  return `${Number(minutes).toLocaleString(undefined, {
    maximumFractionDigits: 1
  })} min`;
}

function formatDistance(value: number | null) {
  if (value === null) {
    return null;
  }

  return `${Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2
  })} km`;
}

function formatCardio(set: SetTarget) {
  const parts = [
    formatDuration(set.target_duration_seconds),
    formatDistance(set.target_distance_km),
    set.target_intensity
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "cardio target";
}

function samePrescription(a: SetTarget, b: SetTarget) {
  return (
    a.target_weight_kg === b.target_weight_kg &&
    a.target_reps_min === b.target_reps_min &&
    a.target_reps_max === b.target_reps_max &&
    a.target_duration_seconds === b.target_duration_seconds &&
    a.target_distance_km === b.target_distance_km &&
    a.target_intensity === b.target_intensity
  );
}

function groupedSetSummaries(sets: SetTarget[], exerciseCategory: string) {
  const summaries: string[] = [];
  let index = 0;

  while (index < sets.length) {
    const first = sets[index];
    let lastIndex = index;

    while (
      lastIndex + 1 < sets.length &&
      samePrescription(first, sets[lastIndex + 1])
    ) {
      lastIndex += 1;
    }

    const last = sets[lastIndex];
    const range =
      first.sort_order === last.sort_order
        ? `${first.sort_order}`
        : `${first.sort_order}-${last.sort_order}`;

    summaries.push(
      exerciseCategory === "cardio"
        ? `${range}: ${formatCardio(first)}`
        : `${range}: ${formatKg(first.target_weight_kg)} x ${formatReps(
            first.target_reps_min,
            first.target_reps_max
          )}`
    );
    index = lastIndex + 1;
  }

  return summaries;
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
              {program.is_public ? "Starter plan" : "My split"}
            </p>
            <span className="rounded-md border border-[color:var(--panel-border)] px-2 py-1 text-[11px] font-semibold capitalize">
              {formatValue(program.difficulty)}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">
            {program.name}
          </h1>
          <p className="text-sm font-bold text-[color:var(--accent)]">
            {program.schedule_type === "calendar"
              ? "Scheduled days"
              : "Rotating split"}
          </p>
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
                    {program.schedule_type === "calendar" ? (
                      <p className="mt-1 text-xs font-bold uppercase text-[color:var(--accent)]">
                        {formatWeekdays(day.schedule_weekdays)}
                      </p>
                    ) : null}
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
                      <p className="mt-1 text-xs font-semibold capitalize text-[color:var(--accent)]">
                        {formatProgressionStyle(exercise.progression_style)}
                        {exercise.track_as_main_lift ? " | main lift" : ""}
                      </p>
                      <div className="mt-2 grid gap-1">
                        {groupedSetSummaries(
                          exercise.sets,
                          exercise.exercise_category
                        ).map((summary, index) => (
                          <p
                            key={`${summary}-${index}`}
                            className="text-xs text-[color:var(--muted)]"
                          >
                            {summary}
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
                Save split
              </FormSubmitButton>
            </form>
          ) : (
            <form action={enrollProgram}>
              <input type="hidden" name="programId" value={program.id} />
              <FormSubmitButton pendingLabel="Starting...">
                <Play aria-hidden="true" className="size-4 fill-current" />
                Use this split
              </FormSubmitButton>
            </form>
          )}
          {program.is_public ? (
            <Link
              href="/programs"
              className="flex min-h-12 items-center justify-center rounded-md border border-[color:var(--panel-border)] px-3 text-sm font-semibold"
            >
              Plans
            </Link>
          ) : (
            <Link
              href={`/programs/${program.id}/edit`}
              className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-3 text-sm font-semibold"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Edit
            </Link>
          )}
          <form action={removeProgram} className="col-span-2">
            <input type="hidden" name="programId" value={program.id} />
            <FormSubmitButton
              pendingLabel={program.is_public ? "Hiding..." : "Deleting..."}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[color:var(--danger)]/50 px-3 text-sm font-semibold text-red-200 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {program.is_public ? "Hide starter" : "Delete split"}
            </FormSubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
