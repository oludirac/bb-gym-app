"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getProgramDetail } from "@/lib/programs/queries";

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function fieldNumber(formData: FormData, key: string) {
  const value = Number(fieldValue(formData, key));
  return Number.isFinite(value) ? value : null;
}

export async function copyProgram(formData: FormData) {
  const { supabase, user } = await requireUser();
  const programId = fieldValue(formData, "programId");

  if (!programId) {
    redirect("/programs");
  }

  const program = await getProgramDetail(supabase, programId);

  if (!program) {
    redirect("/programs");
  }

  const { data: copiedProgram } = await supabase
    .from("programs")
    .insert({
      avg_session_minutes: program.avg_session_minutes,
      copied_from_program_id: program.id,
      days_per_week: program.days_per_week,
      description: program.description,
      difficulty: program.difficulty,
      equipment_required: program.equipment_required,
      is_public: false,
      name: program.name,
      owner_id: user.id
    })
    .select("id")
    .single();

  if (!copiedProgram?.id) {
    redirect("/programs");
  }

  if (program.categories.length > 0) {
    await supabase.from("program_categories").insert(
      program.categories.map((category) => ({
        category,
        program_id: copiedProgram.id
      }))
    );
  }

  for (const week of program.weeks) {
    const { data: copiedWeek } = await supabase
      .from("program_weeks")
      .insert({
        notes: week.notes,
        program_id: copiedProgram.id,
        week_number: week.week_number
      })
      .select("id")
      .single();

    if (!copiedWeek?.id) {
      continue;
    }

    for (const day of week.days) {
      const { data: copiedDay } = await supabase
        .from("program_days")
        .insert({
          day_number: day.day_number,
          focus: day.focus,
          name: day.name,
          notes: day.notes,
          program_week_id: copiedWeek.id
        })
        .select("id")
        .single();

      if (!copiedDay?.id) {
        continue;
      }

      for (const exercise of day.exercises) {
        const { data: copiedExercise } = await supabase
          .from("program_exercises")
          .insert({
            exercise_id: exercise.exercise_id,
            notes: exercise.notes,
            program_day_id: copiedDay.id,
            sort_order: exercise.sort_order
          })
          .select("id")
          .single();

        if (!copiedExercise?.id || exercise.sets.length === 0) {
          continue;
        }

        await supabase.from("program_sets").insert(
          exercise.sets.map((set) => ({
            notes: set.notes,
            program_exercise_id: copiedExercise.id,
            rest_seconds: set.rest_seconds,
            set_type: set.set_type,
            sort_order: set.sort_order,
            target_reps_max: set.target_reps_max,
            target_reps_min: set.target_reps_min,
            target_rir: set.target_rir,
            target_rpe: set.target_rpe,
            target_weight_kg: set.target_weight_kg
          }))
        );
      }
    }
  }

  revalidatePath("/programs");
  redirect(`/programs/${copiedProgram.id}`);
}

export async function enrollProgram(formData: FormData) {
  const { supabase, user } = await requireUser();
  const programId = fieldValue(formData, "programId");

  if (!programId) {
    redirect("/programs");
  }

  await supabase
    .from("program_enrollments")
    .update({ status: "paused" })
    .eq("status", "active");

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .insert({
      current_day: 1,
      current_week: 1,
      program_id: programId,
      status: "active",
      user_id: user.id
    })
    .select("id")
    .single();

  if (enrollment?.id) {
    await supabase
      .from("user_settings")
      .update({ active_program_enrollment_id: enrollment.id })
      .eq("user_id", user.id);
  }

  revalidatePath("/programs");
  revalidatePath("/programs/active");
  redirect("/programs/active");
}

export async function setActiveProgramDay(formData: FormData) {
  const { supabase } = await requireUser();
  const enrollmentId = fieldValue(formData, "enrollmentId");
  const weekNumber = fieldNumber(formData, "weekNumber");
  const dayNumber = fieldNumber(formData, "dayNumber");

  if (!enrollmentId || !weekNumber || !dayNumber) {
    redirect("/programs/active");
  }

  await supabase
    .from("program_enrollments")
    .update({
      current_day: dayNumber,
      current_week: weekNumber
    })
    .eq("id", enrollmentId);

  revalidatePath("/programs/active");
  redirect("/programs/active");
}

export async function completeProgramEnrollment(formData: FormData) {
  const { supabase, user } = await requireUser();
  const enrollmentId = fieldValue(formData, "enrollmentId");

  if (enrollmentId) {
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
      .eq("user_id", user.id);
  }

  revalidatePath("/programs");
  revalidatePath("/programs/active");
  redirect("/programs");
}

export async function startWorkoutFromProgramDay(formData: FormData) {
  const { supabase, user } = await requireUser();
  const enrollmentId = fieldValue(formData, "enrollmentId");
  const programDayId = fieldValue(formData, "programDayId");

  if (!enrollmentId || !programDayId) {
    redirect("/programs/active");
  }

  const { data: activeWorkout } = await supabase
    .from("workouts")
    .select("id")
    .eq("status", "active")
    .maybeSingle();

  if (activeWorkout?.id) {
    redirect("/workouts/active");
  }

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("id, program_id")
    .eq("id", enrollmentId)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) {
    redirect("/programs/active");
  }

  const program = await getProgramDetail(supabase, enrollment.program_id);
  const programDay = program?.weeks
    .flatMap((week) => week.days)
    .find((day) => day.id === programDayId);

  if (!program || !programDay) {
    redirect("/programs/active");
  }

  const { data: workout } = await supabase
    .from("workouts")
    .insert({
      name: `${program.name} - ${programDay.name}`,
      owner_id: user.id,
      program_day_id: programDay.id,
      program_enrollment_id: enrollment.id,
      status: "active"
    })
    .select("id")
    .single();

  if (!workout?.id) {
    redirect("/programs/active");
  }

  for (const exercise of programDay.exercises) {
    const { data: workoutExercise } = await supabase
      .from("workout_exercises")
      .insert({
        exercise_id: exercise.exercise_id,
        exercise_name_snapshot: exercise.exercise_name,
        notes: exercise.notes,
        sort_order: exercise.sort_order,
        workout_id: workout.id
      })
      .select("id")
      .single();

    if (!workoutExercise?.id || exercise.sets.length === 0) {
      continue;
    }

    await supabase.from("workout_sets").insert(
      exercise.sets.map((set) => ({
        notes: set.notes,
        reps: set.target_reps_min ?? set.target_reps_max,
        rest_seconds: set.rest_seconds,
        rir: set.target_rir,
        rpe: set.target_rpe,
        set_type: set.set_type,
        sort_order: set.sort_order,
        weight_kg: set.target_weight_kg,
        workout_exercise_id: workoutExercise.id
      }))
    );
  }

  revalidatePath("/workouts/active");
  redirect("/workouts/active");
}
