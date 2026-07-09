"use client";

import { useState, useTransition } from "react";
import { Save, Trash2 } from "lucide-react";
import {
  deleteProgramSetInline,
  updateProgramSetInline
} from "@/app/(app)/programs/actions";
import type { ProgramSet } from "@/lib/programs/queries";

type ProgramSetEditorProps = {
  exerciseCategory: string;
  programId: string;
  set: ProgramSet;
  onDelete: (setId: string) => void;
  onUpdate: (set: ProgramSet) => void;
};

const presetRanges = ["4-6", "8-10", "10-12", "12-15"];

function presetFor(min: number | null, max: number | null) {
  const value = min !== null && max !== null ? `${min}-${max}` : "";
  return presetRanges.includes(value) ? value : "custom";
}

function parsePreset(value: string) {
  if (value === "custom") {
    return null;
  }

  const [min, max] = value.split("-").map((part) => Number(part));
  return Number.isFinite(min) && Number.isFinite(max) ? { max, min } : null;
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "";
  }

  return Number.isInteger(value) ? String(value) : String(value);
}

export function ProgramSetEditor({
  exerciseCategory,
  onDelete,
  onUpdate,
  programId,
  set
}: ProgramSetEditorProps) {
  const isCardio = exerciseCategory === "cardio";
  const [repRange, setRepRange] = useState(() =>
    presetFor(set.target_reps_min, set.target_reps_max)
  );
  const [customMin, setCustomMin] = useState(formatNumber(set.target_reps_min));
  const [customMax, setCustomMax] = useState(formatNumber(set.target_reps_max));
  const [weightKg, setWeightKg] = useState(formatNumber(set.target_weight_kg));
  const [durationMinutes, setDurationMinutes] = useState(
    set.target_duration_seconds === null
      ? ""
      : formatNumber(set.target_duration_seconds / 60)
  );
  const [distanceKm, setDistanceKm] = useState(
    formatNumber(set.target_distance_km)
  );
  const [intensity, setIntensity] = useState(set.target_intensity ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const parsed = parsePreset(repRange);
      const result = await updateProgramSetInline({
        programId,
        setId: set.id,
        targetDistanceKm: distanceKm,
        targetDurationMinutes: durationMinutes,
        targetIntensity: intensity,
        targetRepsMax: parsed?.max ?? customMax,
        targetRepsMin: parsed?.min ?? customMin,
        targetWeightKg: weightKg
      });

      if (result.ok && result.set) {
        onUpdate(result.set);
      } else {
        setError(result.error ?? "Could not save set.");
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProgramSetInline({
        programId,
        setId: set.id
      });

      if (result.ok) {
        onDelete(set.id);
      } else {
        setError(result.error ?? "Could not delete set.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-[color:var(--panel-border)] bg-[#0d1117] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black">Set {set.sort_order}</p>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-[color:var(--accent)] px-3 text-sm font-black text-zinc-950 disabled:cursor-wait disabled:opacity-70"
        >
          <Save aria-hidden="true" className="size-4" />
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>

      {isCardio ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <label className="grid gap-1">
            <span className="text-[11px] font-black text-[color:var(--muted)]">
              minutes
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              className="field-base min-h-11 px-2 text-center text-sm font-black"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-black text-[color:var(--muted)]">
              km
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={distanceKm}
              onChange={(event) => setDistanceKm(event.target.value)}
              className="field-base min-h-11 px-2 text-center text-sm font-black"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-black text-[color:var(--muted)]">
              level
            </span>
            <input
              value={intensity}
              onChange={(event) => setIntensity(event.target.value)}
              className="field-base min-h-11 px-2 text-center text-sm font-black"
            />
          </label>
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="text-[11px] font-black text-[color:var(--muted)]">
                reps
              </span>
              <select
                value={repRange}
                onChange={(event) => setRepRange(event.target.value)}
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              >
                {presetRanges.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-black text-[color:var(--muted)]">
                kg
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.25"
                value={weightKg}
                onChange={(event) => setWeightKg(event.target.value)}
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              />
            </label>
          </div>

          {repRange === "custom" ? (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={customMin}
                onChange={(event) => setCustomMin(event.target.value)}
                placeholder="Min reps"
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              />
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={customMax}
                onChange={(event) => setCustomMax(event.target.value)}
                placeholder="Max reps"
                className="field-base min-h-11 px-2 text-center text-sm font-black"
              />
            </div>
          ) : null}
        </div>
      )}

      {error ? <p className="mt-2 text-xs text-red-200">{error}</p> : null}

      <button
        type="button"
        onClick={remove}
        disabled={isPending}
        className="mt-2 inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-[color:var(--danger)]/40 px-3 text-xs font-black text-red-200 disabled:cursor-wait disabled:opacity-70"
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
        Delete
      </button>
    </div>
  );
}
