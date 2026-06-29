import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentSession } from "@/lib/auth/session";

async function selectIn(
  supabase: SupabaseClient,
  table: string,
  column: string,
  ids: string[]
) {
  if (ids.length === 0) {
    return [];
  }

  const { data } = await supabase.from(table).select("*").in(column, ids);
  return data ?? [];
}

function idsFrom(rows: { id: string }[]) {
  return rows.map((row) => row.id);
}

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabase, user } = session;
  const [profile, settings, exercises, templates, programs, enrollments, workouts, bodyweightLogs, goals] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("user_settings").select("*").eq("user_id", user.id).single(),
      supabase.from("exercises").select("*").eq("is_builtin", false),
      supabase.from("workout_templates").select("*"),
      supabase.from("programs").select("*").eq("is_public", false),
      supabase.from("program_enrollments").select("*"),
      supabase.from("workouts").select("*"),
      supabase.from("bodyweight_logs").select("*"),
      supabase.from("goals").select("*")
    ]);

  const customExercises = exercises.data ?? [];
  const workoutTemplates = templates.data ?? [];
  const copiedPrograms = programs.data ?? [];
  const userWorkouts = workouts.data ?? [];
  const templateExercises = await selectIn(
    supabase,
    "template_exercises",
    "template_id",
    idsFrom(workoutTemplates)
  );
  const templateSets = await selectIn(
    supabase,
    "template_sets",
    "template_exercise_id",
    idsFrom(templateExercises as { id: string }[])
  );
  const programWeeks = await selectIn(
    supabase,
    "program_weeks",
    "program_id",
    idsFrom(copiedPrograms)
  );
  const programDays = await selectIn(
    supabase,
    "program_days",
    "program_week_id",
    idsFrom(programWeeks as { id: string }[])
  );
  const programExercises = await selectIn(
    supabase,
    "program_exercises",
    "program_day_id",
    idsFrom(programDays as { id: string }[])
  );
  const programSets = await selectIn(
    supabase,
    "program_sets",
    "program_exercise_id",
    idsFrom(programExercises as { id: string }[])
  );
  const workoutExercises = await selectIn(
    supabase,
    "workout_exercises",
    "workout_id",
    idsFrom(userWorkouts)
  );
  const workoutSets = await selectIn(
    supabase,
    "workout_sets",
    "workout_exercise_id",
    idsFrom(workoutExercises as { id: string }[])
  );
  const exerciseMuscles = await selectIn(
    supabase,
    "exercise_muscles",
    "exercise_id",
    idsFrom(customExercises)
  );

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    user_settings: settings.data,
    custom_exercises: customExercises,
    exercise_muscles: exerciseMuscles,
    workout_templates: workoutTemplates,
    template_exercises: templateExercises,
    template_sets: templateSets,
    programs: copiedPrograms,
    program_weeks: programWeeks,
    program_days: programDays,
    program_exercises: programExercises,
    program_sets: programSets,
    program_enrollments: enrollments.data ?? [],
    workouts: userWorkouts,
    workout_exercises: workoutExercises,
    workout_sets: workoutSets,
    bodyweight_logs: bodyweightLogs.data ?? [],
    goals: goals.data ?? []
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Disposition": 'attachment; filename="bb-gym-export.json"',
      "Content-Type": "application/json"
    }
  });
}
