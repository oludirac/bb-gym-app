"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string): never {
  redirect(`/settings?error=${encodeURIComponent(message)}`);
}

export async function updateProfileSettings(formData: FormData) {
  const { supabase, user } = await requireUser();
  const displayName = fieldValue(formData, "displayName");
  const unitPreference = fieldValue(formData, "unitPreference");
  const theme = fieldValue(formData, "theme");
  const defaultRestSecondsValue = fieldValue(formData, "defaultRestSeconds");
  const defaultRestSeconds = Number(defaultRestSecondsValue);

  if (!displayName) {
    redirectWithError("Display name is required.");
  }

  if (unitPreference !== "kg" && unitPreference !== "lb") {
    redirectWithError("Choose kg or lb.");
  }

  if (theme !== "dark" && theme !== "light") {
    redirectWithError("Choose light or dark.");
  }

  if (!Number.isInteger(defaultRestSeconds) || defaultRestSeconds < 0) {
    redirectWithError("Default rest time must be zero or more seconds.");
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
      unit_preference: unitPreference
    },
    {
      onConflict: "id"
    }
  );

  if (profileError) {
    redirectWithError(profileError.message);
  }

  const { error: settingsError } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        default_rest_seconds: defaultRestSeconds,
        theme
      },
      {
        onConflict: "user_id"
      }
    );

  if (settingsError) {
    redirectWithError(settingsError.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/more");
  revalidatePath("/settings");
  redirect("/settings?message=Settings saved.");
}
