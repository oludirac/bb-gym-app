"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { displayUnitToKg } from "@/lib/unit-conversion";
import { normalizeCsvName, parseCsv } from "@/lib/csv";

const requiredColumns = [
  "program_name",
  "week",
  "day",
  "day_name",
  "exercise_name",
  "set_order"
];

const allowedCategories = new Set([
  "strength",
  "hypertrophy",
  "powerbuilding",
  "cardio",
  "running",
  "hyrox",
  "mobility",
  "general_fitness",
  "fat_loss"
]);

const allowedDifficulties = new Set(["beginner", "intermediate", "advanced"]);
const allowedSetTypes = new Set(["warmup", "working", "drop", "failure"]);

type CsvRow = Record<string, string>;

type ParsedProgramRow = {
  category: string | null;
  day: number;
  dayName: string;
  difficulty: string | null;
  exerciseId: string;
  exerciseName: string;
  notes: string | null;
  repsMax: number | null;
  repsMin: number | null;
  restSeconds: number | null;
  rir: number | null;
  rowNumber: number;
  rpe: number | null;
  setOrder: number;
  setType: string;
  weightKg: number | null;
  week: number;
};

type ImportErrorInput = {
  code: string;
  field: string | null;
  message: string;
  raw_row?: CsvRow;
  row_number: number | null;
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
  return Number.isFinite(parsed) ? parsed : null;
}

function positiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeEnumValue(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

async function saveImportErrors(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  importId: string,
  errors: ImportErrorInput[]
) {
  if (errors.length > 0) {
    await supabase.from("import_errors").insert(
      errors.map((error) => ({
        code: error.code,
        field: error.field,
        import_id: importId,
        message: error.message,
        raw_row: error.raw_row ?? null,
        row_number: error.row_number
      }))
    );
  }

  await supabase
    .from("program_imports")
    .update({
      error_count: errors.length,
      status: "failed"
    })
    .eq("id", importId);
}

export async function importProgramCsv(formData: FormData) {
  const { supabase, user } = await requireUser();
  const csv = fieldValue(formData, "csv");
  const rows = parseCsv(csv);
  const dataRows = rows.slice(1);
  const { data: importRecord } = await supabase
    .from("program_imports")
    .insert({
      filename: "pasted-program.csv",
      owner_id: user.id,
      row_count: dataRows.length,
      status: "validating"
    })
    .select("id")
    .single();

  if (!importRecord?.id) {
    redirect("/import/programs");
  }

  const importId = importRecord.id;
  const errors: ImportErrorInput[] = [];

  if (rows.length < 2) {
    await saveImportErrors(supabase, importId, [
      {
        code: "empty_csv",
        field: null,
        message: "CSV must include a header row and at least one data row.",
        row_number: null
      }
    ]);
    redirect("/import/programs");
  }

  const headers = rows[0].map((header) => normalizeCsvName(header));
  const missingColumns = requiredColumns.filter(
    (column) => !headers.includes(column)
  );

  if (missingColumns.length > 0) {
    await saveImportErrors(
      supabase,
      importId,
      missingColumns.map((column) => ({
        code: "missing_column",
        field: column,
        message: `Missing required column: ${column}.`,
        row_number: null
      }))
    );
    redirect("/import/programs");
  }

  const rowObjects = dataRows.map((cells, index) => {
    const row: CsvRow = {};

    headers.forEach((header, headerIndex) => {
      row[header] = cells[headerIndex] ?? "";
    });

    return {
      row,
      rowNumber: index + 2
    };
  });
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name")
    .is("deleted_at", null);
  const exerciseByName = new Map(
    (exercises ?? []).map((exercise) => [
      normalizeCsvName(exercise.name),
      exercise.id
    ])
  );
  const parsedRows: ParsedProgramRow[] = [];
  const programName = rowObjects[0]?.row.program_name?.trim() ?? "";

  for (const { row, rowNumber } of rowObjects) {
    for (const column of requiredColumns) {
      if (!row[column]?.trim()) {
        errors.push({
          code: "required",
          field: column,
          message: `${column} is required.`,
          raw_row: row,
          row_number: rowNumber
        });
      }
    }

    if (row.program_name?.trim() !== programName) {
      errors.push({
        code: "multiple_programs",
        field: "program_name",
        message: "Import one program at a time.",
        raw_row: row,
        row_number: rowNumber
      });
    }

    const week = positiveInteger(row.week ?? "");
    const day = positiveInteger(row.day ?? "");
    const setOrder = positiveInteger(row.set_order ?? "");
    const exerciseName = row.exercise_name?.trim() ?? "";
    const exerciseId = exerciseByName.get(normalizeCsvName(exerciseName));
    const repsMin = optionalNumber(row.reps_min ?? "");
    const repsMax = optionalNumber(row.reps_max ?? "");
    const weight = optionalNumber(row.weight ?? "");
    const weightUnit = row.weight_unit?.trim().toLowerCase() === "lb" ? "lb" : "kg";
    const setType = normalizeEnumValue(row.set_type || "working");
    const category = row.category ? normalizeEnumValue(row.category) : null;
    const difficulty = row.difficulty
      ? normalizeEnumValue(row.difficulty)
      : null;

    if (!week) {
      errors.push({
        code: "invalid_number",
        field: "week",
        message: "week must be a positive whole number.",
        raw_row: row,
        row_number: rowNumber
      });
    }

    if (!day) {
      errors.push({
        code: "invalid_number",
        field: "day",
        message: "day must be a positive whole number.",
        raw_row: row,
        row_number: rowNumber
      });
    }

    if (!setOrder) {
      errors.push({
        code: "invalid_number",
        field: "set_order",
        message: "set_order must be a positive whole number.",
        raw_row: row,
        row_number: rowNumber
      });
    }

    if (!exerciseId) {
      errors.push({
        code: "exercise_not_found",
        field: "exercise_name",
        message: `No exercise matched "${exerciseName}". Create it first, then import again.`,
        raw_row: row,
        row_number: rowNumber
      });
    }

    if (repsMin !== null && repsMax !== null && repsMin > repsMax) {
      errors.push({
        code: "invalid_range",
        field: "reps_min",
        message: "reps_min cannot be greater than reps_max.",
        raw_row: row,
        row_number: rowNumber
      });
    }

    if (!allowedSetTypes.has(setType)) {
      errors.push({
        code: "invalid_enum",
        field: "set_type",
        message: "set_type must be warmup, working, drop, or failure.",
        raw_row: row,
        row_number: rowNumber
      });
    }

    if (category && !allowedCategories.has(category)) {
      errors.push({
        code: "invalid_enum",
        field: "category",
        message: "category is not supported.",
        raw_row: row,
        row_number: rowNumber
      });
    }

    if (difficulty && !allowedDifficulties.has(difficulty)) {
      errors.push({
        code: "invalid_enum",
        field: "difficulty",
        message: "difficulty must be beginner, intermediate, or advanced.",
        raw_row: row,
        row_number: rowNumber
      });
    }

    if (week && day && setOrder && exerciseId && allowedSetTypes.has(setType)) {
      parsedRows.push({
        category,
        day,
        dayName: row.day_name,
        difficulty,
        exerciseId,
        exerciseName,
        notes: row.notes || null,
        repsMax,
        repsMin,
        restSeconds: optionalNumber(row.rest_seconds ?? ""),
        rir: optionalNumber(row.rir ?? ""),
        rowNumber,
        rpe: optionalNumber(row.rpe ?? ""),
        setOrder,
        setType,
        weightKg: weight === null ? null : displayUnitToKg(weight, weightUnit),
        week
      });
    }
  }

  if (errors.length > 0 || parsedRows.length === 0) {
    await saveImportErrors(supabase, importId, errors);
    redirect("/import/programs");
  }

  const firstRow = parsedRows[0];
  const { data: program } = await supabase
    .from("programs")
    .insert({
      days_per_week: Math.max(...parsedRows.map((row) => row.day)),
      description: "Imported from CSV.",
      difficulty: firstRow.difficulty,
      is_public: false,
      name: programName,
      owner_id: user.id
    })
    .select("id")
    .single();

  if (!program?.id) {
    await saveImportErrors(supabase, importId, [
      {
        code: "insert_failed",
        field: null,
        message: "Could not create the program.",
        row_number: null
      }
    ]);
    redirect("/import/programs");
  }

  if (firstRow.category) {
    await supabase.from("program_categories").insert({
      category: firstRow.category,
      program_id: program.id
    });
  }

  const weekNumbers = [...new Set(parsedRows.map((row) => row.week))].sort(
    (a, b) => a - b
  );

  for (const weekNumber of weekNumbers) {
    const { data: week } = await supabase
      .from("program_weeks")
      .insert({
        program_id: program.id,
        week_number: weekNumber
      })
      .select("id")
      .single();

    if (!week?.id) {
      continue;
    }

    const weekRows = parsedRows.filter((row) => row.week === weekNumber);
    const dayNumbers = [...new Set(weekRows.map((row) => row.day))].sort(
      (a, b) => a - b
    );

    for (const dayNumber of dayNumbers) {
      const dayRows = weekRows.filter((row) => row.day === dayNumber);
      const { data: day } = await supabase
        .from("program_days")
        .insert({
          day_number: dayNumber,
          name: dayRows[0].dayName,
          program_week_id: week.id
        })
        .select("id")
        .single();

      if (!day?.id) {
        continue;
      }

      const exerciseNames = [
        ...new Set(dayRows.map((row) => normalizeCsvName(row.exerciseName)))
      ];

      for (const [exerciseIndex, exerciseNameKey] of exerciseNames.entries()) {
        const exerciseRows = dayRows
          .filter((row) => normalizeCsvName(row.exerciseName) === exerciseNameKey)
          .sort((a, b) => a.setOrder - b.setOrder);
        const firstExerciseRow = exerciseRows[0];
        const { data: programExercise } = await supabase
          .from("program_exercises")
          .insert({
            exercise_id: firstExerciseRow.exerciseId,
            notes: firstExerciseRow.notes,
            program_day_id: day.id,
            sort_order: exerciseIndex + 1
          })
          .select("id")
          .single();

        if (!programExercise?.id) {
          continue;
        }

        await supabase.from("program_sets").insert(
          exerciseRows.map((row) => ({
            notes: row.notes,
            program_exercise_id: programExercise.id,
            rest_seconds: row.restSeconds,
            set_type: row.setType,
            sort_order: row.setOrder,
            target_reps_max: row.repsMax,
            target_reps_min: row.repsMin,
            target_rir: row.rir,
            target_rpe: row.rpe,
            target_weight_kg: row.weightKg
          }))
        );
      }
    }
  }

  await supabase
    .from("program_imports")
    .update({
      completed_at: new Date().toISOString(),
      created_program_id: program.id,
      error_count: 0,
      status: "completed"
    })
    .eq("id", importId);

  revalidatePath("/import/programs");
  revalidatePath("/programs");
  redirect(`/programs/${program.id}`);
}
