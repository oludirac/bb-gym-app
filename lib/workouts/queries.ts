import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkoutSet = {
  completed_at: string | null;
  distance_km: number | null;
  duration_seconds: number | null;
  id: string;
  intensity: string | null;
  notes: string | null;
  previous_reps: number | null;
  previous_weight_kg: number | null;
  program_set_id: string | null;
  reps: number | null;
  rest_seconds: number | null;
  rir: number | null;
  rpe: number | null;
  set_type: string;
  sort_order: number;
  target_distance_km: number | null;
  target_duration_seconds: number | null;
  target_intensity: string | null;
  target_reps_max: number | null;
  target_reps_min: number | null;
  target_weight_kg: number | null;
  weight_kg: number | null;
};

export type WorkoutExercise = {
  exercise_category: string;
  exercise_id: string;
  exercise_name_snapshot: string;
  id: string;
  notes: string | null;
  program_exercise_id: string | null;
  sets: WorkoutSet[];
  sort_order: number;
};

export type Workout = {
  finished_at: string | null;
  id: string;
  name: string | null;
  program_day_id: string | null;
  scheduled_for: string | null;
  started_at: string;
  status: string;
  total_volume_kg: number;
  workoutExercises: WorkoutExercise[];
};

export type ActiveWorkoutSummary = {
  id: string;
  name: string | null;
  started_at: string;
};

export type ExerciseOption = {
  category: string;
  id: string;
  is_builtin: boolean;
  name: string;
};

type RawWorkoutSet = {
  completed_at: string | null;
  distance_km: number | null;
  duration_seconds: number | null;
  id: string;
  intensity: string | null;
  notes: string | null;
  program_set_id: string | null;
  reps: number | null;
  rest_seconds: number | null;
  rir: number | null;
  rpe: number | null;
  set_type: string;
  sort_order: number;
  weight_kg: number | null;
};

type RawWorkoutExercise = {
  exercise_id: string;
  exercises:
    | {
        category: string;
      }
    | {
        category: string;
      }[]
    | null;
  exercise_name_snapshot: string;
  id: string;
  notes: string | null;
  program_exercise_id: string | null;
  sort_order: number;
  workout_sets?: RawWorkoutSet[] | null;
};

type RawWorkout = {
  finished_at: string | null;
  id: string;
  name: string | null;
  program_day_id: string | null;
  scheduled_for: string | null;
  started_at: string;
  status: string;
  total_volume_kg: number;
  workout_exercises?: RawWorkoutExercise[] | null;
};

type RawProgramSetTarget = {
  id: string;
  sort_order: number;
  target_distance_km: number | null;
  target_duration_seconds: number | null;
  target_intensity: string | null;
  target_reps_max: number | null;
  target_reps_min: number | null;
  target_weight_kg: number | null;
};

type RawProgramExerciseTarget = {
  exercise_id: string;
  program_sets?: RawProgramSetTarget[] | null;
  sort_order: number;
};

type RawPreviousWorkoutSet = {
  completed_at: string | null;
  reps: number | null;
  sort_order: number;
  weight_kg: number | null;
};

type RawPreviousWorkoutExercise = {
  exercise_id: string;
  sort_order: number;
  workout_sets?: RawPreviousWorkoutSet[] | null;
};

type RawPreviousWorkout = {
  started_at: string;
  workout_exercises?: RawPreviousWorkoutExercise[] | null;
};

const workoutSelect = `
  id,
  name,
  status,
  program_day_id,
  scheduled_for,
  started_at,
  finished_at,
  total_volume_kg,
  workout_exercises (
    id,
    exercise_id,
    program_exercise_id,
    exercises (
      category
    ),
    exercise_name_snapshot,
    sort_order,
    notes,
    workout_sets (
      id,
      program_set_id,
      sort_order,
      set_type,
      duration_seconds,
      distance_km,
      intensity,
      weight_kg,
      reps,
      rest_seconds,
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

function firstExerciseCategory(rawExercise: RawWorkoutExercise["exercises"]) {
  if (Array.isArray(rawExercise)) {
    return rawExercise[0]?.category ?? "chest";
  }

  return rawExercise?.category ?? "chest";
}

function mapWorkout(raw: RawWorkout): Workout {
  return {
    finished_at: raw.finished_at,
    id: raw.id,
    name: raw.name,
    program_day_id: raw.program_day_id,
    scheduled_for: raw.scheduled_for,
    started_at: raw.started_at,
    status: raw.status,
    total_volume_kg: Number(raw.total_volume_kg ?? 0),
    workoutExercises: sortByOrder(raw.workout_exercises ?? []).map(
      (exercise) => ({
        exercise_category: firstExerciseCategory(exercise.exercises),
        exercise_id: exercise.exercise_id,
        exercise_name_snapshot: exercise.exercise_name_snapshot,
        id: exercise.id,
        notes: exercise.notes,
        program_exercise_id: exercise.program_exercise_id,
        sets: sortByOrder(exercise.workout_sets ?? []).map((set) => ({
          ...set,
          distance_km: set.distance_km === null ? null : Number(set.distance_km),
          previous_reps: null,
          previous_weight_kg: null,
          program_set_id: set.program_set_id,
          rir: set.rir === null ? null : Number(set.rir),
          rpe: set.rpe === null ? null : Number(set.rpe),
          target_distance_km: null,
          target_duration_seconds: null,
          target_intensity: null,
          target_reps_max: null,
          target_reps_min: null,
          target_weight_kg: null,
          weight_kg: set.weight_kg === null ? null : Number(set.weight_kg)
        })),
        sort_order: exercise.sort_order
      })
    )
  };
}

function setContextKey(exerciseSortOrder: number, setSortOrder: number) {
  return `${exerciseSortOrder}:${setSortOrder}`;
}

async function getProgramTargets(
  supabase: SupabaseClient,
  programDayId: string | null
) {
  if (!programDayId) {
    return new Map<
      string,
      {
        target_reps_max: number | null;
        target_reps_min: number | null;
        target_distance_km: number | null;
        target_duration_seconds: number | null;
        target_intensity: string | null;
        target_weight_kg: number | null;
      }
    >();
  }

  const { data, error } = await supabase
    .from("program_exercises")
    .select(
      `
        exercise_id,
        sort_order,
        program_sets (
          id,
          sort_order,
          target_duration_seconds,
          target_distance_km,
          target_intensity,
          target_reps_min,
          target_reps_max,
          target_weight_kg
        )
      `
    )
    .eq("program_day_id", programDayId);

  if (error) {
    throw new Error(error.message);
  }

  const targets = new Map<
    string,
    {
      target_reps_max: number | null;
      target_reps_min: number | null;
      target_distance_km: number | null;
      target_duration_seconds: number | null;
      target_intensity: string | null;
      target_weight_kg: number | null;
    }
  >();

  for (const exercise of (data ?? []) as RawProgramExerciseTarget[]) {
    for (const set of exercise.program_sets ?? []) {
      const target = {
        target_distance_km:
          set.target_distance_km === null ? null : Number(set.target_distance_km),
        target_duration_seconds: set.target_duration_seconds,
        target_intensity: set.target_intensity,
        target_reps_max: set.target_reps_max,
        target_reps_min: set.target_reps_min,
        target_weight_kg:
          set.target_weight_kg === null ? null : Number(set.target_weight_kg)
      };

      targets.set(setContextKey(exercise.sort_order, set.sort_order), target);
      targets.set(`set:${set.id}`, target);
    }
  }

  return targets;
}

async function getPreviousSets(
  supabase: SupabaseClient,
  workout: Workout
) {
  const exerciseIds = [
    ...new Set(workout.workoutExercises.map((exercise) => exercise.exercise_id))
  ];

  if (exerciseIds.length === 0) {
    return new Map<
      string,
      Map<number, { previous_reps: number | null; previous_weight_kg: number | null }>
    >();
  }

  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
        started_at,
        workout_exercises (
          exercise_id,
          sort_order,
          workout_sets (
            sort_order,
            weight_kg,
            reps,
            completed_at
          )
        )
      `
    )
    .eq("status", "completed")
    .lt("started_at", workout.started_at)
    .order("started_at", { ascending: false })
    .limit(30);

  if (error) {
    throw new Error(error.message);
  }

  const previousByExercise = new Map<
    string,
    Map<number, { previous_reps: number | null; previous_weight_kg: number | null }>
  >();
  const wanted = new Set(exerciseIds);

  for (const previousWorkout of (data ?? []) as RawPreviousWorkout[]) {
    for (const exercise of sortByOrder(
      previousWorkout.workout_exercises ?? []
    )) {
      if (
        !wanted.has(exercise.exercise_id) ||
        previousByExercise.has(exercise.exercise_id)
      ) {
        continue;
      }

      const completedSets = sortByOrder(exercise.workout_sets ?? []).filter(
        (set) => set.completed_at
      );

      if (completedSets.length === 0) {
        continue;
      }

      previousByExercise.set(
        exercise.exercise_id,
        new Map(
          completedSets.map((set) => [
            set.sort_order,
            {
              previous_reps: set.reps,
              previous_weight_kg:
                set.weight_kg === null ? null : Number(set.weight_kg)
            }
          ])
        )
      );
    }

    if (previousByExercise.size === wanted.size) {
      break;
    }
  }

  return previousByExercise;
}

async function hydrateActiveWorkoutContext(
  supabase: SupabaseClient,
  workout: Workout
) {
  const [targets, previousSets] = await Promise.all([
    getProgramTargets(supabase, workout.program_day_id),
    getPreviousSets(supabase, workout)
  ]);

  return {
    ...workout,
    workoutExercises: workout.workoutExercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => {
        const target = set.program_set_id
          ? targets.get(`set:${set.program_set_id}`) ??
            targets.get(setContextKey(exercise.sort_order, set.sort_order))
          : targets.get(setContextKey(exercise.sort_order, set.sort_order));
        const previous = previousSets
          .get(exercise.exercise_id)
          ?.get(set.sort_order);

        return {
          ...set,
          previous_reps: previous?.previous_reps ?? null,
          previous_weight_kg: previous?.previous_weight_kg ?? null,
          target_reps_max: target?.target_reps_max ?? null,
          target_distance_km: target?.target_distance_km ?? null,
          target_duration_seconds: target?.target_duration_seconds ?? null,
          target_intensity: target?.target_intensity ?? null,
          target_reps_min: target?.target_reps_min ?? null,
          target_weight_kg: target?.target_weight_kg ?? null
        };
      })
    }))
  } satisfies Workout;
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

  return data
    ? hydrateActiveWorkoutContext(supabase, mapWorkout(data as RawWorkout))
    : null;
}

export async function getActiveWorkoutSummary(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, name, started_at")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as ActiveWorkoutSummary | null;
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
    .select("id, name, is_builtin, category")
    .is("deleted_at", null)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExerciseOption[];
}

export async function getCompletedWorkouts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, name, scheduled_for, started_at, finished_at, total_volume_kg")
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
    scheduled_for: string | null;
    started_at: string;
    total_volume_kg: number;
  }[];
}
