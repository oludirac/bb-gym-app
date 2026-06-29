# Gym Tracker PWA Technical Implementation Plan

Status: Planning complete. Awaiting approval before implementation.

Currentness audit: checked against official docs on 2026-06-29. Implementation should use Supabase publishable/secret keys, `@supabase/ssr`, Next.js `proxy.ts` instead of the deprecated `middleware` convention, Tailwind CSS v4/PostCSS setup, and current Vercel environment handling.

## Product Overview

Build a cloud-backed, mobile-first gym tracker PWA designed for iPhone users who install it through Safari Add to Home Screen.

The app should support serious workout logging, reusable workout templates, structured programs, goals, bodyweight tracking, progress analytics, and program imports.

Primary product principle: the active workout logging experience must be extremely fast. Prioritize minimal taps, one-handed use, sticky controls, quick set entry, previous set copying, previous workout comparison, reliable autosave, and resumable unfinished workouts.

## Technical Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Vercel deployment
- PWA manifest, icons, and service worker where practical

## Current Implementation Standards

- Use `create-next-app` with TypeScript, App Router, and ESLint.
- Use Tailwind CSS v4 with `tailwindcss`, `@tailwindcss/postcss`, `postcss`, a `postcss.config.mjs`, and `@import "tailwindcss"` in global CSS.
- Use explicit lint scripts that call ESLint directly. Do not rely on deprecated `next lint` behavior.
- Keep local secrets in `.env.local` or `.env`; only commit `.env.example`.
- Configure Vercel environment variables separately for Development, Preview, and Production when deployment begins.

## Core Domain Separation

Keep these concepts distinct across the database, application code, routes, and UI:

- Exercise: reusable movement definition.
- Workout Template: reusable planned session.
- Program: multi-week structured training plan.
- Workout: actual session performed by a user.
- Workout Set: actual logged performance.

## 1. Product Requirements Document

### Users

The primary user is an iPhone gym-goer who wants fast, reliable workout logging with enough structure for serious progression.

### Jobs To Be Done

- Track a workout quickly during training.
- Reuse common workouts through templates.
- Follow a multi-week program.
- Review strength, volume, consistency, bodyweight, and personal records.
- Import an existing program from CSV.
- Own and export personal training data.

### Functional Requirements

#### Authentication

- Users can sign up, log in, and log out with Supabase Auth.
- Each user has a profile.
- Each user can choose a preferred display unit: kg or lb.
- Store canonical weights in kg and convert for display/input.

#### Exercise Library

- Built-in exercises are available to all authenticated users.
- Users can create private custom exercises.
- Exercise metadata includes category, equipment, movement pattern, difficulty, instructions, and notes.
- Users can search and filter exercises.
- Supported exercise categories:
  - barbell
  - dumbbell
  - machine
  - cable
  - bodyweight
  - cardio
  - mobility

#### Muscle Mapping

- Store muscles and muscle groups.
- Exercises can have primary and secondary muscles.
- Exercise detail pages show muscles worked.
- Exercise library can filter by muscle.

#### Workout Templates

- Users can create reusable workout templates.
- Templates contain ordered exercises.
- Template exercises contain planned sets, reps, weight, RPE, RIR, and rest time.
- Users can duplicate, edit, and delete templates.

#### Active Workout Logging

- Users can start a blank workout.
- Users can start a workout from a template.
- Users can start a workout from a program day.
- Users can add or remove exercises during a workout.
- Users can log sets with weight, reps, RPE, RIR, set type, and notes.
- Supported set types:
  - warmup
  - working
  - drop
  - failure
- Users can quickly copy a previous set.
- Users can see previous workout values for the same exercise.
- Users can use a rest timer.
- Active workouts autosave.
- Unfinished workouts are resumable.
- Users can finish a workout.

#### Programs

- The app includes a public program library.
- Users can create programs.
- Users must copy public programs into their account before editing.
- Program duration supports any number of weeks, especially 4, 6, 8, 10, 12, and 16 weeks.
- Program categories:
  - strength
  - hypertrophy
  - powerbuilding
  - cardio
  - running
  - Hyrox
  - mobility
  - general fitness
  - fat loss
- Programs include difficulty, days per week, average session length, equipment required, weeks, days, exercises, sets, and optional phases.
- Users can track an active program, current week, and completion percentage.

#### Goals

Support these goal types:

- Strength goal
- Bodyweight goal
- Consistency goal
- Workout count goal
- Volume goal

#### Bodyweight Tracking

- Users can log bodyweight by date.
- Users can view bodyweight over time in a chart.
- Bodyweight input and display should respect unit preference.

#### Progress Dashboard

Dashboard should include:

- Personal records
- Estimated 1RM
- Total volume
- Workout count
- Weekly consistency
- Exercise history
- Muscle group training frequency

#### Program And Workout Import

- Users can import programs from CSV.
- Imported rows are validated.
- Exercises are matched by name.
- Unmatched exercises can become custom exercises after user confirmation.
- Import status and errors are stored.

#### Data Ownership

- Users can export personal data as JSON.
- Users can export practical CSV files.
- Users can delete workouts.
- Account and full data deletion can be added later if practical.

#### PWA And iPhone Support

- Mobile-first layout.
- Large tap targets.
- Dark-mode friendly design.
- Web app manifest.
- App icons, including Apple touch icon.
- Add to Home Screen support.
- Offline-friendly shell where practical.

## 2. MVP Scope And Non-Goals

### MVP Scope

The MVP includes:

- Supabase email/password auth.
- User profile and unit preference.
- Built-in exercise library.
- Custom user exercises.
- Muscle mapping.
- Workout templates.
- Active workout logging.
- Completed workout history.
- Public and user-created programs.
- Program copy and active enrollment.
- Basic goals.
- Bodyweight logs and chart.
- Progress metrics.
- CSV program import.
- JSON/CSV data export.
- PWA metadata, icons, and basic service worker.
- Mobile-first iPhone layout.

### Recommended MVP Simplifications

- Store all weights in kg and convert at the boundary.
- Start with a curated exercise seed set instead of a huge library.
- Start with app-shell offline support rather than full offline sync.
- Calculate progress metrics on demand first, then cache selectively.
- Support CSV program import first, not arbitrary PDF/image parsing.
- Implement account deletion later unless required before launch.

### Non-Goals

- AI coaching
- Apple Health integration
- Social features
- Payments
- Community marketplace
- Native iOS app
- Watch app
- Complex recovery/fatigue engine
- Automatic advanced programming or deload logic

## 3. User Flows

### Authentication And Onboarding

1. User opens app.
2. User signs up or logs in.
3. Supabase Auth creates a session.
4. App creates or loads profile.
5. User selects unit preference.
6. User lands on dashboard.

### Exercise Discovery

1. User opens exercise library.
2. User searches by name or filters by category, equipment, movement pattern, difficulty, or muscle.
3. User opens exercise detail.
4. Detail shows instructions, notes, equipment, muscles worked, and previous performance summary.

### Custom Exercise Creation

1. User taps create exercise.
2. User enters name and metadata.
3. User selects primary and secondary muscles.
4. Exercise becomes private to the user.

### Template Creation

1. User opens templates.
2. User creates a template.
3. User adds ordered exercises.
4. User adds planned sets.
5. User saves template.
6. User can duplicate, edit, delete, or start workout from template.

### Active Workout From Blank

1. User taps start workout.
2. App creates active workout.
3. User adds exercise.
4. User logs sets.
5. User copies previous set when useful.
6. App autosaves after mutations.
7. User finishes workout.
8. App calculates volume and progress updates.

### Active Workout From Template

1. User opens template.
2. User taps start.
3. App copies planned exercises and sets into an active workout draft.
4. User logs actual performance.
5. User finishes workout.

### Active Workout From Program Day

1. User opens active program.
2. User selects current day.
3. User taps start workout.
4. App creates workout linked to program day and enrollment.
5. User logs actual sets.
6. User finishes workout.
7. Program completion updates.

### Program Library And Copy

1. User browses public programs.
2. User filters by category, difficulty, days per week, equipment, or duration.
3. User opens program detail.
4. User copies program to account.
5. User starts an enrollment.

### Bodyweight Logging

1. User opens bodyweight.
2. User logs today's bodyweight.
3. App stores canonical kg value.
4. Chart updates.

### Program Import

1. User uploads CSV.
2. App parses rows.
3. App validates required fields.
4. App matches exercises by normalized name.
5. App shows unmatched exercises.
6. User confirms custom exercise creation or cancels.
7. App creates program in a transaction.
8. App stores import status and errors.

### Data Export

1. User opens export page.
2. User selects JSON or CSV.
3. App generates data for authenticated user only.
4. User downloads export.

## 4. Database Schema

Use UUID primary keys, `created_at`, `updated_at`, foreign keys, and Row Level Security on all user-owned or exposed tables.

Use Postgres enums where values are stable and finite.

Suggested enums:

```sql
create type unit_preference as enum ('kg', 'lb');
create type exercise_category as enum ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'cardio', 'mobility');
create type muscle_role as enum ('primary', 'secondary');
create type set_type as enum ('warmup', 'working', 'drop', 'failure');
create type workout_status as enum ('active', 'completed', 'discarded');
create type program_category as enum ('strength', 'hypertrophy', 'powerbuilding', 'cardio', 'running', 'hyrox', 'mobility', 'general_fitness', 'fat_loss');
create type difficulty_level as enum ('beginner', 'intermediate', 'advanced');
create type goal_type as enum ('strength', 'bodyweight', 'consistency', 'workout_count', 'volume');
create type goal_status as enum ('active', 'completed', 'paused', 'cancelled');
create type import_status as enum ('pending', 'validating', 'needs_confirmation', 'completed', 'failed');
```

### profiles

```sql
profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  unit_preference unit_preference not null default 'kg',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

### user_settings

```sql
user_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  theme text not null default 'system',
  default_rest_seconds integer not null default 120,
  active_program_enrollment_id uuid,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

### muscles

```sql
muscles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  muscle_group text not null,
  body_region text not null,
  created_at timestamptz not null default now()
)
```

### exercises

```sql
exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  is_builtin boolean not null default false,
  name text not null,
  slug text not null,
  category exercise_category not null,
  equipment text[] not null default '{}',
  movement_pattern text,
  difficulty difficulty_level,
  instructions text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (is_builtin = true and owner_id is null)
    or
    (is_builtin = false and owner_id is not null)
  )
)
```

### exercise_muscles

```sql
exercise_muscles (
  exercise_id uuid not null references exercises(id) on delete cascade,
  muscle_id uuid not null references muscles(id) on delete cascade,
  role muscle_role not null,
  created_at timestamptz not null default now(),
  primary key (exercise_id, muscle_id, role)
)
```

### workout_templates

```sql
workout_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  notes text,
  estimated_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

### template_exercises

```sql
template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references workout_templates(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  sort_order integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, sort_order)
)
```

### template_sets

```sql
template_sets (
  id uuid primary key default gen_random_uuid(),
  template_exercise_id uuid not null references template_exercises(id) on delete cascade,
  sort_order integer not null,
  set_type set_type not null default 'working',
  target_reps_min integer,
  target_reps_max integer,
  target_weight_kg numeric(8,2),
  target_rpe numeric(3,1),
  target_rir numeric(3,1),
  rest_seconds integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_exercise_id, sort_order)
)
```

### programs

```sql
programs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  is_public boolean not null default false,
  copied_from_program_id uuid references programs(id),
  name text not null,
  description text,
  difficulty difficulty_level,
  days_per_week integer,
  avg_session_minutes integer,
  equipment_required text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (is_public = true and owner_id is null)
    or
    (is_public = false and owner_id is not null)
  )
)
```

### program_categories

```sql
program_categories (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  category program_category not null,
  unique (program_id, category)
)
```

### program_phases

```sql
program_phases (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  name text not null,
  start_week integer not null,
  end_week integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

### program_weeks

```sql
program_weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  phase_id uuid references program_phases(id) on delete set null,
  week_number integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, week_number)
)
```

### program_days

```sql
program_days (
  id uuid primary key default gen_random_uuid(),
  program_week_id uuid not null references program_weeks(id) on delete cascade,
  day_number integer not null,
  name text not null,
  focus text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_week_id, day_number)
)
```

### program_exercises

```sql
program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references program_days(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  sort_order integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_day_id, sort_order)
)
```

### program_sets

```sql
program_sets (
  id uuid primary key default gen_random_uuid(),
  program_exercise_id uuid not null references program_exercises(id) on delete cascade,
  sort_order integer not null,
  set_type set_type not null default 'working',
  target_reps_min integer,
  target_reps_max integer,
  target_weight_kg numeric(8,2),
  target_rpe numeric(3,1),
  target_rir numeric(3,1),
  rest_seconds integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_exercise_id, sort_order)
)
```

### program_enrollments

```sql
program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  program_id uuid not null references programs(id) on delete cascade,
  started_on date not null default current_date,
  status text not null default 'active',
  current_week integer not null default 1,
  current_day integer not null default 1,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

### workouts

```sql
workouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  template_id uuid references workout_templates(id) on delete set null,
  program_day_id uuid references program_days(id) on delete set null,
  program_enrollment_id uuid references program_enrollments(id) on delete set null,
  status workout_status not null default 'active',
  name text,
  notes text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  total_volume_kg numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

### workout_exercises

```sql
workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  sort_order integer not null,
  exercise_name_snapshot text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_id, sort_order)
)
```

### workout_sets

```sql
workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references workout_exercises(id) on delete cascade,
  sort_order integer not null,
  set_type set_type not null default 'working',
  weight_kg numeric(8,2),
  reps integer,
  rpe numeric(3,1),
  rir numeric(3,1),
  rest_seconds integer,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_exercise_id, sort_order)
)
```

### bodyweight_logs

```sql
bodyweight_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  logged_on date not null,
  weight_kg numeric(8,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, logged_on)
)
```

### goals

```sql
goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  type goal_type not null,
  exercise_id uuid references exercises(id) on delete set null,
  target_value numeric(12,2) not null,
  unit text not null,
  start_date date not null default current_date,
  target_date date,
  status goal_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

### personal_records

```sql
personal_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  metric text not null,
  value numeric(12,2) not null,
  weight_kg numeric(8,2),
  reps integer,
  workout_set_id uuid references workout_sets(id) on delete set null,
  achieved_at timestamptz not null,
  created_at timestamptz not null default now()
)
```

### program_imports

```sql
program_imports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  filename text,
  status import_status not null default 'pending',
  row_count integer not null default 0,
  error_count integer not null default 0,
  created_program_id uuid references programs(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
)
```

### import_errors

```sql
import_errors (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references program_imports(id) on delete cascade,
  row_number integer,
  field text,
  code text not null,
  message text not null,
  raw_row jsonb,
  created_at timestamptz not null default now()
)
```

## 5. Supabase RLS Policies

Enable Row Level Security on every exposed table.

General policy principles:

- Use `to authenticated` on authenticated-user policies.
- Use `(select auth.uid())` in policies for performance.
- Public seed data is readable but not writable by normal users.
- User-owned data is only visible and mutable by the owner.
- Child rows inherit access through their parent rows.
- Supabase secret-key operations are only used server-side for admin/seed tasks.

### Policy Matrix

```text
profiles:
  select/update own row
  insert own row during profile bootstrap

user_settings:
  select/insert/update/delete own row

muscles:
  authenticated users can select
  no client writes

exercises:
  select built-in exercises
  select own custom exercises
  insert/update/delete own custom exercises
  no client writes to built-in exercises

exercise_muscles:
  select when parent exercise is built-in or owned by user
  insert/update/delete when parent exercise is owned by user

workout_templates:
  CRUD own templates

template_exercises/template_sets:
  CRUD when parent template is owned by user

programs:
  select public programs
  select own programs
  insert/update/delete own non-public programs
  no client writes to public programs

program hierarchy tables:
  select when parent program is public or owned by user
  insert/update/delete when parent program is owned by user

program_enrollments:
  CRUD own enrollments

workouts:
  CRUD own workouts

workout_exercises/workout_sets:
  CRUD when parent workout is owned by user

bodyweight_logs:
  CRUD own logs

goals:
  CRUD own goals

personal_records:
  select own records
  insert/update/delete own records through app logic

program_imports/import_errors:
  CRUD/read own import records and errors
```

## 6. Indexing Strategy

Add indexes for FK joins, ownership lookups, common filters, and dashboard queries.

```sql
create index exercises_owner_id_idx on exercises(owner_id);
create index exercises_is_builtin_idx on exercises(is_builtin);
create index exercises_category_idx on exercises(category);
create index exercises_movement_pattern_idx on exercises(movement_pattern);
create index exercises_difficulty_idx on exercises(difficulty);
create index exercises_name_lower_idx on exercises(lower(name));

create index exercise_muscles_muscle_id_idx on exercise_muscles(muscle_id);
create index exercise_muscles_exercise_id_idx on exercise_muscles(exercise_id);

create index workout_templates_owner_id_idx on workout_templates(owner_id);
create index template_exercises_template_order_idx on template_exercises(template_id, sort_order);
create index template_sets_exercise_order_idx on template_sets(template_exercise_id, sort_order);

create index programs_public_idx on programs(is_public);
create index programs_owner_id_idx on programs(owner_id);
create index programs_difficulty_idx on programs(difficulty);
create index programs_days_per_week_idx on programs(days_per_week);
create index program_categories_category_idx on program_categories(category);

create index program_weeks_program_order_idx on program_weeks(program_id, week_number);
create index program_days_week_order_idx on program_days(program_week_id, day_number);
create index program_exercises_day_order_idx on program_exercises(program_day_id, sort_order);
create index program_sets_exercise_order_idx on program_sets(program_exercise_id, sort_order);

create index program_enrollments_user_status_idx on program_enrollments(user_id, status);

create index workouts_owner_status_idx on workouts(owner_id, status);
create index workouts_owner_started_idx on workouts(owner_id, started_at desc);
create index workouts_owner_finished_idx on workouts(owner_id, finished_at desc);
create unique index one_active_workout_per_user_idx
  on workouts(owner_id)
  where status = 'active';

create index workout_exercises_workout_order_idx on workout_exercises(workout_id, sort_order);
create index workout_exercises_exercise_id_idx on workout_exercises(exercise_id);
create index workout_sets_exercise_order_idx on workout_sets(workout_exercise_id, sort_order);

create index bodyweight_logs_owner_date_idx on bodyweight_logs(owner_id, logged_on desc);
create index goals_owner_status_type_idx on goals(owner_id, status, type);
create index personal_records_owner_exercise_metric_idx on personal_records(owner_id, exercise_id, metric, achieved_at desc);
create index import_errors_import_row_idx on import_errors(import_id, row_number);
```

Optional later improvement:

```sql
create extension if not exists pg_trgm;
create index exercises_name_trgm_idx on exercises using gin (name gin_trgm_ops);
```

## 7. Seed Data Strategy

Seed data should be idempotent and version-controlled.

### Seed In MVP

- Muscles.
- Muscle groups.
- Exercise categories.
- 100 to 150 built-in exercises.
- Exercise to muscle mappings.
- A few high-quality public starter programs.

### Seed Guidelines

- Use stable slugs for exercises and muscles.
- Keep built-in exercises ownerless with `is_builtin = true`.
- Keep public programs ownerless with `is_public = true`.
- Use explicit IDs or stable slugs to make reseeding safe.
- Prefer quality and complete metadata over sheer quantity.

## 8. Route And Page Structure

```text
app/
  proxy.ts
  (auth)/
    login/page.tsx
    signup/page.tsx
  auth/
    callback/route.ts
  (app)/
    layout.tsx
    dashboard/page.tsx
    exercises/page.tsx
    exercises/[id]/page.tsx
    exercises/new/page.tsx
    workouts/start/page.tsx
    workouts/active/page.tsx
    workouts/[id]/page.tsx
    templates/page.tsx
    templates/[id]/edit/page.tsx
    programs/page.tsx
    programs/[id]/page.tsx
    programs/active/page.tsx
    goals/page.tsx
    bodyweight/page.tsx
    progress/page.tsx
    import/programs/page.tsx
    export/page.tsx
    settings/page.tsx
  api/
    import/programs/route.ts
    export/json/route.ts
    export/csv/route.ts
  manifest.ts
```

## 9. Component Structure

```text
components/
  ui/
    button.tsx
    input.tsx
    select.tsx
    dialog.tsx
    sheet.tsx
    tabs.tsx
    timer.tsx
    chart.tsx
  layout/
    app-shell.tsx
    bottom-nav.tsx
    page-header.tsx
    active-workout-bar.tsx

features/
  auth/
  profile/
  exercises/
    exercise-list.tsx
    exercise-card.tsx
    exercise-filters.tsx
    exercise-detail.tsx
    exercise-form.tsx
  workouts/
    active-workout-screen.tsx
    workout-exercise-card.tsx
    workout-set-row.tsx
    quick-add-set-button.tsx
    previous-performance.tsx
    rest-timer.tsx
  templates/
  programs/
  goals/
  bodyweight/
  progress/
  import-export/

lib/
  supabase/
    client.ts
    server.ts
    proxy.ts
  validation/
  unit-conversion.ts
  progress-metrics.ts
  csv.ts
  date.ts
```

## 10. Server Actions And API Structure

Use Supabase SSR clients with cookies through `@supabase/ssr` and `@supabase/supabase-js`.

Use the current Supabase publishable key for browser and SSR client setup. Do not use legacy `anon` naming in new code. If a privileged backend key is needed later, use a server-only Supabase secret key and never expose it to Client Components.

Use Next.js `proxy.ts` for auth/session refresh. The older `middleware.ts` file convention is deprecated in current Next.js.

Use server components for authenticated initial reads where appropriate.

Use client Supabase calls for fast active workout mutations that benefit from optimistic UI and RLS enforcement.

Use server actions for validated mutations where latency is less critical:

- Profile update.
- Settings update.
- Template create/update/delete.
- Program copy.
- Goal create/update/delete.
- Bodyweight log create/update/delete.

Use route handlers for file workflows:

```text
POST /api/import/programs
GET  /api/export/json
GET  /api/export/csv
```

Use Postgres RPC or a server-side transaction for operations that must be atomic:

- Finish workout.
- Calculate total workout volume.
- Update active program progress.
- Refresh personal records.
- Create program from imported CSV.
- Copy public program to user account.

Suggested RPC functions:

```text
finish_workout(workout_id uuid)
copy_public_program(program_id uuid)
create_program_from_import(import_id uuid, resolved_exercises jsonb)
refresh_personal_records(user_id uuid)
```

## 11. PWA Strategy

### Manifest

Use `app/manifest.ts` or `app/manifest.json` with:

- name
- short_name
- description
- id
- start_url
- display: standalone
- background_color
- theme_color
- icons for 192x192 and 512x512
- maskable icon if practical

### iPhone Support

Add Apple-specific metadata:

- `apple-mobile-web-app-capable`
- `apple-mobile-web-app-status-bar-style`
- `apple-mobile-web-app-title`
- `apple-touch-icon`

Use a valid manifest with `display: standalone` or `fullscreen` as the primary iOS Home Screen web app signal. Keep `apple-touch-icon` because iOS gives it precedence over manifest icons when both are present.

iOS Safari does not support the cross-browser install prompt pattern consistently. Provide a small manual Add to Home Screen instruction UI instead of relying on `beforeinstallprompt`.

Use safe area CSS:

```css
padding-bottom: env(safe-area-inset-bottom);
padding-top: env(safe-area-inset-top);
```

### Service Worker

MVP service worker should:

- Cache static app shell assets.
- Provide an offline fallback route.
- Avoid caching private Supabase API responses by default.
- Avoid pretending full offline sync exists.

### Offline-Friendly Active Workout

MVP should protect users from accidental loss:

- Keep active workout UI state mirrored in local storage or IndexedDB.
- Sync to Supabase whenever online.
- Warn or show sync status if offline.
- Reconcile conservatively when app restarts.

Full offline mutation queue can be a later enhancement.

## 12. Import And Export Strategy

### CSV Program Import Format

Recommended MVP columns:

```text
program_name
category
difficulty
week
day
day_name
exercise_name
set_order
set_type
reps_min
reps_max
weight
weight_unit
rpe
rir
rest_seconds
notes
```

### Import Pipeline

1. Upload CSV.
2. Parse rows.
3. Validate required fields.
4. Normalize program, day, exercise, and set values.
5. Match exercises by normalized name.
6. Store validation errors.
7. Present unmatched exercises.
8. User confirms custom exercise creation.
9. Create program and hierarchy in transaction.
10. Mark import completed or failed.

### Export

MVP export options:

- Full JSON export.
- CSV export for core user-owned tables.

Export only the authenticated user's data.

Do not include privileged secret-key routes exposed to the browser.

## 13. Edge Cases

### Data And Units

- Store canonical kg values.
- Convert lb at input and display.
- Avoid double conversion on edit.
- Respect user local date for bodyweight logs.

### Workout Logging

- User opens active workout on multiple tabs/devices.
- User backgrounds PWA during workout.
- User loses network mid-workout.
- User closes app before finishing.
- User logs partial sets.
- User edits completed workout later.
- User deletes workout after PRs were calculated.

### Exercises

- Built-in and custom exercise names can collide.
- Custom exercise is referenced by historical workouts.
- Exercise is renamed after old workouts exist.
- Exercise is deleted after old workouts exist.

Recommendation: soft-delete referenced custom exercises and snapshot exercise names in workout history.

### Programs

- Public program changes after user copies it.
- User edits copied program while enrolled.
- Program has unusual duration.
- Program has rest days or no exercises on a day.
- Program import has missing weeks or duplicate set orders.

### Security

- RLS must prevent cross-user reads through child tables.
- Public program children must be readable but not writable.
- Supabase secret key must never be available client-side.

## 14. Testing Plan

### Unit Tests

- kg/lb conversion.
- Volume calculation.
- Estimated 1RM calculation.
- Personal record detection.
- CSV parsing.
- CSV validation.
- Exercise name normalization and matching.
- Program completion percentage.

### Database Tests

- Migrations apply cleanly.
- FK constraints work.
- Unique constraints work.
- RLS prevents cross-user access.
- Built-in exercises are readable but not writable.
- Public programs are readable but not writable.
- Users can only mutate owned data.

### Integration Tests

- Auth callback creates/loads session.
- Profile bootstrap works.
- Custom exercise creation with muscles works.
- Template create/update/delete works.
- Program copy creates a user-owned program.
- Finish workout transaction updates status, volume, PRs, and enrollment progress.
- Program import stores errors and creates program only after confirmation.

### E2E Tests

Use Playwright with iPhone/mobile viewport:

- Sign up/login.
- Create custom exercise.
- Search/filter exercises.
- Start blank workout.
- Add exercise.
- Log set.
- Copy previous set.
- Resume active workout.
- Finish workout.
- Create template.
- Start from template.
- Copy/start program.
- Log bodyweight.
- View progress dashboard.

### PWA QA

- Manifest is valid.
- Icons load.
- App opens in standalone mode after Add to Home Screen.
- Safe areas do not hide controls.
- Service worker does not cache private data incorrectly.
- Lighthouse PWA checks pass where practical.

## 15. Deployment Plan

### Supabase

- Use Supabase project `BB Gym App` in `eu-west-2` unless the user chooses a different project.
- Configure auth providers.
- Configure redirect URLs for local, preview, and production.
- Apply migrations through Supabase CLI.
- Seed built-in data.
- Generate TypeScript database types.
- Verify RLS in staging.

### Vercel

- Connect Git repository.
- Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - server-only `SUPABASE_SECRET_KEY` only if absolutely needed for admin operations
- Configure production domain.
- Deploy preview.
- Run smoke tests.
- Deploy production.

### Operations

- Keep migrations reviewed and ordered.
- Back up Supabase project data.
- Monitor auth and API errors.
- Track basic web vitals.

## 16. Implementation Milestones

1. Project setup: Next.js App Router, TypeScript, Tailwind, linting, formatting, test tooling.
2. Supabase setup: clients, env vars, auth callback, generated types.
3. Schema, migrations, RLS, and seed data.
4. Auth, profile, and user settings.
5. Mobile app shell, navigation, and PWA metadata.
6. Exercise library and muscle filters.
7. Workout logging v1: active workout, set logging, autosave, resume, finish.
8. Workout templates.
9. Programs: library, copy, program day start, enrollment progress.
10. Goals and bodyweight.
11. Progress dashboard.
12. Program import and data export.
13. PWA polish, testing, and deployment.

## 17. Suggested Build Tickets In Order

1. Scaffold Next.js app with TypeScript and Tailwind.
2. Add linting, formatting, test tooling, and baseline scripts.
3. Add Supabase browser/server clients.
4. Add auth callback and session proxy.
5. Create SQL enums.
6. Create core profile/settings tables.
7. Create exercise and muscle tables.
8. Create template tables.
9. Create program tables.
10. Create workout tables.
11. Create bodyweight, goals, PR, and import tables.
12. Add RLS policies.
13. Add indexes.
14. Add seed data for muscles.
15. Add seed data for built-in exercises.
16. Add seed data for public programs.
17. Build profile/settings screens.
18. Build mobile app shell and bottom navigation.
19. Add PWA manifest and icons.
20. Build exercise list/search/filter.
21. Build exercise detail.
22. Build custom exercise CRUD.
23. Build active workout creation.
24. Build active workout exercise picker.
25. Build set logging UI.
26. Add quick copy previous set.
27. Add previous workout comparison.
28. Add rest timer.
29. Add autosave/resume behavior.
30. Add finish workout transaction.
31. Build workout history.
32. Build template CRUD.
33. Add start from template.
34. Build public program library.
35. Add copy public program.
36. Build active program enrollment.
37. Add start from program day.
38. Build bodyweight logging and chart.
39. Build goals.
40. Build progress dashboard.
41. Add CSV program import parser.
42. Add CSV validation and error display.
43. Add unmatched exercise confirmation.
44. Add import transaction.
45. Add JSON export.
46. Add CSV export.
47. Add service worker and offline fallback.
48. Add mobile E2E tests.
49. Run RLS/security QA.
50. Deploy to Vercel.

## First Coding Batch After Approval

Recommended first implementation batch:

1. Scaffold the app and tooling.
2. Add Supabase client structure and auth callback.
3. Add initial database schema migrations.
4. Add RLS policies and seed strategy.

This gives the project a secure foundation before UI work begins.

## References

- Next.js PWA guide: https://nextjs.org/docs/app/guides/progressive-web-apps
- Next.js manifest docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
- Next.js proxy docs: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- Supabase SSR auth for Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Tailwind CSS with Next.js: https://tailwindcss.com/docs/installation/framework-guides/nextjs
- Vercel environment variables: https://vercel.com/docs/environment-variables
- WebKit Home Screen web apps: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
