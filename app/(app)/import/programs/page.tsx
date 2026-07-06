import Link from "next/link";
import { CopyPromptButton } from "@/components/copy-prompt-button";
import { FormSubmitButton } from "@/components/form-submit-button";
import { importProgramCsv } from "@/app/(app)/import/programs/actions";
import { getRecentProgramImports } from "@/lib/imports/queries";
import { requireUser } from "@/lib/auth/session";

const sampleCsv = `program_name,day_name,exercise_name,category,set_number,reps_min,reps_max,weight_kg,duration_minutes,distance_km,intensity
My Imported Plan,Push,Barbell Bench Press,chest,1,6,8,60,,,
My Imported Plan,Push,Barbell Bench Press,chest,2,6,8,60,,,
My Imported Plan,Cardio,Treadmill Run,cardio,1,,,,20,3,RPE 7`;

const csvPrompt = `Turn the workout plan below into a CSV for my gym app.

Use exactly these columns:
program_name,day_name,exercise_name,category,set_number,reps_min,reps_max,weight_kg,duration_minutes,distance_km,intensity

Rules:
- Return only raw CSV. No markdown, no code fence, no explanation.
- One row per set.
- Use the same program_name on every row.
- day_name can be simple names like Push, Pull, Legs, Upper, Lower, Full Body.
- set_number starts at 1 for each exercise.
- category must be one of: chest, back, shoulders, biceps, triceps, quads, hamstrings, glutes, calves, core, cardio, mobility, full_body.
- Pick the category from the main body part trained by the exercise, not from the split name.
- Use kg only.
- For lifting rows, use reps_min, reps_max, and weight_kg. If weight is unknown, leave weight_kg blank.
- For cardio rows, leave reps_min, reps_max, and weight_kg blank. Use duration_minutes, distance_km, and/or intensity.
- intensity is short text like RPE 7, level 8, or 2% incline.
- Use simple exercise names.
- Use double progression: give each lift a reps_min and reps_max range.
- Repeat the same starting weight for sets that should progress together.
- If a top set/back-off set uses different reps or weight, make that exact set its own row.

Workout plan:
[paste workout here]`;

const createPlanPrompt = `Ask me up to 5 quick questions, then create a simple gym plan CSV using these columns:
program_name,day_name,exercise_name,category,set_number,reps_min,reps_max,weight_kg,duration_minutes,distance_km,intensity

Rules:
- Return only raw CSV when done.
- Use kg only.
- category must be one of: chest, back, shoulders, biceps, triceps, quads, hamstrings, glutes, calves, core, cardio, mobility, full_body.
- Use double progression with rep ranges.
- For cardio rows, use duration_minutes, distance_km, and/or intensity instead of reps and weight.
- Use one row per set.
- Keep it practical and use common exercises.`;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(value));
}

export default async function ProgramImportPage() {
  const { supabase } = await requireUser();
  const imports = await getRecentProgramImports(supabase);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href="/programs"
          className="inline-flex min-h-10 items-center text-sm font-semibold text-[color:var(--accent)]"
        >
          Back to plans
        </Link>
        <header className="space-y-2">
          <p className="text-sm font-medium text-[color:var(--accent)]">
            Import
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Plan CSV
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Paste a plan CSV. Matching exercises are reused; new exercise names
            become your private custom exercises.
          </p>
        </header>
      </div>

      <section className="app-card-flat space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-black">Use ChatGPT to make a CSV</h2>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              Paste this prompt into ChatGPT with any workout plan.
            </p>
          </div>
          <CopyPromptButton text={csvPrompt} />
        </div>
        <textarea
          readOnly
          rows={10}
          value={csvPrompt}
          className="w-full rounded-xl border border-[color:var(--panel-border)] bg-zinc-950 px-3 py-3 font-mono text-xs leading-5 outline-none"
        />
        <details className="rounded-xl border border-[color:var(--panel-border)] p-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-[color:var(--accent)]">
            <span>Need a plan first?</span>
            <CopyPromptButton text={createPlanPrompt} />
          </summary>
          <textarea
            readOnly
            rows={5}
            value={createPlanPrompt}
            className="mt-3 w-full rounded-xl border border-[color:var(--panel-border)] bg-zinc-950 px-3 py-3 font-mono text-xs leading-5 outline-none"
          />
        </details>
      </section>

      <form action={importProgramCsv} className="space-y-3">
        <label className="grid gap-2">
          <span className="text-sm font-medium">CSV</span>
          <textarea
            name="csv"
            rows={12}
            defaultValue={sampleCsv}
            className="w-full rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 py-3 font-mono text-xs leading-5 outline-none focus:border-[color:var(--accent)]"
          />
        </label>
        <FormSubmitButton pendingLabel="Importing...">
          Import plan
        </FormSubmitButton>
      </form>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Recent imports</h2>
        {imports.length === 0 ? (
          <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
            <p className="text-sm text-[color:var(--muted)]">
              No imports yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {imports.map((programImport) => (
              <article
                key={programImport.id}
                className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold capitalize">
                      {programImport.status}
                    </h3>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {programImport.row_count} rows -{" "}
                      {formatDate(programImport.created_at)}
                    </p>
                  </div>
                  {programImport.created_program_id ? (
                    <Link
                      href={`/programs/${programImport.created_program_id}`}
                      className="flex min-h-10 items-center justify-center rounded-md border border-[color:var(--panel-border)] px-3 text-sm font-semibold"
                    >
                      Open
                    </Link>
                  ) : null}
                </div>

                {programImport.errors.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {programImport.errors.slice(0, 5).map((error) => (
                      <p
                        key={error.id}
                        className="rounded-md bg-zinc-950 p-2 text-xs text-red-200"
                      >
                        Row {error.row_number ?? "-"} {error.field ?? "csv"}:{" "}
                        {error.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
