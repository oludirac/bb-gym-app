import { NextResponse } from "next/server";
import { ensureUserRows, getUserSettings } from "@/lib/auth/session";
import { shouldShowOnboarding } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const redirectTo = next?.startsWith("/") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.exchangeCodeForSession(code);

    if (user) {
      await ensureUserRows(supabase, user);

      const settings = await getUserSettings(supabase, user.id);
      if (
        redirectTo === "/dashboard" &&
        (await shouldShowOnboarding(supabase, user.id, settings))
      ) {
        return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
      }
    }
  }

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
