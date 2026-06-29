"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureUserRows } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function getOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost || headerStore.get("host");
  const forwardedProto = headerStore.get("x-forwarded-proto") || "https";
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const resolvedOrigin =
    origin || (host ? `${forwardedProto}://${host}` : undefined) || vercelUrl || appUrl;

  return (resolvedOrigin || "http://localhost:3000").replace(/\/$/, "");
}

export async function signIn(formData: FormData) {
  const email = fieldValue(formData, "email");
  const password = fieldValue(formData, "password");

  if (!email || !password) {
    redirectWithError("/login", "Enter your email and password.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirectWithError("/login", error.message);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    await ensureUserRows(supabase, user);
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const displayName = fieldValue(formData, "displayName");
  const email = fieldValue(formData, "email");
  const password = fieldValue(formData, "password");
  const unitPreference = fieldValue(formData, "unitPreference");

  if (!email || !password) {
    redirectWithError("/signup", "Enter your email and password.");
  }

  if (password.length < 8) {
    redirectWithError("/signup", "Password must be at least 8 characters.");
  }

  if (unitPreference !== "kg" && unitPreference !== "lb") {
    redirectWithError("/signup", "Choose kg or lb.");
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email,
        unit_preference: unitPreference
      },
      emailRedirectTo: `${origin}/auth/callback`
    }
  });

  if (error) {
    redirectWithError("/signup", error.message);
  }

  if (data.user) {
    await ensureUserRows(supabase, data.user);

    await supabase
      .from("profiles")
      .update({
        display_name: displayName || email,
        unit_preference: unitPreference
      })
      .eq("id", data.user.id);
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirect(
    `/login?message=${encodeURIComponent("Check your email to finish signing up.")}`
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
