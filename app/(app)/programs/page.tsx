import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { enrollProgram } from "@/app/(app)/programs/actions";
import {
  getActiveProgramEnrollment,
  getProgramSummaries,
  type ProgramSummary
} from "@/lib/programs/queries";
import { requireUser } from "@/lib/auth/session";

function formatValue(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function ProgramCard({ program }: { program: ProgramSummary }) {
  return (
    <article className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{program.name}</h2>
          <p className="mt-1 text-sm capitalize text-[color:var(--muted)]">
            {formatValue(program.difficulty)} - {program.day_count} day
            {program.day_count === 1 ? "" : "s"}
          </p>
        </div>
        <span className="rounded-md border border-[color:var(--panel-border)] px-2 py-1 text-[11px] font-semibold">
          {program.is_public ? "Starter" : "Saved"}
        </span>
      </div>

      {program.description ? (
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          {program.description}
        </p>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
            Frequency
          </dt>
          <dd className="mt-1">
            {program.days_per_week ? `${program.days_per_week}/week` : "-"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
            Session
          </dt>
          <dd className="mt-1">
            {program.avg_session_minutes
              ? `${program.avg_session_minutes} min`
              : "-"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-2">
        <Link
          href={`/programs/${program.id}`}
          className="flex min-h-11 items-center justify-center rounded-md border border-[color:var(--panel-border)] px-3 text-sm font-semibold"
        >
          Open
        </Link>
        {!program.is_public ? (
          <form action={enrollProgram}>
            <input type="hidden" name="programId" value={program.id} />
            <FormSubmitButton pendingLabel="Starting...">
              Use plan
            </FormSubmitButton>
          </form>
        ) : null}
      </div>
    </article>
  );
}

export default async function ProgramsPage() {
  const { supabase } = await requireUser();
  const [programs, activeEnrollment] = await Promise.all([
    getProgramSummaries(supabase),
    getActiveProgramEnrollment(supabase)
  ]);
  const ownPrograms = programs.filter((program) => !program.is_public);
  const publicPrograms = programs.filter((program) => program.is_public);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--accent)]">
          Plans
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Plans
        </h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Save a starter plan or run one of yours.
        </p>
      </header>

      <Link
        href="/import/programs"
        className="flex min-h-12 items-center justify-center rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-semibold"
      >
        Import plan CSV
      </Link>

      {activeEnrollment ? (
        <Link
          href="/programs/active"
          className="block rounded-md border border-[color:var(--accent)] bg-[color:var(--panel)] p-4"
        >
          <p className="text-sm font-medium text-[color:var(--accent)]">
            Current plan
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {activeEnrollment.program_name}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Week {activeEnrollment.current_week}, day{" "}
            {activeEnrollment.current_day} -{" "}
            {activeEnrollment.percent_complete}% complete
          </p>
        </Link>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Your plans</h2>
        {ownPrograms.length === 0 ? (
          <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
            <h3 className="text-base font-semibold">No saved plans yet</h3>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              Open a starter plan and save it.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {ownPrograms.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Starter plans</h2>
        <div className="grid gap-3">
          {publicPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </section>
    </div>
  );
}
