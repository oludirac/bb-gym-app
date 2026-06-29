revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.can_read_exercise(target_exercise_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exercises e
    where e.id = target_exercise_id
      and e.deleted_at is null
      and (e.is_builtin = true or e.owner_id = (select auth.uid()))
  );
$$;

create or replace function private.can_write_exercise(target_exercise_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exercises e
    where e.id = target_exercise_id
      and e.is_builtin = false
      and e.owner_id = (select auth.uid())
  );
$$;

create or replace function private.can_read_template(target_template_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workout_templates wt
    where wt.id = target_template_id
      and wt.owner_id = (select auth.uid())
  );
$$;

create or replace function private.can_write_template(target_template_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.can_read_template(target_template_id);
$$;

create or replace function private.can_read_program(target_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.programs p
    where p.id = target_program_id
      and (p.is_public = true or p.owner_id = (select auth.uid()))
  );
$$;

create or replace function private.can_write_program(target_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.programs p
    where p.id = target_program_id
      and p.is_public = false
      and p.owner_id = (select auth.uid())
  );
$$;

create or replace function private.can_read_workout(target_workout_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workouts w
    where w.id = target_workout_id
      and w.owner_id = (select auth.uid())
  );
$$;

create or replace function private.can_write_workout(target_workout_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.can_read_workout(target_workout_id);
$$;

create or replace function private.can_read_import(target_import_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.program_imports pi
    where pi.id = target_import_id
      and pi.owner_id = (select auth.uid())
  );
$$;

create or replace function private.can_write_import(target_import_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.can_read_import(target_import_id);
$$;

grant execute on all functions in schema private to authenticated;

alter table public.profiles enable row level security;
alter table public.muscles enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_muscles enable row level security;
alter table public.workout_templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.template_sets enable row level security;
alter table public.programs enable row level security;
alter table public.program_categories enable row level security;
alter table public.program_phases enable row level security;
alter table public.program_weeks enable row level security;
alter table public.program_days enable row level security;
alter table public.program_exercises enable row level security;
alter table public.program_sets enable row level security;
alter table public.program_enrollments enable row level security;
alter table public.user_settings enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.bodyweight_logs enable row level security;
alter table public.goals enable row level security;
alter table public.personal_records enable row level security;
alter table public.program_imports enable row level security;
alter table public.import_errors enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
  on public.user_settings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own"
  on public.user_settings for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "muscles_select_authenticated" on public.muscles;
create policy "muscles_select_authenticated"
  on public.muscles for select
  to authenticated
  using (true);

drop policy if exists "exercises_select_accessible" on public.exercises;
create policy "exercises_select_accessible"
  on public.exercises for select
  to authenticated
  using (
    deleted_at is null
    and (is_builtin = true or owner_id = (select auth.uid()))
  );

drop policy if exists "exercises_insert_own" on public.exercises;
create policy "exercises_insert_own"
  on public.exercises for insert
  to authenticated
  with check (
    is_builtin = false
    and owner_id = (select auth.uid())
  );

drop policy if exists "exercises_update_own" on public.exercises;
create policy "exercises_update_own"
  on public.exercises for update
  to authenticated
  using (
    is_builtin = false
    and owner_id = (select auth.uid())
  )
  with check (
    is_builtin = false
    and owner_id = (select auth.uid())
  );

drop policy if exists "exercises_delete_own" on public.exercises;
create policy "exercises_delete_own"
  on public.exercises for delete
  to authenticated
  using (
    is_builtin = false
    and owner_id = (select auth.uid())
  );

drop policy if exists "exercise_muscles_select_accessible" on public.exercise_muscles;
create policy "exercise_muscles_select_accessible"
  on public.exercise_muscles for select
  to authenticated
  using (private.can_read_exercise(exercise_id));

drop policy if exists "exercise_muscles_insert_owned_exercise" on public.exercise_muscles;
create policy "exercise_muscles_insert_owned_exercise"
  on public.exercise_muscles for insert
  to authenticated
  with check (private.can_write_exercise(exercise_id));

drop policy if exists "exercise_muscles_update_owned_exercise" on public.exercise_muscles;
create policy "exercise_muscles_update_owned_exercise"
  on public.exercise_muscles for update
  to authenticated
  using (private.can_write_exercise(exercise_id))
  with check (private.can_write_exercise(exercise_id));

drop policy if exists "exercise_muscles_delete_owned_exercise" on public.exercise_muscles;
create policy "exercise_muscles_delete_owned_exercise"
  on public.exercise_muscles for delete
  to authenticated
  using (private.can_write_exercise(exercise_id));

drop policy if exists "workout_templates_select_own" on public.workout_templates;
create policy "workout_templates_select_own"
  on public.workout_templates for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "workout_templates_insert_own" on public.workout_templates;
create policy "workout_templates_insert_own"
  on public.workout_templates for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "workout_templates_update_own" on public.workout_templates;
create policy "workout_templates_update_own"
  on public.workout_templates for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "workout_templates_delete_own" on public.workout_templates;
create policy "workout_templates_delete_own"
  on public.workout_templates for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "template_exercises_select_own_template" on public.template_exercises;
create policy "template_exercises_select_own_template"
  on public.template_exercises for select
  to authenticated
  using (private.can_read_template(template_id));

drop policy if exists "template_exercises_insert_own_template" on public.template_exercises;
create policy "template_exercises_insert_own_template"
  on public.template_exercises for insert
  to authenticated
  with check (
    private.can_write_template(template_id)
    and private.can_read_exercise(exercise_id)
  );

drop policy if exists "template_exercises_update_own_template" on public.template_exercises;
create policy "template_exercises_update_own_template"
  on public.template_exercises for update
  to authenticated
  using (private.can_write_template(template_id))
  with check (
    private.can_write_template(template_id)
    and private.can_read_exercise(exercise_id)
  );

drop policy if exists "template_exercises_delete_own_template" on public.template_exercises;
create policy "template_exercises_delete_own_template"
  on public.template_exercises for delete
  to authenticated
  using (private.can_write_template(template_id));

drop policy if exists "template_sets_select_own_template" on public.template_sets;
create policy "template_sets_select_own_template"
  on public.template_sets for select
  to authenticated
  using (
    exists (
      select 1 from public.template_exercises te
      where te.id = template_exercise_id
        and private.can_read_template(te.template_id)
    )
  );

drop policy if exists "template_sets_insert_own_template" on public.template_sets;
create policy "template_sets_insert_own_template"
  on public.template_sets for insert
  to authenticated
  with check (
    exists (
      select 1 from public.template_exercises te
      where te.id = template_exercise_id
        and private.can_write_template(te.template_id)
    )
  );

drop policy if exists "template_sets_update_own_template" on public.template_sets;
create policy "template_sets_update_own_template"
  on public.template_sets for update
  to authenticated
  using (
    exists (
      select 1 from public.template_exercises te
      where te.id = template_exercise_id
        and private.can_write_template(te.template_id)
    )
  )
  with check (
    exists (
      select 1 from public.template_exercises te
      where te.id = template_exercise_id
        and private.can_write_template(te.template_id)
    )
  );

drop policy if exists "template_sets_delete_own_template" on public.template_sets;
create policy "template_sets_delete_own_template"
  on public.template_sets for delete
  to authenticated
  using (
    exists (
      select 1 from public.template_exercises te
      where te.id = template_exercise_id
        and private.can_write_template(te.template_id)
    )
  );

drop policy if exists "programs_select_accessible" on public.programs;
create policy "programs_select_accessible"
  on public.programs for select
  to authenticated
  using (is_public = true or owner_id = (select auth.uid()));

drop policy if exists "programs_insert_own" on public.programs;
create policy "programs_insert_own"
  on public.programs for insert
  to authenticated
  with check (
    is_public = false
    and owner_id = (select auth.uid())
  );

drop policy if exists "programs_update_own" on public.programs;
create policy "programs_update_own"
  on public.programs for update
  to authenticated
  using (
    is_public = false
    and owner_id = (select auth.uid())
  )
  with check (
    is_public = false
    and owner_id = (select auth.uid())
  );

drop policy if exists "programs_delete_own" on public.programs;
create policy "programs_delete_own"
  on public.programs for delete
  to authenticated
  using (
    is_public = false
    and owner_id = (select auth.uid())
  );

drop policy if exists "program_categories_select_accessible" on public.program_categories;
create policy "program_categories_select_accessible"
  on public.program_categories for select
  to authenticated
  using (private.can_read_program(program_id));

drop policy if exists "program_categories_insert_owned_program" on public.program_categories;
create policy "program_categories_insert_owned_program"
  on public.program_categories for insert
  to authenticated
  with check (private.can_write_program(program_id));

drop policy if exists "program_categories_update_owned_program" on public.program_categories;
create policy "program_categories_update_owned_program"
  on public.program_categories for update
  to authenticated
  using (private.can_write_program(program_id))
  with check (private.can_write_program(program_id));

drop policy if exists "program_categories_delete_owned_program" on public.program_categories;
create policy "program_categories_delete_owned_program"
  on public.program_categories for delete
  to authenticated
  using (private.can_write_program(program_id));

drop policy if exists "program_phases_select_accessible" on public.program_phases;
create policy "program_phases_select_accessible"
  on public.program_phases for select
  to authenticated
  using (private.can_read_program(program_id));

drop policy if exists "program_phases_insert_owned_program" on public.program_phases;
create policy "program_phases_insert_owned_program"
  on public.program_phases for insert
  to authenticated
  with check (private.can_write_program(program_id));

drop policy if exists "program_phases_update_owned_program" on public.program_phases;
create policy "program_phases_update_owned_program"
  on public.program_phases for update
  to authenticated
  using (private.can_write_program(program_id))
  with check (private.can_write_program(program_id));

drop policy if exists "program_phases_delete_owned_program" on public.program_phases;
create policy "program_phases_delete_owned_program"
  on public.program_phases for delete
  to authenticated
  using (private.can_write_program(program_id));

drop policy if exists "program_weeks_select_accessible" on public.program_weeks;
create policy "program_weeks_select_accessible"
  on public.program_weeks for select
  to authenticated
  using (private.can_read_program(program_id));

drop policy if exists "program_weeks_insert_owned_program" on public.program_weeks;
create policy "program_weeks_insert_owned_program"
  on public.program_weeks for insert
  to authenticated
  with check (private.can_write_program(program_id));

drop policy if exists "program_weeks_update_owned_program" on public.program_weeks;
create policy "program_weeks_update_owned_program"
  on public.program_weeks for update
  to authenticated
  using (private.can_write_program(program_id))
  with check (private.can_write_program(program_id));

drop policy if exists "program_weeks_delete_owned_program" on public.program_weeks;
create policy "program_weeks_delete_owned_program"
  on public.program_weeks for delete
  to authenticated
  using (private.can_write_program(program_id));

drop policy if exists "program_days_select_accessible" on public.program_days;
create policy "program_days_select_accessible"
  on public.program_days for select
  to authenticated
  using (
    exists (
      select 1 from public.program_weeks pw
      where pw.id = program_week_id
        and private.can_read_program(pw.program_id)
    )
  );

drop policy if exists "program_days_insert_owned_program" on public.program_days;
create policy "program_days_insert_owned_program"
  on public.program_days for insert
  to authenticated
  with check (
    exists (
      select 1 from public.program_weeks pw
      where pw.id = program_week_id
        and private.can_write_program(pw.program_id)
    )
  );

drop policy if exists "program_days_update_owned_program" on public.program_days;
create policy "program_days_update_owned_program"
  on public.program_days for update
  to authenticated
  using (
    exists (
      select 1 from public.program_weeks pw
      where pw.id = program_week_id
        and private.can_write_program(pw.program_id)
    )
  )
  with check (
    exists (
      select 1 from public.program_weeks pw
      where pw.id = program_week_id
        and private.can_write_program(pw.program_id)
    )
  );

drop policy if exists "program_days_delete_owned_program" on public.program_days;
create policy "program_days_delete_owned_program"
  on public.program_days for delete
  to authenticated
  using (
    exists (
      select 1 from public.program_weeks pw
      where pw.id = program_week_id
        and private.can_write_program(pw.program_id)
    )
  );

drop policy if exists "program_exercises_select_accessible" on public.program_exercises;
create policy "program_exercises_select_accessible"
  on public.program_exercises for select
  to authenticated
  using (
    exists (
      select 1
      from public.program_days pd
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pd.id = program_day_id
        and private.can_read_program(pw.program_id)
    )
  );

drop policy if exists "program_exercises_insert_owned_program" on public.program_exercises;
create policy "program_exercises_insert_owned_program"
  on public.program_exercises for insert
  to authenticated
  with check (
    private.can_read_exercise(exercise_id)
    and exists (
      select 1
      from public.program_days pd
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pd.id = program_day_id
        and private.can_write_program(pw.program_id)
    )
  );

drop policy if exists "program_exercises_update_owned_program" on public.program_exercises;
create policy "program_exercises_update_owned_program"
  on public.program_exercises for update
  to authenticated
  using (
    exists (
      select 1
      from public.program_days pd
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pd.id = program_day_id
        and private.can_write_program(pw.program_id)
    )
  )
  with check (
    private.can_read_exercise(exercise_id)
    and exists (
      select 1
      from public.program_days pd
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pd.id = program_day_id
        and private.can_write_program(pw.program_id)
    )
  );

drop policy if exists "program_exercises_delete_owned_program" on public.program_exercises;
create policy "program_exercises_delete_owned_program"
  on public.program_exercises for delete
  to authenticated
  using (
    exists (
      select 1
      from public.program_days pd
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pd.id = program_day_id
        and private.can_write_program(pw.program_id)
    )
  );

drop policy if exists "program_sets_select_accessible" on public.program_sets;
create policy "program_sets_select_accessible"
  on public.program_sets for select
  to authenticated
  using (
    exists (
      select 1
      from public.program_exercises pe
      join public.program_days pd on pd.id = pe.program_day_id
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pe.id = program_exercise_id
        and private.can_read_program(pw.program_id)
    )
  );

drop policy if exists "program_sets_insert_owned_program" on public.program_sets;
create policy "program_sets_insert_owned_program"
  on public.program_sets for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.program_exercises pe
      join public.program_days pd on pd.id = pe.program_day_id
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pe.id = program_exercise_id
        and private.can_write_program(pw.program_id)
    )
  );

drop policy if exists "program_sets_update_owned_program" on public.program_sets;
create policy "program_sets_update_owned_program"
  on public.program_sets for update
  to authenticated
  using (
    exists (
      select 1
      from public.program_exercises pe
      join public.program_days pd on pd.id = pe.program_day_id
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pe.id = program_exercise_id
        and private.can_write_program(pw.program_id)
    )
  )
  with check (
    exists (
      select 1
      from public.program_exercises pe
      join public.program_days pd on pd.id = pe.program_day_id
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pe.id = program_exercise_id
        and private.can_write_program(pw.program_id)
    )
  );

drop policy if exists "program_sets_delete_owned_program" on public.program_sets;
create policy "program_sets_delete_owned_program"
  on public.program_sets for delete
  to authenticated
  using (
    exists (
      select 1
      from public.program_exercises pe
      join public.program_days pd on pd.id = pe.program_day_id
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pe.id = program_exercise_id
        and private.can_write_program(pw.program_id)
    )
  );

drop policy if exists "program_enrollments_select_own" on public.program_enrollments;
create policy "program_enrollments_select_own"
  on public.program_enrollments for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "program_enrollments_insert_own" on public.program_enrollments;
create policy "program_enrollments_insert_own"
  on public.program_enrollments for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and private.can_read_program(program_id)
  );

drop policy if exists "program_enrollments_update_own" on public.program_enrollments;
create policy "program_enrollments_update_own"
  on public.program_enrollments for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and private.can_read_program(program_id)
  );

drop policy if exists "program_enrollments_delete_own" on public.program_enrollments;
create policy "program_enrollments_delete_own"
  on public.program_enrollments for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "workouts_select_own" on public.workouts;
create policy "workouts_select_own"
  on public.workouts for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "workouts_insert_own" on public.workouts;
create policy "workouts_insert_own"
  on public.workouts for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "workouts_update_own" on public.workouts;
create policy "workouts_update_own"
  on public.workouts for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "workouts_delete_own" on public.workouts;
create policy "workouts_delete_own"
  on public.workouts for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "workout_exercises_select_own_workout" on public.workout_exercises;
create policy "workout_exercises_select_own_workout"
  on public.workout_exercises for select
  to authenticated
  using (private.can_read_workout(workout_id));

drop policy if exists "workout_exercises_insert_own_workout" on public.workout_exercises;
create policy "workout_exercises_insert_own_workout"
  on public.workout_exercises for insert
  to authenticated
  with check (
    private.can_write_workout(workout_id)
    and private.can_read_exercise(exercise_id)
  );

drop policy if exists "workout_exercises_update_own_workout" on public.workout_exercises;
create policy "workout_exercises_update_own_workout"
  on public.workout_exercises for update
  to authenticated
  using (private.can_write_workout(workout_id))
  with check (
    private.can_write_workout(workout_id)
    and private.can_read_exercise(exercise_id)
  );

drop policy if exists "workout_exercises_delete_own_workout" on public.workout_exercises;
create policy "workout_exercises_delete_own_workout"
  on public.workout_exercises for delete
  to authenticated
  using (private.can_write_workout(workout_id));

drop policy if exists "workout_sets_select_own_workout" on public.workout_sets;
create policy "workout_sets_select_own_workout"
  on public.workout_sets for select
  to authenticated
  using (
    exists (
      select 1 from public.workout_exercises we
      where we.id = workout_exercise_id
        and private.can_read_workout(we.workout_id)
    )
  );

drop policy if exists "workout_sets_insert_own_workout" on public.workout_sets;
create policy "workout_sets_insert_own_workout"
  on public.workout_sets for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workout_exercises we
      where we.id = workout_exercise_id
        and private.can_write_workout(we.workout_id)
    )
  );

drop policy if exists "workout_sets_update_own_workout" on public.workout_sets;
create policy "workout_sets_update_own_workout"
  on public.workout_sets for update
  to authenticated
  using (
    exists (
      select 1 from public.workout_exercises we
      where we.id = workout_exercise_id
        and private.can_write_workout(we.workout_id)
    )
  )
  with check (
    exists (
      select 1 from public.workout_exercises we
      where we.id = workout_exercise_id
        and private.can_write_workout(we.workout_id)
    )
  );

drop policy if exists "workout_sets_delete_own_workout" on public.workout_sets;
create policy "workout_sets_delete_own_workout"
  on public.workout_sets for delete
  to authenticated
  using (
    exists (
      select 1 from public.workout_exercises we
      where we.id = workout_exercise_id
        and private.can_write_workout(we.workout_id)
    )
  );

drop policy if exists "bodyweight_logs_select_own" on public.bodyweight_logs;
create policy "bodyweight_logs_select_own"
  on public.bodyweight_logs for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "bodyweight_logs_insert_own" on public.bodyweight_logs;
create policy "bodyweight_logs_insert_own"
  on public.bodyweight_logs for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "bodyweight_logs_update_own" on public.bodyweight_logs;
create policy "bodyweight_logs_update_own"
  on public.bodyweight_logs for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "bodyweight_logs_delete_own" on public.bodyweight_logs;
create policy "bodyweight_logs_delete_own"
  on public.bodyweight_logs for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own"
  on public.goals for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own"
  on public.goals for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and (exercise_id is null or private.can_read_exercise(exercise_id))
  );

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own"
  on public.goals for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and (exercise_id is null or private.can_read_exercise(exercise_id))
  );

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own"
  on public.goals for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "personal_records_select_own" on public.personal_records;
create policy "personal_records_select_own"
  on public.personal_records for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "personal_records_insert_own" on public.personal_records;
create policy "personal_records_insert_own"
  on public.personal_records for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and private.can_read_exercise(exercise_id)
  );

drop policy if exists "personal_records_update_own" on public.personal_records;
create policy "personal_records_update_own"
  on public.personal_records for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and private.can_read_exercise(exercise_id)
  );

drop policy if exists "personal_records_delete_own" on public.personal_records;
create policy "personal_records_delete_own"
  on public.personal_records for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "program_imports_select_own" on public.program_imports;
create policy "program_imports_select_own"
  on public.program_imports for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "program_imports_insert_own" on public.program_imports;
create policy "program_imports_insert_own"
  on public.program_imports for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "program_imports_update_own" on public.program_imports;
create policy "program_imports_update_own"
  on public.program_imports for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "program_imports_delete_own" on public.program_imports;
create policy "program_imports_delete_own"
  on public.program_imports for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "import_errors_select_own_import" on public.import_errors;
create policy "import_errors_select_own_import"
  on public.import_errors for select
  to authenticated
  using (private.can_read_import(import_id));

drop policy if exists "import_errors_insert_own_import" on public.import_errors;
create policy "import_errors_insert_own_import"
  on public.import_errors for insert
  to authenticated
  with check (private.can_write_import(import_id));

drop policy if exists "import_errors_update_own_import" on public.import_errors;
create policy "import_errors_update_own_import"
  on public.import_errors for update
  to authenticated
  using (private.can_write_import(import_id))
  with check (private.can_write_import(import_id));

drop policy if exists "import_errors_delete_own_import" on public.import_errors;
create policy "import_errors_delete_own_import"
  on public.import_errors for delete
  to authenticated
  using (private.can_write_import(import_id));
