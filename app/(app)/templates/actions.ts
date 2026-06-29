"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getTemplateDetail } from "@/lib/templates/queries";

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function nextSortOrder(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  table: string,
  parentColumn: string,
  parentId: string
) {
  const { data } = await supabase
    .from(table)
    .select("sort_order")
    .eq(parentColumn, parentId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data as { sort_order?: number } | null)?.sort_order ?? 0) + 1;
}

export async function createTemplate(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = fieldValue(formData, "name");

  if (!name) {
    redirect("/templates");
  }

  const { data } = await supabase
    .from("workout_templates")
    .insert({
      estimated_minutes: optionalNumber(fieldValue(formData, "estimatedMinutes")),
      name,
      notes: fieldValue(formData, "notes") || null,
      owner_id: user.id
    })
    .select("id")
    .single();

  revalidatePath("/templates");
  redirect(data?.id ? `/templates/${data.id}/edit` : "/templates");
}

export async function updateTemplate(formData: FormData) {
  const { supabase } = await requireUser();
  const templateId = fieldValue(formData, "templateId");
  const name = fieldValue(formData, "name");

  if (!templateId || !name) {
    redirect("/templates");
  }

  await supabase
    .from("workout_templates")
    .update({
      estimated_minutes: optionalNumber(fieldValue(formData, "estimatedMinutes")),
      name,
      notes: fieldValue(formData, "notes") || null
    })
    .eq("id", templateId);

  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}/edit`);
  redirect(`/templates/${templateId}/edit`);
}

export async function deleteTemplate(formData: FormData) {
  const { supabase } = await requireUser();
  const templateId = fieldValue(formData, "templateId");

  if (templateId) {
    await supabase.from("workout_templates").delete().eq("id", templateId);
  }

  revalidatePath("/templates");
  redirect("/templates");
}

export async function duplicateTemplate(formData: FormData) {
  const { supabase, user } = await requireUser();
  const templateId = fieldValue(formData, "templateId");

  if (!templateId) {
    redirect("/templates");
  }

  const template = await getTemplateDetail(supabase, templateId);

  if (!template) {
    redirect("/templates");
  }

  const { data: copiedTemplate } = await supabase
    .from("workout_templates")
    .insert({
      estimated_minutes: template.estimated_minutes,
      name: `${template.name} 2`,
      notes: template.notes,
      owner_id: user.id
    })
    .select("id")
    .single();

  if (!copiedTemplate?.id) {
    redirect("/templates");
  }

  for (const exercise of template.exercises) {
    const { data: copiedExercise } = await supabase
      .from("template_exercises")
      .insert({
        exercise_id: exercise.exercise_id,
        notes: exercise.notes,
        sort_order: exercise.sort_order,
        template_id: copiedTemplate.id
      })
      .select("id")
      .single();

    if (!copiedExercise?.id || exercise.sets.length === 0) {
      continue;
    }

    await supabase.from("template_sets").insert(
      exercise.sets.map((set) => ({
        notes: set.notes,
        rest_seconds: set.rest_seconds,
        set_type: set.set_type,
        sort_order: set.sort_order,
        target_reps_max: set.target_reps_max,
        target_reps_min: set.target_reps_min,
        target_rir: set.target_rir,
        target_rpe: set.target_rpe,
        target_weight_kg: set.target_weight_kg,
        template_exercise_id: copiedExercise.id
      }))
    );
  }

  revalidatePath("/templates");
  redirect(`/templates/${copiedTemplate.id}/edit`);
}

export async function addTemplateExercise(formData: FormData) {
  const { supabase } = await requireUser();
  const templateId = fieldValue(formData, "templateId");
  const exerciseId = fieldValue(formData, "exerciseId");

  if (!templateId || !exerciseId) {
    redirect("/templates");
  }

  const sortOrder = await nextSortOrder(
    supabase,
    "template_exercises",
    "template_id",
    templateId
  );

  await supabase.from("template_exercises").insert({
    exercise_id: exerciseId,
    sort_order: sortOrder,
    template_id: templateId
  });

  revalidatePath(`/templates/${templateId}/edit`);
  redirect(`/templates/${templateId}/edit`);
}

export async function deleteTemplateExercise(formData: FormData) {
  const { supabase } = await requireUser();
  const templateId = fieldValue(formData, "templateId");
  const templateExerciseId = fieldValue(formData, "templateExerciseId");

  if (templateExerciseId) {
    await supabase
      .from("template_exercises")
      .delete()
      .eq("id", templateExerciseId);
  }

  revalidatePath(`/templates/${templateId}/edit`);
  redirect(templateId ? `/templates/${templateId}/edit` : "/templates");
}

export async function addTemplateSet(formData: FormData) {
  const { supabase } = await requireUser();
  const templateId = fieldValue(formData, "templateId");
  const templateExerciseId = fieldValue(formData, "templateExerciseId");

  if (!templateId || !templateExerciseId) {
    redirect("/templates");
  }

  const sortOrder = await nextSortOrder(
    supabase,
    "template_sets",
    "template_exercise_id",
    templateExerciseId
  );

  await supabase.from("template_sets").insert({
    set_type: "working",
    sort_order: sortOrder,
    template_exercise_id: templateExerciseId
  });

  revalidatePath(`/templates/${templateId}/edit`);
  redirect(`/templates/${templateId}/edit`);
}

export async function updateTemplateSet(formData: FormData) {
  const { supabase } = await requireUser();
  const templateId = fieldValue(formData, "templateId");
  const setId = fieldValue(formData, "setId");

  if (!templateId || !setId) {
    redirect("/templates");
  }

  await supabase
    .from("template_sets")
    .update({
      notes: fieldValue(formData, "notes") || null,
      rest_seconds: optionalNumber(fieldValue(formData, "restSeconds")),
      set_type: fieldValue(formData, "setType") || "working",
      target_reps_max: optionalNumber(fieldValue(formData, "targetRepsMax")),
      target_reps_min: optionalNumber(fieldValue(formData, "targetRepsMin")),
      target_rir: optionalNumber(fieldValue(formData, "targetRir")),
      target_rpe: optionalNumber(fieldValue(formData, "targetRpe")),
      target_weight_kg: optionalNumber(fieldValue(formData, "targetWeightKg"))
    })
    .eq("id", setId);

  revalidatePath(`/templates/${templateId}/edit`);
  redirect(`/templates/${templateId}/edit`);
}

export async function deleteTemplateSet(formData: FormData) {
  const { supabase } = await requireUser();
  const templateId = fieldValue(formData, "templateId");
  const setId = fieldValue(formData, "setId");

  if (setId) {
    await supabase.from("template_sets").delete().eq("id", setId);
  }

  revalidatePath(`/templates/${templateId}/edit`);
  redirect(templateId ? `/templates/${templateId}/edit` : "/templates");
}

export async function startWorkoutFromTemplate(formData: FormData) {
  const { supabase, user } = await requireUser();
  const templateId = fieldValue(formData, "templateId");

  if (!templateId) {
    redirect("/templates");
  }

  const { data: activeWorkout } = await supabase
    .from("workouts")
    .select("id")
    .eq("status", "active")
    .maybeSingle();

  if (activeWorkout?.id) {
    redirect("/workouts/active");
  }

  const template = await getTemplateDetail(supabase, templateId);

  if (!template) {
    redirect("/templates");
  }

  const { data: workout } = await supabase
    .from("workouts")
    .insert({
      name: template.name,
      owner_id: user.id,
      status: "active",
      template_id: template.id
    })
    .select("id")
    .single();

  if (!workout?.id) {
    redirect("/templates");
  }

  for (const exercise of template.exercises) {
    const { data: workoutExercise } = await supabase
      .from("workout_exercises")
      .insert({
        exercise_id: exercise.exercise_id,
        exercise_name_snapshot: exercise.exercise_name,
        notes: exercise.notes,
        sort_order: exercise.sort_order,
        workout_id: workout.id
      })
      .select("id")
      .single();

    if (!workoutExercise?.id || exercise.sets.length === 0) {
      continue;
    }

    await supabase.from("workout_sets").insert(
      exercise.sets.map((set) => ({
        notes: set.notes,
        reps: set.target_reps_min ?? set.target_reps_max,
        rest_seconds: set.rest_seconds,
        rir: set.target_rir,
        rpe: set.target_rpe,
        set_type: set.set_type,
        sort_order: set.sort_order,
        weight_kg: set.target_weight_kg,
        workout_exercise_id: workoutExercise.id
      }))
    );
  }

  revalidatePath("/workouts/active");
  redirect("/workouts/active");
}
