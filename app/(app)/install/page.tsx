import Link from "next/link";
import { requireUser } from "@/lib/auth/session";

export default async function InstallPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--accent)]">
          Install
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Add to iPhone
        </h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Use Safari to keep BB Gym on your Home Screen.
        </p>
      </header>

      <section className="space-y-3">
        {[
          "Open BB Gym in Safari.",
          "Tap the Share button.",
          "Choose Add to Home Screen.",
          "Open BB Gym from the new Home Screen icon."
        ].map((step, index) => (
          <div
            key={step}
            className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
              Step {index + 1}
            </p>
            <p className="mt-1 text-base font-semibold">{step}</p>
          </div>
        ))}
      </section>

      <Link
        href="/dashboard"
        className="flex min-h-12 items-center justify-center rounded-md bg-[color:var(--accent)] px-4 text-base font-semibold text-zinc-950"
      >
        Back to today
      </Link>
    </div>
  );
}
