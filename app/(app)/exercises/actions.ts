"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { bodyPartCategorySet } from "@/lib/exercises/categories";

const difficulties = new Set(["beginner", "intermediate", "advanced"]);

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function fieldValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `exercise-${Date.now()}`;
}

function parseEquipment(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function redirectWithError(message: string): never {
  redirect(`/exercises/new?error=${encodeURIComponent(message)}`);
}

export async function createCustomExercise(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = fieldValue(formData, "name");
  const category = fieldValue(formData, "category");
  const difficulty = fieldValue(formData, "difficulty");
  const movementPattern = fieldValue(formData, "movementPattern");
  const equipment = parseEquipment(fieldValue(formData, "equipment"));
  const instructions = fieldValue(formData, "instructions");
  const notes = fieldValue(formData, "notes");
  const primaryMuscles = fieldValues(formData, "primaryMuscles");
  const secondaryMuscles = fieldValues(formData, "secondaryMuscles").filter(
    (muscleId) => !primaryMuscles.includes(muscleId)
  );

  if (!name) {
    redirectWithError("Exercise name is required.");
  }

  if (!bodyPartCategorySet.has(category)) {
    redirectWithError("Choose a valid category.");
  }

  if (difficulty && !difficulties.has(difficulty)) {
    redirectWithError("Choose a valid difficulty.");
  }

  const { data: exercise, error: exerciseError } = await supabase
    .from("exercises")
    .insert({
      category,
      difficulty: difficulty || null,
      equipment,
      instructions: instructions || null,
      is_builtin: false,
      movement_pattern: movementPattern || null,
      name,
      notes: notes || null,
      owner_id: user.id,
      slug: slugify(name)
    })
    .select("id")
    .single();

  if (exerciseError || !exercise) {
    redirectWithError(exerciseError?.message ?? "Could not create exercise.");
  }

  const muscleRows = [
    ...primaryMuscles.map((muscleId) => ({
      exercise_id: exercise.id,
      muscle_id: muscleId,
      role: "primary"
    })),
    ...secondaryMuscles.map((muscleId) => ({
      exercise_id: exercise.id,
      muscle_id: muscleId,
      role: "secondary"
    }))
  ];

  if (muscleRows.length > 0) {
    const { error: muscleError } = await supabase
      .from("exercise_muscles")
      .insert(muscleRows);

    if (muscleError) {
      await supabase.from("exercises").delete().eq("id", exercise.id);
      redirectWithError(muscleError.message);
    }
  }

  revalidatePath("/exercises");
  redirect(`/exercises/${exercise.id}`);
}

export async function deleteCustomExercise(formData: FormData) {
  const { supabase } = await requireUser();
  const exerciseId = fieldValue(formData, "exerciseId");

  if (!exerciseId) {
    redirect("/exercises");
  }

  await supabase
    .from("exercises")
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq("id", exerciseId)
    .eq("is_builtin", false);

  revalidatePath("/exercises");
  redirect("/exercises");
}
