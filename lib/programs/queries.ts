import type { SupabaseClient } from "@supabase/supabase-js";

export type ProgramSet = {
  id: string;
  notes: string | null;
  rest_seconds: number | null;
  set_type: string;
  sort_order: number;
  target_reps_max: number | null;
  target_reps_min: number | null;
  target_rir: number | null;
  target_rpe: number | null;
  target_weight_kg: number | null;
};

export type ProgramExercise = {
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
};

export type ActiveProgramEnrollment = {
  completed_workouts: number;
  current_day: number;
  current_week: number;
  id: string;
  percent_complete: number;
  program_id: string;
  program_name: string;
  started_on: string;
  status: string;
  total_days: number;
};

type RawActiveProgramEnrollment = {
  current_day: number;
  current_week: number;
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
  status: string;
};

type RawProgramCategory = {
  category: string;
};

type RawProgramSet = ProgramSet;

type RawProgramExercise = {
  exercise_id: string;
  exercises:
    | {
        name: string;
      }
    | {
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
  program_weeks?: RawProgramWeek[] | null;
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
  program_categories (
    category
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
          name
        ),
        program_sets (
          id,
          sort_order,
          set_type,
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

function mapProgramSet(set: RawProgramSet): ProgramSet {
  return {
    ...set,
    target_rir: set.target_rir === null ? null : Number(set.target_rir),
    target_rpe: set.target_rpe === null ? null : Number(set.target_rpe),
    target_weight_kg:
      set.target_weight_kg === null ? null : Number(set.target_weight_kg)
  };
}

function mapProgram(raw: RawProgram): ProgramDetail {
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
    weeks: sortByOrder(raw.program_weeks ?? [], "week_number").map((week) => ({
      days: sortByOrder(week.program_days ?? [], "day_number").map((day) => ({
        day_number: day.day_number,
        exercises: sortByOrder(
          day.program_exercises ?? [],
          "sort_order"
        ).map((exercise) => ({
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
        notes: day.notes
      })),
      id: week.id,
      notes: week.notes,
      week_number: week.week_number
    }))
  };
}

export async function getProgramSummaries(supabase: SupabaseClient) {
  const { data, error } = await supabase
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
        program_weeks (
          id,
          program_days (id)
        )
      `
    )
    .order("is_public", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawProgram[]).map((program) => ({
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
    owner_id: program.owner_id
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
          name
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
    started_on: enrollment.started_on,
    status: enrollment.status,
    total_days: totalDays
  } satisfies ActiveProgramEnrollment;
}
