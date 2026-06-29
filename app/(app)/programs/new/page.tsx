import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { createProgram } from "@/app/(app)/programs/actions";
import { weekdayOptions } from "@/lib/scheduling/weekdays";
import { requireUser } from "@/lib/auth/session";

type NewProgramPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewProgramPage({
  searchParams
}: NewProgramPageProps) {
  const [{ error }] = await Promise.all([searchParams, requireUser()]);

  return (
    <div className="space-y-6 pb-24">
      <header className="space-y-2">
        <Link
          href="/programs"
          className="inline-flex min-h-10 items-center text-sm font-black text-[color:var(--accent)]"
        >
          Back to plans
        </Link>
        <p className="text-sm font-bold text-[color:var(--accent)]">New plan</p>
        <h1 className="text-3xl font-black tracking-normal">Build a plan</h1>
      </header>

      {error ? (
        <p className="rounded-xl border border-[color:var(--danger)]/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <form action={createProgram} className="space-y-5">
        <section className="app-card space-y-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#0d1117] text-[color:var(--accent)]">
              <Trophy aria-hidden="true" className="size-5" />
            </div>
            <h2 className="text-base font-black">Plan</h2>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-bold">Name</span>
            <input
              name="name"
              required
              placeholder="PPL"
              className="field-base text-base"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold">Notes</span>
            <textarea
              name="description"
              rows={3}
              placeholder="Optional"
              className="rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] px-3 py-3 text-base outline-none focus:border-[color:var(--accent)]"
            />
          </label>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-bold">Mode</legend>
            <div className="grid gap-2">
              <label className="flex min-h-14 items-center gap-3 rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] px-3">
                <input
                  type="radio"
                  name="scheduleType"
                  value="sequence"
                  defaultChecked
                  className="size-4 accent-[color:var(--accent)]"
                />
                <span>
                  <span className="block text-sm font-black">
                    Next workout in order
                  </span>
                  <span className="block text-xs text-[color:var(--muted)]">
                    Push, Pull, Legs, repeat
                  </span>
                </span>
              </label>
              <label className="flex min-h-14 items-center gap-3 rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] px-3">
                <input
                  type="radio"
                  name="scheduleType"
                  value="calendar"
                  className="size-4 accent-[color:var(--accent)]"
                />
                <span>
                  <span className="block text-sm font-black">
                    Fixed weekdays
                  </span>
                  <span className="block text-xs text-[color:var(--muted)]">
                    Monday Push, Wednesday Pull
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-black">Workout days</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Leave unused rows blank.
            </p>
          </div>

          <div className="grid gap-3">
            {Array.from({ length: 7 }, (_, index) => {
              const row = index + 1;

              return (
                <div key={row} className="app-card-flat grid gap-2 p-3">
                  <label className="grid gap-1">
                    <span className="text-xs font-bold uppercase text-[color:var(--muted)]">
                      Day {row}
                    </span>
                    <input
                      name={`dayName_${row}`}
                      placeholder={row === 1 ? "Push" : row === 2 ? "Pull" : row === 3 ? "Legs" : ""}
                      className="field-base text-base"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-bold uppercase text-[color:var(--muted)]">
                      Weekday
                    </span>
                    <select
                      name={`weekday_${row}`}
                      defaultValue=""
                      className="field-base text-base"
                    >
                      <option value="">Sequence only</option>
                      {weekdayOptions.map((weekday) => (
                        <option key={weekday.value} value={weekday.value}>
                          {weekday.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              );
            })}
          </div>
        </section>

        <FormSubmitButton pendingLabel="Creating...">
          <Plus aria-hidden="true" className="size-5" />
          Create plan
        </FormSubmitButton>
      </form>
    </div>
  );
}
