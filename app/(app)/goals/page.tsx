import { FormSubmitButton } from "@/components/form-submit-button";
import {
  createGoal,
  deleteGoal,
  updateGoalStatus
} from "@/app/(app)/goals/actions";
import { getExerciseOptions } from "@/lib/workouts/queries";
import { getGoals, type Goal } from "@/lib/tracking/queries";
import { requireUser } from "@/lib/auth/session";

const goalTypes = [
  "strength",
  "bodyweight",
  "consistency",
  "workout_count",
  "volume"
];

const goalUnits = ["kg", "lb", "workouts", "sessions/week", "kg volume"];

function formatValue(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "No target date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function GoalCard({ goal }: { goal: Goal }) {
  return (
    <article className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-[color:var(--muted)]">
            {formatValue(goal.type)}
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {goal.target_value.toLocaleString()} {goal.unit}
          </h2>
          {goal.exercise_name ? (
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {goal.exercise_name}
            </p>
          ) : null}
        </div>
        <span className="rounded-md border border-[color:var(--panel-border)] px-2 py-1 text-[11px] font-semibold capitalize">
          {goal.status}
        </span>
      </div>

      <p className="mt-3 text-sm text-[color:var(--muted)]">
        Target: {formatDate(goal.target_date)}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <form action={updateGoalStatus}>
          <input type="hidden" name="goalId" value={goal.id} />
          <input type="hidden" name="status" value="completed" />
          <FormSubmitButton
            pendingLabel="Saving..."
            className="min-h-10 w-full rounded-md bg-[color:var(--accent)] px-2 text-xs font-semibold text-zinc-950 disabled:cursor-wait disabled:opacity-70"
          >
            Done
          </FormSubmitButton>
        </form>
        <form action={updateGoalStatus}>
          <input type="hidden" name="goalId" value={goal.id} />
          <input
            type="hidden"
            name="status"
            value={goal.status === "paused" ? "active" : "paused"}
          />
          <FormSubmitButton
            pendingLabel="Saving..."
            className="min-h-10 w-full rounded-md border border-[color:var(--panel-border)] px-2 text-xs font-semibold disabled:cursor-wait disabled:opacity-70"
          >
            {goal.status === "paused" ? "Resume" : "Pause"}
          </FormSubmitButton>
        </form>
        <form action={deleteGoal}>
          <input type="hidden" name="goalId" value={goal.id} />
          <FormSubmitButton
            pendingLabel="Deleting..."
            className="min-h-10 w-full rounded-md border border-red-500/40 px-2 text-xs font-semibold text-red-200 disabled:cursor-wait disabled:opacity-70"
          >
            Delete
          </FormSubmitButton>
        </form>
      </div>
    </article>
  );
}

export default async function GoalsPage() {
  const { profile, supabase } = await requireUser();
  const [goals, exerciseOptions] = await Promise.all([
    getGoals(supabase),
    getExerciseOptions(supabase)
  ]);
  const activeGoals = goals.filter((goal) => goal.status === "active");
  const otherGoals = goals.filter((goal) => goal.status !== "active");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--accent)]">
          Goals
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Goals
        </h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Keep a few targets in view.
        </p>
      </header>

      <form
        action={createGoal}
        className="space-y-3 rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4"
      >
        <h2 className="text-base font-semibold">Add goal</h2>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Type</span>
            <select
              name="type"
              className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base capitalize"
              required
            >
              {goalTypes.map((type) => (
                <option key={type} value={type}>
                  {formatValue(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Unit</span>
            <select
              name="unit"
              defaultValue={profile?.unit_preference ?? "kg"}
              className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base"
              required
            >
              {goalUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Target value</span>
          <input
            name="targetValue"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            required
            className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Exercise</span>
          <select
            name="exerciseId"
            className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base"
          >
            <option value="">No exercise</option>
            {exerciseOptions.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
                {exercise.is_builtin ? "" : " (custom)"}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Target date</span>
          <input
            name="targetDate"
            type="date"
            className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base"
          />
        </label>

        <FormSubmitButton pendingLabel="Creating...">Create Goal</FormSubmitButton>
      </form>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Active goals</h2>
        {activeGoals.length === 0 ? (
          <div className="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4">
            <h3 className="text-base font-semibold">No goals yet</h3>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Add one above.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </section>

      {otherGoals.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Other goals</h2>
          <div className="grid gap-3">
            {otherGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
