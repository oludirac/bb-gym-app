"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ProgramExercisePicker } from "@/components/program-exercise-picker";
import type { ExerciseOption } from "@/lib/workouts/queries";

type LazyProgramExercisePickerProps = {
  action: (formData: FormData) => void | Promise<void>;
  exerciseOptions: ExerciseOption[];
  programDayId: string;
  programId: string;
};

export function LazyProgramExercisePicker({
  action,
  exerciseOptions,
  programDayId,
  programId
}: LazyProgramExercisePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="app-card-flat inline-flex min-h-12 w-full items-center justify-center gap-2 p-3 text-sm font-black text-[color:var(--accent)] transition active:scale-[0.98]"
      >
        <Plus aria-hidden="true" className="size-4" />
        Add lift
      </button>
    );
  }

  return (
    <section className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black">Add lift</p>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[color:var(--panel-border)] px-3 text-xs font-black text-[color:var(--muted)]"
        >
          Close
        </button>
      </div>
      <ProgramExercisePicker
        action={action}
        exerciseOptions={exerciseOptions}
        programDayId={programDayId}
        programId={programId}
      />
    </section>
  );
}
