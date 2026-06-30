"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  bodyPartCategories,
  formatExerciseCategory
} from "@/lib/exercises/categories";
import type { ExerciseOption } from "@/lib/workouts/queries";

type ProgramExercisePickerProps = {
  exerciseOptions: ExerciseOption[];
  programDayId: string;
  programId: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function ProgramExercisePicker({
  action,
  exerciseOptions,
  programDayId,
  programId
}: ProgramExercisePickerProps) {
  const categories = useMemo(
    () =>
      bodyPartCategories.filter((category) =>
        exerciseOptions.some((exercise) => exercise.category === category)
      ),
    [exerciseOptions]
  );
  const [category, setCategory] = useState<string>(categories[0] ?? "chest");
  const filteredExercises = exerciseOptions.filter(
    (exercise) => exercise.category === category
  );

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
          onChange={(event) => setCategory(event.target.value)}
          className="field-base text-base capitalize"
          required
        >
          {categories.map((item) => (
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
        <select name="exerciseId" className="field-base text-base" required>
          {filteredExercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
              {exercise.is_builtin ? "" : " (custom)"}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-4 gap-2">
        <label className="grid gap-1">
          <span className="text-xs font-black uppercase text-[color:var(--muted)]">
            sets
          </span>
          <select
            name="setCount"
            defaultValue="3"
            className="field-base min-h-11 px-2 text-center text-sm font-black"
          >
            {[1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-black uppercase text-[color:var(--muted)]">
            min
          </span>
          <input
            name="targetRepsMin"
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue="8"
            className="field-base min-h-11 px-2 text-center text-sm font-black"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-black uppercase text-[color:var(--muted)]">
            max
          </span>
          <input
            name="targetRepsMax"
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue="12"
            className="field-base min-h-11 px-2 text-center text-sm font-black"
          />
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
            step="0.5"
            placeholder="0"
            className="field-base min-h-11 px-2 text-center text-sm font-black"
          />
        </label>
      </div>
      <FormSubmitButton pendingLabel="Adding...">
        <Plus aria-hidden="true" className="size-4" />
        Add lift
      </FormSubmitButton>
    </form>
  );
}
