import Link from "next/link";
import { requireUser } from "@/lib/auth/session";

export default async function ExportPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--accent)]">
          Export
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Your Data</h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Download your training data for backup or spreadsheet work.
        </p>
      </header>

      <section className="grid gap-3">
        <a
          href="/api/export/json"
          className="block rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4"
        >
          <h2 className="text-base font-semibold">Full JSON export</h2>
          <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
            Includes your profile, settings, custom exercises, templates,
            copied programs, workouts, bodyweight logs, and goals.
          </p>
        </a>

        <a
          href="/api/export/csv"
          className="block rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4"
        >
          <h2 className="text-base font-semibold">Workout CSV</h2>
          <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
            A practical set-by-set spreadsheet of completed workouts.
          </p>
        </a>
      </section>

      <Link
        href="/dashboard"
        className="flex min-h-12 items-center justify-center rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-semibold"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
