import Link from "next/link";
import {
  ChevronRight,
  Download,
  FileUp,
  LibraryBig,
  LogOut,
  Scale,
  Settings,
  Smartphone,
  Target,
  Trophy
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { requireUser } from "@/lib/auth/session";

const moreItems = [
  { href: "/programs", icon: Trophy, label: "My split", meta: "Plans" },
  { href: "/exercises", icon: LibraryBig, label: "Exercise list", meta: "Library" },
  { href: "/bodyweight", icon: Scale, label: "Weight", meta: "Weigh-ins" },
  { href: "/goals", icon: Target, label: "Goals", meta: "Targets" },
  { href: "/import/workouts", icon: FileUp, label: "Import workout", meta: "One session" },
  { href: "/import/programs", icon: FileUp, label: "Import plan", meta: "Plan CSV" },
  { href: "/export", icon: Download, label: "Export", meta: "Backups" },
  { href: "/install", icon: Smartphone, label: "Install", meta: "Home Screen" },
  { href: "/settings", icon: Settings, label: "Settings", meta: "Name and units" }
];

export default async function MorePage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-bold text-[color:var(--accent)]">More</p>
        <h1 className="text-3xl font-black tracking-normal">Tools</h1>
      </header>

      <section className="grid gap-3">
        {moreItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-16 items-center justify-between gap-3 border-b border-[color:var(--panel-border)] py-3 transition active:opacity-80"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[color:var(--panel)] text-[color:var(--muted)]">
                  <Icon aria-hidden="true" className="size-5" strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-extrabold">{item.label}</h2>
                  <p className="text-sm text-[color:var(--muted)]">{item.meta}</p>
                </div>
              </div>
              <ChevronRight
                aria-hidden="true"
                className="size-5 shrink-0 text-[color:var(--muted)]"
              />
            </Link>
          );
        })}
      </section>

      <form action={signOut}>
        <FormSubmitButton
          pendingLabel="Logging out..."
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--danger)]/45 px-4 text-base font-extrabold text-red-200 transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
        >
          <LogOut aria-hidden="true" className="size-5" />
          Log out
        </FormSubmitButton>
      </form>
    </div>
  );
}
