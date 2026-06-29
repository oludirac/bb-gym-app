import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  addProgramDay,
  addProgramExercise,
  addProgramSet,
  deleteProgramDay,
  deleteProgramExercise,
  deleteProgramSet,
  updateProgramBasics,
  updateProgramDay,
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

const setTypes = ["warmup", "working", "drop", "failure"];

type EditProgramPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function SetEditor({
  programId,
  set
}: {
  programId: string;
  set: ProgramSet;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] p-3">
      <form action={updateProgramSet} className="space-y-3">
        <input type="hidden" name="programId" value={programId} />
        <input type="hidden" name="setId" value={set.id} />

        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <p className="text-sm font-black">Set {set.sort_order}</p>
          <select
            name="setType"
            defaultValue={set.set_type}
            className="field-base min-h-10 text-sm capitalize"
          >
            {setTypes.map((setType) => (
              <option key={setType} value={setType}>
                {setType}
              </option>
            ))}
          </select>
          <FormSubmitButton
            pendingLabel="Saving..."
            className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-[color:var(--accent)] px-3 text-sm font-black text-zinc-950 disabled:cursor-wait disabled:opacity-70"
          >
            <Save aria-hidden="true" className="size-4" />
            Save
          </FormSubmitButton>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="grid gap-1">
            <span className="text-[11px] font-black text-[color:var(--muted)]">
              reps min
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
              reps max
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
              step="0.5"
              defaultValue={set.target_weight_kg ?? ""}
              className="field-base min-h-11 px-2 text-center text-sm font-black"
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="grid gap-1">
            <span className="text-[11px] font-black text-[color:var(--muted)]">
              RPE
            </span>
            <input
              name="targetRpe"
              type="number"
              inputMode="decimal"
              min="0"
              max="10"
              step="0.5"
              defaultValue={set.target_rpe ?? ""}
              className="field-base min-h-11 px-2 text-center text-sm font-black"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-black text-[color:var(--muted)]">
              RIR
            </span>
            <input
              name="targetRir"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              defaultValue={set.target_rir ?? ""}
              className="field-base min-h-11 px-2 text-center text-sm font-black"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-black text-[color:var(--muted)]">
              rest
            </span>
            <input
              name="restSeconds"
              type="number"
              inputMode="numeric"
              min="0"
              step="5"
              defaultValue={set.rest_seconds ?? ""}
              className="field-base min-h-11 px-2 text-center text-sm font-black"
            />
          </label>
        </div>

        <input
          name="notes"
          defaultValue={set.notes ?? ""}
          placeholder="Notes"
          className="field-base w-full text-sm"
        />
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

function ExerciseCard({
  exercise,
  programId
}: {
  exercise: ProgramExercise;
  programId: string;
}) {
  return (
    <article className="app-card-flat overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-[color:var(--panel-border)] p-3">
        <div className="min-w-0">
          <h4 className="truncate text-base font-black">
            {exercise.sort_order}. {exercise.exercise_name}
          </h4>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {exercise.sets.length} set{exercise.sets.length === 1 ? "" : "s"}
          </p>
        </div>
        <form action={deleteProgramExercise}>
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="programExerciseId" value={exercise.id} />
          <FormSubmitButton
            pendingLabel="Removing..."
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[color:var(--danger)]/40 px-3 text-sm font-black text-red-200 disabled:cursor-wait disabled:opacity-70"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </FormSubmitButton>
        </form>
      </div>

      <div className="space-y-3 p-3">
        {exercise.sets.map((set) => (
          <SetEditor key={set.id} programId={programId} set={set} />
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
    </article>
  );
}

function DayEditor({
  day,
  exerciseOptions,
  programId
}: {
  day: ProgramDay;
  exerciseOptions: Awaited<ReturnType<typeof getExerciseOptions>>;
  programId: string;
}) {
  return (
    <section className="space-y-3">
      <article className="app-card p-4">
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
          <textarea
            name="notes"
            rows={2}
            defaultValue={day.notes ?? ""}
            placeholder="Notes"
            className="rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] px-3 py-3 text-base outline-none focus:border-[color:var(--accent)]"
          />
          <FormSubmitButton pendingLabel="Saving...">Save day</FormSubmitButton>
        </form>
      </article>

      <form action={addProgramExercise} className="app-card-flat grid gap-2 p-3">
        <input type="hidden" name="programId" value={programId} />
        <input type="hidden" name="programDayId" value={day.id} />
        <select name="exerciseId" className="field-base text-base" required>
          {exerciseOptions.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
              {exercise.is_builtin ? "" : " (custom)"}
            </option>
          ))}
        </select>
        <FormSubmitButton pendingLabel="Adding...">
          <Plus aria-hidden="true" className="size-4" />
          Add lift
        </FormSubmitButton>
      </form>

      <div className="space-y-3">
        {day.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            programId={programId}
          />
        ))}
      </div>
    </section>
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
        {days.map((day) => (
          <DayEditor
            key={day.id}
            day={day}
            exerciseOptions={exerciseOptions}
            programId={program.id}
          />
        ))}
      </div>
    </div>
  );
}
