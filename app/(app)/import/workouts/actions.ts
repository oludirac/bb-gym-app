"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { normalizeCsvName, parseCsv } from "@/lib/csv";
import { bodyPartCategorySet } from "@/lib/exercises/categories";

const requiredColumns = [
  "workout_name",
  "exercise_name",
  "category",
  "set_number",
  "reps",
  "weight_kg",
  "duration_minutes",
  "distance_km",
  "intensity",
  "rest_seconds"
];

type CsvRow = Record<string, string>;

type ParsedWorkoutRow = {
  category: string;
  distanceKm: number | null;
  durationSeconds: number | null;
  exerciseId: string;
  exerciseKey: string;
  exerciseName: string;
  intensity: string | null;
  reps: number | null;
  restSeconds: number | null;
  setNumber: number;
  weightKg: number | null;
};

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function positiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "exercise"}-${crypto.randomUUID().slice(0, 8)}`;
}

function importError(message: string): never {
  redirect(`/import/workouts?error=${encodeURIComponent(message)}`);
}

export async function importWorkoutCsv(formData: FormData) {
  const { supabase, user } = await requireUser();
  const rows = parseCsv(fieldValue(formData, "csv"));

  if (rows.length < 2) {
    importError("Add a header row and at least one workout set.");
  }

  const headers = rows[0].map(normalizeCsvName);
  const missingColumns = requiredColumns.filter(
    (column) => !headers.includes(column)
  );

  if (missingColumns.length > 0) {
    importError(`Missing columns: ${missingColumns.join(", ")}.`);
  }

  const { data: activeWorkout } = await supabase
    .from("workouts")
    .select("id")
    .eq("owner_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (activeWorkout?.id) {
    importError("Finish or cancel your current workout before importing another.");
  }

  const rowObjects = rows.slice(1).map((cells, index) => {
    const row: CsvRow = {};

    headers.forEach((header, headerIndex) => {
      row[header] = cells[headerIndex] ?? "";
    });

    return { row, rowNumber: index + 2 };
  });
  const workoutName = rowObjects[0]?.row.workout_name?.trim();

  if (!workoutName) {
    importError("workout_name is required on every row.");
  }

  const validatedRows: Omit<ParsedWorkoutRow, "exerciseId">[] = [];
  const seenSets = new Set<string>();
  const categoryByExercise = new Map<string, string>();

  for (const { row, rowNumber } of rowObjects) {
    const rowWorkoutName = row.workout_name?.trim();
    const exerciseName = row.exercise_name?.trim();
    const exerciseKey = normalizeCsvName(exerciseName ?? "");
    const category = normalizeCsvName(row.category ?? "").replace(/[\s-]+/g, "_");
    const setNumber = positiveInteger(row.set_number ?? "");
    const reps = optionalNumber(row.reps ?? "");
    const weightKg = optionalNumber(row.weight_kg ?? "");
    const durationMinutes = optionalNumber(row.duration_minutes ?? "");
    const distanceKm = optionalNumber(row.distance_km ?? "");
    const intensity = row.intensity?.trim() || null;
    const restSeconds = optionalNumber(row.rest_seconds ?? "");

    for (const field of [
      "reps",
      "weight_kg",
      "duration_minutes",
      "distance_km",
      "rest_seconds"
    ]) {
      if (row[field]?.trim() && optionalNumber(row[field]) === null) {
        importError(`Row ${rowNumber}: ${field} must be zero or more.`);
      }
    }

    if (rowWorkoutName !== workoutName) {
      importError(`Row ${rowNumber}: use the same workout_name on every row.`);
    }

    if (!exerciseName || !exerciseKey) {
      importError(`Row ${rowNumber}: exercise_name is required.`);
    }

    if (!bodyPartCategorySet.has(category)) {
      importError(`Row ${rowNumber}: category is not supported.`);
    }

    const existingCategory = categoryByExercise.get(exerciseKey);
    if (existingCategory && existingCategory !== category) {
      importError(`Row ${rowNumber}: use one category for ${exerciseName}.`);
    }
    categoryByExercise.set(exerciseKey, category);

    if (!setNumber) {
      importError(`Row ${rowNumber}: set_number must be a positive whole number.`);
    }

    const setKey = `${exerciseKey}:${setNumber}`;
    if (seenSets.has(setKey)) {
      importError(`Row ${rowNumber}: duplicate set_number for ${exerciseName}.`);
    }
    seenSets.add(setKey);

    if (category === "cardio") {
      if (durationMinutes === null && distanceKm === null && !intensity) {
        importError(
          `Row ${rowNumber}: cardio needs duration_minutes, distance_km, or intensity.`
        );
      }
    } else if (reps === null || !Number.isInteger(reps) || reps <= 0) {
      importError(`Row ${rowNumber}: reps must be a positive whole number.`);
    }

    if (restSeconds !== null && !Number.isInteger(restSeconds)) {
      importError(`Row ${rowNumber}: rest_seconds must be a whole number.`);
    }

    validatedRows.push({
      category,
      distanceKm,
      durationSeconds:
        durationMinutes === null ? null : Math.round(durationMinutes * 60),
      exerciseKey,
      exerciseName,
      intensity,
      reps,
      restSeconds,
      setNumber,
      weightKg
    });
  }

  const { data: exercises, error: exercisesError } = await supabase
    .from("exercises")
    .select("id, name, is_builtin, category")
    .is("deleted_at", null);

  if (exercisesError) {
    importError("Could not load the exercise list.");
  }

  const exerciseByName = new Map<string, string>();

  for (const exercise of (exercises ?? []).filter((item) => !item.is_builtin)) {
    exerciseByName.set(normalizeCsvName(exercise.name), exercise.id);
  }

  for (const exercise of (exercises ?? []).filter((item) => item.is_builtin)) {
    const key = normalizeCsvName(exercise.name);
    if (!exerciseByName.has(key)) {
      exerciseByName.set(key, exercise.id);
    }
  }

  const missingExercises = [
    ...new Map(
      validatedRows
        .filter((row) => !exerciseByName.has(row.exerciseKey))
        .map((row) => [row.exerciseKey, row])
    ).values()
  ];

  if (missingExercises.length > 0) {
    const { data: createdExercises, error: createExercisesError } = await supabase
      .from("exercises")
      .insert(
        missingExercises.map((exercise) => ({
          category: exercise.category,
          equipment: [],
          is_builtin: false,
          name: exercise.exerciseName,
          owner_id: user.id,
          slug: slugify(exercise.exerciseName)
        }))
      )
      .select("id, name");

    if (createExercisesError || !createdExercises) {
      importError("Could not create the private exercises in this workout.");
    }

    for (const exercise of createdExercises) {
      exerciseByName.set(normalizeCsvName(exercise.name), exercise.id);
    }
  }

  const parsedRows: ParsedWorkoutRow[] = validatedRows.map((row) => ({
    ...row,
    exerciseId: exerciseByName.get(row.exerciseKey) ?? ""
  }));

  if (parsedRows.some((row) => !row.exerciseId)) {
    importError("Could not match every exercise in the workout.");
  }

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      name: workoutName,
      owner_id: user.id,
      status: "active"
    })
    .select("id")
    .single();

  if (workoutError || !workout?.id) {
    importError("Could not create the workout.");
  }

  const orderedExercises = [
    ...new Map(parsedRows.map((row) => [row.exerciseKey, row])).values()
  ];
  const { data: workoutExercises, error: workoutExercisesError } = await supabase
    .from("workout_exercises")
    .insert(
      orderedExercises.map((exercise, index) => ({
        exercise_id: exercise.exerciseId,
        exercise_name_snapshot: exercise.exerciseName,
        sort_order: (index + 1) * 1000,
        workout_id: workout.id
      }))
    )
    .select("id, exercise_id");

  if (workoutExercisesError || !workoutExercises) {
    await supabase.from("workouts").delete().eq("id", workout.id);
    importError("Could not add the exercises to the workout.");
  }

  const workoutExerciseIdByExerciseId = new Map(
    workoutExercises.map((exercise) => [exercise.exercise_id, exercise.id])
  );
  const { error: setsError } = await supabase.from("workout_sets").insert(
    parsedRows.map((row) => ({
      completed_at: null,
      distance_km: row.distanceKm,
      duration_seconds: row.durationSeconds,
      intensity: row.intensity,
      reps: row.reps,
      rest_seconds: row.restSeconds,
      set_type: "working",
      sort_order: row.setNumber * 1000,
      weight_kg: row.weightKg,
      workout_exercise_id: workoutExerciseIdByExerciseId.get(row.exerciseId)
    }))
  );

  if (setsError) {
    await supabase.from("workouts").delete().eq("id", workout.id);
    importError("Could not add the sets to the workout.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/workouts");
  revalidatePath("/workouts/active");
  redirect("/workouts/active");
}
