import Link from "next/link";
import { signUp } from "../actions";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-5 py-6">
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-[color:var(--accent)]">
            BB Gym Tracker
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Create Account
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Choose your units now. You can change this anytime in settings.
          </p>
        </div>

        {error ? (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <form action={signUp} className="space-y-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Display name</span>
            <input
              name="displayName"
              autoComplete="name"
              className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base outline-none focus:border-[color:var(--accent)]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base outline-none focus:border-[color:var(--accent)]"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Password</span>
            <input
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base outline-none focus:border-[color:var(--accent)]"
              required
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Units</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["kg", "lb"] as const).map((unit) => (
                <label
                  key={unit}
                  className="flex min-h-12 items-center gap-2 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3"
                >
                  <input
                    type="radio"
                    name="unitPreference"
                    value={unit}
                    defaultChecked={unit === "kg"}
                    className="size-4 accent-[color:var(--accent)]"
                  />
                  <span className="text-sm font-semibold uppercase">{unit}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="min-h-12 w-full rounded-md bg-[color:var(--accent)] px-4 text-base font-semibold text-zinc-950"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-[color:var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-zinc-100">
            Login
          </Link>
        </p>
      </section>
    </div>
  );
}
