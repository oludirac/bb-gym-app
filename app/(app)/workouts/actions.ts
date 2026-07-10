"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { bodyPartCategorySet } from "@/lib/exercises/categories";
import { getProgramDetail } from "@/lib/programs/queries";

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalSecondsFromMinutes(value: string) {
  const minutes = optionalNumber(value);
  return minutes === null ? null : Math.round(minutes * 60);
}

function optionalNumberFromValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalSecondsFromMinuteValue(
  value: number | string | null | undefined
) {
  const minutes = optionalNumberFromValue(value);
  return minutes === null ? null : Math.round(minutes * 60);
}

type InlineWorkoutSetInput = {
  distanceKm?: number | string | null;
  durationMinutes?: number | string | null;
  intensity?: string | null;
  reps?: number | string | null;
  restSeconds?: number | string | null;
  setId: string;
  weightKg?: number | string | null;
};

type InlineWorkoutSetMutationInput = {
  copySetId?: string | null;
  workoutExerciseId: string;
};

async function nextSortOrder(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  table: string,
  parentColumn: string,
  parentId: string
) {
  const { data } = await supabase
    .from(table)
    .select("sort_order")
    .eq(parentColumn, parentId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data as { sort_order?: number } | null)?.sort_order ?? 0) + 1000;
}

async function advanceProgramEnrollment(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  enrollmentId: string,
  programDayId: string
) {
  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("id, program_id")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (!enrollment?.program_id) {
    return;
  }

  const program = await getProgramDetail(supabase, enrollment.program_id);

  if (!program) {
    return;
  }

  const orderedDays = program.weeks.flatMap((week) =>
    week.days.map((day) => ({
      dayId: day.id,
      dayNumber: day.day_number,
      weekNumber: week.week_number
    }))
  );
  const currentIndex = orderedDays.findIndex(
    (day) => day.dayId === programDayId
  );

  if (program.schedule_type === "calendar") {
    return;
  }

  const nextDay = orderedDays[currentIndex + 1];

  if (nextDay) {
    await supabase
      .from("program_enrollments")
      .update({
        current_day: nextDay.dayNumber,
        current_week: nextDay.weekNumber
      })
      .eq("id", enrollmentId);
    return;
  }

  const firstDay = orderedDays[0];

  if (firstDay) {
    await supabase
      .from("program_enrollments")
      .update({
        current_day: firstDay.dayNumber,
        current_week: firstDay.weekNumber
      })
      .eq("id", enrollmentId);
    return;
  }

  await supabase
    .from("program_enrollments")
    .update({
      completed_at: new Date().toISOString(),
      status: "completed"
    })
    .eq("id", enrollmentId);

  await supabase
    .from("user_settings")
    .update({ active_program_enrollment_id: null })
    .eq("active_program_enrollment_id", enrollmentId);
}

type WorkoutExerciseForProgression = {
  program_exercise_id: string | null;
  sort_order: number;
  workout_sets:
    | {
        completed_at: string | null;
        program_set_id: string | null;
        reps: number | null;
        sort_order: number;
        weight_kg: number | null;
      }[]
    | null;
};

async function applyDoubleProgression(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  programDayId: string,
  workoutExercises: WorkoutExerciseForProgression[]
) {
  const { data: programExercises } = await supabase
    .from("program_exercises")
    .select(
      `
        id,
        progression_style,
        sort_order,
        weight_increment_kg,
        program_sets (
          id,
          progression_track_id,
          set_type,
          sort_order,
          target_reps_min,
          target_reps_max,
          target_weight_kg
        )
      `
    )
    .eq("program_day_id", programDayId);

  const workoutExerciseByProgramId = new Map(
    workoutExercises
      .filter((exercise) => exercise.program_exercise_id)
      .map((exercise) => [exercise.program_exercise_id, exercise])
  );
  const updates: PromiseLike<unknown>[] = [];

  for (const programExercise of programExercises ?? []) {
    const workoutExercise = workoutExerciseByProgramId.get(programExercise.id);

    if (!workoutExercise || programExercise.progression_style === "fixed") {
      continue;
    }

    const workoutSetByProgramId = new Map(
      (workoutExercise.workout_sets ?? [])
        .filter((set) => set.program_set_id)
        .map((set) => [set.program_set_id, set])
    );
    const programSets = [...(programExercise.program_sets ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    let index = 0;

    while (index < programSets.length) {
      const first = programSets[index];
      let lastIndex = index;
      const progressionTrackId = first.progression_track_id ?? null;
      const targetWeight =
        first.target_weight_kg === null
          ? null
          : Number(first.target_weight_kg);

      while (
        lastIndex + 1 < programSets.length &&
        (progressionTrackId
          ? programSets[lastIndex + 1].progression_track_id ===
            progressionTrackId
          : programSets[lastIndex + 1].target_weight_kg ===
              first.target_weight_kg &&
            programSets[lastIndex + 1].target_reps_min ===
              first.target_reps_min &&
            programSets[lastIndex + 1].target_reps_max ===
              first.target_reps_max)
      ) {
        lastIndex += 1;
      }

      const group = programSets.slice(index, lastIndex + 1);

      if (
        targetWeight === null ||
        first.target_reps_max === null ||
        group.some((set) => set.set_type !== "working")
      ) {
        index = lastIndex + 1;
        continue;
      }

      const groupCompleted = group.every((programSet) => {
        const workoutSet = workoutSetByProgramId.get(programSet.id);
        return (
          Boolean(workoutSet?.completed_at) &&
          workoutSet?.reps !== null &&
          workoutSet?.reps !== undefined &&
          workoutSet.reps >= Number(programSet.target_reps_max)
        );
      });

      if (groupCompleted) {
        const nextWeight =
          targetWeight + Number(programExercise.weight_increment_kg ?? 2.5);

        if (progressionTrackId) {
          updates.push(
            supabase
              .from("progression_tracks")
              .update({ current_weight_kg: nextWeight })
              .eq("id", progressionTrackId)
              .then(() => undefined)
          );
          updates.push(
            supabase
              .from("program_sets")
              .update({ target_weight_kg: nextWeight })
              .eq("progression_track_id", progressionTrackId)
              .then(() => undefined)
          );
        } else {
          updates.push(
            supabase
              .from("program_sets")
              .update({ target_weight_kg: nextWeight })
              .in(
                "id",
                group.map((set) => set.id)
              )
              .then(() => undefined)
          );
        }
      }

      index = lastIndex + 1;
    }
  }

  await Promise.all(updates);
}

async function moveWorkoutExerciseById(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  workoutExerciseId: string,
  direction: "down" | "later" | "up"
) {
  const { data: current } = await supabase
    .from("workout_exercises")
    .select("id, workout_id, sort_order")
    .eq("id", workoutExerciseId)
    .maybeSingle();

  if (!current) {
    return;
  }

  const { data } = await supabase
    .from("workout_exercises")
    .select("id, sort_order")
    .eq("workout_id", current.workout_id)
    .order("sort_order", { ascending: true });
  const exercises = data ?? [];

  if (direction === "later") {
    const maxOrder = Math.max(...exercises.map((exercise) => exercise.sort_order));

    if (current.sort_order === maxOrder) {
      return;
    }

    await supabase
      .from("workout_exercises")
      .update({ sort_order: maxOrder + 1000 })
      .eq("id", current.id);
  } else {
    const currentIndex = exercises.findIndex(
      (exercise) => exercise.id === current.id
    );
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const target = exercises[targetIndex];

    if (!target) {
      return;
    }

    const temporarySortOrder =
      Math.max(...exercises.map((exercise) => exercise.sort_order)) + 1000;

    await supabase
      .from("workout_exercises")
      .update({ sort_order: temporarySortOrder })
      .eq("id", current.id);

    await supabase
      .from("workout_exercises")
      .update({ sort_order: current.sort_order })
      .eq("id", target.id);

    await supabase
      .from("workout_exercises")
      .update({ sort_order: target.sort_order })
      .eq("id", current.id);
  }

}

export async function moveWorkoutExerciseInline(input: {
  direction: "down" | "later" | "up";
  workoutExerciseId: string;
}) {
  const { supabase } = await requireUser();

  if (!["down", "later", "up"].includes(input.direction)) {
    return { ok: false };
  }

  await moveWorkoutExerciseById(
    supabase,
    input.workoutExerciseId,
    input.direction
  );

  return { ok: true };
}

export async function saveWorkoutSetWeightAsPlanWeight(input: {
  programSetId: string | null;
  weightKg: number | string | null;
}) {
  const { supabase } = await requireUser();
  const weightKg = optionalNumberFromValue(input.weightKg);

  if (!input.programSetId || weightKg === null) {
    return { ok: false };
  }

  await supabase
    .from("program_sets")
    .update({ target_weight_kg: weightKg })
    .eq("id", input.programSetId);

  revalidatePath("/programs");
  revalidatePath("/programs/active");
  return { ok: true, weightKg };
}

export async function getExerciseOptionsForCategory(category: string) {
  const { supabase } = await requireUser();

  if (!bodyPartCategorySet.has(category)) {
    return { ok: false, options: [] };
  }

  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, is_builtin, category")
    .eq("category", category)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    return { ok: false, options: [] };
  }

  return { ok: true, options: data ?? [] };
}

export async function startBlankWorkout() {
  const { supabase, user } = await requireUser();
  const { data: existing } = await supabase
    .from("workouts")
    .select("id")
    .eq("status", "active")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing?.id) {
    redirect("/workouts/active");
  }

  const today = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(new Date());

  await supabase.from("workouts").insert({
    name: `Workout ${today}`,
    owner_id: user.id,
    status: "active"
  });

  revalidatePath("/workouts/active");
  redirect("/workouts/active");
}

export async function addExerciseToWorkout(formData: FormData) {
  const { supabase } = await requireUser();
  const workoutId = fieldValue(formData, "workoutId");
  const exerciseId = fieldValue(formData, "exerciseId");

  if (!workoutId || !exerciseId) {
    redirect("/workouts/active");
  }

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, name")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!exercise) {
    redirect("/workouts/active");
  }

  const sortOrder = await nextSortOrder(
    supabase,
    "workout_exercises",
    "workout_id",
    workoutId
  );

  await supabase.from("workout_exercises").insert({
    exercise_id: exercise.id,
    exercise_name_snapshot: exercise.name,
    sort_order: sortOrder,
    workout_id: workoutId
  });

  revalidatePath("/workouts/active");
  redirect("/workouts/active");
}

export async function addWorkoutSet(formData: FormData) {
  const { supabase } = await requireUser();
  const workoutExerciseId = fieldValue(formData, "workoutExerciseId");
  const copySetId = fieldValue(formData, "copySetId");

  if (!workoutExerciseId) {
    redirect("/workouts/active");
  }

  const sortOrder = await nextSortOrder(
    supabase,
    "workout_sets",
    "workout_exercise_id",
    workoutExerciseId
  );
  let copiedSet = null;

  if (copySetId) {
    const { data } = await supabase
      .from("workout_sets")
      .select(
        "set_type, weight_kg, reps, duration_seconds, distance_km, intensity, rpe, rir, rest_seconds, notes"
      )
      .eq("id", copySetId)
      .maybeSingle();
    copiedSet = data;
  }

  await supabase.from("workout_sets").insert({
    completed_at: null,
    distance_km: copiedSet?.distance_km ?? null,
    duration_seconds: copiedSet?.duration_seconds ?? null,
    intensity: copiedSet?.intensity ?? null,
    reps: copiedSet?.reps ?? null,
    rest_seconds: copiedSet?.rest_seconds ?? null,
    rir: copiedSet?.rir ?? null,
    rpe: copiedSet?.rpe ?? null,
    set_type: copiedSet?.set_type ?? "working",
    sort_order: sortOrder,
    weight_kg: copiedSet?.weight_kg ?? null,
    workout_exercise_id: workoutExerciseId
  });

  revalidatePath("/workouts/active");
  redirect("/workouts/active");
}

export async function addWorkoutSetInline(input: InlineWorkoutSetMutationInput) {
  const { supabase } = await requireUser();

  if (!input.workoutExerciseId) {
    return { error: "Missing workout exercise.", ok: false };
  }

  const sortOrder = await nextSortOrder(
    supabase,
    "workout_sets",
    "workout_exercise_id",
    input.workoutExerciseId
  );
  let copiedSet = null;

  if (input.copySetId) {
    const { data } = await supabase
      .from("workout_sets")
      .select(
        "set_type, weight_kg, reps, duration_seconds, distance_km, intensity, rpe, rir, rest_seconds, notes"
      )
      .eq("id", input.copySetId)
      .maybeSingle();
    copiedSet = data;
  }

  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      completed_at: null,
      distance_km: copiedSet?.distance_km ?? null,
      duration_seconds: copiedSet?.duration_seconds ?? null,
      intensity: copiedSet?.intensity ?? null,
      reps: copiedSet?.reps ?? null,
      rest_seconds: copiedSet?.rest_seconds ?? null,
      rir: copiedSet?.rir ?? null,
      rpe: copiedSet?.rpe ?? null,
      set_type: copiedSet?.set_type ?? "working",
      sort_order: sortOrder,
      weight_kg: copiedSet?.weight_kg ?? null,
      workout_exercise_id: input.workoutExerciseId
    })
    .select(
      "id, program_set_id, sort_order, set_type, duration_seconds, distance_km, intensity, weight_kg, reps, rest_seconds, rpe, rir, notes, completed_at"
    )
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Could not add set.",
      ok: false
    };
  }

  return {
    ok: true,
    set: {
      ...data,
      distance_km: data.distance_km === null ? null : Number(data.distance_km),
      previous_reps: null,
      previous_weight_kg: null,
      rir: data.rir === null ? null : Number(data.rir),
      rpe: data.rpe === null ? null : Number(data.rpe),
      target_distance_km: null,
      target_duration_seconds: null,
      target_intensity: null,
      target_reps_max: null,
      target_reps_min: null,
      target_weight_kg: null,
      weight_kg: data.weight_kg === null ? null : Number(data.weight_kg)
    }
  };
}

export async function saveWorkoutSet(formData: FormData) {
  const { supabase } = await requireUser();
  const setId = fieldValue(formData, "setId");

  if (!setId) {
    redirect("/workouts/active");
  }

  await supabase
    .from("workout_sets")
    .update({
      completed_at: new Date().toISOString(),
      distance_km: optionalNumber(fieldValue(formData, "distanceKm")),
      duration_seconds: optionalSecondsFromMinutes(
        fieldValue(formData, "durationMinutes")
      ),
      intensity: fieldValue(formData, "intensity") || null,
      notes: fieldValue(formData, "notes") || null,
      reps: optionalNumber(fieldValue(formData, "reps")),
      rest_seconds: optionalNumber(fieldValue(formData, "restSeconds")),
      rir: optionalNumber(fieldValue(formData, "rir")),
      rpe: optionalNumber(fieldValue(formData, "rpe")),
      set_type: fieldValue(formData, "setType") || "working",
      weight_kg: optionalNumber(fieldValue(formData, "weightKg"))
    })
    .eq("id", setId);

  revalidatePath("/workouts/active");
  redirect("/workouts/active");
}

export async function completeWorkoutSetInline(input: InlineWorkoutSetInput) {
  const { supabase } = await requireUser();

  if (!input.setId) {
    return { error: "Missing set.", ok: false };
  }

  const completedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("workout_sets")
    .update({
      completed_at: completedAt,
      distance_km: optionalNumberFromValue(input.distanceKm),
      duration_seconds: optionalSecondsFromMinuteValue(input.durationMinutes),
      intensity: input.intensity?.trim() || null,
      reps: optionalNumberFromValue(input.reps),
      rest_seconds: optionalNumberFromValue(input.restSeconds),
      weight_kg: optionalNumberFromValue(input.weightKg)
    })
    .eq("id", input.setId)
    .select(
      "id, completed_at, distance_km, duration_seconds, intensity, reps, rest_seconds, weight_kg"
    )
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not save set.", ok: false };
  }

  return {
    ok: true,
    set: {
      ...data,
      distance_km: data.distance_km === null ? null : Number(data.distance_km),
      weight_kg: data.weight_kg === null ? null : Number(data.weight_kg)
    }
  };
}

export async function undoWorkoutSetInline(setId: string) {
  const { supabase } = await requireUser();

  if (!setId) {
    return { error: "Missing set.", ok: false };
  }

  const { data, error } = await supabase
    .from("workout_sets")
    .update({
      completed_at: null
    })
    .eq("id", setId)
    .select("id, completed_at")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not undo set.", ok: false };
  }

  return { ok: true, set: data };
}

export async function deleteWorkoutSet(formData: FormData) {
  const { supabase } = await requireUser();
  const setId = fieldValue(formData, "setId");

  if (setId) {
    await supabase.from("workout_sets").delete().eq("id", setId);
  }

  revalidatePath("/workouts/active");
  redirect("/workouts/active");
}

export async function removeWorkoutExercise(formData: FormData) {
  const { supabase } = await requireUser();
  const workoutExerciseId = fieldValue(formData, "workoutExerciseId");

  if (workoutExerciseId) {
    await supabase
      .from("workout_exercises")
      .delete()
      .eq("id", workoutExerciseId);
  }

  revalidatePath("/workouts/active");
  redirect("/workouts/active");
}

export async function finishWorkout(formData: FormData) {
  const { supabase } = await requireUser();
  const workoutId = fieldValue(formData, "workoutId");

  if (!workoutId) {
    redirect("/workouts/active");
  }

  const { data: workoutMeta } = await supabase
    .from("workouts")
    .select("program_day_id, program_enrollment_id")
    .eq("id", workoutId)
    .maybeSingle();

  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select(
      "id, program_exercise_id, sort_order, workout_sets(program_set_id, sort_order, weight_kg, reps, completed_at)"
    )
    .eq("workout_id", workoutId);

  const totalVolumeKg = (exercises ?? []).reduce((total, exercise) => {
    const sets = (exercise.workout_sets ?? []) as {
      reps: number | null;
      weight_kg: number | null;
      completed_at: string | null;
    }[];

    return (
      total +
      sets.reduce((setTotal, set) => {
        if (!set.completed_at) {
          return setTotal;
        }

        return setTotal + Number(set.weight_kg ?? 0) * Number(set.reps ?? 0);
      }, 0)
    );
  }, 0);

  await supabase
    .from("workouts")
    .update({
      finished_at: new Date().toISOString(),
      status: "completed",
      total_volume_kg: totalVolumeKg
    })
    .eq("id", workoutId);

  if (workoutMeta?.program_enrollment_id && workoutMeta.program_day_id) {
    await applyDoubleProgression(
      supabase,
      workoutMeta.program_day_id,
      (exercises ?? []) as WorkoutExerciseForProgression[]
    );

    await advanceProgramEnrollment(
      supabase,
      workoutMeta.program_enrollment_id,
      workoutMeta.program_day_id
    );
  }

  revalidatePath("/workouts");
  revalidatePath("/workouts/active");
  revalidatePath("/dashboard");
  revalidatePath("/programs");
  revalidatePath("/programs/active");
  revalidatePath("/progress");
  redirect(`/workouts/${workoutId}`);
}

export async function cancelActiveWorkout(formData: FormData) {
  const { supabase, user } = await requireUser();
  const workoutId = fieldValue(formData, "workoutId");

  if (!workoutId) {
    redirect("/workouts/active");
  }

  await supabase
    .from("workouts")
    .update({
      finished_at: new Date().toISOString(),
      status: "discarded"
    })
    .eq("id", workoutId)
    .eq("owner_id", user.id)
    .eq("status", "active");

  revalidatePath("/dashboard");
  revalidatePath("/workouts");
  revalidatePath("/workouts/active");
  revalidatePath("/programs/active");
  revalidatePath("/progress");
  redirect("/dashboard");
}

export async function deleteWorkout(formData: FormData) {
  const { supabase } = await requireUser();
  const workoutId = fieldValue(formData, "workoutId");

  if (workoutId) {
    await supabase.from("workouts").delete().eq("id", workoutId);
  }

  revalidatePath("/workouts");
  redirect("/workouts");
}
