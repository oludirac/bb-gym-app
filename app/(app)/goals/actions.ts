"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createGoal(formData: FormData) {
  const { supabase, user } = await requireUser();
  const type = fieldValue(formData, "type");
  const targetValue = Number(fieldValue(formData, "targetValue"));
  const unit = fieldValue(formData, "unit");
  const exerciseId = fieldValue(formData, "exerciseId");
  const targetDate = fieldValue(formData, "targetDate");

  if (!type || !unit || !Number.isFinite(targetValue)) {
    redirect("/goals");
  }

  await supabase.from("goals").insert({
    exercise_id: exerciseId || null,
    owner_id: user.id,
    target_date: targetDate || null,
    target_value: targetValue,
    type,
    unit
  });

  revalidatePath("/goals");
  redirect("/goals");
}

export async function updateGoalStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const goalId = fieldValue(formData, "goalId");
  const status = fieldValue(formData, "status");

  if (goalId && status) {
    await supabase.from("goals").update({ status }).eq("id", goalId);
  }

  revalidatePath("/goals");
  redirect("/goals");
}

export async function deleteGoal(formData: FormData) {
  const { supabase } = await requireUser();
  const goalId = fieldValue(formData, "goalId");

  if (goalId) {
    await supabase.from("goals").delete().eq("id", goalId);
  }

  revalidatePath("/goals");
  redirect("/goals");
}
