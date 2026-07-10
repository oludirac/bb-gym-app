import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgramProgressionStyle } from "@/lib/programs/queries";

type ProgressionTrack = {
  current_weight_kg: number | null;
  id: string;
  name: string;
  weight_increment_kg: number;
};

type FindOrCreateProgressionTrackInput = {
  currentWeightKg: number | null;
  exerciseId: string;
  exerciseName: string;
  ownerId: string;
  programId: string;
  progressionStyle: ProgramProgressionStyle;
  repsMax: number | null;
  repsMin: number | null;
  separateKey?: string | null;
  weightIncrementKg: number;
};

function repLabel(min: number | null, max: number | null) {
  if (min !== null && max !== null) {
    return min === max ? String(min) : `${min}-${max}`;
  }

  return String(min ?? max ?? "reps");
}

function trackKey(input: FindOrCreateProgressionTrackInput) {
  const scope = input.separateKey ? `separate:${input.separateKey}` : "shared";

  return [
    scope,
    input.exerciseId,
    input.progressionStyle,
    input.repsMin ?? "null",
    input.repsMax ?? "null"
  ].join(":");
}

function trackName(input: FindOrCreateProgressionTrackInput) {
  return `${input.exerciseName} ${repLabel(input.repsMin, input.repsMax)}`;
}

export async function findOrCreateProgressionTrack(
  supabase: SupabaseClient,
  input: FindOrCreateProgressionTrackInput
): Promise<ProgressionTrack | null> {
  if (
    input.progressionStyle === "fixed" ||
    input.currentWeightKg === null ||
    input.repsMax === null
  ) {
    return null;
  }

  const key = trackKey(input);
  const { data: existing, error: existingError } = await supabase
    .from("progression_tracks")
    .select("id, name, current_weight_kg, weight_increment_kg")
    .eq("program_id", input.programId)
    .eq("track_key", key)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return {
      current_weight_kg:
        existing.current_weight_kg === null
          ? null
          : Number(existing.current_weight_kg),
      id: existing.id,
      name: existing.name,
      weight_increment_kg: Number(existing.weight_increment_kg)
    };
  }

  const { data: created, error: createdError } = await supabase
    .from("progression_tracks")
    .insert({
      current_weight_kg: input.currentWeightKg,
      exercise_id: input.exerciseId,
      name: trackName(input),
      owner_id: input.ownerId,
      program_id: input.programId,
      progression_style: input.progressionStyle,
      reps_max: input.repsMax,
      reps_min: input.repsMin,
      track_key: key,
      weight_increment_kg: input.weightIncrementKg
    })
    .select("id, name, current_weight_kg, weight_increment_kg")
    .single();

  if (createdError) {
    throw new Error(createdError.message);
  }

  return {
    current_weight_kg:
      created.current_weight_kg === null ? null : Number(created.current_weight_kg),
    id: created.id,
    name: created.name,
    weight_increment_kg: Number(created.weight_increment_kg)
  };
}
