import { requireUser } from "@/lib/auth/session";

const dashboardItems = [
  ["Active workout", "Resume or start a fast logging session."],
  ["Programs", "Follow a copied plan and track completion."],
  ["Progress", "Review volume, PRs, consistency, and muscles."],
  ["Bodyweight", "Log weight with kg/lb-aware display."]
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
          Your account is ready. Current display units: {unitPreference}.
        </p>
      </header>

      <section className="grid gap-3">
        {dashboardItems.map(([title, description]) => (
          <article
            key={title}
            className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4"
          >
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              {description}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
