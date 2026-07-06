-- Add simple cardio targets/log fields without changing the workout flow.

alter table public.program_sets
  add column if not exists target_duration_seconds integer
    check (target_duration_seconds is null or target_duration_seconds >= 0),
  add column if not exists target_distance_km numeric(8,2)
    check (target_distance_km is null or target_distance_km >= 0),
  add column if not exists target_intensity text;

alter table public.workout_sets
  add column if not exists duration_seconds integer
    check (duration_seconds is null or duration_seconds >= 0),
  add column if not exists distance_km numeric(8,2)
    check (distance_km is null or distance_km >= 0),
  add column if not exists intensity text;
