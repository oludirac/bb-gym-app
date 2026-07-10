import Link from "next/link";
import { Dumbbell, Plus, Search } from "lucide-react";
import {
  getExerciseSummaries,
  getMuscleOptions,
  normalizeExerciseFilters,
  type ExerciseFilters
} from "@/lib/exercises/queries";
import {
  bodyPartCategories,
  formatExerciseCategory
} from "@/lib/exercises/categories";
import { requireUser } from "@/lib/auth/session";

type ExercisesPageProps = {
  searchParams: Promise<ExerciseFilters>;
};

function formatValue(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function FilterSelect({
  children,
  label,
  name,
  value
}: {
  children: React.ReactNode;
  label: string;
  name: string;
  value?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="field-base text-sm capitalize"
      >
        {children}
      </select>
    </label>
  );
}

export default async function ExercisesPage({
  searchParams
}: ExercisesPageProps) {
  const [{ supabase }, params] = await Promise.all([
    requireUser(),
    searchParams
  ]);
  const filters = {
    ...normalizeExerciseFilters(params),
    difficulty: undefined
  };
  const [exercises, muscles] = await Promise.all([
    getExerciseSummaries(supabase, filters),
    getMuscleOptions(supabase)
  ]);
  const hasFilters = Boolean(filters.q || filters.category || filters.muscle);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--accent)]">
          Exercises
        </p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-normal">Exercises</h1>
          <Link
            href="/exercises/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[color:var(--accent)] px-3 text-sm font-black text-zinc-950"
          >
            <Plus aria-hidden="true" className="size-4" />
            New
          </Link>
        </div>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Find a lift or add your own.
        </p>
      </header>

      <form action="/exercises" className="space-y-3">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
            Search
          </span>
          <div className="field-base flex items-center gap-2">
            <Search aria-hidden="true" className="size-4 text-[color:var(--muted)]" />
            <input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Search exercises"
              className="min-h-11 flex-1 bg-transparent text-base outline-none"
            />
          </div>
        </label>

        <div className="grid gap-3">
          <FilterSelect
            label="Category"
            name="category"
            value={filters.category}
          >
            <option value="">All categories</option>
            {bodyPartCategories.map((category) => (
              <option key={category} value={category}>
                {formatExerciseCategory(category)}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Muscle" name="muscle" value={filters.muscle}>
            <option value="">All muscles</option>
            {muscles.map((muscle) => (
              <option key={muscle.id} value={muscle.slug}>
                {muscle.name}
              </option>
            ))}
          </FilterSelect>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            type="submit"
            className="min-h-12 rounded-md bg-[color:var(--accent)] px-4 text-base font-black text-zinc-950"
          >
            Apply
          </button>
          <Link
            href="/exercises"
            className="flex min-h-12 items-center justify-center rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-black"
          >
            Clear
          </Link>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            {exercises.length} exercise{exercises.length === 1 ? "" : "s"}
          </h2>
          {hasFilters ? (
            <p className="text-xs text-[color:var(--muted)]">Filtered</p>
          ) : null}
        </div>

        {exercises.length === 0 ? (
          <div className="app-card-flat p-4">
            <h3 className="text-base font-semibold">No exercises found</h3>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              Try a different search or remove a filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {exercises.map((exercise) => (
              <Link
                key={exercise.id}
                href={`/exercises/${exercise.id}`}
                className="app-card-flat block p-4 transition active:scale-[0.99] active:border-[color:var(--accent)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[color:var(--panel-raised)] text-[color:var(--muted)]">
                      <Dumbbell aria-hidden="true" className="size-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-semibold">
                      {exercise.name}
                    </h3>
                    <p className="text-xs capitalize text-[color:var(--muted)]">
                      {formatValue(exercise.category)}
                    </p>
                    </div>
                  </div>
                  <div className="grid shrink-0 justify-items-end gap-2">
                    <span className="app-chip capitalize">
                      {formatValue(exercise.movement_pattern)}
                    </span>
                    {!exercise.is_builtin ? (
                      <span className="app-chip border-[color:var(--accent)] bg-[color:var(--accent)] text-zinc-950">
                        Custom
                      </span>
                    ) : null}
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
                      Equipment
                    </dt>
                    <dd className="mt-1 capitalize">
                      {exercise.equipment.length > 0
                        ? exercise.equipment.join(", ")
                        : "Not set"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
                      Primary muscles
                    </dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {exercise.primaryMuscles.length > 0 ? (
                        exercise.primaryMuscles.map((muscle) => (
                          <span
                            key={muscle.id}
                            className="app-chip"
                          >
                            {muscle.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[color:var(--muted)]">
                          Not mapped
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
