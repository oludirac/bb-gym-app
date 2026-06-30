import type { SupabaseClient } from "@supabase/supabase-js";

export type ProgressSummary = {
  best_lifts: {
    estimated_one_rep_max: number;
    exercise_id: string;
    exercise_name: string;
    reps: number;
    weight_kg: number;
  }[];
  muscle_groups: {
    count: number;
    muscle_group: string;
  }[];
  periods: {
    all: {
      volume_kg: number;
      workouts: number;
    };
    month: {
      volume_kg: number;
      workouts: number;
    };
    week: {
      volume_kg: number;
      workouts: number;
    };
    year: {
      volume_kg: number;
      workouts: number;
    };
  };
  this_week_workouts: number;
  total_volume_kg: number;
  weekly_activity: {
    label: string;
    volume_kg: number;
    workouts: number;
  }[];
  workout_count: number;
};

type RawWorkoutSet = {
  reps: number | null;
  weight_kg: number | null;
  workout_exercises:
    | {
        exercise_id: string;
        exercise_name_snapshot: string;
      }
    | {
        exercise_id: string;
        exercise_name_snapshot: string;
      }[]
    | null;
};

type RawExerciseMuscle = {
  exercise_id: string;
  role: string;
  muscles:
    | {
        muscle_group: string;
      }
    | {
        muscle_group: string;
      }[]
    | null;
};

function firstWorkoutExercise(raw: RawWorkoutSet["workout_exercises"]) {
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }

  return raw;
}

function firstMuscle(raw: RawExerciseMuscle["muscles"]) {
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }

  return raw;
}

function estimatedOneRepMax(weightKg: number, reps: number) {
  if (reps <= 1) {
    return weightKg;
  }

  return weightKg * (1 + reps / 30);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  return start;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function roundVolume(value: number) {
  return Math.round(value * 10) / 10;
}

function periodSummary(
  workouts: { started_at: string; total_volume_kg: number | null }[],
  start: Date | null
) {
  const filtered = start
    ? workouts.filter((workout) => new Date(workout.started_at) >= start)
    : workouts;

  return {
    volume_kg: roundVolume(
      filtered.reduce(
        (total, workout) => total + Number(workout.total_volume_kg ?? 0),
        0
      )
    ),
    workouts: filtered.length
  };
}

function weeklyActivity(
  workouts: { started_at: string; total_volume_kg: number | null }[],
  now: Date
) {
  const currentWeekStart = startOfWeek(now);
  const weekStarts = Array.from({ length: 8 }, (_, index) => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - (7 - index) * 7);
    return start;
  });

  return weekStarts.map((start) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const inWeek = workouts.filter((workout) => {
      const startedAt = new Date(workout.started_at);
      return startedAt >= start && startedAt < end;
    });

    return {
      label: new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short"
      }).format(start),
      volume_kg: roundVolume(
        inWeek.reduce(
          (total, workout) => total + Number(workout.total_volume_kg ?? 0),
          0
        )
      ),
      workouts: inWeek.length
    };
  });
}

export async function getProgressSummary(supabase: SupabaseClient) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const [workoutsResult, setsResult] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, started_at, total_volume_kg")
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(500),
    supabase
      .from("workout_sets")
      .select(
        `
          id,
          weight_kg,
          reps,
          completed_at,
          workout_exercises!inner (
            exercise_id,
            exercise_name_snapshot,
            workouts!inner (
              status
            )
          )
        `
      )
      .not("completed_at", "is", null)
      .eq("workout_exercises.workouts.status", "completed")
  ]);

  if (workoutsResult.error) {
    throw new Error(workoutsResult.error.message);
  }

  if (setsResult.error) {
    throw new Error(setsResult.error.message);
  }

  const workouts = workoutsResult.data ?? [];
  const sets = (setsResult.data ?? []) as RawWorkoutSet[];
  const periods = {
    all: periodSummary(workouts, null),
    month: periodSummary(workouts, monthStart),
    week: periodSummary(workouts, weekStart),
    year: periodSummary(workouts, yearStart)
  };
  const bestLiftMap = new Map<
    string,
    {
      estimated_one_rep_max: number;
      exercise_id: string;
      exercise_name: string;
      reps: number;
      weight_kg: number;
    }
  >();
  const exerciseSetCounts = new Map<string, number>();

  for (const set of sets) {
    const workoutExercise = firstWorkoutExercise(set.workout_exercises);
    const weightKg = Number(set.weight_kg ?? 0);
    const reps = Number(set.reps ?? 0);

    if (!workoutExercise || weightKg <= 0 || reps <= 0) {
      continue;
    }

    const estimate = estimatedOneRepMax(weightKg, reps);
    const existing = bestLiftMap.get(workoutExercise.exercise_id);

    if (!existing || estimate > existing.estimated_one_rep_max) {
      bestLiftMap.set(workoutExercise.exercise_id, {
        estimated_one_rep_max: Math.round(estimate * 10) / 10,
        exercise_id: workoutExercise.exercise_id,
        exercise_name: workoutExercise.exercise_name_snapshot,
        reps,
        weight_kg: weightKg
      });
    }

    exerciseSetCounts.set(
      workoutExercise.exercise_id,
      (exerciseSetCounts.get(workoutExercise.exercise_id) ?? 0) + 1
    );
  }

  const exerciseIds = [...exerciseSetCounts.keys()];
  const muscleGroups = new Map<string, number>();

  if (exerciseIds.length > 0) {
    const { data, error } = await supabase
      .from("exercise_muscles")
      .select("exercise_id, role, muscles(muscle_group)")
      .eq("role", "primary")
      .in("exercise_id", exerciseIds);

    if (error) {
      throw new Error(error.message);
    }

    for (const mapping of (data ?? []) as RawExerciseMuscle[]) {
      const muscle = firstMuscle(mapping.muscles);

      if (!muscle) {
        continue;
      }

      muscleGroups.set(
        muscle.muscle_group,
        (muscleGroups.get(muscle.muscle_group) ?? 0) +
          (exerciseSetCounts.get(mapping.exercise_id) ?? 0)
      );
    }
  }

  return {
    best_lifts: [...bestLiftMap.values()]
      .sort((a, b) => b.estimated_one_rep_max - a.estimated_one_rep_max)
      .slice(0, 5),
    muscle_groups: [...muscleGroups.entries()]
      .map(([muscleGroup, count]) => ({
        count,
        muscle_group: muscleGroup
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    periods,
    this_week_workouts: periods.week.workouts,
    total_volume_kg: periods.all.volume_kg,
    weekly_activity: weeklyActivity(workouts, now),
    workout_count: workouts.length
  } satisfies ProgressSummary;
}
