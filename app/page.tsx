import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-between px-5 py-6">
      <section className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-medium text-[color:var(--accent)]">
            BB Gym Tracker
          </p>
          <h1 className="text-4xl font-semibold tracking-normal">
            Fast workout logging for iPhone.
          </h1>
          <p className="text-base leading-7 text-[color:var(--muted)]">
            Track workouts, templates, programs, goals, and bodyweight from a
            mobile-first PWA.
          </p>
        </div>

        <div className="grid gap-3">
          <Link
            href="/dashboard"
            className="flex min-h-12 items-center justify-center rounded-md bg-[color:var(--accent)] px-4 text-base font-semibold text-zinc-950"
          >
            Open Dashboard
          </Link>
          <Link
            href="/login"
            className="flex min-h-12 items-center justify-center rounded-md border border-[color:var(--panel-border)] px-4 text-base font-semibold"
          >
            Login
          </Link>
        </div>
      </section>
    </div>
  );
}
