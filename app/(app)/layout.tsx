import { Dumbbell } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile, settings, user } = await requireUser();
  const displayName = profile?.display_name || user.email || "Account";
  const theme = settings?.theme === "light" ? "theme-light" : "theme-dark";

  return (
    <div className={`${theme} mx-auto flex min-h-svh w-full max-w-md flex-col bg-[color:var(--background)] text-[color:var(--foreground)]`}>
      <header className="flex items-center justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-zinc-950 shadow-[0_14px_30px_rgba(245,158,11,0.2)]">
            <Dumbbell aria-hidden="true" className="size-5" strokeWidth={2.6} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">BB Gym</p>
            <p className="truncate text-xs text-[color:var(--muted)]">
              {displayName}
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
