"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { mergeOnboardingSettings, type OnboardingPrefs } from "@/lib/onboarding";

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validGoal(value: string): OnboardingPrefs["goal"] {
  return value === "strength" || value === "muscle" || value === "general"
    ? value
    : "strength";
}

function validExperience(value: string): OnboardingPrefs["experience"] {
  return value === "beginner" ||
    value === "intermediate" ||
    value === "advanced"
    ? value
    : "intermediate";
}

function validScheduleType(value: string): OnboardingPrefs["schedule_type"] {
  return value === "calendar" ? "calendar" : "sequence";
}

function validDaysPerWeek(value: string) {
  const days = Number(value);
  return Number.isFinite(days) ? Math.min(6, Math.max(2, days)) : 3;
}

function nextPath(value: string) {
  if (value === "build") {
    return "/programs/new";
  }

  if (value === "import") {
    return "/import/programs";
  }

  if (value === "starter") {
    return "/programs";
  }

  return "/dashboard";
}

export async function saveOnboarding(formData: FormData) {
  const { profile, settings, supabase, user } = await requireUser();
  const displayName = fieldValue(formData, "displayName");
  const unitPreference = fieldValue(formData, "unitPreference") === "lb" ? "lb" : "kg";
  const equipment = formData
    .getAll("equipment")
    .filter((value): value is string => typeof value === "string");
  const onboarding: OnboardingPrefs = {
    completed: true,
    days_per_week: validDaysPerWeek(fieldValue(formData, "daysPerWeek")),
    equipment,
    experience: validExperience(fieldValue(formData, "experience")),
    goal: validGoal(fieldValue(formData, "goal")),
    schedule_type: validScheduleType(fieldValue(formData, "scheduleType"))
  };

  await Promise.all([
    supabase
      .from("profiles")
      .update({
        display_name: displayName || profile?.display_name || user.email,
        unit_preference: unitPreference
      })
      .eq("id", user.id),
    supabase.from("user_settings").upsert(
      {
        settings: mergeOnboardingSettings(settings, onboarding),
        user_id: user.id
      },
      {
        onConflict: "user_id"
      }
    )
  ]);

  redirect(nextPath(fieldValue(formData, "nextStep")));
}

export async function skipOnboarding() {
  const { settings, supabase, user } = await requireUser();

  await supabase.from("user_settings").upsert(
    {
      settings: mergeOnboardingSettings(settings, {
        completed: true,
        skipped: true
      }),
      user_id: user.id
    },
    {
      onConflict: "user_id"
    }
  );

  redirect("/dashboard");
}
