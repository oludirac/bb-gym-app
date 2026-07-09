import Link from "next/link";
import { Dumbbell, History, Plus } from "lucide-react";
import { ActiveWorkoutConsole } from "@/components/active-workout-console";
import { FormSubmitButton } from "@/components/form-submit-button";
import { startBlankWorkout } from "@/app/(app)/workouts/actions";
import { getActiveWorkout } from "@/lib/workouts/queries";
import { requireUser } from "@/lib/auth/session";

export default async function ActiveWorkoutPage() {
  const { settings, supabase } = await requireUser();
  const activeWorkout = await getActiveWorkout(supabase);
  const defaultRestSeconds = settings?.default_rest_seconds ?? 120;

  if (!activeWorkout) {
    return (
      <div className="space-y-6">
        <section className="app-card p-5">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-zinc-950">
            <Dumbbell aria-hidden="true" className="size-7" strokeWidth={2.6} />
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-normal">
            No workout running
          </h1>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Start today&apos;s planned workout from Today, or start a blank one.
          </p>
          <div className="mt-5 grid gap-2">
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[color:var(--accent)] px-4 text-base font-extrabold text-zinc-950"
            >
              Go to Today
            </Link>
            <form action={startBlankWorkout}>
              <FormSubmitButton
                pendingLabel="Starting..."
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--panel-border)] px-4 text-base font-extrabold"
              >
                <Plus aria-hidden="true" className="size-5" />
                Blank workout
              </FormSubmitButton>
            </form>
          </div>
        </section>

        <Link
          href="/workouts"
          className="app-card-flat flex min-h-12 items-center justify-center gap-2 px-4 text-sm font-black"
        >
          <History aria-hidden="true" className="size-4" />
          History
        </Link>
      </div>
    );
  }

  const workoutStructureKey = activeWorkout.workoutExercises
    .map(
      (exercise) =>
        `${exercise.id}:${exercise.sets.map((set) => set.id).join(",")}`
    )
    .join("|");

  return (
    <ActiveWorkoutConsole
      key={`${activeWorkout.id}:${workoutStructureKey}`}
      activeWorkout={activeWorkout}
      defaultRestSeconds={defaultRestSeconds}
    />
  );
}
