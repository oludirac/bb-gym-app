do $$
begin
  create type public.progression_style as enum (
    'double_progression',
    'top_set_backoff',
    'fixed'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.program_exercises
  add column if not exists progression_style public.progression_style not null default 'double_progression',
  add column if not exists weight_increment_kg numeric(8,2) not null default 2.5 check (weight_increment_kg >= 0),
  add column if not exists track_as_main_lift boolean not null default false;

alter table public.program_enrollments
  add column if not exists block_length_weeks integer not null default 12 check (block_length_weeks > 0);

alter table public.workout_exercises
  add column if not exists program_exercise_id uuid references public.program_exercises(id) on delete set null;

alter table public.workout_sets
  add column if not exists program_set_id uuid references public.program_sets(id) on delete set null;

create index if not exists program_exercises_main_lifts_idx
  on public.program_exercises(program_day_id, track_as_main_lift)
  where track_as_main_lift = true;

create index if not exists program_enrollments_block_idx
  on public.program_enrollments(user_id, status, started_on);

create index if not exists workout_exercises_program_exercise_idx
  on public.workout_exercises(program_exercise_id)
  where program_exercise_id is not null;

create index if not exists workout_sets_program_set_idx
  on public.workout_sets(program_set_id)
  where program_set_id is not null;

create index if not exists workouts_enrollment_status_started_idx
  on public.workouts(program_enrollment_id, status, started_at)
  where program_enrollment_id is not null;
