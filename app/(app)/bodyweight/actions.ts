"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { displayUnitToKg } from "@/lib/unit-conversion";

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function todayDate() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

export async function saveBodyweightLog(formData: FormData) {
  const { profile, supabase, user } = await requireUser();
  const unit = profile?.unit_preference ?? "kg";
  const loggedOn = fieldValue(formData, "loggedOn") || todayDate();
  const weightValue = Number(fieldValue(formData, "weight"));

  if (!Number.isFinite(weightValue) || weightValue <= 0) {
    redirect("/bodyweight");
  }

  await supabase.from("bodyweight_logs").upsert(
    {
      logged_on: loggedOn,
      notes: fieldValue(formData, "notes") || null,
      owner_id: user.id,
      weight_kg: displayUnitToKg(weightValue, unit)
    },
    {
      onConflict: "owner_id,logged_on"
    }
  );

  revalidatePath("/bodyweight");
  redirect("/bodyweight");
}

export async function deleteBodyweightLog(formData: FormData) {
  const { supabase } = await requireUser();
  const logId = fieldValue(formData, "logId");

  if (logId) {
    await supabase.from("bodyweight_logs").delete().eq("id", logId);
  }

  revalidatePath("/bodyweight");
  redirect("/bodyweight");
}
