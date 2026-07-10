import type { ProgramSet } from "@/lib/programs/queries";

type SetTarget = Pick<
  ProgramSet,
  | "sort_order"
  | "target_distance_km"
  | "target_duration_seconds"
  | "target_intensity"
  | "target_reps_max"
  | "target_reps_min"
  | "target_weight_kg"
>;

function formatKg(value: number | null) {
  if (value === null) {
    return "";
  }

  return `${Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2
  })}kg`;
}

function formatReps(min: number | null, max: number | null) {
  if (min !== null && max !== null) {
    return min === max ? `${min}` : `${min}-${max}`;
  }

  return `${min ?? max ?? "-"}`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return null;
  }

  return `${Number(seconds / 60).toLocaleString(undefined, {
    maximumFractionDigits: 1
  })} min`;
}

function formatDistance(value: number | null) {
  if (value === null) {
    return null;
  }

  return `${Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2
  })} km`;
}

function formatCardio(set: SetTarget) {
  const parts = [
    formatDuration(set.target_duration_seconds),
    formatDistance(set.target_distance_km),
    set.target_intensity
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "cardio target";
}

function samePrescription(a: SetTarget, b: SetTarget) {
  return (
    a.target_weight_kg === b.target_weight_kg &&
    a.target_reps_min === b.target_reps_min &&
    a.target_reps_max === b.target_reps_max &&
    a.target_duration_seconds === b.target_duration_seconds &&
    a.target_distance_km === b.target_distance_km &&
    a.target_intensity === b.target_intensity
  );
}

function setCountLabel(count: number) {
  return count === 1 ? "1 x" : `${count} x`;
}

export function groupedSetSummaries(
  sets: SetTarget[],
  exerciseCategory: string
) {
  const summaries: string[] = [];
  const sortedSets = [...sets].sort((a, b) => a.sort_order - b.sort_order);
  let index = 0;

  while (index < sortedSets.length) {
    const first = sortedSets[index];
    let lastIndex = index;

    while (
      lastIndex + 1 < sortedSets.length &&
      samePrescription(first, sortedSets[lastIndex + 1])
    ) {
      lastIndex += 1;
    }

    const count = lastIndex - index + 1;
    const reps = formatReps(first.target_reps_min, first.target_reps_max);
    const weight = formatKg(first.target_weight_kg);

    summaries.push(
      exerciseCategory === "cardio"
        ? `${setCountLabel(count)} ${formatCardio(first)}`
        : `${setCountLabel(count)} ${reps}${weight ? ` @ ${weight}` : ""}`
    );
    index = lastIndex + 1;
  }

  return summaries;
}
