import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-between px-5 py-6">
      <section className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-medium text-[color:var(--accent)]">
            BB Gym
          </p>
          <h1 className="text-4xl font-semibold tracking-normal">
            Log workouts fast.
          </h1>
          <p className="text-base leading-7 text-[color:var(--muted)]">
            Built for gym sessions, plans, and progress.
          </p>
        </div>

        <div className="grid gap-3">
          <Link
            href="/dashboard"
            className="flex min-h-12 items-center justify-center rounded-md bg-[color:var(--accent)] px-4 text-base font-semibold text-zinc-950"
          >
            Open app
          </Link>
          <Link
            href="/login"
            className="flex min-h-12 items-center justify-center rounded-md border border-[color:var(--panel-border)] px-4 text-base font-semibold"
          >
            Log in
          </Link>
        </div>
      </section>
    </div>
  );
}
