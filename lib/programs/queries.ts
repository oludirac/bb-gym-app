import type { SupabaseClient } from "@supabase/supabase-js";

export type ProgramScheduleType = "calendar" | "sequence";

export type ProgramDaySchedule = {
  id: string;
  program_day_id: string;
  weekday: number;
};

export type ProgramSet = {
  id: string;
  notes: string | null;
  rest_seconds: number | null;
  set_type: string;
  sort_order: number;
  target_distance_km: number | null;
  target_duration_seconds: number | null;
  target_intensity: string | null;
  target_reps_max: number | null;
  target_reps_min: number | null;
  target_rir: number | null;
  target_rpe: number | null;
  target_weight_kg: number | null;
};

export type ProgramExercise = {
  exercise_category: string;
  exercise_id: string;
  exercise_name: string;
  id: string;
  notes: string | null;
  sets: ProgramSet[];
  sort_order: number;
};

export type ProgramDay = {
  day_number: number;
  exercises: ProgramExercise[];
  focus: string | null;
  id: string;
  name: string;
  notes: string | null;
  schedule_weekdays: number[];
};

export type ProgramWeek = {
  days: ProgramDay[];
  id: string;
  notes: string | null;
  week_number: number;
};

export type ProgramDetail = {
  avg_session_minutes: number | null;
  categories: string[];
  days_per_week: number | null;
  description: string | null;
  difficulty: string | null;
  equipment_required: string[];
  id: string;
  is_public: boolean;
  name: string;
  owner_id: string | null;
  schedule_type: ProgramScheduleType;
  weeks: ProgramWeek[];
};

export type ProgramSummary = {
  avg_session_minutes: number | null;
  categories: string[];
  day_count: number;
  days_per_week: number | null;
  description: string | null;
  difficulty: string | null;
  equipment_required: string[];
  id: string;
  is_public: boolean;
  name: string;
  owner_id: string | null;
  schedule_type: ProgramScheduleType;
};

export type ActiveProgramEnrollment = {
  completed_workouts: number;
  current_day: number;
  current_week: number;
  id: string;
  percent_complete: number;
  program_id: string;
  program_name: string;
  schedule_type: ProgramScheduleType;
  started_on: string;
  status: string;
  total_days: number;
};

export type TodayPlanOverview = {
  completed_today: boolean;
  enrollment_id: string;
  missed: {
    day: ProgramDay;
    scheduled_for: string;
    week_number: number;
  } | null;
  program_day: ProgramDay | null;
  program_id: string;
  program_name: string;
  scheduled_for: string;
  schedule_type: ProgramScheduleType;
  status: "done" | "due" | "missed" | "rest" | "sequence";
  week_number: number | null;
};

type RawActiveProgramEnrollment = {
  current_day: number;
  current_week: number;
  id: string;
  program_id: string;
  programs:
    | {
        name: string;
        schedule_type: ProgramScheduleType;
      }
    | {
        name: string;
        schedule_type: ProgramScheduleType;
      }[]
    | null;
  started_on: string;
  status: string;
};

type RawProgramCategory = {
  category: string;
};

type RawProgramDaySchedule = {
  id: string;
  program_day_id: string;
  weekday: number;
};

type RawProgramSet = ProgramSet;

type RawProgramExercise = {
  exercise_id: string;
  exercises:
    | {
        category: string;
        name: string;
      }
    | {
        category: string;
        name: string;
      }[]
    | null;
  id: string;
  notes: string | null;
  program_sets?: RawProgramSet[] | null;
  sort_order: number;
};

type RawProgramDay = {
  day_number: number;
  focus: string | null;
  id: string;
  name: string;
  notes: string | null;
  program_exercises?: RawProgramExercise[] | null;
};

type RawProgramWeek = {
  id: string;
  notes: string | null;
  program_days?: RawProgramDay[] | null;
  week_number: number;
};

type RawProgram = {
  avg_session_minutes: number | null;
  days_per_week: number | null;
  description: string | null;
  difficulty: string | null;
  equipment_required: string[] | null;
  id: string;
  is_public: boolean;
  name: string;
  owner_id: string | null;
  program_categories?: RawProgramCategory[] | null;
  program_day_schedules?: RawProgramDaySchedule[] | null;
  program_weeks?: RawProgramWeek[] | null;
  schedule_type: ProgramScheduleType | null;
};

const programDetailSelect = `
  id,
  owner_id,
  is_public,
  name,
  description,
  difficulty,
  days_per_week,
  avg_session_minutes,
  equipment_required,
  schedule_type,
  program_categories (
    category
  ),
  program_day_schedules (
    id,
    program_day_id,
    weekday
  ),
  program_weeks (
    id,
    week_number,
    notes,
    program_days (
      id,
      day_number,
      name,
      focus,
      notes,
      program_exercises (
        id,
        exercise_id,
        sort_order,
        notes,
        exercises (
          category,
          name
        ),
        program_sets (
          id,
          sort_order,
          set_type,
          target_duration_seconds,
          target_distance_km,
          target_intensity,
          target_reps_min,
          target_reps_max,
          target_weight_kg,
          target_rpe,
          target_rir,
          rest_seconds,
          notes
        )
      )
    )
  )
`;

function sortByOrder<T extends Record<TKey, number>, TKey extends keyof T>(
  items: T[],
  key: TKey
) {
  return [...items].sort((a, b) => a[key] - b[key]);
}

function firstExerciseName(rawExercise: RawProgramExercise["exercises"]) {
  if (Array.isArray(rawExercise)) {
    return rawExercise[0]?.name ?? "Exercise";
  }

  return rawExercise?.name ?? "Exercise";
}

function firstExerciseCategory(rawExercise: RawProgramExercise["exercises"]) {
  if (Array.isArray(rawExercise)) {
    return rawExercise[0]?.category ?? "chest";
  }

  return rawExercise?.category ?? "chest";
}

function mapProgramSet(set: RawProgramSet): ProgramSet {
  return {
    ...set,
    target_distance_km:
      set.target_distance_km === null ? null : Number(set.target_distance_km),
    target_rir: set.target_rir === null ? null : Number(set.target_rir),
    target_rpe: set.target_rpe === null ? null : Number(set.target_rpe),
    target_weight_kg:
      set.target_weight_kg === null ? null : Number(set.target_weight_kg)
  };
}

function mapProgram(raw: RawProgram): ProgramDetail {
  const scheduleMap = new Map<string, number[]>();

  for (const schedule of raw.program_day_schedules ?? []) {
    scheduleMap.set(schedule.program_day_id, [
      ...(scheduleMap.get(schedule.program_day_id) ?? []),
      schedule.weekday
    ]);
  }

  return {
    avg_session_minutes: raw.avg_session_minutes,
    categories: (raw.program_categories ?? []).map((item) => item.category),
    days_per_week: raw.days_per_week,
    description: raw.description,
    difficulty: raw.difficulty,
    equipment_required: raw.equipment_required ?? [],
    id: raw.id,
    is_public: raw.is_public,
    name: raw.name,
    owner_id: raw.owner_id,
    schedule_type: raw.schedule_type ?? "sequence",
    weeks: sortByOrder(raw.program_weeks ?? [], "week_number").map((week) => ({
      days: sortByOrder(week.program_days ?? [], "day_number").map((day) => ({
        day_number: day.day_number,
        exercises: sortByOrder(
          day.program_exercises ?? [],
          "sort_order"
        ).map((exercise) => ({
          exercise_category: firstExerciseCategory(exercise.exercises),
          exercise_id: exercise.exercise_id,
          exercise_name: firstExerciseName(exercise.exercises),
          id: exercise.id,
          notes: exercise.notes,
          sets: sortByOrder(exercise.program_sets ?? [], "sort_order").map(
            mapProgramSet
          ),
          sort_order: exercise.sort_order
        })),
        focus: day.focus,
        id: day.id,
        name: day.name,
        notes: day.notes,
        schedule_weekdays: (scheduleMap.get(day.id) ?? []).sort(
          (a, b) => a - b
        )
      })),
      id: week.id,
      notes: week.notes,
      week_number: week.week_number
    }))
  };
}

export async function getProgramSummaries(supabase: SupabaseClient) {
  const [programsResult, hiddenResult] = await Promise.all([
    supabase
      .from("programs")
      .select(
        `
        id,
        owner_id,
        is_public,
        name,
        description,
        difficulty,
        days_per_week,
        avg_session_minutes,
        equipment_required,
        program_categories (category),
        schedule_type,
        program_weeks (
          id,
          program_days (id)
        )
      `
      )
      .order("is_public", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase.from("hidden_public_programs").select("program_id")
  ]);

  if (programsResult.error) {
    throw new Error(programsResult.error.message);
  }

  if (hiddenResult.error) {
    throw new Error(hiddenResult.error.message);
  }

  const hiddenPublicProgramIds = new Set(
    (hiddenResult.data ?? []).map((row) => row.program_id as string)
  );

  return ((programsResult.data ?? []) as RawProgram[])
    .filter(
      (program) =>
        !program.is_public || !hiddenPublicProgramIds.has(program.id)
    )
    .map((program) => ({
    avg_session_minutes: program.avg_session_minutes,
    categories: (program.program_categories ?? []).map((item) => item.category),
    day_count: (program.program_weeks ?? []).reduce(
      (total, week) => total + (week.program_days?.length ?? 0),
      0
    ),
    days_per_week: program.days_per_week,
    description: program.description,
    difficulty: program.difficulty,
    equipment_required: program.equipment_required ?? [],
    id: program.id,
    is_public: program.is_public,
    name: program.name,
    owner_id: program.owner_id,
    schedule_type: program.schedule_type ?? "sequence"
  })) satisfies ProgramSummary[];
}

export async function getProgramDetail(
  supabase: SupabaseClient,
  programId: string
) {
  const { data, error } = await supabase
    .from("programs")
    .select(programDetailSelect)
    .eq("id", programId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapProgram(data as RawProgram) : null;
}

export async function getActiveProgramEnrollment(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("program_enrollments")
    .select(
      `
        id,
        program_id,
        started_on,
        status,
        current_week,
        current_day,
        programs (
          name,
          schedule_type
        )
      `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const enrollment = data as RawActiveProgramEnrollment;
  const programName = Array.isArray(enrollment.programs)
    ? enrollment.programs[0]?.name
    : enrollment.programs?.name;
  const scheduleType = Array.isArray(enrollment.programs)
    ? enrollment.programs[0]?.schedule_type
    : enrollment.programs?.schedule_type;

  const [program, completedWorkoutsResult] = await Promise.all([
    getProgramDetail(supabase, enrollment.program_id),
    supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("program_enrollment_id", enrollment.id)
      .eq("status", "completed")
  ]);

  const totalDays =
    program?.weeks.reduce((total, week) => total + week.days.length, 0) ?? 0;
  const completedWorkouts = completedWorkoutsResult.count ?? 0;

  return {
    completed_workouts: completedWorkouts,
    current_day: enrollment.current_day,
    current_week: enrollment.current_week,
    id: enrollment.id,
    percent_complete:
      totalDays > 0 ? Math.min(100, Math.round((completedWorkouts / totalDays) * 100)) : 0,
    program_id: enrollment.program_id,
    program_name: programName ?? "Program",
    schedule_type: scheduleType ?? "sequence",
    started_on: enrollment.started_on,
    status: enrollment.status,
    total_days: totalDays
  } satisfies ActiveProgramEnrollment;
}

function todayIsoDate() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function weekdayNumber(date = new Date()) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function previousDateForWeekday(targetWeekday: number, from = new Date()) {
  const currentWeekday = weekdayNumber(from);
  const diff = (currentWeekday - targetWeekday + 7) % 7;

  if (diff === 0) {
    return null;
  }

  const previous = new Date(from);
  previous.setDate(previous.getDate() - diff);
  return new Intl.DateTimeFormat("en-CA").format(previous);
}

function orderedProgramDays(program: ProgramDetail) {
  return program.weeks.flatMap((week) =>
    week.days.map((day) => ({
      day,
      weekNumber: week.week_number
    }))
  );
}

export async function getTodayPlanOverview(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("program_enrollments")
    .select(
      `
        id,
        program_id,
        started_on,
        status,
        current_week,
        current_day,
        programs (
          name,
          schedule_type
        )
      `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const enrollment = data as RawActiveProgramEnrollment;
  const program = await getProgramDetail(supabase, enrollment.program_id);

  if (!program) {
    return null;
  }

  const today = new Date();
  const todayIso = todayIsoDate();
  const todayWeekday = weekdayNumber(today);
  const orderedDays = orderedProgramDays(program);
  const completedTodayResult = await supabase
    .from("workouts")
    .select("id", { count: "exact", head: true })
    .eq("program_enrollment_id", enrollment.id)
    .eq("status", "completed")
    .eq("scheduled_for", todayIso);
  const completedToday = (completedTodayResult.count ?? 0) > 0;

  if (program.schedule_type === "calendar") {
    const todayMatch =
      orderedDays.find(({ day }) =>
        day.schedule_weekdays.includes(todayWeekday)
      ) ?? null;
    const previousMatches = orderedDays
      .flatMap(({ day, weekNumber }) =>
        day.schedule_weekdays.map((weekday) => ({
          day,
          scheduled_for: previousDateForWeekday(weekday, today),
          weekday,
          weekNumber
        }))
      )
      .filter(
        (
          item
        ): item is {
          day: ProgramDay;
          scheduled_for: string;
          weekday: number;
          weekNumber: number;
        } => Boolean(item.scheduled_for)
      )
      .filter((item) => item.scheduled_for >= enrollment.started_on)
      .sort((a, b) => b.scheduled_for.localeCompare(a.scheduled_for));
    let missed: TodayPlanOverview["missed"] = null;
    let completedMissedKeys = new Set<string>();

    if (previousMatches.length > 0) {
      const { data: completedRows } = await supabase
        .from("workouts")
        .select("program_day_id, scheduled_for")
        .eq("program_enrollment_id", enrollment.id)
        .eq("status", "completed")
        .in(
          "scheduled_for",
          previousMatches.map((item) => item.scheduled_for)
        );

      completedMissedKeys = new Set(
        ((completedRows ?? []) as {
          program_day_id: string | null;
          scheduled_for: string | null;
        }[])
          .filter((row) => row.program_day_id && row.scheduled_for)
          .map((row) => `${row.program_day_id}:${row.scheduled_for}`)
      );
    }

    for (const item of previousMatches) {
      if (!completedMissedKeys.has(`${item.day.id}:${item.scheduled_for}`)) {
        missed = {
          day: item.day,
          scheduled_for: item.scheduled_for,
          week_number: item.weekNumber
        };
        break;
      }
    }

    return {
      completed_today: completedToday,
      enrollment_id: enrollment.id,
      missed,
      program_day: todayMatch?.day ?? null,
      program_id: program.id,
      program_name: program.name,
      scheduled_for: todayIso,
      schedule_type: program.schedule_type,
      status: todayMatch
        ? completedToday
          ? "done"
          : "due"
        : missed
          ? "missed"
          : "rest",
      week_number: todayMatch?.weekNumber ?? null
    } satisfies TodayPlanOverview;
  }

  const current =
    orderedDays.find(
      ({ day, weekNumber }) =>
        weekNumber === enrollment.current_week &&
        day.day_number === enrollment.current_day
    ) ?? orderedDays[0] ?? null;

  return {
    completed_today: completedToday,
    enrollment_id: enrollment.id,
    missed: null,
    program_day: current?.day ?? null,
    program_id: program.id,
    program_name: program.name,
    scheduled_for: todayIso,
    schedule_type: program.schedule_type,
    status: "sequence",
    week_number: current?.weekNumber ?? null
  } satisfies TodayPlanOverview;
}
