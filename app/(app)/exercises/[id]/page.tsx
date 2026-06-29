import Link from "next/link";
import { notFound } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { deleteCustomExercise } from "@/app/(app)/exercises/actions";
import { getExerciseDetail } from "@/lib/exercises/queries";
import { requireUser } from "@/lib/auth/session";

type ExerciseDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatValue(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function MuscleList({
  emptyLabel,
  muscles
}: {
  emptyLabel: string;
  muscles: { id: string; name: string }[];
}) {
  if (muscles.length === 0) {
    return <p className="text-sm text-[color:var(--muted)]">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {muscles.map((muscle) => (
        <span
          key={muscle.id}
          className="rounded-md border border-[color:var(--panel-border)] px-2 py-1 text-xs font-semibold"
        >
          {muscle.name}
        </span>
      ))}
    </div>
  );
}

export default async function ExerciseDetailPage({
  params
}: ExerciseDetailPageProps) {
  const [{ id }, { supabase, user }] = await Promise.all([params, requireUser()]);
  const exercise = await getExerciseDetail(supabase, id);

  if (!exercise) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href="/exercises"
          className="inline-flex min-h-10 items-center text-sm font-semibold text-[color:var(--accent)]"
        >
          Back to exercises
        </Link>

        <header className="space-y-2">
          <p className="text-sm font-medium capitalize text-[color:var(--accent)]">
            {exercise.is_builtin ? "Built-in" : "Custom"} -{" "}
            {formatValue(exercise.category)}
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            {exercise.name}
          </h1>
        </header>
      </div>

      <section className="grid gap-3">
        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
          <h2 className="text-sm font-semibold text-[color:var(--muted)]">
            Details
          </h2>
          <dl className="mt-3 grid gap-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[color:var(--muted)]">Equipment</dt>
              <dd className="text-right capitalize">
                {exercise.equipment.length > 0
                  ? exercise.equipment.join(", ")
                  : "Not set"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[color:var(--muted)]">Movement</dt>
              <dd className="text-right capitalize">
                {formatValue(exercise.movement_pattern)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[color:var(--muted)]">Difficulty</dt>
              <dd className="text-right capitalize">
                {formatValue(exercise.difficulty)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
          <h2 className="text-base font-semibold">Primary muscles</h2>
          <div className="mt-3">
            <MuscleList
              emptyLabel="No primary muscles mapped."
              muscles={exercise.primaryMuscles}
            />
          </div>
        </div>

        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
          <h2 className="text-base font-semibold">Secondary muscles</h2>
          <div className="mt-3">
            <MuscleList
              emptyLabel="No secondary muscles mapped."
              muscles={exercise.secondaryMuscles}
            />
          </div>
        </div>

        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
          <h2 className="text-base font-semibold">Instructions</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            {exercise.instructions || "No instructions added yet."}
          </p>
        </div>

        <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
          <h2 className="text-base font-semibold">Notes</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            {exercise.notes || "No notes added yet."}
          </p>
        </div>

        {!exercise.is_builtin && exercise.owner_id === user.id ? (
          <form action={deleteCustomExercise}>
            <input type="hidden" name="exerciseId" value={exercise.id} />
            <FormSubmitButton
              pendingLabel="Deleting..."
              className="min-h-11 w-full rounded-md border border-red-500/40 px-4 text-sm font-semibold text-red-200 transition-opacity disabled:cursor-wait disabled:opacity-70"
            >
              Delete Custom Exercise
            </FormSubmitButton>
          </form>
        ) : null}
      </section>
    </div>
  );
}
