import type { SupabaseClient } from "@supabase/supabase-js";

export type BodyweightLog = {
  id: string;
  logged_on: string;
  notes: string | null;
  weight_kg: number;
};

export type Goal = {
  exercise_id: string | null;
  exercise_name: string | null;
  id: string;
  start_date: string;
  status: string;
  target_date: string | null;
  target_value: number;
  type: string;
  unit: string;
};

type RawGoal = {
  exercise_id: string | null;
  exercises:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  id: string;
  start_date: string;
  status: string;
  target_date: string | null;
  target_value: number;
  type: string;
  unit: string;
};

function firstExerciseName(rawExercise: RawGoal["exercises"]) {
  if (Array.isArray(rawExercise)) {
    return rawExercise[0]?.name ?? null;
  }

  return rawExercise?.name ?? null;
}

export async function getBodyweightLogs(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("bodyweight_logs")
    .select("id, logged_on, weight_kg, notes")
    .order("logged_on", { ascending: false })
    .limit(30);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((log) => ({
    id: log.id,
    logged_on: log.logged_on,
    notes: log.notes,
    weight_kg: Number(log.weight_kg)
  })) satisfies BodyweightLog[];
}

export async function getGoals(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("goals")
    .select(
      `
        id,
        type,
        exercise_id,
        target_value,
        unit,
        start_date,
        target_date,
        status,
        exercises (
          name
        )
      `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawGoal[]).map((goal) => ({
    exercise_id: goal.exercise_id,
    exercise_name: firstExerciseName(goal.exercises),
    id: goal.id,
    start_date: goal.start_date,
    status: goal.status,
    target_date: goal.target_date,
    target_value: Number(goal.target_value),
    type: goal.type,
    unit: goal.unit
  })) satisfies Goal[];
}
