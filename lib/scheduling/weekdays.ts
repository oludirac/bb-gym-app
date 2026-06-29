export const weekdayOptions = [
  { label: "Monday", shortLabel: "Mon", value: 1 },
  { label: "Tuesday", shortLabel: "Tue", value: 2 },
  { label: "Wednesday", shortLabel: "Wed", value: 3 },
  { label: "Thursday", shortLabel: "Thu", value: 4 },
  { label: "Friday", shortLabel: "Fri", value: 5 },
  { label: "Saturday", shortLabel: "Sat", value: 6 },
  { label: "Sunday", shortLabel: "Sun", value: 7 }
] as const;

export function weekdayLabel(value: number, variant: "long" | "short" = "long") {
  const weekday = weekdayOptions.find((option) => option.value === value);

  if (!weekday) {
    return "Unscheduled";
  }

  return variant === "short" ? weekday.shortLabel : weekday.label;
}

export function formatWeekdays(values: number[]) {
  if (values.length === 0) {
    return "No fixed days";
  }

  return values.map((value) => weekdayLabel(value, "short")).join(", ");
}
