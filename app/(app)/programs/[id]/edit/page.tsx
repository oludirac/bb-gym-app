import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { LazyProgramExercisePicker } from "@/components/lazy-program-exercise-picker";
import { ProgramReorderButton } from "@/components/program-reorder-button";
import {
  addProgramDay,
  addProgramExercise,
  addProgramSet,
  deleteProgramDay,
  deleteProgramExercise,
  deleteProgramSet,
  removeProgram,
  updateProgramBasics,
  updateProgramDay,
  updateProgramExerciseSettings,
  updateProgramSet
} from "@/app/(app)/programs/actions";
import { getExerciseOptions } from "@/lib/workouts/queries";
import {
  getProgramDetail,
  type ProgramDay,
  type ProgramExercise,
  type ProgramSet
} from "@/lib/programs/queries";
import { formatWeekdays, weekdayOptions } from "@/lib/scheduling/weekdays";
import { requireUser } from "@/lib/auth/session";

type EditProgramPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function SetEditor({
  exerciseCategory,
  programId,
  set
}: {
  exerciseCategory: string;
  programId: string;
  set: ProgramSet;
}) {
  const isCardio = exerciseCategory === "cardio";

  return (
    <div className="rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] p-3">
      <form action={updateProgramSet} className="space-y-3">
        <input type="hidden" name="programId" value={programId} />
        <input type="hidden" name="setId" value={set.id} />

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-black">Set {set.sort_order}</p>
          <input type="hidden" name="setType" value="working" />
          <FormSubmitButton
            pendingLabel="Saving..."
            className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-[color:var(--accent)] px-3 text-sm font-black text-zinc-950 disabled:cursor-wait disabled:opacity-70"
          >
            <Save aria-hidden="true" className="size-4" />
            Save
          </FormSubmitButton>
        </div>

        {isCardio ? (
          <div className="grid grid-cols-3 gap-2">
            <label className="grid gap-1">
              <span className="text-[11px] font-black text-[color:var(--muted)]">
                minutes
              </span>
              <input
                name="targetDurationMinutes"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                defaultValue={
                  set.target_duration_seconds === null
                    ? ""
                    : set.target_duration_seconds / 60
                }
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-black text-[color:var(--muted)]">
                km
              </span>
              <input
                name="targetDistanceKm"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                defaultValue={set.target_distance_km ?? ""}
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-black text-[color:var(--muted)]">
                level
              </span>
              <input
                name="targetIntensity"
                defaultValue={set.target_intensity ?? ""}
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <label className="grid gap-1">
              <span className="text-[11px] font-black text-[color:var(--muted)]">
                reps from
              </span>
              <input
                name="targetRepsMin"
                type="number"
                inputMode="numeric"
                min="0"
                defaultValue={set.target_reps_min ?? ""}
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-black text-[color:var(--muted)]">
                reps to
              </span>
              <input
                name="targetRepsMax"
                type="number"
                inputMode="numeric"
                min="0"
                defaultValue={set.target_reps_max ?? ""}
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-black text-[color:var(--muted)]">
                kg
              </span>
              <input
                name="targetWeightKg"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.25"
                defaultValue={set.target_weight_kg ?? ""}
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              />
            </label>
          </div>
        )}
      </form>

      <form action={deleteProgramSet} className="mt-2">
        <input type="hidden" name="programId" value={programId} />
        <input type="hidden" name="setId" value={set.id} />
        <FormSubmitButton
          pendingLabel="Deleting..."
          className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-[color:var(--danger)]/40 px-3 text-xs font-black text-red-200 disabled:cursor-wait disabled:opacity-70"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
          Delete
        </FormSubmitButton>
      </form>
    </div>
  );
}

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

function formatCardio(set: ProgramSet) {
  const parts = [
    formatDuration(set.target_duration_seconds),
    formatDistance(set.target_distance_km),
    set.target_intensity
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "cardio target";
}

function samePrescription(a: ProgramSet, b: ProgramSet) {
  return (
    a.target_weight_kg === b.target_weight_kg &&
    a.target_reps_min === b.target_reps_min &&
    a.target_reps_max === b.target_reps_max &&
    a.target_duration_seconds === b.target_duration_seconds &&
    a.target_distance_km === b.target_distance_km &&
    a.target_intensity === b.target_intensity
  );
}

function groupedSetSummaries(sets: ProgramSet[], exerciseCategory: string) {
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

function ExerciseCard({
  exercise,
  isFirst,
  isLast,
  programId
}: {
  exercise: ProgramExercise;
  isFirst: boolean;
  isLast: boolean;
  programId: string;
}) {
  const setSummaries = groupedSetSummaries(
    exercise.sets,
    exercise.exercise_category
  );

  return (
    <article className="app-card-flat overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-[color:var(--panel-border)] p-3">
        <div className="min-w-0">
          <h4 className="truncate text-base font-black">
            {exercise.sort_order}. {exercise.exercise_name}
          </h4>
          <p className="mt-1 text-xs font-black capitalize text-[color:var(--accent)]">
            {formatProgressionStyle(exercise.progression_style)} · +
            {formatKg(exercise.weight_increment_kg)}
            {exercise.track_as_main_lift ? " · main lift" : ""}
          </p>
          <div className="mt-2 grid gap-1 text-sm text-[color:var(--muted)]">
            {setSummaries.length === 0 ? (
              <p>No sets</p>
            ) : (
              setSummaries.map((summary, index) => (
                <p key={`${summary}-${index}`}>{summary}</p>
              ))
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ProgramReorderButton
            direction="up"
            disabled={isFirst}
            programExerciseId={exercise.id}
            programId={programId}
            target="exercise"
          />
          <ProgramReorderButton
            direction="down"
            disabled={isLast}
            programExerciseId={exercise.id}
            programId={programId}
            target="exercise"
          />
          <form action={deleteProgramExercise}>
            <input type="hidden" name="programId" value={programId} />
            <input type="hidden" name="programExerciseId" value={exercise.id} />
            <FormSubmitButton
              pendingLabel="Removing..."
              className="inline-flex size-10 items-center justify-center rounded-lg border border-[color:var(--danger)]/40 text-red-200 disabled:cursor-wait disabled:opacity-70"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </FormSubmitButton>
          </form>
        </div>
      </div>

      <details className="border-t border-[color:var(--panel-border)]">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-3 text-sm font-black text-[color:var(--accent)]">
          Advanced edit
          <span className="text-xs text-[color:var(--muted)]">sets</span>
        </summary>
        <div className="space-y-3 p-3 pt-0">
          <form action={updateProgramExerciseSettings} className="grid gap-2 rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] p-3">
            <input type="hidden" name="programId" value={programId} />
            <input
              type="hidden"
              name="programExerciseId"
              value={exercise.id}
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1">
                <span className="text-[11px] font-black text-[color:var(--muted)]">
                  style
                </span>
                <select
                  name="progressionStyle"
                  defaultValue={exercise.progression_style}
                  className="field-base min-h-11 px-2 text-sm font-black"
                >
                  <option value="double_progression">Double progression</option>
                  <option value="top_set_backoff">Top set + back-off</option>
                  <option value="fixed">Fixed</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] font-black text-[color:var(--muted)]">
                  increase
                </span>
                <input
                  name="weightIncrementKg"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.25"
                  defaultValue={exercise.weight_increment_kg}
                  className="field-base min-h-11 px-2 text-center text-sm font-black"
                />
              </label>
            </div>
            <label className="flex min-h-11 items-center gap-2 text-xs font-black text-[color:var(--muted)]">
              <input
                name="trackAsMainLift"
                type="checkbox"
                defaultChecked={exercise.track_as_main_lift}
                className="size-4 accent-[color:var(--accent)]"
              />
              Track as main lift
            </label>
            <FormSubmitButton pendingLabel="Saving...">
              <Save aria-hidden="true" className="size-4" />
              Save lift settings
            </FormSubmitButton>
          </form>
          {exercise.sets.map((set) => (
            <SetEditor
              key={set.id}
              exerciseCategory={exercise.exercise_category}
              programId={programId}
              set={set}
            />
          ))}
        </div>

        <form action={addProgramSet} className="border-t border-[color:var(--panel-border)] p-3">
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="programExerciseId" value={exercise.id} />
          <FormSubmitButton pendingLabel="Adding...">
            <Plus aria-hidden="true" className="size-4" />
            Add set
          </FormSubmitButton>
        </form>
      </details>
    </article>
  );
}

function DayEditor({
  day,
  exerciseOptions,
  isFirst,
  isLast,
  initiallyOpen,
  programId
}: {
  day: ProgramDay;
  exerciseOptions: Awaited<ReturnType<typeof getExerciseOptions>>;
  isFirst: boolean;
  isLast: boolean;
  initiallyOpen: boolean;
  programId: string;
}) {
  return (
    <details className="app-card overflow-hidden" open={initiallyOpen}>
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black">
            Day {day.day_number} - {day.name}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {day.exercises.length} lift{day.exercises.length === 1 ? "" : "s"}{" "}
            | {formatWeekdays(day.schedule_weekdays)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ProgramReorderButton
            direction="up"
            disabled={isFirst}
            programDayId={day.id}
            programId={programId}
            target="day"
          />
          <ProgramReorderButton
            direction="down"
            disabled={isLast}
            programDayId={day.id}
            programId={programId}
            target="day"
          />
          <span className="app-chip hidden shrink-0 sm:inline-flex">Edit</span>
        </div>
      </summary>

      <section className="space-y-3 border-t border-[color:var(--panel-border)] p-3">
        <article className="app-card-flat p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-[color:var(--muted)]">
              Day {day.day_number}
            </p>
            <h3 className="mt-1 text-lg font-black">{day.name}</h3>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {formatWeekdays(day.schedule_weekdays)}
            </p>
          </div>
          <form action={deleteProgramDay}>
            <input type="hidden" name="programId" value={programId} />
            <input type="hidden" name="programDayId" value={day.id} />
            <FormSubmitButton
              pendingLabel="Deleting..."
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[color:var(--danger)]/40 px-3 text-sm font-black text-red-200 disabled:cursor-wait disabled:opacity-70"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </FormSubmitButton>
          </form>
          </div>

          <form action={updateProgramDay} className="grid gap-2">
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="programDayId" value={day.id} />
          <input
            name="name"
            required
            defaultValue={day.name}
            className="field-base text-base"
          />
          <input
            name="focus"
            defaultValue={day.focus ?? ""}
            placeholder="Focus"
            className="field-base text-base"
          />
          <FormSubmitButton pendingLabel="Saving...">Save day</FormSubmitButton>
          </form>
        </article>

        <LazyProgramExercisePicker
          action={addProgramExercise}
          exerciseOptions={exerciseOptions}
          programDayId={day.id}
          programId={programId}
          recommendMainLift={
            day.exercises.filter((exercise) => exercise.track_as_main_lift)
              .length < 2
          }
        />

        <div className="space-y-3">
          {day.exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isFirst={index === 0}
              isLast={index === day.exercises.length - 1}
              programId={programId}
            />
          ))}
        </div>
      </section>
    </details>
  );
}

export default async function EditProgramPage({
  params,
  searchParams
}: EditProgramPageProps) {
  const [{ id }, { error }, { supabase }] = await Promise.all([
    params,
    searchParams,
    requireUser()
  ]);
  const [program, exerciseOptions] = await Promise.all([
    getProgramDetail(supabase, id),
    getExerciseOptions(supabase)
  ]);

  if (!program || program.is_public) {
    notFound();
  }

  const days = program.weeks.flatMap((week) => week.days);

  return (
    <div className="space-y-6 pb-28">
      <header className="space-y-2">
        <Link
          href={`/programs/${program.id}`}
          className="inline-flex min-h-10 items-center text-sm font-black text-[color:var(--accent)]"
        >
          Back to plan
        </Link>
        <p className="text-sm font-bold text-[color:var(--accent)]">Edit plan</p>
        <h1 className="text-3xl font-black tracking-normal">{program.name}</h1>
      </header>

      {error ? (
        <p className="rounded-xl border border-[color:var(--danger)]/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <form action={updateProgramBasics} className="app-card space-y-4 p-4">
        <input type="hidden" name="programId" value={program.id} />
        <label className="grid gap-2">
          <span className="text-sm font-bold">Name</span>
          <input
            name="name"
            required
            defaultValue={program.name}
            className="field-base text-base"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-bold">Notes</span>
          <textarea
            name="description"
            rows={3}
            defaultValue={program.description ?? ""}
            className="rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] px-3 py-3 text-base outline-none focus:border-[color:var(--accent)]"
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-bold">Mode</legend>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] px-3">
            <input
              type="radio"
              name="scheduleType"
              value="sequence"
              defaultChecked={program.schedule_type === "sequence"}
              className="size-4 accent-[color:var(--accent)]"
            />
            <span className="text-sm font-black">Next workout in order</span>
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] px-3">
            <input
              type="radio"
              name="scheduleType"
              value="calendar"
              defaultChecked={program.schedule_type === "calendar"}
              className="size-4 accent-[color:var(--accent)]"
            />
            <span className="text-sm font-black">Fixed weekdays</span>
          </label>
        </fieldset>

        <section className="grid gap-2">
          <h2 className="text-sm font-bold">Weekdays</h2>
          {days.map((day) => (
            <label key={day.id} className="grid gap-1">
              <span className="text-xs font-bold uppercase text-[color:var(--muted)]">
                {day.name}
              </span>
              <select
                name={`weekday_${day.id}`}
                defaultValue={day.schedule_weekdays[0] ?? ""}
                className="field-base text-base"
              >
                <option value="">Sequence only</option>
                {weekdayOptions.map((weekday) => (
                  <option key={weekday.value} value={weekday.value}>
                    {weekday.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </section>

        <FormSubmitButton pendingLabel="Saving...">Save plan</FormSubmitButton>
      </form>

      <form action={removeProgram} className="app-card-flat border-[color:var(--danger)]/40 p-3">
        <input type="hidden" name="programId" value={program.id} />
        <FormSubmitButton
          pendingLabel="Deleting..."
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--danger)]/50 px-4 text-sm font-black text-red-200 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Delete plan
        </FormSubmitButton>
      </form>

      <form action={addProgramDay} className="app-card-flat grid gap-2 p-3">
        <input type="hidden" name="programId" value={program.id} />
        <input
          name="name"
          placeholder="New day name"
          className="field-base text-base"
        />
        <FormSubmitButton pendingLabel="Adding...">
          <Plus aria-hidden="true" className="size-4" />
          Add day
        </FormSubmitButton>
      </form>

      <div className="space-y-6">
        {days.map((day, index) => (
          <DayEditor
            key={day.id}
            day={day}
            exerciseOptions={exerciseOptions}
            isFirst={index === 0}
            isLast={index === days.length - 1}
            initiallyOpen={index === 0}
            programId={program.id}
          />
        ))}
      </div>
    </div>
  );
}
