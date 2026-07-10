"use client";

import { useState, useTransition } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  addProgramSetInline,
  deleteProgramExercise,
  updateProgramExerciseSettings
} from "@/app/(app)/programs/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ProgramReorderButton } from "@/components/program-reorder-button";
import { ProgramSetEditor } from "@/components/program-set-editor";
import { groupedSetSummaries } from "@/lib/programs/set-summary";
import type { ProgramExercise } from "@/lib/programs/queries";

type ProgramExerciseCardProps = {
  displayOrder: number;
  exercise: ProgramExercise;
  isFirst: boolean;
  isLast: boolean;
  programId: string;
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

export function ProgramExerciseCard({
  displayOrder,
  exercise,
  isFirst,
  isLast,
  programId
}: ProgramExerciseCardProps) {
  const [sets, setSets] = useState(exercise.sets);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const setSummaries = groupedSetSummaries(sets, exercise.exercise_category);
  const progressionTrackNames = [
    ...new Set(
      sets
        .map((set) => set.progression_track?.name)
        .filter((name): name is string => Boolean(name))
    )
  ];

  function addSet() {
    setError(null);
    startTransition(async () => {
      const result = await addProgramSetInline({
        programExerciseId: exercise.id,
        programId
      });

      if (result.ok && result.set) {
        setSets((current) =>
          [...current, result.set].sort((a, b) => a.sort_order - b.sort_order)
        );
      } else {
        setError(result.error ?? "Could not add set.");
      }
    });
  }

  return (
    <article className="app-card-flat overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-[color:var(--panel-border)] p-3">
        <div className="min-w-0">
          <h4 className="truncate text-base font-black">
            {displayOrder}. {exercise.exercise_name}
          </h4>
          <p className="mt-1 text-xs font-black capitalize text-[color:var(--accent)]">
            {formatProgressionStyle(exercise.progression_style)} | +
            {formatKg(exercise.weight_increment_kg)}
            {exercise.track_as_main_lift ? " | main lift" : ""}
          </p>
          {progressionTrackNames.length > 0 ? (
            <p className="mt-1 text-xs font-bold text-[color:var(--muted)]">
              Progresses with: {progressionTrackNames.join(", ")}
            </p>
          ) : null}
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
          <form
            action={updateProgramExerciseSettings}
            className="grid gap-2 rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel-raised)] p-3"
          >
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

          {sets.map((set, index) => (
            <ProgramSetEditor
              key={set.id}
              displayOrder={index + 1}
              exerciseCategory={exercise.exercise_category}
              onDelete={(setId) =>
                setSets((current) =>
                  current
                    .filter((item) => item.id !== setId)
                    .map((item, index) => ({
                      ...item,
                      sort_order: index + 1
                    }))
                )
              }
              onUpdate={(updatedSet) =>
                setSets((current) =>
                  current.map((item) =>
                    item.id === updatedSet.id ? updatedSet : item
                  )
                )
              }
              programId={programId}
              set={set}
            />
          ))}
        </div>

        <div className="border-t border-[color:var(--panel-border)] p-3">
          <button
            type="button"
            onClick={addSet}
            disabled={isPending}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[color:var(--accent)] px-4 text-base font-extrabold text-zinc-950 transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
          >
            <Plus aria-hidden="true" className="size-4" />
            {isPending ? "Adding..." : "Add set"}
          </button>
          {error ? <p className="mt-2 text-xs text-red-200">{error}</p> : null}
        </div>
      </details>
    </article>
  );
}
