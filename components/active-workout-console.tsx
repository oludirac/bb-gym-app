"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Flag,
  History,
  Plus,
  Repeat2,
  RotateCcw,
  Settings,
  Trash2,
  X
} from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  addExerciseToWorkout,
  addWorkoutSetInline,
  cancelActiveWorkout,
  completeWorkoutSetInline,
  finishWorkout,
  getExerciseOptionsForCategory,
  moveWorkoutExerciseInline,
  removeWorkoutExercise,
  saveWorkoutSetWeightAsPlanWeight,
  undoWorkoutSetInline,
} from "@/app/(app)/workouts/actions";
import {
  bodyPartCategories,
  formatExerciseCategory
} from "@/lib/exercises/categories";
import type {
  ExerciseOption,
  Workout,
  WorkoutExercise,
  WorkoutSet
} from "@/lib/workouts/queries";

type Draft = {
  distanceKm: string;
  durationMinutes: string;
  intensity: string;
  reps: string;
  weightKg: string;
};

type ActiveWorkoutConsoleProps = {
  activeWorkout: Workout;
  defaultRestSeconds: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "";
  }

  return Number.isInteger(value) ? String(value) : String(value);
}

function secondsToMinutes(seconds: number | null) {
  return seconds === null ? "" : formatNumber(seconds / 60);
}

function completedCount(exercise: WorkoutExercise) {
  return exercise.sets.filter((set) => set.completed_at).length;
}

function totalSetCount(workout: Workout) {
  return workout.workoutExercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0
  );
}

function completedSetCount(workout: Workout) {
  return workout.workoutExercises.reduce(
    (total, exercise) => total + completedCount(exercise),
    0
  );
}

function targetLabel(set: WorkoutSet, isCardio: boolean) {
  if (isCardio) {
    const parts = [
      set.target_duration_seconds
        ? `${Math.round(set.target_duration_seconds / 60)} min`
        : null,
      set.target_distance_km ? `${set.target_distance_km} km` : null,
      set.target_intensity
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(" | ") : "Open target";
  }

  const reps =
    set.target_reps_min && set.target_reps_max
      ? `${set.target_reps_min}-${set.target_reps_max}`
      : set.target_reps_min ?? set.target_reps_max;
  const weight =
    set.target_weight_kg !== null ? `${formatNumber(set.target_weight_kg)}kg` : null;

  return [weight, reps ? `${reps} reps` : null].filter(Boolean).join(" x ") || "Open target";
}

function loggedLabel(set: WorkoutSet, isCardio: boolean) {
  if (isCardio) {
    const parts = [
      set.duration_seconds ? `${Math.round(set.duration_seconds / 60)} min` : null,
      set.distance_km ? `${set.distance_km} km` : null,
      set.intensity
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(" | ") : "Completed";
  }

  const weight = set.weight_kg !== null ? `${formatNumber(set.weight_kg)}kg` : null;
  const reps = set.reps !== null ? `${set.reps} reps` : null;
  return [weight, reps].filter(Boolean).join(" x ") || "Completed";
}

function firstIncomplete(workout: Workout) {
  for (const exercise of workout.workoutExercises) {
    const set = exercise.sets.find((item) => !item.completed_at);

    if (set) {
      return { exerciseId: exercise.id, setId: set.id };
    }
  }

  const firstExercise = workout.workoutExercises[0];
  const firstSet = firstExercise?.sets[0];
  return firstExercise && firstSet
    ? { exerciseId: firstExercise.id, setId: firstSet.id }
    : null;
}

function updateSet(
  workout: Workout,
  setId: string,
  patch: Partial<WorkoutSet>
) {
  return {
    ...workout,
    workoutExercises: workout.workoutExercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) =>
        set.id === setId ? { ...set, ...patch } : set
      )
    }))
  };
}

function findSet(workout: Workout, setId: string | null) {
  for (const exercise of workout.workoutExercises) {
    const set = exercise.sets.find((item) => item.id === setId);

    if (set) {
      return { exercise, set };
    }
  }

  return null;
}

function buildDraft(set: WorkoutSet | null, previousSet: WorkoutSet | null): Draft {
  return {
    distanceKm: formatNumber(
      set?.distance_km ?? set?.target_distance_km ?? previousSet?.distance_km ?? null
    ),
    durationMinutes: secondsToMinutes(
      set?.duration_seconds ??
        set?.target_duration_seconds ??
        previousSet?.duration_seconds ??
        null
    ),
    intensity:
      set?.intensity ?? set?.target_intensity ?? previousSet?.intensity ?? "",
    reps: formatNumber(
      set?.reps ??
        set?.target_reps_min ??
        set?.target_reps_max ??
        set?.previous_reps ??
        previousSet?.reps ??
        null
    ),
    weightKg: formatNumber(
      set?.weight_kg ??
        set?.target_weight_kg ??
        set?.previous_weight_kg ??
        previousSet?.weight_kg ??
        null
    )
  };
}

function hasSameTarget(current: WorkoutSet, next: WorkoutSet, isCardio: boolean) {
  if (isCardio) {
    return (
      current.target_distance_km === next.target_distance_km &&
      current.target_duration_seconds === next.target_duration_seconds &&
      current.target_intensity === next.target_intensity
    );
  }

  return (
    current.target_weight_kg === next.target_weight_kg &&
    current.target_reps_min === next.target_reps_min &&
    current.target_reps_max === next.target_reps_max
  );
}

function hasAnyTarget(set: WorkoutSet, isCardio: boolean) {
  if (isCardio) {
    return Boolean(
      set.target_distance_km ||
        set.target_duration_seconds ||
        set.target_intensity
    );
  }

  return Boolean(
    set.target_weight_kg || set.target_reps_min || set.target_reps_max
  );
}

function shouldCopyToNext(
  current: WorkoutSet,
  next: WorkoutSet,
  isCardio: boolean
) {
  if (isCardio) {
    if (next.distance_km || next.duration_seconds || next.intensity) {
      return false;
    }
  } else if (next.weight_kg || next.reps) {
    return false;
  }

  return !hasAnyTarget(next, isCardio) || hasSameTarget(current, next, isCardio);
}

function nextIncompleteAfter(
  workout: Workout,
  exerciseId: string,
  setId: string
) {
  let hasPassedCurrent = false;

  for (const exercise of workout.workoutExercises) {
    for (const set of exercise.sets) {
      if (hasPassedCurrent && !set.completed_at) {
        return { exerciseId: exercise.id, setId: set.id };
      }

      if (exercise.id === exerciseId && set.id === setId) {
        hasPassedCurrent = true;
      }
    }
  }

  return firstIncomplete(workout);
}

function previousSetFor(exercise: WorkoutExercise, set: WorkoutSet | null) {
  if (!set) {
    return null;
  }

  const index = exercise.sets.findIndex((item) => item.id === set.id);

  if (index <= 0) {
    return null;
  }

  return exercise.sets[index - 1] ?? null;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function RestPanel({
  addRest,
  remaining,
  skipRest
}: {
  addRest: () => void;
  remaining: number | null;
  skipRest: () => void;
}) {
  if (remaining === null) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-[color:var(--muted)]">
            Rest
          </p>
          <p className="mt-1 text-xl font-black">
            {remaining > 0 ? `Next set in ${formatTime(remaining)}` : "Next set"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={skipRest}
            className="min-h-11 rounded-xl border border-[color:var(--panel-border)] px-3 text-sm font-black"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={addRest}
            className="min-h-11 rounded-xl bg-[color:var(--accent)] px-3 text-sm font-black text-zinc-950"
          >
            +30s
          </button>
        </div>
      </div>
    </div>
  );
}

export function ActiveWorkoutConsole({
  activeWorkout,
  defaultRestSeconds
}: ActiveWorkoutConsoleProps) {
  const router = useRouter();
  const [workout, setWorkout] = useState(activeWorkout);
  const [focus, setFocus] = useState(() => firstIncomplete(activeWorkout));
  const [draftState, setDraftState] = useState<{
    draft: Draft;
    setId: string | null;
  }>(() => ({
    draft: {
      distanceKm: "",
      durationMinutes: "",
      intensity: "",
      reps: "",
      weightKg: ""
    },
    setId: null
  }));
  const [savingSetId, setSavingSetId] = useState<string | null>(null);
  const [pendingSetMutationId, setPendingSetMutationId] = useState<string | null>(
    null
  );
  const [isReordering, startReorderTransition] = useTransition();
  const [expandedCompleted, setExpandedCompleted] = useState<Set<string>>(
    () => new Set()
  );
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [remainingRest, setRemainingRest] = useState<number | null>(null);
  const [addLiftCategory, setAddLiftCategory] = useState("chest");
  const [exerciseOptionsByCategory, setExerciseOptionsByCategory] = useState<
    Record<string, ExerciseOption[]>
  >({});
  const [isLoadingExerciseOptions, startExerciseOptionsTransition] =
    useTransition();

  const focused = useMemo(() => {
    const fallback = firstIncomplete(workout);
    const activeFocus = focus ?? fallback;
    const found = findSet(workout, activeFocus?.setId ?? null);

    if (found) {
      return found;
    }

    return findSet(workout, fallback?.setId ?? null);
  }, [focus, workout]);

  const currentExercise = focused?.exercise ?? null;
  const currentSet = focused?.set ?? null;
  const isCardio = currentExercise?.exercise_category === "cardio";
  const previousSet = currentExercise
    ? previousSetFor(currentExercise, currentSet)
    : null;
  const draft =
    draftState.setId === currentSet?.id
      ? draftState.draft
      : buildDraft(currentSet, previousSet);
  const doneSets = completedSetCount(workout);
  const allSets = totalSetCount(workout);

  const updateDraft = (patch: Partial<Draft>) => {
    setDraftState({
      draft: {
        ...draft,
        ...patch
      },
      setId: currentSet?.id ?? null
    });
  };

  const loadExerciseCategory = (nextCategory: string) => {
    setAddLiftCategory(nextCategory);

    if (exerciseOptionsByCategory[nextCategory]) {
      return;
    }

    startExerciseOptionsTransition(async () => {
      const result = await getExerciseOptionsForCategory(nextCategory);

      if (result.ok) {
        setExerciseOptionsByCategory((current) => ({
          ...current,
          [nextCategory]: result.options
        }));
      }
    });
  };

  useEffect(() => {
    if (!restEndsAt) {
      return;
    }

    const tick = () => {
      const seconds = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRemainingRest(seconds);
    };

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [restEndsAt]);

  useEffect(() => {
    if (remainingRest !== 0) {
      return;
    }

    window.navigator.vibrate?.([120, 80, 120]);

    if (Notification.permission === "granted") {
      new Notification("Rest", { body: "Next set" });
    }
  }, [remainingRest]);

  const startRest = (seconds: number) => {
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }

    setRestEndsAt(Date.now() + seconds * 1000);
    setRemainingRest(seconds);
  };

  const completeCurrentSet = async () => {
    if (!currentExercise || !currentSet) {
      return;
    }

    const restSeconds = currentSet.rest_seconds ?? defaultRestSeconds;
    const completedAt = new Date().toISOString();
    const patch: Partial<WorkoutSet> = isCardio
      ? {
          completed_at: completedAt,
          distance_km: draft.distanceKm ? Number(draft.distanceKm) : null,
          duration_seconds: draft.durationMinutes
            ? Math.round(Number(draft.durationMinutes) * 60)
            : null,
          intensity: draft.intensity || null,
          rest_seconds: restSeconds
        }
      : {
          completed_at: completedAt,
          reps: draft.reps ? Number(draft.reps) : null,
          rest_seconds: restSeconds,
          weight_kg: draft.weightKg ? Number(draft.weightKg) : null
        };

    let optimistic = updateSet(workout, currentSet.id, patch);
    const next = nextIncompleteAfter(
      optimistic,
      currentExercise.id,
      currentSet.id
    );

    if (next && next.setId !== currentSet.id) {
      const nextFound = findSet(optimistic, next.setId);

      if (nextFound && shouldCopyToNext(currentSet, nextFound.set, isCardio)) {
        optimistic = updateSet(
          optimistic,
          nextFound.set.id,
          isCardio
            ? {
                distance_km: patch.distance_km ?? null,
                duration_seconds: patch.duration_seconds ?? null,
                intensity: patch.intensity ?? null
              }
            : {
                reps: patch.reps ?? null,
                weight_kg: patch.weight_kg ?? null
              }
        );
      }
    }

    setWorkout(optimistic);
    setFocus(next);
    setSavingSetId(currentSet.id);
    startRest(restSeconds);

    await completeWorkoutSetInline({
      distanceKm: draft.distanceKm,
      durationMinutes: draft.durationMinutes,
      intensity: draft.intensity,
      reps: draft.reps,
      restSeconds,
      setId: currentSet.id,
      weightKg: draft.weightKg
    });

    setSavingSetId(null);
    router.refresh();
  };

  const undoSet = async (exerciseId: string, setId: string) => {
    setWorkout(updateSet(workout, setId, { completed_at: null }));
    setFocus({ exerciseId, setId });
    setSavingSetId(setId);
    await undoWorkoutSetInline(setId);
    setSavingSetId(null);
    router.refresh();
  };

  const moveExercise = (
    workoutExerciseId: string,
    direction: "down" | "later" | "up"
  ) => {
    setWorkout((current) => {
      const exercises = [...current.workoutExercises];
      const currentIndex = exercises.findIndex(
        (exercise) => exercise.id === workoutExerciseId
      );

      if (currentIndex === -1) {
        return current;
      }

      if (direction === "later") {
        const [item] = exercises.splice(currentIndex, 1);
        exercises.push(item);
      } else {
        const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (!exercises[targetIndex]) {
          return current;
        }

        [exercises[currentIndex], exercises[targetIndex]] = [
          exercises[targetIndex],
          exercises[currentIndex]
        ];
      }

      return {
        ...current,
        workoutExercises: exercises.map((exercise, index) => ({
          ...exercise,
          sort_order: index + 1
        }))
      };
    });

    startReorderTransition(async () => {
      await moveWorkoutExerciseInline({ direction, workoutExerciseId });
      router.refresh();
    });
  };

  const savePlanWeight = async () => {
    if (!currentSet?.program_set_id) {
      return;
    }

    await saveWorkoutSetWeightAsPlanWeight({
      programSetId: currentSet.program_set_id,
      weightKg: draft.weightKg
    });
    router.refresh();
  };

  const addSetToExercise = async (
    workoutExerciseId: string,
    copySetId?: string | null
  ) => {
    setPendingSetMutationId(workoutExerciseId);
    const result = await addWorkoutSetInline({
      copySetId,
      workoutExerciseId
    });

    if (result.ok && result.set) {
      setWorkout((current) => ({
        ...current,
        workoutExercises: current.workoutExercises.map((exercise) =>
          exercise.id === workoutExerciseId
            ? {
                ...exercise,
                sets: [...exercise.sets, result.set].sort(
                  (a, b) => a.sort_order - b.sort_order
                )
              }
            : exercise
        )
      }));
      setFocus({ exerciseId: workoutExerciseId, setId: result.set.id });
    }

    setPendingSetMutationId(null);
    startReorderTransition(() => {
      router.refresh();
    });
  };

  const readyToFinish = allSets > 0 && doneSets >= allSets;

  return (
    <div className="space-y-4 pb-36">
      <header className="flex items-start justify-between gap-3 border-b border-[color:var(--panel-border)] pb-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-[color:var(--muted)]">
            Workout
          </p>
          <h1 className="mt-1 truncate text-2xl font-black tracking-normal">
            {workout.name ?? "Workout"}
          </h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {doneSets}/{allSets} sets done
          </p>
        </div>
        <p className="shrink-0 text-xs font-bold text-[color:var(--muted)]">
          {formatDate(workout.started_at)}
        </p>
      </header>

      {currentExercise && currentSet ? (
        <section className="overflow-hidden border-y border-[color:var(--panel-border)]">
          <div className="border-b border-[color:var(--panel-border)] py-4">
            <p className="text-xs font-black uppercase text-[color:var(--muted)]">
              Focus mode
            </p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black">
                  {currentExercise.exercise_name_snapshot}
                </h2>
                <p className="mt-1 text-sm font-bold text-[color:var(--muted)]">
                  Set {currentSet.sort_order} of {currentExercise.sets.length}
                </p>
              </div>
              <div className="grid size-11 shrink-0 place-items-center rounded-md bg-[color:var(--accent)] text-lg font-black text-zinc-950">
                {currentSet.sort_order}
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {currentExercise.sets.map((set) => (
                <button
                  type="button"
                  key={set.id}
                  onClick={() =>
                    setFocus({ exerciseId: currentExercise.id, setId: set.id })
                  }
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black ${
                    set.id === currentSet.id
                      ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-zinc-950"
                      : set.completed_at
                        ? "border-[color:var(--success)]/50 text-[color:var(--success)]"
                        : "border-[color:var(--panel-border)] text-[color:var(--muted)]"
                  }`}
                >
                  {set.completed_at
                    ? `${set.sort_order}: ${loggedLabel(set, isCardio)}`
                    : `${set.sort_order}: ${targetLabel(set, isCardio)}`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 py-4">
            {isCardio ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                    Minutes
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    value={draft.durationMinutes}
                    onChange={(event) =>
                      updateDraft({
                        durationMinutes: event.target.value
                      })
                    }
                    className="field-base min-h-14 text-center text-2xl font-black"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                    Km
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    value={draft.distanceKm}
                    onChange={(event) =>
                      updateDraft({
                        distanceKm: event.target.value
                      })
                    }
                    className="field-base min-h-14 text-center text-2xl font-black"
                  />
                </label>
                <label className="col-span-2 grid gap-1">
                  <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                    Intensity
                  </span>
                  <input
                    value={draft.intensity}
                    onChange={(event) =>
                      updateDraft({
                        intensity: event.target.value
                      })
                    }
                    placeholder="RPE 7, level 8, 2% incline"
                    className="field-base min-h-12"
                  />
                </label>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
                  <p className="text-xs font-black uppercase text-[color:var(--muted)]">
                    Planned weight
                  </p>
                  <p className="mt-1 text-4xl font-black">
                    {draft.weightKg || "-"}kg
                  </p>
                  <p className="mt-1 text-sm font-bold text-[color:var(--muted)]">
                    {targetLabel(currentSet, false)}
                  </p>
                </div>

                <div className="rounded-md border border-[color:var(--panel-border)] bg-[#0d1117] p-3">
                  <p className="text-xs font-black uppercase text-[color:var(--muted)]">
                    Reps
                  </p>
                  <div className="mt-2 grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft({
                          reps: String(Math.max(0, Number(draft.reps || 0) - 1))
                        })
                      }
                      className="grid min-h-14 place-items-center rounded-md border border-[color:var(--panel-border)] text-3xl font-black"
                    >
                      -
                    </button>
                    <div className="grid min-h-16 place-items-center rounded-md bg-[color:var(--panel)] text-4xl font-black">
                      {draft.reps || "0"}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft({
                          reps: String(Number(draft.reps || 0) + 1)
                        })
                      }
                      className="grid min-h-14 place-items-center rounded-md border border-[color:var(--panel-border)] text-3xl font-black"
                    >
                      +
                    </button>
                  </div>
                </div>

                <details className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-3">
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-sm font-black text-[color:var(--muted)]">
                    <span className="inline-flex items-center gap-2">
                      <Settings aria-hidden="true" className="size-4" />
                      Advanced
                    </span>
                    Override
                  </summary>
                  <div className="mt-3 grid gap-2">
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                        Override kg
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.25"
                        value={draft.weightKg}
                        onChange={(event) =>
                          updateDraft({
                            weightKg: event.target.value
                          })
                        }
                        className="field-base min-h-12 text-center text-xl font-black"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={savePlanWeight}
                      disabled={!currentSet.program_set_id}
                      className="min-h-11 rounded-md border border-[color:var(--panel-border)] px-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Use as new plan weight
                    </button>
                  </div>
                </details>
              </div>
            )}

            <button
              type="button"
              onClick={completeCurrentSet}
              disabled={savingSetId === currentSet.id}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-md bg-[color:var(--accent)] px-4 text-base font-black text-zinc-950 transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
            >
              <Check aria-hidden="true" className="size-5" />
              {currentSet.completed_at ? "Update set" : "Complete set"}
            </button>

            <RestPanel
              remaining={remainingRest}
              skipRest={() => {
                setRestEndsAt(null);
                setRemainingRest(null);
              }}
              addRest={() => {
                setRestEndsAt((current) =>
                  current ? current + 30_000 : Date.now() + 30_000
                );
                setRemainingRest((current) => (current ?? 0) + 30);
              }}
            />
          </div>
        </section>
      ) : (
        <section className="app-card-flat p-4">
          <h2 className="text-base font-black">No lifts yet</h2>
          <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
            Open Workout tools and add the first lift.
          </p>
        </section>
      )}

      <details className="border-y border-[color:var(--panel-border)] py-2">
        <summary
          onClick={() => loadExerciseCategory(addLiftCategory)}
          className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-black"
        >
          Workout tools
          <Plus aria-hidden="true" className="size-4 text-[color:var(--muted)]" />
        </summary>
        <div className="mt-3 grid gap-4">
          <form action={addExerciseToWorkout} className="grid gap-2">
            <input type="hidden" name="workoutId" value={workout.id} />
            <label className="grid gap-1">
              <span className="text-xs font-black uppercase text-[color:var(--muted)]">
                Body part
              </span>
              <select
                value={addLiftCategory}
                onChange={(event) => loadExerciseCategory(event.target.value)}
                className="field-base text-base capitalize"
              >
                {bodyPartCategories.map((category) => (
                  <option key={category} value={category}>
                    {formatExerciseCategory(category)}
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
                disabled={
                  isLoadingExerciseOptions ||
                  (exerciseOptionsByCategory[addLiftCategory] ?? []).length === 0
                }
                required
              >
                {isLoadingExerciseOptions ? <option>Loading...</option> : null}
                {!isLoadingExerciseOptions &&
                (exerciseOptionsByCategory[addLiftCategory] ?? []).length === 0 ? (
                  <option>No exercises found</option>
                ) : null}
                {(exerciseOptionsByCategory[addLiftCategory] ?? []).map(
                  (exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                      {exercise.is_builtin ? "" : " (custom)"}
                    </option>
                  )
                )}
              </select>
            </label>
            <FormSubmitButton
              disabled={
                isLoadingExerciseOptions ||
                (exerciseOptionsByCategory[addLiftCategory] ?? []).length === 0
              }
              pendingLabel="Adding..."
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-[color:var(--accent)] px-4 text-sm font-black text-zinc-950 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            >
              Add lift
            </FormSubmitButton>
          </form>

          <div className="grid gap-2">
            <form action={finishWorkout}>
              <input type="hidden" name="workoutId" value={workout.id} />
              <FormSubmitButton
                pendingLabel="Completing..."
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-black disabled:cursor-wait disabled:opacity-70"
              >
                <Flag aria-hidden="true" className="size-4" />
                Finish early
              </FormSubmitButton>
            </form>
            <Link
              href="/workouts"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-black"
            >
              <History aria-hidden="true" className="size-4" />
              History
            </Link>
            <form action={cancelActiveWorkout}>
              <input type="hidden" name="workoutId" value={workout.id} />
              <FormSubmitButton
                pendingLabel="Cancelling..."
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[color:var(--danger)]/50 px-4 text-sm font-black text-red-200 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
              >
                <X aria-hidden="true" className="size-4" />
                Cancel workout
              </FormSubmitButton>
            </form>
          </div>
        </div>
      </details>

      <details className="app-card-flat p-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-black">
          Full workout
          <span className="text-xs text-[color:var(--muted)]">
            Add, reorder, edit
          </span>
        </summary>
        <div className="mt-3 space-y-3">
        {workout.workoutExercises.map((exercise, index) => {
          const done = completedCount(exercise);
          const isExpanded = expandedCompleted.has(exercise.id);
          const isComplete = done === exercise.sets.length && exercise.sets.length > 0;
          const lastCompleted = [...exercise.sets]
            .reverse()
            .find((set) => set.completed_at);

          return (
            <article key={exercise.id} className="app-card-flat overflow-hidden">
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black">
                    {exercise.exercise_name_snapshot}
                  </h3>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {done}/{exercise.sets.length} completed
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => moveExercise(exercise.id, "up")}
                    disabled={index === 0 || isReordering}
                    className="inline-flex size-10 items-center justify-center rounded-xl border border-[color:var(--panel-border)] text-[color:var(--muted)] disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Move exercise up today"
                  >
                    <ArrowUp aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveExercise(exercise.id, "down")}
                    disabled={
                      index === workout.workoutExercises.length - 1 ||
                      isReordering
                    }
                    className="inline-flex size-10 items-center justify-center rounded-xl border border-[color:var(--panel-border)] text-[color:var(--muted)] disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Move exercise down today"
                  >
                    <ArrowDown aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveExercise(exercise.id, "later")}
                    disabled={
                      index === workout.workoutExercises.length - 1 ||
                      isReordering
                    }
                    className="min-h-10 rounded-xl border border-[color:var(--panel-border)] px-2 text-xs font-black text-[color:var(--muted)] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Later
                  </button>
                  {isComplete ? (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCompleted((current) => {
                          const next = new Set(current);
                          if (next.has(exercise.id)) {
                            next.delete(exercise.id);
                          } else {
                            next.add(exercise.id);
                          }
                          return next;
                        })
                      }
                      className="min-h-10 rounded-xl border border-[color:var(--panel-border)] px-3 text-xs font-black"
                    >
                      Edit
                    </button>
                  ) : null}
                  {lastCompleted ? (
                    <button
                      type="button"
                      onClick={() => undoSet(exercise.id, lastCompleted.id)}
                      className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-[color:var(--panel-border)] px-3 text-xs font-black"
                    >
                      <RotateCcw aria-hidden="true" className="size-3.5" />
                      Undo
                    </button>
                  ) : null}
                </div>
              </div>

              {!isComplete || isExpanded ? (
                <div className="space-y-2 border-t border-[color:var(--panel-border)] p-3">
                  {exercise.sets.map((set) => (
                    <button
                      type="button"
                      key={set.id}
                      onClick={() =>
                        setFocus({ exerciseId: exercise.id, setId: set.id })
                      }
                      className="grid min-h-12 w-full grid-cols-[2.25rem_1fr_auto] items-center gap-2 rounded-xl border border-[color:var(--panel-border)] px-2 text-left transition active:scale-[0.99]"
                    >
                      <span
                        className={`grid size-9 place-items-center rounded-lg text-sm font-black ${
                          set.completed_at
                            ? "bg-[color:var(--success)] text-zinc-950"
                            : "bg-[color:var(--panel)]"
                        }`}
                      >
                        {set.sort_order}
                      </span>
                      <span className="min-w-0 truncate text-sm font-bold">
                        {set.completed_at
                          ? loggedLabel(set, exercise.exercise_category === "cardio")
                          : targetLabel(set, exercise.exercise_category === "cardio")}
                      </span>
                      <span className="text-xs font-black text-[color:var(--accent)]">
                        {set.completed_at ? "Completed" : "Edit"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-2 border-t border-[color:var(--panel-border)] p-3">
                <button
                  type="button"
                  onClick={() => addSetToExercise(exercise.id)}
                  disabled={pendingSetMutationId === exercise.id}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-[color:var(--panel-border)] px-2 text-xs font-black disabled:cursor-wait disabled:opacity-70"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  {pendingSetMutationId === exercise.id ? "Adding..." : "Set"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    addSetToExercise(exercise.id, exercise.sets.at(-1)?.id)
                  }
                  disabled={
                    pendingSetMutationId === exercise.id ||
                    exercise.sets.length === 0
                  }
                  className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-[color:var(--panel-border)] px-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Repeat2 aria-hidden="true" className="size-4" />
                  {pendingSetMutationId === exercise.id ? "Copying..." : "Copy"}
                </button>
                <form action={removeWorkoutExercise}>
                  <input
                    type="hidden"
                    name="workoutExerciseId"
                    value={exercise.id}
                  />
                  <FormSubmitButton
                    pendingLabel="..."
                    className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-[color:var(--danger)]/50 px-2 text-xs font-black text-red-200"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    Lift
                  </FormSubmitButton>
                </form>
              </div>
            </article>
          );
        })}
        </div>
      </details>

      {readyToFinish ? (
        <div className="fixed inset-x-0 bottom-[5.75rem] z-20 px-4">
          <div className="mx-auto max-w-md rounded-md border border-[color:var(--panel-border)] bg-[#080a0d]/95 p-2 backdrop-blur-xl">
            <form action={finishWorkout}>
              <input type="hidden" name="workoutId" value={workout.id} />
              <FormSubmitButton pendingLabel="Completing...">
                <Flag aria-hidden="true" className="size-5" />
                Complete workout
              </FormSubmitButton>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
