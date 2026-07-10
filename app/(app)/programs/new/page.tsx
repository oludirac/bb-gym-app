import Link from "next/link";
import { FileUp, Plus, Trophy } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { createProgram } from "@/app/(app)/programs/actions";
import { weekdayOptions } from "@/lib/scheduling/weekdays";
import { requireUser } from "@/lib/auth/session";

type NewProgramPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const presets = [
  { label: "2 day full body", value: "full_body_2" },
  { label: "3 day full body", value: "full_body_3" },
  { label: "3 day push/pull/legs", value: "ppl_3" },
  { label: "4 day upper/lower", value: "upper_lower_4" },
  { label: "5 day upper/lower/PPL", value: "ulppl_5" },
  { label: "6 day PPL x2", value: "ppl_6" },
  { label: "Custom names", value: "custom" }
];

export default async function NewProgramPage({
  searchParams
}: NewProgramPageProps) {
  const [{ error }] = await Promise.all([searchParams, requireUser()]);

  return (
    <div className="space-y-6 pb-24">
      <header className="border-b border-[color:var(--panel-border)] pb-4">
        <Link
          href="/programs"
          className="inline-flex min-h-10 items-center text-sm font-black text-[color:var(--accent)]"
        >
          Back to plans
        </Link>
        <p className="mt-2 text-sm font-bold text-[color:var(--accent)]">
          Build my split
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-normal">
          Start simple
        </h1>
      </header>

      <div className="grid gap-2">
        <Link
          href="/programs"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-black"
        >
          <Trophy aria-hidden="true" className="size-4" />
          Use starter plan
        </Link>
        <Link
          href="/import/programs"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-black"
        >
          <FileUp aria-hidden="true" className="size-4" />
          Import CSV
        </Link>
      </div>

      {error ? (
        <p className="rounded-md border border-[color:var(--danger)]/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <form action={createProgram} className="space-y-5">
        <section className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-bold">Split name</span>
            <input
              name="name"
              required
              placeholder="My PPL"
              className="field-base text-base"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold">Split template</span>
            <select name="dayPreset" defaultValue="ppl_3" className="field-base">
              {presets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-bold">Schedule</legend>
            <label className="training-choice">
              <input
                type="radio"
                name="scheduleType"
                value="sequence"
                defaultChecked
                className="size-4 accent-[color:var(--accent)]"
              />
              <span>
                <span className="block font-black">Rotating split</span>
                <span className="block text-xs text-[color:var(--muted)]">
                  Push, Pull, Legs, repeat
                </span>
              </span>
            </label>
            <label className="training-choice">
              <input
                type="radio"
                name="scheduleType"
                value="calendar"
                className="size-4 accent-[color:var(--accent)]"
              />
              <span>
                <span className="block font-black">Scheduled days</span>
                <span className="block text-xs text-[color:var(--muted)]">
                  Uses sensible weekdays from the preset
                </span>
              </span>
            </label>
          </fieldset>
        </section>

        <details className="border-y border-[color:var(--panel-border)] py-3">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-sm font-black">
            Custom day names
            <span className="text-xs text-[color:var(--muted)]">
              optional
            </span>
          </summary>
          <div className="mt-3 grid gap-3">
            {Array.from({ length: 6 }, (_, index) => {
              const row = index + 1;

              return (
                <div key={row} className="grid grid-cols-[1fr_8rem] gap-2">
                  <input
                    name={`dayName_${row}`}
                    placeholder={`Day ${row}`}
                    className="field-base text-base"
                  />
                  <select
                    name={`weekday_${row}`}
                    defaultValue=""
                    className="field-base text-sm"
                  >
                    <option value="">Any</option>
                    {weekdayOptions.map((weekday) => (
                      <option key={weekday.value} value={weekday.value}>
                        {weekday.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </details>

        <FormSubmitButton pendingLabel="Creating...">
          <Plus aria-hidden="true" className="size-5" />
          Create split
        </FormSubmitButton>
      </form>
    </div>
  );
}
