import { redirect } from "next/navigation";
import { cache } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type UnitPreference = "kg" | "lb";

export type Profile = {
  id: string;
  display_name: string | null;
  unit_preference: UnitPreference;
};

export type UserSettings = {
  user_id: string;
  default_rest_seconds: number;
  settings: Record<string, unknown>;
  theme: string;
};

export type AuthenticatedSession = {
  profile: Profile | null;
  settings: UserSettings | null;
  supabase: SupabaseClient;
  user: User;
};

function getDisplayName(user: User) {
  const metadataName = user.user_metadata?.display_name;

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  return user.email ?? null;
}

function getUnitPreference(user: User): UnitPreference {
  const metadataUnit = user.user_metadata?.unit_preference;

  return metadataUnit === "lb" ? "lb" : "kg";
}

export async function ensureUserRows(supabase: SupabaseClient, user: User) {
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: getDisplayName(user),
      unit_preference: getUnitPreference(user)
    },
    {
      ignoreDuplicates: true,
      onConflict: "id"
    }
  );

  await supabase.from("user_settings").upsert(
    {
      user_id: user.id
    },
    {
      ignoreDuplicates: true,
      onConflict: "user_id"
    }
  );
}

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, unit_preference")
    .eq("id", userId)
    .maybeSingle();

  return data as Profile | null;
}

export async function getUserSettings(
  supabase: SupabaseClient,
  userId: string
) {
  const { data } = await supabase
    .from("user_settings")
    .select("user_id, default_rest_seconds, settings, theme")
    .eq("user_id", userId)
    .maybeSingle();

  const settings = data as UserSettings | null;

  return settings
    ? {
        ...settings,
        settings:
          settings.settings && typeof settings.settings === "object"
            ? settings.settings
            : {}
      }
    : null;
}

async function getCurrentSessionUncached() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const [profile, settings] = await Promise.all([
    getProfile(supabase, user.id),
    getUserSettings(supabase, user.id)
  ]);

  return {
    profile,
    settings,
    supabase,
    user
  } satisfies AuthenticatedSession;
}

export const getCurrentSession = cache(getCurrentSessionUncached);

export async function requireUser() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
