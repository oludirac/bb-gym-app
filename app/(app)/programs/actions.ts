"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import {
  getProgramDetail,
  type ProgramScheduleType
} from "@/lib/programs/queries";

const setTypes = new Set(["warmup", "working", "drop", "failure"]);
const scheduleTypes = new Set<ProgramScheduleType>(["calendar", "sequence"]);

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function fieldNumber(formData: FormData, key: string) {
  const value = Number(fieldValue(formData, key));
  return Number.isFinite(value) ? value : null;
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

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function todayDate() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function parseScheduleType(value: string): ProgramScheduleType {
  return scheduleTypes.has(value as ProgramScheduleType)
    ? (value as ProgramScheduleType)
    : "sequence";
}

function parseSetType(value: string) {
  return setTypes.has(value) ? value : "working";
}

function collectNewPlanDays(formData: FormData) {
  return Array.from({ length: 7 }, (_, index) => {
    const row = index + 1;
    return {
      day_number: row,
      name: fieldValue(formData, `dayName_${row}`),
      weekday: fieldNumber(formData, `weekday_${row}`)
    };
  }).filter((day) => day.name);
}

function validateCalendarWeekdays(
  rows: { name: string; weekday: number | null }[],
  errorPath: string
) {
  const weekdays = rows.map((row) => row.weekday);

  if (weekdays.some((weekday) => !weekday || weekday < 1 || weekday > 7)) {
    redirectWithError(errorPath, "Choose a weekday for each plan day.");
  }

  if (new Set(weekdays).size !== weekdays.length) {
    redirectWithError(errorPath, "Each weekday can only be used once.");
  }
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

async function nextDayNumber(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  programWeekId: string
) {
  const { data } = await supabase
    .from("program_days")
    .select("day_number")
    .eq("program_week_id", programWeekId)
    .order("day_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data as { day_number?: number } | null)?.day_number ?? 0) + 1;
}

async function firstProgramWeekId(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  programId: string
) {
  const { data } = await supabase
    .from("program_weeks")
    .select("id")
    .eq("program_id", programId)
    .order("week_number", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    return data.id as string;
  }

  const { data: week } = await supabase
    .from("program_weeks")
    .insert({
      program_id: programId,
      week_number: 1
    })
    .select("id")
    .single();

  return week?.id as string | undefined;
}

export async function createProgram(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = fieldValue(formData, "name");
  const description = fieldValue(formData, "description") || null;
  const scheduleType = parseScheduleType(fieldValue(formData, "scheduleType"));
  const days = collectNewPlanDays(formData);

  if (!name) {
    redirectWithError("/programs/new", "Plan name is required.");
  }

  if (days.length === 0) {
    redirectWithError("/programs/new", "Add at least one workout day.");
  }

  if (scheduleType === "calendar") {
    validateCalendarWeekdays(days, "/programs/new");
  }

  const { data: program, error: programError } = await supabase
    .from("programs")
    .insert({
      days_per_week: scheduleType === "calendar" ? days.length : null,
      description,
      is_public: false,
      name,
      owner_id: user.id,
      schedule_type: scheduleType
    })
    .select("id")
    .single();

  if (programError || !program?.id) {
    redirectWithError("/programs/new", programError?.message ?? "Could not create plan.");
  }

  const { data: week } = await supabase
    .from("program_weeks")
    .insert({
      program_id: program.id,
      week_number: 1
    })
    .select("id")
    .single();

  if (!week?.id) {
    redirectWithError("/programs/new", "Could not create plan week.");
  }

  for (const day of days) {
    const { data: programDay } = await supabase
      .from("program_days")
      .insert({
        day_number: day.day_number,
        name: day.name,
        program_week_id: week.id
      })
      .select("id")
      .single();

    if (scheduleType === "calendar" && programDay?.id && day.weekday) {
      await supabase.from("program_day_schedules").insert({
        program_day_id: programDay.id,
        program_id: program.id,
        weekday: day.weekday
      });
    }
  }

  revalidatePath("/programs");
  redirect(`/programs/${program.id}/edit`);
}

export async function updateProgramBasics(formData: FormData) {
  const { supabase } = await requireUser();
  const programId = fieldValue(formData, "programId");
  const name = fieldValue(formData, "name");
  const description = fieldValue(formData, "description") || null;
  const scheduleType = parseScheduleType(fieldValue(formData, "scheduleType"));
  const errorPath = programId ? `/programs/${programId}/edit` : "/programs";

  if (!programId || !name) {
    redirectWithError(errorPath, "Plan name is required.");
  }

  const program = await getProgramDetail(supabase, programId);

  if (!program || program.is_public) {
    redirect("/programs");
  }

  const allSchedules = program.weeks
    .flatMap((week) => week.days)
    .map((day) => ({
      dayId: day.id,
      name: day.name,
      weekday: fieldNumber(formData, `weekday_${day.id}`)
    }));

  if (scheduleType === "calendar") {
    validateCalendarWeekdays(
      allSchedules.map((schedule) => ({
        name: schedule.name,
        weekday: schedule.weekday
      })),
      errorPath
    );
  }

  const schedules = allSchedules.filter(
    (schedule): schedule is {
      dayId: string;
      name: string;
      weekday: number;
    } => Boolean(schedule.weekday)
  );

  await supabase
    .from("programs")
    .update({
      days_per_week: scheduleType === "calendar" ? schedules.length : null,
      description,
      name,
      schedule_type: scheduleType
    })
    .eq("id", programId);

  await supabase
    .from("program_day_schedules")
    .delete()
    .eq("program_id", programId);

  if (scheduleType === "calendar" && schedules.length > 0) {
    await supabase.from("program_day_schedules").insert(
      schedules.map((schedule) => ({
        program_day_id: schedule.dayId,
        program_id: programId,
        weekday: schedule.weekday
      }))
    );
  }

  revalidatePath("/programs");
  revalidatePath(`/programs/${programId}`);
  revalidatePath(`/programs/${programId}/edit`);
  redirect(`/programs/${programId}/edit`);
}

export async function updateProgramDay(formData: FormData) {
  const { supabase } = await requireUser();
  const programId = fieldValue(formData, "programId");
  const programDayId = fieldValue(formData, "programDayId");
  const name = fieldValue(formData, "name");

  if (!programId || !programDayId || !name) {
    redirect(programId ? `/programs/${programId}/edit` : "/programs");
  }

  await supabase
    .from("program_days")
    .update({
      focus: fieldValue(formData, "focus") || null,
      name,
      notes: fieldValue(formData, "notes") || null
    })
    .eq("id", programDayId);

  revalidatePath(`/programs/${programId}/edit`);
  redirect(`/programs/${programId}/edit`);
}

export async function addProgramDay(formData: FormData) {
  const { supabase } = await requireUser();
  const programId = fieldValue(formData, "programId");
  const name = fieldValue(formData, "name") || "New day";

  if (!programId) {
    redirect("/programs");
  }

  const weekId = await firstProgramWeekId(supabase, programId);

  if (!weekId) {
    redirect(`/programs/${programId}/edit`);
  }

  const dayNumber = await nextDayNumber(supabase, weekId);

  await supabase.from("program_days").insert({
    day_number: dayNumber,
    name,
    program_week_id: weekId
  });

  revalidatePath(`/programs/${programId}/edit`);
  redirect(`/programs/${programId}/edit`);
}

export async function deleteProgramDay(formData: FormData) {
  const { supabase } = await requireUser();
  const programId = fieldValue(formData, "programId");
  const programDayId = fieldValue(formData, "programDayId");

  if (programDayId) {
    await supabase.from("program_days").delete().eq("id", programDayId);
  }

  revalidatePath(`/programs/${programId}/edit`);
  redirect(programId ? `/programs/${programId}/edit` : "/programs");
}

export async function addProgramExercise(formData: FormData) {
  const { supabase } = await requireUser();
  const programId = fieldValue(formData, "programId");
  const programDayId = fieldValue(formData, "programDayId");
  const exerciseId = fieldValue(formData, "exerciseId");
  const setCount = Math.min(
    10,
    Math.max(1, fieldNumber(formData, "setCount") ?? 3)
  );
  const repsMin = optionalNumber(fieldValue(formData, "targetRepsMin")) ?? 8;
  const repsMax =
    optionalNumber(fieldValue(formData, "targetRepsMax")) ?? repsMin;
  const targetWeightKg = optionalNumber(fieldValue(formData, "targetWeightKg"));
  const targetDurationSeconds = optionalSecondsFromMinutes(
    fieldValue(formData, "targetDurationMinutes")
  );
  const targetDistanceKm = optionalNumber(fieldValue(formData, "targetDistanceKm"));
  const targetIntensity = fieldValue(formData, "targetIntensity") || null;
  const isCardio = fieldValue(formData, "exerciseCategory") === "cardio";

  if (!programId || !programDayId || !exerciseId) {
    redirect(programId ? `/programs/${programId}/edit` : "/programs");
  }

  if (!isCardio && repsMin > repsMax) {
    redirectWithError(
      `/programs/${programId}/edit`,
      "Rep range must go from low to high."
    );
  }

  const sortOrder = await nextSortOrder(
    supabase,
    "program_exercises",
    "program_day_id",
    programDayId
  );

  const { data: programExercise } = await supabase
    .from("program_exercises")
    .insert({
      exercise_id: exerciseId,
      program_day_id: programDayId,
      sort_order: sortOrder
    })
    .select("id")
    .single();

  if (programExercise?.id) {
    await supabase.from("program_sets").insert(
      Array.from({ length: setCount }, (_, index) => ({
        program_exercise_id: programExercise.id,
        set_type: "working",
        sort_order: index + 1,
        target_distance_km: isCardio ? targetDistanceKm : null,
        target_duration_seconds: isCardio ? targetDurationSeconds : null,
        target_intensity: isCardio ? targetIntensity : null,
        target_reps_min: isCardio ? null : repsMin,
        target_reps_max: isCardio ? null : repsMax,
        target_weight_kg: isCardio ? null : targetWeightKg
      }))
    );
  }

  revalidatePath(`/programs/${programId}/edit`);
  redirect(`/programs/${programId}/edit`);
}

export async function deleteProgramExercise(formData: FormData) {
  const { supabase } = await requireUser();
  const programId = fieldValue(formData, "programId");
  const programExerciseId = fieldValue(formData, "programExerciseId");

  if (programExerciseId) {
    await supabase
      .from("program_exercises")
      .delete()
      .eq("id", programExerciseId);
  }

  revalidatePath(`/programs/${programId}/edit`);
  redirect(programId ? `/programs/${programId}/edit` : "/programs");
}

export async function addProgramSet(formData: FormData) {
  const { supabase } = await requireUser();
  const programId = fieldValue(formData, "programId");
  const programExerciseId = fieldValue(formData, "programExerciseId");

  if (!programId || !programExerciseId) {
    redirect(programId ? `/programs/${programId}/edit` : "/programs");
  }

  const sortOrder = await nextSortOrder(
    supabase,
    "program_sets",
    "program_exercise_id",
    programExerciseId
  );

  await supabase.from("program_sets").insert({
    program_exercise_id: programExerciseId,
    set_type: "working",
    sort_order: sortOrder,
    target_reps_min: 8,
    target_reps_max: 12
  });

  revalidatePath(`/programs/${programId}/edit`);
  redirect(`/programs/${programId}/edit`);
}

export async function updateProgramSet(formData: FormData) {
  const { supabase } = await requireUser();
  const programId = fieldValue(formData, "programId");
  const setId = fieldValue(formData, "setId");

  if (!programId || !setId) {
    redirect(programId ? `/programs/${programId}/edit` : "/programs");
  }

  await supabase
    .from("program_sets")
    .update({
      notes: fieldValue(formData, "notes") || null,
      rest_seconds: optionalNumber(fieldValue(formData, "restSeconds")),
      set_type: parseSetType(fieldValue(formData, "setType")),
      target_distance_km: optionalNumber(fieldValue(formData, "targetDistanceKm")),
      target_duration_seconds: optionalSecondsFromMinutes(
        fieldValue(formData, "targetDurationMinutes")
      ),
      target_intensity: fieldValue(formData, "targetIntensity") || null,
      target_reps_max: optionalNumber(fieldValue(formData, "targetRepsMax")),
      target_reps_min: optionalNumber(fieldValue(formData, "targetRepsMin")),
      target_rir: optionalNumber(fieldValue(formData, "targetRir")),
      target_rpe: optionalNumber(fieldValue(formData, "targetRpe")),
      target_weight_kg: optionalNumber(fieldValue(formData, "targetWeightKg"))
    })
    .eq("id", setId);

  revalidatePath(`/programs/${programId}/edit`);
  redirect(`/programs/${programId}/edit`);
}

export async function deleteProgramSet(formData: FormData) {
  const { supabase } = await requireUser();
  const programId = fieldValue(formData, "programId");
  const setId = fieldValue(formData, "setId");

  if (setId) {
    await supabase.from("program_sets").delete().eq("id", setId);
  }

  revalidatePath(`/programs/${programId}/edit`);
  redirect(programId ? `/programs/${programId}/edit` : "/programs");
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
      owner_id: user.id,
      schedule_type: program.schedule_type
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

  const dayIdMap = new Map<string, string>();

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

      dayIdMap.set(day.id, copiedDay.id);

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
            target_distance_km: set.target_distance_km,
            target_duration_seconds: set.target_duration_seconds,
            target_intensity: set.target_intensity,
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

  const copiedSchedules = program.weeks
    .flatMap((week) => week.days)
    .flatMap((day) =>
      day.schedule_weekdays.map((weekday) => ({
        program_day_id: dayIdMap.get(day.id),
        program_id: copiedProgram.id,
        weekday
      }))
    )
    .filter(
      (
        schedule
      ): schedule is {
        program_day_id: string;
        program_id: string;
        weekday: number;
      } => Boolean(schedule.program_day_id)
    );

  if (copiedSchedules.length > 0) {
    await supabase.from("program_day_schedules").insert(copiedSchedules);
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
    .eq("status", "active")
    .eq("user_id", user.id);

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

  revalidatePath("/dashboard");
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

  revalidatePath("/dashboard");
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

  revalidatePath("/dashboard");
  revalidatePath("/programs");
  revalidatePath("/programs/active");
  redirect("/programs");
}

async function cancelActiveEnrollmentForProgram(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  programId: string
) {
  const { data: activeEnrollments } = await supabase
    .from("program_enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("program_id", programId)
    .eq("status", "active");

  const activeEnrollmentIds = (activeEnrollments ?? []).map(
    (enrollment) => enrollment.id as string
  );

  if (activeEnrollmentIds.length === 0) {
    return;
  }

  await supabase
    .from("program_enrollments")
    .update({
      completed_at: new Date().toISOString(),
      status: "cancelled"
    })
    .in("id", activeEnrollmentIds);

  await supabase
    .from("user_settings")
    .update({ active_program_enrollment_id: null })
    .eq("user_id", userId)
    .in("active_program_enrollment_id", activeEnrollmentIds);
}

export async function removeProgram(formData: FormData) {
  const { supabase, user } = await requireUser();
  const programId = fieldValue(formData, "programId");

  if (!programId) {
    redirect("/programs");
  }

  const program = await getProgramDetail(supabase, programId);

  if (!program) {
    redirect("/programs");
  }

  await cancelActiveEnrollmentForProgram(supabase, user.id, program.id);

  if (program.is_public) {
    await supabase.from("hidden_public_programs").upsert({
      program_id: program.id,
      user_id: user.id
    });
  } else if (program.owner_id === user.id) {
    await supabase
      .from("programs")
      .delete()
      .eq("id", program.id)
      .eq("owner_id", user.id)
      .eq("is_public", false);
  }

  revalidatePath("/dashboard");
  revalidatePath("/programs");
  revalidatePath(`/programs/${program.id}`);
  revalidatePath(`/programs/${program.id}/edit`);
  revalidatePath("/programs/active");
  redirect("/programs");
}

export async function startWorkoutFromProgramDay(formData: FormData) {
  const { supabase, user } = await requireUser();
  const enrollmentId = fieldValue(formData, "enrollmentId");
  const programDayId = fieldValue(formData, "programDayId");
  const scheduledFor = fieldValue(formData, "scheduledFor") || todayDate();

  if (!enrollmentId || !programDayId) {
    redirect("/programs/active");
  }

  const { data: activeWorkout } = await supabase
    .from("workouts")
    .select("id")
    .eq("status", "active")
    .eq("owner_id", user.id)
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
      scheduled_for: scheduledFor,
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
        distance_km: set.target_distance_km,
        duration_seconds: set.target_duration_seconds,
        intensity: set.target_intensity,
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

  revalidatePath("/dashboard");
  revalidatePath("/workouts/active");
  redirect("/workouts/active");
}
