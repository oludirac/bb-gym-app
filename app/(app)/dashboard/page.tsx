import Link from "next/link";
import { requireUser } from "@/lib/auth/session";

const dashboardItems = [
  ["/workouts/active", "Workout", "Start or resume."],
  ["/templates", "Routines", "Your usual sessions."],
  ["/programs", "Plans", "Run a training plan."],
  ["/exercises", "Exercises", "Browse or add lifts."],
  ["/progress", "Progress", "Volume, best lifts, consistency."],
  ["/bodyweight", "Weight", "Log a weigh-in."],
  ["/goals", "Goals", "Targets worth checking."],
  ["/import/programs", "Import", "Paste a plan CSV."],
  ["/export", "Export", "Download your data."],
  ["/install", "Install", "Add to Home Screen."]
];

export default async function DashboardPage() {
  const { profile, user } = await requireUser();
  const displayName = profile?.display_name || user.email || "there";
  const unitPreference = profile?.unit_preference ?? "kg";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--accent)]">
          Today
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Hi, {displayName}
        </h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Units: {unitPreference}. Pick what you are doing next.
        </p>
      </header>

      <section className="grid gap-3">
        {dashboardItems.map(([href, title, description]) => (
          <Link
            key={href}
            href={href}
            className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4"
          >
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              {description}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
