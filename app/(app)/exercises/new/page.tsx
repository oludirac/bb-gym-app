import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { createCustomExercise } from "@/app/(app)/exercises/actions";
import { getMuscleOptions } from "@/lib/exercises/queries";
import { requireUser } from "@/lib/auth/session";

const categories = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "cardio",
  "mobility"
];

const difficulties = ["", "beginner", "intermediate", "advanced"];

type NewExercisePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function formatValue(value: string) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function MuscleCheckboxes({
  muscles,
  name
}: {
  muscles: { id: string; muscle_group: string; name: string }[];
  name: string;
}) {
  return (
    <div className="grid gap-2">
      {muscles.map((muscle) => (
        <label
          key={`${name}-${muscle.id}`}
          className="flex min-h-11 items-center gap-3 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3"
        >
          <input
            type="checkbox"
            name={name}
            value={muscle.id}
            className="size-4 accent-[color:var(--accent)]"
          />
          <span className="min-w-0 text-sm">
            <span className="font-semibold">{muscle.name}</span>
            <span className="ml-2 text-xs capitalize text-[color:var(--muted)]">
              {muscle.muscle_group}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

export default async function NewExercisePage({
  searchParams
}: NewExercisePageProps) {
  const [{ error }, { supabase }] = await Promise.all([
    searchParams,
    requireUser()
  ]);
  const muscles = await getMuscleOptions(supabase);

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
          <p className="text-sm font-medium text-[color:var(--accent)]">
            Custom lift
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            New Exercise
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Add a movement that is private to your account.
          </p>
        </header>
      </div>

      {error ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <form action={createCustomExercise} className="space-y-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Name</span>
          <input
            name="name"
            className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base outline-none focus:border-[color:var(--accent)]"
            required
          />
        </label>

        <div className="grid gap-3">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Category</span>
            <select
              name="category"
              className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base capitalize outline-none focus:border-[color:var(--accent)]"
              required
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatValue(category)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Difficulty</span>
            <select
              name="difficulty"
              className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base capitalize outline-none focus:border-[color:var(--accent)]"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty || "none"} value={difficulty}>
                  {difficulty || "Not set"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Equipment</span>
          <input
            name="equipment"
            placeholder="barbell, rack"
            className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base outline-none focus:border-[color:var(--accent)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Movement pattern</span>
          <input
            name="movementPattern"
            placeholder="squat, hinge, horizontal push"
            className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base outline-none focus:border-[color:var(--accent)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Instructions</span>
          <textarea
            name="instructions"
            rows={4}
            className="rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 py-3 text-base outline-none focus:border-[color:var(--accent)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            name="notes"
            rows={3}
            className="rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 py-3 text-base outline-none focus:border-[color:var(--accent)]"
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Primary muscles</legend>
          <MuscleCheckboxes muscles={muscles} name="primaryMuscles" />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Secondary muscles</legend>
          <MuscleCheckboxes muscles={muscles} name="secondaryMuscles" />
        </fieldset>

        <FormSubmitButton pendingLabel="Creating exercise...">
          Create Exercise
        </FormSubmitButton>
      </form>
    </div>
  );
}
