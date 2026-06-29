import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { importProgramCsv } from "@/app/(app)/import/programs/actions";
import { getRecentProgramImports } from "@/lib/imports/queries";
import { requireUser } from "@/lib/auth/session";

const sampleCsv = `program_name,category,difficulty,week,day,day_name,exercise_name,set_order,set_type,reps_min,reps_max,weight,weight_unit,rpe,rir,rest_seconds,notes
My Imported Program,strength,beginner,1,1,Day 1,Barbell Back Squat,1,working,5,5,,kg,7,,180,
My Imported Program,strength,beginner,1,1,Day 1,Barbell Bench Press,1,working,5,5,,kg,7,,180,`;

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
          Back to programs
        </Link>
        <header className="space-y-2">
          <p className="text-sm font-medium text-[color:var(--accent)]">
            Import
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Program CSV
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Paste CSV rows. Exercises must already exist by matching name.
          </p>
        </header>
      </div>

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
          Import Program
        </FormSubmitButton>
      </form>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Recent imports</h2>
        {imports.length === 0 ? (
          <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
            <p className="text-sm text-[color:var(--muted)]">
              No imports have been attempted yet.
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
