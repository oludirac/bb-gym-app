import Link from "next/link";
import { FileUp, Play, X } from "lucide-react";
import { importWorkoutCsv } from "@/app/(app)/import/workouts/actions";
import { cancelActiveWorkout } from "@/app/(app)/workouts/actions";
import { CopyPromptButton } from "@/components/copy-prompt-button";
import { CsvInputTools } from "@/components/csv-input-tools";
import { FormSubmitButton } from "@/components/form-submit-button";
import { requireUser } from "@/lib/auth/session";
import { getActiveWorkout } from "@/lib/workouts/queries";

const sampleCsv = `workout_name,exercise_name,category,set_number,reps,weight_kg,duration_minutes,distance_km,intensity,rest_seconds
Upper Body,Barbell Bench Press,chest,1,8,60,,,,120
Upper Body,Barbell Bench Press,chest,2,8,60,,,,120
Upper Body,Lat Pulldown,back,1,10,45,,,,90
Upper Body,Lat Pulldown,back,2,10,45,,,,90`;

const csvPrompt = `Turn the workout below into a CSV for one gym session.

Use exactly these columns:
workout_name,exercise_name,category,set_number,reps,weight_kg,duration_minutes,distance_km,intensity,rest_seconds

Rules:
- Return only raw CSV. No markdown, code fence, or explanation.
- One row per set.
- Use the same workout_name on every row.
- set_number starts at 1 for each exercise.
- category must be one of: chest, back, shoulders, biceps, triceps, forearms, quads, hamstrings, glutes, calves, core, cardio, mobility, full_body.
- Use kg only. Leave weight_kg blank when unknown.
- Lifting rows need one exact reps value.
- Cardio rows leave reps and weight_kg blank and use duration_minutes, distance_km, and/or intensity.
- rest_seconds can be left blank.
- Use simple exercise names.

Workout:
[paste workout here]`;

type WorkoutImportPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

export default async function WorkoutImportPage({
  searchParams
}: WorkoutImportPageProps) {
  const [{ supabase }, params] = await Promise.all([
    requireUser(),
    searchParams
  ]);
  const activeWorkout = await getActiveWorkout(supabase);
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <div className="space-y-6">
      <header className="space-y-3 border-b border-[color:var(--panel-border)] pb-5">
        <Link
          href="/workouts/active"
          className="inline-flex min-h-10 items-center text-sm font-bold text-[color:var(--accent)]"
        >
          Back to Workout
        </Link>
        <div>
          <p className="text-sm font-bold text-[color:var(--accent)]">Import</p>
          <h1 className="mt-1 text-3xl font-black tracking-normal">
            One workout
          </h1>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Paste or upload one session. It opens ready to log.
          </p>
        </div>
      </header>

      {error ? (
        <p className="rounded-md border border-[color:var(--danger)]/50 bg-[color:var(--danger)]/10 p-3 text-sm font-bold text-red-200">
          {error}
        </p>
      ) : null}

      {activeWorkout ? (
        <section className="app-card-flat space-y-3 p-4">
          <div>
            <h2 className="text-lg font-black">Workout already running</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Finish or cancel it before importing another workout.
            </p>
          </div>
          <Link
            href="/workouts/active"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[color:var(--accent)] px-4 text-sm font-black text-zinc-950"
          >
            <Play aria-hidden="true" className="size-4" />
            Resume workout
          </Link>
          <form action={cancelActiveWorkout}>
            <input type="hidden" name="workoutId" value={activeWorkout.id} />
            <FormSubmitButton
              pendingLabel="Cancelling..."
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[color:var(--danger)]/50 px-4 text-sm font-black text-red-200"
            >
              <X aria-hidden="true" className="size-4" />
              Cancel workout
            </FormSubmitButton>
          </form>
        </section>
      ) : (
        <>
          <section className="app-card-flat space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-black">Make the CSV in ChatGPT</h2>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  Copy the prompt, add your workout, then paste the result below.
                </p>
              </div>
              <CopyPromptButton text={csvPrompt} />
            </div>
            <textarea
              readOnly
              rows={8}
              value={csvPrompt}
              className="w-full rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] px-3 py-3 font-mono text-xs leading-5 outline-none"
            />
          </section>

          <form action={importWorkoutCsv} className="space-y-3">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Workout CSV</span>
              <textarea
                id="workout-csv-input"
                name="csv"
                rows={12}
                defaultValue={sampleCsv}
                className="w-full rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel)] px-3 py-3 font-mono text-xs leading-5 outline-none focus:border-[color:var(--accent)]"
              />
            </label>
            <CsvInputTools textareaId="workout-csv-input" />
            <FormSubmitButton pendingLabel="Importing...">
              <FileUp aria-hidden="true" className="size-4" />
              Import and start
            </FormSubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
