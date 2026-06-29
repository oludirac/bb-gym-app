import type { SupabaseClient } from "@supabase/supabase-js";

export type TemplateSet = {
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

export type TemplateExercise = {
  exercise_id: string;
  exercise_name: string;
  id: string;
  notes: string | null;
  sets: TemplateSet[];
  sort_order: number;
};

export type WorkoutTemplate = {
  estimated_minutes: number | null;
  exercises: TemplateExercise[];
  id: string;
  name: string;
  notes: string | null;
};

export type TemplateSummary = {
  estimated_minutes: number | null;
  exercise_count: number;
  id: string;
  name: string;
  notes: string | null;
};

type RawTemplateSet = TemplateSet;

type RawTemplateExercise = {
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
  sort_order: number;
  template_sets?: RawTemplateSet[] | null;
};

type RawTemplate = {
  estimated_minutes: number | null;
  id: string;
  name: string;
  notes: string | null;
  template_exercises?: RawTemplateExercise[] | null;
};

const templateSelect = `
  id,
  name,
  notes,
  estimated_minutes,
  template_exercises (
    id,
    exercise_id,
    sort_order,
    notes,
    exercises (
      name
    ),
    template_sets (
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
`;

function sortByOrder<T extends { sort_order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

function firstExerciseName(rawExercise: RawTemplateExercise["exercises"]) {
  if (Array.isArray(rawExercise)) {
    return rawExercise[0]?.name ?? "Exercise";
  }

  return rawExercise?.name ?? "Exercise";
}

function mapTemplate(raw: RawTemplate): WorkoutTemplate {
  return {
    estimated_minutes: raw.estimated_minutes,
    exercises: sortByOrder(raw.template_exercises ?? []).map((exercise) => ({
      exercise_id: exercise.exercise_id,
      exercise_name: firstExerciseName(exercise.exercises),
      id: exercise.id,
      notes: exercise.notes,
      sets: sortByOrder(exercise.template_sets ?? []).map((set) => ({
        ...set,
        target_rir: set.target_rir === null ? null : Number(set.target_rir),
        target_rpe: set.target_rpe === null ? null : Number(set.target_rpe),
        target_weight_kg:
          set.target_weight_kg === null ? null : Number(set.target_weight_kg)
      })),
      sort_order: exercise.sort_order
    })),
    id: raw.id,
    name: raw.name,
    notes: raw.notes
  };
}

export async function getTemplateSummaries(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("workout_templates")
    .select(
      "id, name, notes, estimated_minutes, template_exercises(id)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((template) => ({
    estimated_minutes: template.estimated_minutes,
    exercise_count: template.template_exercises?.length ?? 0,
    id: template.id,
    name: template.name,
    notes: template.notes
  })) as TemplateSummary[];
}

export async function getTemplateDetail(
  supabase: SupabaseClient,
  templateId: string
) {
  const { data, error } = await supabase
    .from("workout_templates")
    .select(templateSelect)
    .eq("id", templateId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapTemplate(data as RawTemplate) : null;
}
