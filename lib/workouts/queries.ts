import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkoutSet = {
  completed_at: string | null;
  id: string;
  notes: string | null;
  reps: number | null;
  rir: number | null;
  rpe: number | null;
  set_type: string;
  sort_order: number;
  weight_kg: number | null;
};

export type WorkoutExercise = {
  exercise_id: string;
  exercise_name_snapshot: string;
  id: string;
  notes: string | null;
  sets: WorkoutSet[];
  sort_order: number;
};

export type Workout = {
  finished_at: string | null;
  id: string;
  name: string | null;
  started_at: string;
  status: string;
  total_volume_kg: number;
  workoutExercises: WorkoutExercise[];
};

export type ExerciseOption = {
  id: string;
  is_builtin: boolean;
  name: string;
};

type RawWorkoutSet = WorkoutSet;

type RawWorkoutExercise = {
  exercise_id: string;
  exercise_name_snapshot: string;
  id: string;
  notes: string | null;
  sort_order: number;
  workout_sets?: RawWorkoutSet[] | null;
};

type RawWorkout = {
  finished_at: string | null;
  id: string;
  name: string | null;
  started_at: string;
  status: string;
  total_volume_kg: number;
  workout_exercises?: RawWorkoutExercise[] | null;
};

const workoutSelect = `
  id,
  name,
  status,
  started_at,
  finished_at,
  total_volume_kg,
  workout_exercises (
    id,
    exercise_id,
    exercise_name_snapshot,
    sort_order,
    notes,
    workout_sets (
      id,
      sort_order,
      set_type,
      weight_kg,
      reps,
      rpe,
      rir,
      notes,
      completed_at
    )
  )
`;

function sortByOrder<T extends { sort_order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

function mapWorkout(raw: RawWorkout): Workout {
  return {
    finished_at: raw.finished_at,
    id: raw.id,
    name: raw.name,
    started_at: raw.started_at,
    status: raw.status,
    total_volume_kg: Number(raw.total_volume_kg ?? 0),
    workoutExercises: sortByOrder(raw.workout_exercises ?? []).map(
      (exercise) => ({
        exercise_id: exercise.exercise_id,
        exercise_name_snapshot: exercise.exercise_name_snapshot,
        id: exercise.id,
        notes: exercise.notes,
        sets: sortByOrder(exercise.workout_sets ?? []).map((set) => ({
          ...set,
          rir: set.rir === null ? null : Number(set.rir),
          rpe: set.rpe === null ? null : Number(set.rpe),
          weight_kg: set.weight_kg === null ? null : Number(set.weight_kg)
        })),
        sort_order: exercise.sort_order
      })
    )
  };
}

export async function getActiveWorkout(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("workouts")
    .select(workoutSelect)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapWorkout(data as RawWorkout) : null;
}

export async function getWorkoutDetail(
  supabase: SupabaseClient,
  workoutId: string
) {
  const { data, error } = await supabase
    .from("workouts")
    .select(workoutSelect)
    .eq("id", workoutId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapWorkout(data as RawWorkout) : null;
}

export async function getExerciseOptions(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, is_builtin")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExerciseOption[];
}

export async function getCompletedWorkouts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, name, started_at, finished_at, total_volume_kg")
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(30);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as {
    finished_at: string | null;
    id: string;
    name: string | null;
    started_at: string;
    total_volume_kg: number;
  }[];
}
