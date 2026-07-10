import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserSettings } from "@/lib/auth/session";

export type OnboardingPrefs = {
  completed: boolean;
  days_per_week: number;
  equipment: string[];
  experience: "beginner" | "intermediate" | "advanced";
  goal: "strength" | "muscle" | "general";
  schedule_type: "sequence" | "calendar";
  skipped?: boolean;
};

type SettingsJson = Record<string, unknown> & {
  onboarding?: Partial<OnboardingPrefs>;
};

function settingsObject(settings: UserSettings | null): SettingsJson {
  return settings?.settings && typeof settings.settings === "object"
    ? (settings.settings as SettingsJson)
    : {};
}

export function onboardingPrefs(settings: UserSettings | null) {
  const onboarding = settingsObject(settings).onboarding;
  return onboarding && typeof onboarding === "object" ? onboarding : null;
}

export function hasCompletedOnboarding(settings: UserSettings | null) {
  return onboardingPrefs(settings)?.completed === true;
}

export function mergeOnboardingSettings(
  settings: UserSettings | null,
  onboarding: Partial<OnboardingPrefs>
) {
  return {
    ...settingsObject(settings),
    onboarding: {
      ...onboardingPrefs(settings),
      ...onboarding
    }
  };
}

export async function shouldShowOnboarding(
  supabase: SupabaseClient,
  userId: string,
  settings: UserSettings | null
) {
  if (hasCompletedOnboarding(settings)) {
    return false;
  }

  const [activeEnrollment, completedWorkouts] = await Promise.all([
    supabase
      .from("program_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("status", "completed")
  ]);

  return (
    (activeEnrollment.count ?? 0) === 0 &&
    (completedWorkouts.count ?? 0) === 0
  );
}
