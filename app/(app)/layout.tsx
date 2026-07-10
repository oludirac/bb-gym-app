import { Dumbbell } from "lucide-react";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { requireUser } from "@/lib/auth/session";
import { shouldShowOnboarding } from "@/lib/onboarding";

function formatToday() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    weekday: "short"
  }).format(new Date());
}

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile, settings, supabase, user } = await requireUser();
  if (await shouldShowOnboarding(supabase, user.id, settings)) {
    redirect("/onboarding");
  }

  const displayName = profile?.display_name || user.email || "Account";
  const theme = settings?.theme === "light" ? "theme-light" : "theme-dark";
  const today = formatToday();

  return (
    <div className={`${theme} mx-auto flex min-h-svh w-full max-w-md flex-col bg-[color:var(--background)] text-[color:var(--foreground)]`}>
      <header className="flex items-center justify-between gap-3 px-4 pt-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[color:var(--accent)] text-zinc-950">
            <Dumbbell aria-hidden="true" className="size-5" strokeWidth={2.6} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">
              {displayName}
            </p>
            <p className="truncate text-xs text-[color:var(--muted)]">
              {today}
            </p>
          </div>
        </div>
        <span className="app-chip uppercase">{profile?.unit_preference ?? "kg"}</span>
      </header>
      <div className="flex-1 px-4 pb-28 pt-6">{children}</div>
      <BottomNav />
    </div>
  );
}
