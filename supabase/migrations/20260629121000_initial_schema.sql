create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create schema if not exists private;

do $$
begin
  create type public.unit_preference as enum ('kg', 'lb');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.exercise_category as enum ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'cardio', 'mobility');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.muscle_role as enum ('primary', 'secondary');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.set_type as enum ('warmup', 'working', 'drop', 'failure');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.workout_status as enum ('active', 'completed', 'discarded');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.program_category as enum ('strength', 'hypertrophy', 'powerbuilding', 'cardio', 'running', 'hyrox', 'mobility', 'general_fitness', 'fat_loss');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.difficulty_level as enum ('beginner', 'intermediate', 'advanced');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.goal_type as enum ('strength', 'bodyweight', 'consistency', 'workout_count', 'volume');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.goal_status as enum ('active', 'completed', 'paused', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.import_status as enum ('pending', 'validating', 'needs_confirmation', 'completed', 'failed');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  unit_preference public.unit_preference not null default 'kg',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.muscles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  muscle_group text not null,
  body_region text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  is_builtin boolean not null default false,
  name text not null,
  slug text not null,
  category public.exercise_category not null,
  equipment text[] not null default '{}',
  movement_pattern text,
  difficulty public.difficulty_level,
  instructions text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_owner_matches_builtin check (
    (is_builtin = true and owner_id is null)
    or
    (is_builtin = false and owner_id is not null)
  )
);

create unique index if not exists exercises_builtin_slug_uidx
  on public.exercises(slug)
  where is_builtin = true;

create unique index if not exists exercises_owner_slug_uidx
  on public.exercises(owner_id, slug)
  where owner_id is not null and deleted_at is null;

create table if not exists public.exercise_muscles (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_id uuid not null references public.muscles(id) on delete cascade,
  role public.muscle_role not null,
  created_at timestamptz not null default now(),
  primary key (exercise_id, muscle_id, role)
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  notes text,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sort_order integer not null check (sort_order > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, sort_order)
);

create table if not exists public.template_sets (
  id uuid primary key default gen_random_uuid(),
  template_exercise_id uuid not null references public.template_exercises(id) on delete cascade,
  sort_order integer not null check (sort_order > 0),
  set_type public.set_type not null default 'working',
  target_reps_min integer check (target_reps_min is null or target_reps_min >= 0),
  target_reps_max integer check (target_reps_max is null or target_reps_max >= 0),
  target_weight_kg numeric(8,2) check (target_weight_kg is null or target_weight_kg >= 0),
  target_rpe numeric(3,1) check (target_rpe is null or (target_rpe >= 0 and target_rpe <= 10)),
  target_rir numeric(3,1) check (target_rir is null or target_rir >= 0),
  rest_seconds integer check (rest_seconds is null or rest_seconds >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_exercise_id, sort_order),
  constraint template_sets_rep_range check (
    target_reps_min is null
    or target_reps_max is null
    or target_reps_min <= target_reps_max
  )
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  is_public boolean not null default false,
  copied_from_program_id uuid references public.programs(id),
  name text not null,
  description text,
  difficulty public.difficulty_level,
  days_per_week integer check (days_per_week is null or (days_per_week >= 1 and days_per_week <= 14)),
  avg_session_minutes integer check (avg_session_minutes is null or avg_session_minutes > 0),
  equipment_required text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programs_owner_matches_public check (
    (is_public = true and owner_id is null)
    or
    (is_public = false and owner_id is not null)
  )
);

create table if not exists public.program_categories (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  category public.program_category not null,
  unique (program_id, category)
);

create table if not exists public.program_phases (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  name text not null,
  start_week integer not null check (start_week > 0),
  end_week integer not null check (end_week > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_phases_week_range check (start_week <= end_week)
);

create table if not exists public.program_weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  phase_id uuid references public.program_phases(id) on delete set null,
  week_number integer not null check (week_number > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, week_number)
);

create table if not exists public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_week_id uuid not null references public.program_weeks(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  name text not null,
  focus text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_week_id, day_number)
);

create table if not exists public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references public.program_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sort_order integer not null check (sort_order > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_day_id, sort_order)
);

create table if not exists public.program_sets (
  id uuid primary key default gen_random_uuid(),
  program_exercise_id uuid not null references public.program_exercises(id) on delete cascade,
  sort_order integer not null check (sort_order > 0),
  set_type public.set_type not null default 'working',
  target_reps_min integer check (target_reps_min is null or target_reps_min >= 0),
  target_reps_max integer check (target_reps_max is null or target_reps_max >= 0),
  target_weight_kg numeric(8,2) check (target_weight_kg is null or target_weight_kg >= 0),
  target_rpe numeric(3,1) check (target_rpe is null or (target_rpe >= 0 and target_rpe <= 10)),
  target_rir numeric(3,1) check (target_rir is null or target_rir >= 0),
  rest_seconds integer check (rest_seconds is null or rest_seconds >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_exercise_id, sort_order),
  constraint program_sets_rep_range check (
    target_reps_min is null
    or target_reps_max is null
    or target_reps_min <= target_reps_max
  )
);

create table if not exists public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  started_on date not null default current_date,
  status text not null default 'active',
  current_week integer not null default 1 check (current_week > 0),
  current_day integer not null default 1 check (current_day > 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'system',
  default_rest_seconds integer not null default 120 check (default_rest_seconds >= 0),
  active_program_enrollment_id uuid references public.program_enrollments(id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid references public.workout_templates(id) on delete set null,
  program_day_id uuid references public.program_days(id) on delete set null,
  program_enrollment_id uuid references public.program_enrollments(id) on delete set null,
  status public.workout_status not null default 'active',
  name text,
  notes text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  total_volume_kg numeric(12,2) not null default 0 check (total_volume_kg >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workouts_finished_when_completed check (
    status <> 'completed'
    or finished_at is not null
  )
);

create unique index if not exists one_active_workout_per_user_uidx
  on public.workouts(owner_id)
  where status = 'active';

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sort_order integer not null check (sort_order > 0),
  exercise_name_snapshot text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_id, sort_order)
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  sort_order integer not null check (sort_order > 0),
  set_type public.set_type not null default 'working',
  weight_kg numeric(8,2) check (weight_kg is null or weight_kg >= 0),
  reps integer check (reps is null or reps >= 0),
  rpe numeric(3,1) check (rpe is null or (rpe >= 0 and rpe <= 10)),
  rir numeric(3,1) check (rir is null or rir >= 0),
  rest_seconds integer check (rest_seconds is null or rest_seconds >= 0),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_exercise_id, sort_order)
);

create table if not exists public.bodyweight_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  logged_on date not null,
  weight_kg numeric(8,2) not null check (weight_kg > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, logged_on)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type public.goal_type not null,
  exercise_id uuid references public.exercises(id) on delete set null,
  target_value numeric(12,2) not null check (target_value >= 0),
  unit text not null,
  start_date date not null default current_date,
  target_date date,
  status public.goal_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  metric text not null,
  value numeric(12,2) not null,
  weight_kg numeric(8,2),
  reps integer,
  workout_set_id uuid references public.workout_sets(id) on delete set null,
  achieved_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.program_imports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  filename text,
  status public.import_status not null default 'pending',
  row_count integer not null default 0 check (row_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  created_program_id uuid references public.programs(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.import_errors (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.program_imports(id) on delete cascade,
  row_number integer,
  field text,
  code text not null,
  message text not null,
  raw_row jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', new.email)
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

drop trigger if exists workout_templates_set_updated_at on public.workout_templates;
create trigger workout_templates_set_updated_at
  before update on public.workout_templates
  for each row execute function public.set_updated_at();

drop trigger if exists template_exercises_set_updated_at on public.template_exercises;
create trigger template_exercises_set_updated_at
  before update on public.template_exercises
  for each row execute function public.set_updated_at();

drop trigger if exists template_sets_set_updated_at on public.template_sets;
create trigger template_sets_set_updated_at
  before update on public.template_sets
  for each row execute function public.set_updated_at();

drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

drop trigger if exists program_phases_set_updated_at on public.program_phases;
create trigger program_phases_set_updated_at
  before update on public.program_phases
  for each row execute function public.set_updated_at();

drop trigger if exists program_weeks_set_updated_at on public.program_weeks;
create trigger program_weeks_set_updated_at
  before update on public.program_weeks
  for each row execute function public.set_updated_at();

drop trigger if exists program_days_set_updated_at on public.program_days;
create trigger program_days_set_updated_at
  before update on public.program_days
  for each row execute function public.set_updated_at();

drop trigger if exists program_exercises_set_updated_at on public.program_exercises;
create trigger program_exercises_set_updated_at
  before update on public.program_exercises
  for each row execute function public.set_updated_at();

drop trigger if exists program_sets_set_updated_at on public.program_sets;
create trigger program_sets_set_updated_at
  before update on public.program_sets
  for each row execute function public.set_updated_at();

drop trigger if exists program_enrollments_set_updated_at on public.program_enrollments;
create trigger program_enrollments_set_updated_at
  before update on public.program_enrollments
  for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

drop trigger if exists workouts_set_updated_at on public.workouts;
create trigger workouts_set_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();

drop trigger if exists workout_exercises_set_updated_at on public.workout_exercises;
create trigger workout_exercises_set_updated_at
  before update on public.workout_exercises
  for each row execute function public.set_updated_at();

drop trigger if exists workout_sets_set_updated_at on public.workout_sets;
create trigger workout_sets_set_updated_at
  before update on public.workout_sets
  for each row execute function public.set_updated_at();

drop trigger if exists bodyweight_logs_set_updated_at on public.bodyweight_logs;
create trigger bodyweight_logs_set_updated_at
  before update on public.bodyweight_logs
  for each row execute function public.set_updated_at();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();
