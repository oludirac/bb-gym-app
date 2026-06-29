import type { UnitPreference } from "@/lib/auth/session";

const poundsPerKg = 2.2046226218;

export function kgToDisplayUnit(weightKg: number, unit: UnitPreference) {
  return unit === "lb" ? weightKg * poundsPerKg : weightKg;
}

export function displayUnitToKg(weight: number, unit: UnitPreference) {
  return unit === "lb" ? weight / poundsPerKg : weight;
}

export function formatWeight(weightKg: number | null, unit: UnitPreference) {
  if (weightKg === null) {
    return "-";
  }

  const displayValue = kgToDisplayUnit(Number(weightKg), unit);
  const rounded = Math.round(displayValue * 10) / 10;

  return `${rounded.toLocaleString()} ${unit}`;
}
