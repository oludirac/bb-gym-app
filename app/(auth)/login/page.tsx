import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { signIn } from "../actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-5 py-6">
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-[color:var(--accent)]">
            BB Gym
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">Log in</h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Get back to your workouts.
          </p>
        </div>

        {error ? (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}

        <form action={signIn} className="space-y-4">
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
              autoComplete="current-password"
              className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base outline-none focus:border-[color:var(--accent)]"
              required
            />
          </label>

          <FormSubmitButton pendingLabel="Logging in...">
            Log in
          </FormSubmitButton>
        </form>

        <p className="text-center text-sm text-[color:var(--muted)]">
          No account yet?{" "}
          <Link href="/signup" className="font-semibold text-zinc-100">
            Sign up
          </Link>
        </p>
      </section>
    </div>
  );
}
