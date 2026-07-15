import type { SupabaseClient } from "@supabase/supabase-js";

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
  start_weight_kg: number | null;
  weekly_weights: {
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
};

type RawEnrollment = {
  block_length_weeks: number | null;
  id: string;
  program_id: string;
  programs:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
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
    program_set_id: string | null;
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

type RawProgressionTrack = {
  current_weight_kg: number | null;
  exercise_id: string;
  id: string;
  name: string;
  reps_max: number | null;
  reps_min: number | null;
};

type RawProgramSetTrackLink = {
  id: string;
  program_exercise_id: string | null;
  progression_track_id: string | null;
  program_exercises:
    | {
        track_as_main_lift: boolean | null;
      }
    | {
        track_as_main_lift: boolean | null;
      }[]
    | null;
};

type CompletedSetRow = ReturnType<typeof completedSetRows>[number];

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

function firstWorkout(raw: RawWorkoutExercise["workouts"]) {
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

function firstProgramExercise(raw: RawProgramSetTrackLink["program_exercises"]) {
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

function firstProgramName(raw: RawEnrollment["programs"]) {
  return Array.isArray(raw) ? raw[0]?.name : raw?.name;
}

function weekNumberFor(startedOn: string, date = new Date()) {
  const start = startOfDay(new Date(`${startedOn}T00:00:00`));
  const diffMs = startOfDay(date).getTime() - start.getTime();
  return Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function workoutWeek(startedOn: string, value: string) {
  return weekNumberFor(startedOn, new Date(value));
}

function periodCount(workouts: RawWorkout[], start: Date) {
  return workouts.filter((workout) => new Date(workout.started_at) >= start)
    .length;
}

function completedSetRows(row: RawWorkoutExercise) {
  const workout = firstWorkout(row.workouts);

  if (!workout) {
    return [];
  }

  return (row.workout_sets ?? [])
    .map((set) => {
      const weightKg = Number(set.weight_kg ?? 0);
      const reps = Number(set.reps ?? 0);

      if (!set.completed_at || weightKg <= 0 || reps <= 0) {
        return null;
      }

      return {
        achieved_at: set.completed_at,
        exercise_id: row.exercise_id,
        exercise_name: row.exercise_name_snapshot,
        reps,
        program_set_id: set.program_set_id,
        started_at: workout.started_at,
        weight_kg: weightKg
      };
    })
    .filter((set): set is NonNullable<typeof set> => set !== null);
}

function calendarWeekIndex(start: Date, value: string) {
  const diffMs = startOfDay(new Date(value)).getTime() - start.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
}

function fallbackMainLiftsFromRows(rows: RawWorkoutExercise[]) {
  const twelveWeeksAgo = startOfDay(new Date());
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 77);
  const byExercise = new Map<
    string,
    {
      exercise_id: string;
      exercise_name: string;
      sets: CompletedSetRow[];
    }
  >();

  for (const row of rows) {
    const sets = completedSetRows(row);

    if (sets.length === 0) {
      continue;
    }

    const existing = byExercise.get(row.exercise_id) ?? {
      exercise_id: row.exercise_id,
      exercise_name: row.exercise_name_snapshot,
      sets: []
    };

    existing.sets.push(...sets);
    byExercise.set(row.exercise_id, existing);
  }

  return [...byExercise.values()]
    .sort((a, b) => b.sets.length - a.sets.length)
    .slice(0, 4)
    .map((exercise) => {
      const sortedSets = [...exercise.sets].sort(
        (a, b) =>
          new Date(a.achieved_at).getTime() -
          new Date(b.achieved_at).getTime()
      );
      const bestByWeek = new Map<number, number>();

      for (const set of sortedSets) {
        const week = calendarWeekIndex(twelveWeeksAgo, set.started_at);

        if (week < 1 || week > 12) {
          continue;
        }

        const existing = bestByWeek.get(week) ?? null;
        if (existing === null || set.weight_kg > existing) {
          bestByWeek.set(week, set.weight_kg);
        }
      }

      const firstSet = sortedSets[0] ?? null;
      const lastSet = sortedSets.at(-1) ?? null;

      return {
        change_kg:
          firstSet && lastSet
            ? Math.round((lastSet.weight_kg - firstSet.weight_kg) * 100) / 100
            : null,
        current_weight_kg: lastSet?.weight_kg ?? null,
        exercise_id: exercise.exercise_id,
        exercise_name: exercise.exercise_name,
        last_result: lastSet
          ? {
              achieved_at: lastSet.achieved_at,
              reps: lastSet.reps,
              weight_kg: lastSet.weight_kg
            }
          : null,
        program_exercise_id: `logged:${exercise.exercise_id}`,
        rep_range: "logged",
        start_weight_kg: firstSet?.weight_kg ?? null,
        weekly_weights: Array.from({ length: 12 }, (_, index) => {
          const week = index + 1;
          return {
            label: `W${week}`,
            value: bestByWeek.get(week) ?? null,
            week
          };
        })
      } satisfies MainLiftProgress;
    });
}

async function getLoggedWorkoutRows(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("workout_exercises")
    .select(
      `
        exercise_id,
        exercise_name_snapshot,
        program_exercise_id,
        workouts!inner (
          started_at,
          status
        ),
        workout_sets (
          program_set_id,
          weight_kg,
          reps,
          completed_at
        )
      `
    )
    .eq("workouts.status", "completed");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RawWorkoutExercise[];
}

function repRangeLabel(min: number | null, max: number | null) {
  if (min !== null && max !== null) {
    return min === max ? String(min) : `${min}-${max}`;
  }

  return String(min ?? max ?? "-");
}

async function getTrackMainLifts({
  blockLength,
  enrollment,
  supabase,
  workoutRows
}: {
  blockLength: number;
  enrollment: RawEnrollment;
  supabase: SupabaseClient;
  workoutRows: RawWorkoutExercise[];
}) {
  const { data: tracksData, error: tracksError } = await supabase
    .from("progression_tracks")
    .select("id, name, current_weight_kg, reps_min, reps_max, exercise_id")
    .eq("program_id", enrollment.program_id)
    .order("created_at", { ascending: true });

  if (tracksError) {
    throw new Error(tracksError.message);
  }

  const tracks = (tracksData ?? []) as RawProgressionTrack[];

  if (tracks.length === 0) {
    return fallbackMainLiftsFromRows(workoutRows);
  }

  const trackIds = tracks.map((track) => track.id);
  const { data: linksData, error: linksError } = await supabase
    .from("program_sets")
    .select(
      "id, progression_track_id, program_exercise_id, program_exercises(track_as_main_lift)"
    )
    .in("progression_track_id", trackIds);

  if (linksError) {
    throw new Error(linksError.message);
  }

  const linkedSets = (linksData ?? []) as RawProgramSetTrackLink[];
  const mainTrackIds = new Set<string>();
  const programExerciseIdsByTrack = new Map<string, Set<string>>();
  const programSetIdsByTrack = new Map<string, Set<string>>();

  for (const link of linkedSets) {
    if (!link.progression_track_id) {
      continue;
    }

    if (firstProgramExercise(link.program_exercises)?.track_as_main_lift) {
      mainTrackIds.add(link.progression_track_id);
    }

    if (link.program_exercise_id) {
      const programExerciseIds =
        programExerciseIdsByTrack.get(link.progression_track_id) ?? new Set();
      programExerciseIds.add(link.program_exercise_id);
      programExerciseIdsByTrack.set(link.progression_track_id, programExerciseIds);
    }

    const programSetIds =
      programSetIdsByTrack.get(link.progression_track_id) ?? new Set();
    programSetIds.add(link.id);
    programSetIdsByTrack.set(link.progression_track_id, programSetIds);
  }

  const candidates = (mainTrackIds.size > 0
    ? tracks.filter((track) => mainTrackIds.has(track.id))
    : tracks
  ).slice(0, 4);

  return candidates.map((track) => {
    const linkedProgramExerciseIds = programExerciseIdsByTrack.get(track.id);
    const linkedProgramSetIds = programSetIdsByTrack.get(track.id);
    const bestByWeek = new Map<number, number>();
    let firstLoggedAt: string | null = null;
    let firstLoggedWeight: number | null = null;
    let lastResult: MainLiftProgress["last_result"] = null;

    for (const row of workoutRows) {
      const linkedByExercise =
        linkedProgramExerciseIds && row.program_exercise_id
          ? linkedProgramExerciseIds.has(row.program_exercise_id)
          : row.exercise_id === track.exercise_id;

      if (!linkedByExercise) {
        continue;
      }

      const workout = firstWorkout(row.workouts);

      if (!workout) {
        continue;
      }

      const week = workoutWeek(enrollment.started_on, workout.started_at);

      if (week < 1 || week > blockLength) {
        continue;
      }

      const completedSets = completedSetRows(row).filter((set) =>
        linkedProgramSetIds?.size
          ? set.program_set_id !== null &&
            linkedProgramSetIds.has(set.program_set_id)
          : true
      );

      for (const set of completedSets) {
        const existing = bestByWeek.get(week) ?? null;

        if (existing === null || set.weight_kg > existing) {
          bestByWeek.set(week, set.weight_kg);
        }

        if (
          !firstLoggedAt ||
          new Date(set.achieved_at) < new Date(firstLoggedAt)
        ) {
          firstLoggedAt = set.achieved_at;
          firstLoggedWeight = set.weight_kg;
        }

        if (
          !lastResult ||
          new Date(set.achieved_at) > new Date(lastResult.achieved_at)
        ) {
          lastResult = {
            achieved_at: set.achieved_at,
            reps: set.reps,
            weight_kg: set.weight_kg
          };
        }
      }
    }

    const currentWeightKg =
      track.current_weight_kg === null ? null : Number(track.current_weight_kg);

    return {
      change_kg:
        lastResult !== null && firstLoggedWeight !== null
          ? Math.round((lastResult.weight_kg - firstLoggedWeight) * 100) / 100
          : null,
      current_weight_kg: currentWeightKg,
      exercise_id: track.exercise_id,
      exercise_name: track.name,
      last_result: lastResult,
      program_exercise_id: track.id,
      rep_range: repRangeLabel(track.reps_min, track.reps_max),
      start_weight_kg: firstLoggedWeight,
      weekly_weights: Array.from({ length: blockLength }, (_, index) => {
        const week = index + 1;
        return {
          label: `W${week}`,
          value: bestByWeek.get(week) ?? null,
          week
        };
      })
    } satisfies MainLiftProgress;
  });
}

export async function getProgressSummary(supabase: SupabaseClient) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from("program_enrollments")
    .select("id, program_id, started_on, block_length_weeks, programs(name)")
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
    const loggedRows = await getLoggedWorkoutRows(supabase);

    return {
      active_block: null,
      bodyweight: (bodyweightResult.data ?? []).map((log) => ({
        logged_on: log.logged_on as string,
        weight_kg: Number(log.weight_kg)
      })),
      main_lifts: fallbackMainLiftsFromRows(loggedRows),
      periods
    } satisfies ProgressSummary;
  }

  const blockLength = enrollment.block_length_weeks ?? 12;
  const activeWeek = Math.min(blockLength, weekNumberFor(enrollment.started_on));
  const blockWorkouts = workouts.filter((workout) => {
    const week = workoutWeek(enrollment.started_on, workout.started_at);
    return week >= 1 && week <= blockLength;
  });
  const workoutsThisBlockWeek = blockWorkouts.filter(
    (workout) => workoutWeek(enrollment.started_on, workout.started_at) === activeWeek
  );

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
          program_set_id,
          weight_kg,
          reps,
          completed_at
        )
      `
    )
    .eq("workouts.program_enrollment_id", enrollment.id)
    .eq("workouts.status", "completed");

  if (rowsError) {
    throw new Error(rowsError.message);
  }

  const workoutRows = (rows ?? []) as RawWorkoutExercise[];
  const mainLifts = await getTrackMainLifts({
    blockLength,
    enrollment,
    supabase,
    workoutRows
  });

  return {
    active_block: {
      block_length_weeks: blockLength,
      program_name: firstProgramName(enrollment.programs) ?? "Plan",
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
    periods
  } satisfies ProgressSummary;
}
