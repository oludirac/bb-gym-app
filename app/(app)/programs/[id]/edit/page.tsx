import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { LazyProgramExercisePicker } from "@/components/lazy-program-exercise-picker";
import { ProgramExerciseCard } from "@/components/program-exercise-card";
import { ProgramReorderButton } from "@/components/program-reorder-button";
import {
  addProgramDay,
  addProgramExercise,
  deleteProgramDay,
  removeProgram,
  updateProgramBasics,
  updateProgramDay
} from "@/app/(app)/programs/actions";
import {
  getProgramDayEditor,
  getProgramEditShell,
  type ProgramDay,
  type ProgramEditDaySummary
} from "@/lib/programs/queries";
import { formatWeekdays, weekdayOptions } from "@/lib/scheduling/weekdays";
import { requireUser } from "@/lib/auth/session";

type EditProgramPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    day?: string;
    error?: string;
  }>;
};

function DaySelector({
  days,
  programId,
  selectedDayId
}: {
  days: ProgramEditDaySummary[];
  programId: string;
  selectedDayId: string | null;
}) {
  return (
    <section className="app-card-flat p-3">
      <h2 className="text-sm font-black">Days</h2>
      <div className="mt-3 grid gap-2">
        {days.map((day) => {
          const selected = day.id === selectedDayId;

          return (
            <Link
              key={day.id}
              href={`/programs/${programId}/edit?day=${day.id}`}
              className={`flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 text-sm font-black ${
                selected
                  ? "border-[color:var(--accent)] bg-[color:var(--panel-raised)]"
                  : "border-[color:var(--panel-border)]"
              }`}
            >
              <span className="min-w-0 truncate">
                Day {day.day_number} - {day.name}
              </span>
              <span className="shrink-0 text-xs text-[color:var(--muted)]">
                {day.exercise_count} lift{day.exercise_count === 1 ? "" : "s"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function DayEditor({
  day,
  isFirst,
  isLast,
  programId
}: {
  day: ProgramDay;
  isFirst: boolean;
  isLast: boolean;
  programId: string;
}) {
  return (
    <section className="app-card overflow-hidden">
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-[color:var(--panel-border)] p-4">
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
        </div>
      </header>

      <div className="space-y-3 p-3">
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
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-[color:var(--danger)]/40 px-3 text-sm font-black text-red-200 disabled:cursor-wait disabled:opacity-70"
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
          programDayId={day.id}
          programId={programId}
          recommendMainLift={
            day.exercises.filter((exercise) => exercise.track_as_main_lift)
              .length < 2
          }
        />

        <div className="space-y-3">
          {day.exercises.map((exercise, index) => (
            <ProgramExerciseCard
              key={exercise.id}
              displayOrder={index + 1}
              exercise={exercise}
              isFirst={index === 0}
              isLast={index === day.exercises.length - 1}
              programId={programId}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function EditProgramPage({
  params,
  searchParams
}: EditProgramPageProps) {
  const [{ id }, { day: requestedDayId, error }, { supabase }] =
    await Promise.all([params, searchParams, requireUser()]);
  const program = await getProgramEditShell(supabase, id);

  if (!program || program.is_public) {
    notFound();
  }

  const selectedSummary =
    program.days.find((day) => day.id === requestedDayId) ??
    program.days[0] ??
    null;
  const selectedDay = selectedSummary
    ? await getProgramDayEditor(
        supabase,
        selectedSummary.id,
        selectedSummary.schedule_weekdays
      )
    : null;
  const selectedIndex = selectedSummary
    ? program.days.findIndex((day) => day.id === selectedSummary.id)
    : -1;

  return (
    <div className="space-y-6 pb-28">
      <header className="space-y-2">
        <Link
          href={`/programs/${program.id}`}
          className="inline-flex min-h-10 items-center text-sm font-black text-[color:var(--accent)]"
        >
          Back to split
        </Link>
        <p className="text-sm font-bold text-[color:var(--accent)]">Edit split</p>
        <h1 className="text-3xl font-black tracking-normal">{program.name}</h1>
      </header>

      {error ? (
        <p className="rounded-md border border-[color:var(--danger)]/40 bg-red-500/10 p-3 text-sm text-red-200">
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
            className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel-raised)] px-3 py-3 text-base outline-none focus:border-[color:var(--accent)]"
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-bold">Mode</legend>
          <label className="flex min-h-12 items-center gap-3 rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel-raised)] px-3">
            <input
              type="radio"
              name="scheduleType"
              value="sequence"
              defaultChecked={program.schedule_type === "sequence"}
              className="size-4 accent-[color:var(--accent)]"
            />
            <span className="text-sm font-black">Rotating split</span>
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel-raised)] px-3">
            <input
              type="radio"
              name="scheduleType"
              value="calendar"
              defaultChecked={program.schedule_type === "calendar"}
              className="size-4 accent-[color:var(--accent)]"
            />
            <span className="text-sm font-black">Scheduled days</span>
          </label>
        </fieldset>

        <section className="grid gap-2">
          <h2 className="text-sm font-bold">Weekdays</h2>
          {program.days.map((day) => (
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

        <FormSubmitButton pendingLabel="Saving...">Save split</FormSubmitButton>
      </form>

      <div className="grid gap-3">
        <form
          action={removeProgram}
          className="app-card-flat border-[color:var(--danger)]/40 p-3"
        >
          <input type="hidden" name="programId" value={program.id} />
          <FormSubmitButton
            pendingLabel="Deleting..."
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[color:var(--danger)]/50 px-4 text-sm font-black text-red-200 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Delete split
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
      </div>

      <DaySelector
        days={program.days}
        programId={program.id}
        selectedDayId={selectedSummary?.id ?? null}
      />

      {selectedDay && selectedSummary ? (
        <DayEditor
          day={selectedDay}
          isFirst={selectedIndex <= 0}
          isLast={selectedIndex === program.days.length - 1}
          programId={program.id}
        />
      ) : (
        <p className="app-card-flat p-4 text-sm font-bold text-[color:var(--muted)]">
          Add a day to start building this split.
        </p>
      )}
    </div>
  );
}
