"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { getExerciseOptionsForCategory } from "@/app/(app)/workouts/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  bodyPartCategories,
  formatExerciseCategory
} from "@/lib/exercises/categories";
import type { ExerciseOption } from "@/lib/workouts/queries";

type ProgramExercisePickerProps = {
  programDayId: string;
  programId: string;
  action: (formData: FormData) => void | Promise<void>;
  recommendMainLift: boolean;
};

const repRanges = ["4-6", "8-10", "10-12", "12-15", "custom"];

export function ProgramExercisePicker({
  action,
  programDayId,
  programId,
  recommendMainLift
}: ProgramExercisePickerProps) {
  const [category, setCategory] = useState<string>("chest");
  const [optionsByCategory, setOptionsByCategory] = useState<
    Record<string, ExerciseOption[]>
  >({});
  const [isLoadingOptions, startOptionsTransition] = useTransition();
  const [progressionStyle, setProgressionStyle] =
    useState("double_progression");
  const [repRange, setRepRange] = useState("8-10");
  const [topRepRange, setTopRepRange] = useState("4-6");
  const [backoffRepRange, setBackoffRepRange] = useState("8-10");
  const isCardio = category === "cardio";
  const filteredExercises = optionsByCategory[category] ?? [];

  function fetchCategory(nextCategory: string) {
    if (optionsByCategory[nextCategory]) {
      return;
    }

    startOptionsTransition(async () => {
      const result = await getExerciseOptionsForCategory(nextCategory);

      if (result.ok) {
        setOptionsByCategory((current) => ({
          ...current,
          [nextCategory]: result.options
        }));
      }
    });
  }

  function loadCategory(nextCategory: string) {
    setCategory(nextCategory);
    fetchCategory(nextCategory);
  }

  useEffect(() => {
    fetchCategory(category);
    // The first load should only run once for the initial category.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form action={action} className="app-card-flat grid gap-3 p-3">
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="programDayId" value={programDayId} />
      <label className="grid gap-1">
        <span className="text-xs font-black uppercase text-[color:var(--muted)]">
          Body part
        </span>
        <select
          name="exerciseCategory"
          value={category}
          onChange={(event) => loadCategory(event.target.value)}
          className="field-base text-base capitalize"
          required
        >
          {bodyPartCategories.map((item) => (
            <option key={item} value={item}>
              {formatExerciseCategory(item)}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-black uppercase text-[color:var(--muted)]">
          Exercise
        </span>
        <select
          name="exerciseId"
          className="field-base text-base"
          disabled={isLoadingOptions || filteredExercises.length === 0}
          required
        >
          {isLoadingOptions ? <option>Loading...</option> : null}
          {!isLoadingOptions && filteredExercises.length === 0 ? (
            <option>No exercises found</option>
          ) : null}
          {filteredExercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
              {exercise.is_builtin ? "" : " (custom)"}
            </option>
          ))}
        </select>
      </label>
      {!isCardio ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1">
            <span className="text-xs font-black uppercase text-[color:var(--muted)]">
              Style
            </span>
            <select
              name="progressionStyle"
              value={progressionStyle}
              onChange={(event) => setProgressionStyle(event.target.value)}
              className="field-base min-h-11 px-2 text-sm font-black"
            >
              <option value="double_progression">Double progression</option>
              <option value="top_set_backoff">Top set + back-off</option>
              <option value="fixed">Fixed</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-black uppercase text-[color:var(--muted)]">
              Increase
            </span>
            <select
              name="weightIncrementKg"
              defaultValue="2.5"
              className="field-base min-h-11 px-2 text-center text-sm font-black"
            >
              <option value="1.25">1.25kg</option>
              <option value="2.5">2.5kg</option>
              <option value="5">5kg</option>
            </select>
          </label>
        </div>
      ) : null}

      <div className={isCardio ? "grid grid-cols-4 gap-2" : "grid gap-3"}>
        <label
          className={
            progressionStyle === "top_set_backoff" && !isCardio
              ? "hidden"
              : "grid gap-1"
          }
        >
          <span className="text-xs font-black uppercase text-[color:var(--muted)]">
            sets
          </span>
          <select
            name="setCount"
            defaultValue={isCardio ? "1" : "3"}
            className="field-base min-h-11 px-2 text-center text-sm font-black"
          >
            {[1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
        {isCardio ? (
          <>
            <label className="grid gap-1">
              <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                min
              </span>
              <input
                name="targetDurationMinutes"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                defaultValue="20"
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                km
              </span>
              <input
                name="targetDistanceKm"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                placeholder="0"
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                level
              </span>
              <input
                name="targetIntensity"
                placeholder="RPE 7"
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              />
            </label>
          </>
        ) : (
          <div className="grid gap-2">
            {progressionStyle === "top_set_backoff" ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                      Top reps
                    </span>
                    <select
                      name="topRepRange"
                      value={topRepRange}
                      onChange={(event) => setTopRepRange(event.target.value)}
                      className="field-base min-h-11 px-2 text-center text-sm font-black"
                    >
                      {repRanges.slice(0, 4).map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                      Top kg
                    </span>
                    <input
                      name="topWeightKg"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.25"
                      placeholder="0"
                      className="field-base min-h-11 px-2 text-center text-sm font-black"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                      Back-offs
                    </span>
                    <select
                      name="backoffSetCount"
                      defaultValue="2"
                      className="field-base min-h-11 px-2 text-center text-sm font-black"
                    >
                      {[1, 2, 3, 4].map((count) => (
                        <option key={count} value={count}>
                          {count}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                      Reps
                    </span>
                    <select
                      name="backoffRepRange"
                      value={backoffRepRange}
                      onChange={(event) =>
                        setBackoffRepRange(event.target.value)
                      }
                      className="field-base min-h-11 px-2 text-center text-sm font-black"
                    >
                      {repRanges.slice(1, 4).map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                      Kg
                    </span>
                    <input
                      name="backoffWeightKg"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.25"
                      placeholder="0"
                      className="field-base min-h-11 px-2 text-center text-sm font-black"
                    />
                  </label>
                </div>
                <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[color:var(--panel-border)] px-3 text-xs font-black text-[color:var(--muted)]">
                  <input
                    name="trackAsMainLift"
                    type="checkbox"
                    defaultChecked={recommendMainLift}
                    className="size-4 accent-[color:var(--accent)]"
                  />
                  Track as main lift
                </label>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                    reps
                  </span>
                  <select
                    name="repRange"
                    value={repRange}
                    onChange={(event) => setRepRange(event.target.value)}
                    className="field-base min-h-11 px-2 text-center text-sm font-black"
                  >
                    {repRanges.map((range) => (
                      <option key={range} value={range}>
                        {range === "custom" ? "Custom" : range}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                    kg
                  </span>
                  <input
                    name="targetWeightKg"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.25"
                    placeholder="0"
                    className="field-base min-h-11 px-2 text-center text-sm font-black"
                  />
                </label>
                <label className="flex min-h-11 items-end gap-2 pb-1 text-xs font-black text-[color:var(--muted)]">
                  <input
                    name="trackAsMainLift"
                    type="checkbox"
                    defaultChecked={recommendMainLift}
                    className="size-4 accent-[color:var(--accent)]"
                  />
                  Main
                </label>
              </div>
            )}

            {repRange === "custom" && progressionStyle !== "top_set_backoff" ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="targetRepsMin"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="Min reps"
                  className="field-base min-h-11 px-2 text-center text-sm font-black"
                />
                <input
                  name="targetRepsMax"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="Max reps"
                  className="field-base min-h-11 px-2 text-center text-sm font-black"
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
      <FormSubmitButton
        disabled={isLoadingOptions || filteredExercises.length === 0}
        pendingLabel="Adding..."
      >
        <Plus aria-hidden="true" className="size-4" />
        Add lift
      </FormSubmitButton>
    </form>
  );
}
