"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
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

  return ((data as { sort_order?: number } | null)?.sort_order ?? 0) + 1;
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
      .select("set_type, weight_kg, reps, rpe, rir, rest_seconds, notes")
      .eq("id", copySetId)
      .maybeSingle();
    copiedSet = data;
  }

  await supabase.from("workout_sets").insert({
    completed_at: new Date().toISOString(),
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
    .select("id, workout_sets(weight_kg, reps, completed_at)")
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
  redirect(`/workouts/${workoutId}`);
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
