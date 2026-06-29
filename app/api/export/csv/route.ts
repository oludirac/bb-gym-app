import { getCurrentSession } from "@/lib/auth/session";

type RawWorkoutSet = {
  notes: string | null;
  reps: number | null;
  rest_seconds: number | null;
  rir: number | null;
  rpe: number | null;
  set_type: string;
  sort_order: number;
  weight_kg: number | null;
  workout_exercises:
    | {
        exercise_name_snapshot: string;
        sort_order: number;
        workouts:
          | {
              name: string | null;
              started_at: string;
              status: string;
            }
          | {
              name: string | null;
              started_at: string;
              status: string;
            }[]
          | null;
      }
    | {
        exercise_name_snapshot: string;
        sort_order: number;
        workouts:
          | {
              name: string | null;
              started_at: string;
              status: string;
            }
          | {
              name: string | null;
              started_at: string;
              status: string;
            }[]
          | null;
      }[]
    | null;
};

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function first<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabase } = session;
  const { data, error } = await supabase
    .from("workout_sets")
    .select(
      `
        sort_order,
        set_type,
        weight_kg,
        reps,
        rpe,
        rir,
        rest_seconds,
        notes,
        workout_exercises!inner (
          sort_order,
          exercise_name_snapshot,
          workouts!inner (
            name,
            started_at,
            status
          )
        )
      `
    )
    .eq("workout_exercises.workouts.status", "completed");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = ((data ?? []) as RawWorkoutSet[])
    .map((set) => {
      const workoutExercise = first(set.workout_exercises);
      const workout = first(workoutExercise?.workouts ?? null);

      return {
        exercise_name: workoutExercise?.exercise_name_snapshot ?? "",
        exercise_order: workoutExercise?.sort_order ?? "",
        notes: set.notes ?? "",
        reps: set.reps ?? "",
        rest_seconds: set.rest_seconds ?? "",
        rir: set.rir ?? "",
        rpe: set.rpe ?? "",
        set_order: set.sort_order,
        set_type: set.set_type,
        weight_kg: set.weight_kg ?? "",
        workout_name: workout?.name ?? "",
        workout_started_at: workout?.started_at ?? ""
      };
    })
    .sort((a, b) => {
      const dateCompare = a.workout_started_at.localeCompare(
        b.workout_started_at
      );

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return Number(a.exercise_order) - Number(b.exercise_order);
    });

  const headers = [
    "workout_started_at",
    "workout_name",
    "exercise_order",
    "exercise_name",
    "set_order",
    "set_type",
    "weight_kg",
    "reps",
    "rpe",
    "rir",
    "rest_seconds",
    "notes"
  ];
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) =>
      headers
        .map((header) => csvCell(row[header as keyof typeof row]))
        .join(",")
    )
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Disposition": 'attachment; filename="bb-gym-workouts.csv"',
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}
