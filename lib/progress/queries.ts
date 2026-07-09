import type { SupabaseClient } from "@supabase/supabase-js";
import { getProgramDetail, type ProgramExercise } from "@/lib/programs/queries";

export type MainLiftProgress = {
  change_kg: number | null;
  current_weight_kg: number | null;
  exercise_id: string;
  exercise_name: string;
  last_result: {
    achieved_at: string;
    reps: number;
    weight_kg: number;
  } | null;
  program_exercise_id: string;
  rep_range: string;
  trend: {
    label: string;
    value: number | null;
    week: number;
  }[];
};

export type ProgressSummary = {
  active_block: {
    block_length_weeks: number;
    program_name: string;
    started_on: string;
    week_number: number;
    workouts_completed_block: number;
    workouts_completed_this_week: number;
  } | null;
  bodyweight: {
    logged_on: string;
    weight_kg: number;
  }[];
  main_lifts: MainLiftProgress[];
  periods: {
    month: { workouts: number };
    week: { workouts: number };
    year: { workouts: number };
  };
  recent_bests: {
    achieved_at: string;
    estimated_one_rep_max: number;
    exercise_id: string;
    exercise_name: string;
    reps: number;
    weight_kg: number;
  }[];
};

type RawEnrollment = {
  block_length_weeks: number | null;
  id: string;
  program_id: string;
  started_on: string;
};

type RawWorkout = {
  id: string;
  started_at: string;
};

type RawWorkoutExercise = {
  exercise_id: string;
  exercise_name_snapshot: string;
  program_exercise_id: string | null;
  workout_sets?: {
    completed_at: string | null;
    reps: number | null;
    weight_kg: number | null;
  }[] | null;
  workouts:
    | {
        started_at: string;
      }
    | {
        started_at: string;
      }[]
    | null;
};

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

function estimatedOneRepMax(weightKg: number, reps: number) {
  if (reps <= 1) {
    return weightKg;
  }

  return weightKg * (1 + reps / 30);
}

function firstWorkout(raw: RawWorkoutExercise["workouts"]) {
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

function weekNumberFor(startedOn: string, date = new Date()) {
  const start = startOfDay(new Date(`${startedOn}T00:00:00`));
  const diffMs = startOfDay(date).getTime() - start.getTime();
  return Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function workoutWeek(startedOn: string, value: string) {
  return weekNumberFor(startedOn, new Date(value));
}

function mainLiftCandidates(programExercises: ProgramExercise[]) {
  const tracked = programExercises.filter((exercise) => exercise.track_as_main_lift);

  if (tracked.length > 0) {
    return tracked;
  }

  return programExercises
    .filter((exercise) =>
      exercise.sets.some((set) => set.target_weight_kg !== null)
    )
    .slice(0, 4);
}

function formatRepRange(exercise: ProgramExercise) {
  const firstWeighted = exercise.sets.find(
    (set) => set.target_reps_min !== null || set.target_reps_max !== null
  );

  if (!firstWeighted) {
    return "-";
  }

  if (
    firstWeighted.target_reps_min !== null &&
    firstWeighted.target_reps_max !== null
  ) {
    return firstWeighted.target_reps_min === firstWeighted.target_reps_max
      ? String(firstWeighted.target_reps_min)
      : `${firstWeighted.target_reps_min}-${firstWeighted.target_reps_max}`;
  }

  return String(firstWeighted.target_reps_min ?? firstWeighted.target_reps_max);
}

function currentWeight(exercise: ProgramExercise) {
  const firstWeighted = exercise.sets.find(
    (set) => set.target_weight_kg !== null
  );
  return firstWeighted?.target_weight_kg ?? null;
}

function periodCount(workouts: RawWorkout[], start: Date) {
  return workouts.filter((workout) => new Date(workout.started_at) >= start)
    .length;
}

export async function getProgressSummary(supabase: SupabaseClient) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from("program_enrollments")
    .select("id, program_id, started_on, block_length_weeks")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const enrollment = enrollmentData as RawEnrollment | null;

  const [workoutsResult, bodyweightResult] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, started_at")
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(500),
    supabase
      .from("bodyweight_logs")
      .select("logged_on, weight_kg")
      .order("logged_on", { ascending: true })
      .limit(84)
  ]);

  if (workoutsResult.error) {
    throw new Error(workoutsResult.error.message);
  }

  if (bodyweightResult.error) {
    throw new Error(bodyweightResult.error.message);
  }

  const workouts = (workoutsResult.data ?? []) as RawWorkout[];
  const periods = {
    month: { workouts: periodCount(workouts, monthStart) },
    week: { workouts: periodCount(workouts, weekStart) },
    year: { workouts: periodCount(workouts, yearStart) }
  };

  if (!enrollment) {
    return {
      active_block: null,
      bodyweight: (bodyweightResult.data ?? []).map((log) => ({
        logged_on: log.logged_on as string,
        weight_kg: Number(log.weight_kg)
      })),
      main_lifts: [],
      periods,
      recent_bests: []
    } satisfies ProgressSummary;
  }

  const program = await getProgramDetail(supabase, enrollment.program_id);
  const blockLength = enrollment.block_length_weeks ?? 12;
  const activeWeek = Math.min(blockLength, weekNumberFor(enrollment.started_on));
  const blockWorkouts = workouts.filter((workout) => {
    const week = workoutWeek(enrollment.started_on, workout.started_at);
    return week >= 1 && week <= blockLength;
  });
  const workoutsThisBlockWeek = blockWorkouts.filter(
    (workout) => workoutWeek(enrollment.started_on, workout.started_at) === activeWeek
  );

  if (!program) {
    return {
      active_block: null,
      bodyweight: [],
      main_lifts: [],
      periods,
      recent_bests: []
    } satisfies ProgressSummary;
  }

  const programExercises = program.weeks
    .flatMap((week) => week.days)
    .flatMap((day) => day.exercises);
  const mainExercises = mainLiftCandidates(programExercises);
  const programExerciseIds = mainExercises.map((exercise) => exercise.id);
  const { data: rows, error: rowsError } = await supabase
    .from("workout_exercises")
    .select(
      `
        exercise_id,
        exercise_name_snapshot,
        program_exercise_id,
        workouts!inner (
          started_at,
          program_enrollment_id,
          status
        ),
        workout_sets (
          weight_kg,
          reps,
          completed_at
        )
      `
    )
    .eq("workouts.program_enrollment_id", enrollment.id)
    .eq("workouts.status", "completed")
    .not("program_exercise_id", "is", null)
    .in("program_exercise_id", programExerciseIds);

  if (rowsError) {
    throw new Error(rowsError.message);
  }

  const workoutRows = (rows ?? []) as RawWorkoutExercise[];
  const recentBests: ProgressSummary["recent_bests"] = [];

  const mainLifts = mainExercises.map((exercise) => {
    const liftRows = workoutRows.filter(
      (row) => row.program_exercise_id === exercise.id
    );
    const bestByWeek = new Map<number, number>();
    let firstLoggedWeight: number | null = null;
    let lastResult: MainLiftProgress["last_result"] = null;

    for (const row of liftRows) {
      const workout = firstWorkout(row.workouts);

      if (!workout) {
        continue;
      }

      const week = workoutWeek(enrollment.started_on, workout.started_at);

      if (week < 1 || week > blockLength) {
        continue;
      }

      for (const set of row.workout_sets ?? []) {
        const weightKg = Number(set.weight_kg ?? 0);
        const reps = Number(set.reps ?? 0);

        if (!set.completed_at || weightKg <= 0 || reps <= 0) {
          continue;
        }

        const estimate = Math.round(estimatedOneRepMax(weightKg, reps) * 10) / 10;
        const existing = bestByWeek.get(week) ?? null;

        if (existing === null || estimate > existing) {
          bestByWeek.set(week, estimate);
        }

        if (!firstLoggedWeight) {
          firstLoggedWeight = weightKg;
        }

        if (
          !lastResult ||
          new Date(set.completed_at) > new Date(lastResult.achieved_at)
        ) {
          lastResult = {
            achieved_at: set.completed_at,
            reps,
            weight_kg: weightKg
          };
        }

        recentBests.push({
          achieved_at: set.completed_at,
          estimated_one_rep_max: estimate,
          exercise_id: row.exercise_id,
          exercise_name: row.exercise_name_snapshot,
          reps,
          weight_kg: weightKg
        });
      }
    }

    const plannedWeight = currentWeight(exercise);

    return {
      change_kg:
        plannedWeight !== null && firstLoggedWeight !== null
          ? Math.round((plannedWeight - firstLoggedWeight) * 100) / 100
          : null,
      current_weight_kg: plannedWeight,
      exercise_id: exercise.exercise_id,
      exercise_name: exercise.exercise_name,
      last_result: lastResult,
      program_exercise_id: exercise.id,
      rep_range: formatRepRange(exercise),
      trend: Array.from({ length: blockLength }, (_, index) => {
        const week = index + 1;
        return {
          label: `W${week}`,
          value: bestByWeek.get(week) ?? null,
          week
        };
      })
    } satisfies MainLiftProgress;
  });

  return {
    active_block: {
      block_length_weeks: blockLength,
      program_name: program.name,
      started_on: enrollment.started_on,
      week_number: activeWeek,
      workouts_completed_block: blockWorkouts.length,
      workouts_completed_this_week: workoutsThisBlockWeek.length
    },
    bodyweight: (bodyweightResult.data ?? []).map((log) => ({
      logged_on: log.logged_on as string,
      weight_kg: Number(log.weight_kg)
    })),
    main_lifts: mainLifts,
    periods,
    recent_bests: recentBests
      .sort((a, b) => b.estimated_one_rep_max - a.estimated_one_rep_max)
      .slice(0, 5)
  } satisfies ProgressSummary;
}
