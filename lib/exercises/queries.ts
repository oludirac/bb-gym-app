import type { SupabaseClient } from "@supabase/supabase-js";

export type MuscleRole = "primary" | "secondary";

export type ExerciseMuscle = {
  id: string;
  name: string;
  role: MuscleRole;
  slug: string;
};

export type ExerciseSummary = {
  category: string;
  difficulty: string | null;
  equipment: string[];
  id: string;
  is_builtin: boolean;
  movement_pattern: string | null;
  name: string;
  owner_id: string | null;
  primaryMuscles: ExerciseMuscle[];
  slug: string;
};

export type ExerciseDetail = ExerciseSummary & {
  instructions: string | null;
  notes: string | null;
  secondaryMuscles: ExerciseMuscle[];
};

export type MuscleOption = {
  id: string;
  muscle_group: string;
  name: string;
  slug: string;
};

export type ExerciseFilters = {
  category?: string;
  difficulty?: string;
  muscle?: string;
  q?: string;
};

type RawMuscleJoin = {
  role: MuscleRole;
  muscles:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | {
        id: string;
        name: string;
        slug: string;
      }[]
    | null;
};

type RawExercise = {
  category: string;
  difficulty: string | null;
  equipment: string[] | null;
  exercise_muscles?: RawMuscleJoin[] | null;
  id: string;
  instructions?: string | null;
  is_builtin: boolean;
  movement_pattern: string | null;
  name: string;
  notes?: string | null;
  owner_id: string | null;
  slug: string;
};

const exerciseSelect = `
  id,
  is_builtin,
  owner_id,
  name,
  slug,
  category,
  equipment,
  movement_pattern,
  difficulty,
  instructions,
  notes,
  exercise_muscles (
    role,
    muscles (
      id,
      name,
      slug
    )
  )
`;

function firstMuscle(rawMuscle: RawMuscleJoin["muscles"]) {
  if (Array.isArray(rawMuscle)) {
    return rawMuscle[0] ?? null;
  }

  return rawMuscle;
}

function mapMuscles(raw: RawExercise, role: MuscleRole) {
  return (raw.exercise_muscles ?? [])
    .filter((join) => join.role === role)
    .map((join) => {
      const muscle = firstMuscle(join.muscles);

      if (!muscle) {
        return null;
      }

      return {
        id: muscle.id,
        name: muscle.name,
        role: join.role,
        slug: muscle.slug
      } satisfies ExerciseMuscle;
    })
    .filter((muscle): muscle is ExerciseMuscle => Boolean(muscle))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function mapExerciseSummary(raw: RawExercise): ExerciseSummary {
  return {
    category: raw.category,
    difficulty: raw.difficulty,
    equipment: raw.equipment ?? [],
    id: raw.id,
    is_builtin: raw.is_builtin,
    movement_pattern: raw.movement_pattern,
    name: raw.name,
    owner_id: raw.owner_id,
    primaryMuscles: mapMuscles(raw, "primary"),
    slug: raw.slug
  };
}

function mapExerciseDetail(raw: RawExercise): ExerciseDetail {
  return {
    ...mapExerciseSummary(raw),
    instructions: raw.instructions ?? null,
    notes: raw.notes ?? null,
    secondaryMuscles: mapMuscles(raw, "secondary")
  };
}

function cleanFilter(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

export function normalizeExerciseFilters(filters: ExerciseFilters) {
  return {
    category: cleanFilter(filters.category),
    difficulty: cleanFilter(filters.difficulty),
    muscle: cleanFilter(filters.muscle),
    q: cleanFilter(filters.q)
  } satisfies ExerciseFilters;
}

export async function getMuscleOptions(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("muscles")
    .select("id, name, slug, muscle_group")
    .order("muscle_group", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MuscleOption[];
}

export async function getExerciseSummaries(
  supabase: SupabaseClient,
  filters: ExerciseFilters
) {
  const normalized = normalizeExerciseFilters(filters);
  let exerciseIdsForMuscle: string[] | null = null;

  if (normalized.muscle) {
    const { data, error } = await supabase
      .from("exercise_muscles")
      .select("exercise_id, muscles!inner(slug)")
      .eq("muscles.slug", normalized.muscle);

    if (error) {
      throw new Error(error.message);
    }

    exerciseIdsForMuscle = (data ?? []).map(
      (row: { exercise_id: string }) => row.exercise_id
    );

    if (exerciseIdsForMuscle.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("exercises")
    .select(exerciseSelect)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (normalized.q) {
    query = query.ilike("name", `%${normalized.q}%`);
  }

  if (normalized.category) {
    query = query.eq("category", normalized.category);
  }

  if (normalized.difficulty) {
    query = query.eq("difficulty", normalized.difficulty);
  }

  if (exerciseIdsForMuscle) {
    query = query.in("id", exerciseIdsForMuscle);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawExercise[]).map(mapExerciseSummary);
}

export async function getExerciseDetail(
  supabase: SupabaseClient,
  exerciseId: string
) {
  const { data, error } = await supabase
    .from("exercises")
    .select(exerciseSelect)
    .eq("id", exerciseId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapExerciseDetail(data as RawExercise) : null;
}
