import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { signOut } from "@/app/(auth)/actions";
import { requireUser } from "@/lib/auth/session";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/exercises", label: "Exercises" },
  { href: "/workouts/active", label: "Workout" },
  { href: "/programs", label: "Programs" },
  { href: "/settings", label: "Settings" }
];

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile, user } = await requireUser();
  const displayName = profile?.display_name || user.email || "Account";

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col">
      <header className="flex items-center justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="text-xs text-[color:var(--muted)]">
            {profile?.unit_preference ?? "kg"}
          </p>
        </div>
        <form action={signOut}>
          <FormSubmitButton
            pendingLabel="Logging out..."
            className="min-h-10 rounded-md border border-[color:var(--panel-border)] px-3 text-sm font-semibold"
          >
            Logout
          </FormSubmitButton>
        </form>
      </header>
      <div className="flex-1 px-4 pb-24 pt-5">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 border-t border-[color:var(--panel-border)] bg-zinc-950/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-12 items-center justify-center rounded-md px-2 text-center text-[11px] font-medium text-zinc-300"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
