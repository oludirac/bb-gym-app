import Link from "next/link";
import { FileUp, Play, Plus, Trash2, Trophy } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { enrollProgram, removeProgram } from "@/app/(app)/programs/actions";
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
    <article className="app-card-flat p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0d1117] text-[color:var(--accent)]">
            <Trophy aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black">{program.name}</h2>
            <p className="mt-1 text-sm capitalize text-[color:var(--muted)]">
              {formatValue(program.difficulty)} - {program.day_count} day
              {program.day_count === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <span className="app-chip">
          {program.is_public ? "Starter" : "Saved"}
        </span>
      </div>
      <p className="mt-3 text-sm font-bold capitalize text-[color:var(--accent)]">
        {program.schedule_type === "calendar"
          ? "Fixed weekdays"
          : "Next workout in order"}
      </p>

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
          className="flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--panel-border)] px-3 text-sm font-black"
        >
          Open
        </Link>
        {!program.is_public ? (
          <form action={enrollProgram}>
            <input type="hidden" name="programId" value={program.id} />
            <FormSubmitButton pendingLabel="Starting...">
              <Play aria-hidden="true" className="size-4 fill-current" />
              Use plan
            </FormSubmitButton>
          </form>
        ) : null}
        <form action={removeProgram}>
          <input type="hidden" name="programId" value={program.id} />
          <FormSubmitButton
            pendingLabel={program.is_public ? "Hiding..." : "Deleting..."}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--danger)]/50 px-3 text-sm font-black text-red-200 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            {program.is_public ? "Hide starter" : "Delete plan"}
          </FormSubmitButton>
        </form>
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

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/programs/new"
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[color:var(--accent)] px-4 text-sm font-black text-zinc-950"
        >
          <Plus aria-hidden="true" className="size-4" />
          New plan
        </Link>
        <Link
          href="/import/programs"
          className="app-card-flat flex min-h-12 items-center justify-center gap-2 px-4 text-sm font-black"
        >
          <FileUp aria-hidden="true" className="size-4 text-[color:var(--accent)]" />
          Import CSV
        </Link>
      </div>

      {activeEnrollment ? (
        <Link
          href="/programs/active"
          className="app-card block border-[color:var(--accent)] p-4"
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
          <div className="app-card-flat p-4">
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
