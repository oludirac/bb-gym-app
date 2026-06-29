do $$
begin
  create type public.program_schedule_type as enum ('calendar', 'sequence');
exception
  when duplicate_object then null;
end $$;

alter table public.programs
  add column if not exists schedule_type public.program_schedule_type not null default 'sequence';

alter table public.workouts
  add column if not exists scheduled_for date;

create table if not exists public.program_day_schedules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  program_day_id uuid not null references public.program_days(id) on delete cascade,
  weekday integer not null check (weekday >= 1 and weekday <= 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, weekday),
  unique (program_day_id, weekday)
);

create index if not exists program_day_schedules_program_weekday_idx
  on public.program_day_schedules(program_id, weekday);

create index if not exists program_day_schedules_day_idx
  on public.program_day_schedules(program_day_id);

create index if not exists workouts_owner_scheduled_idx
  on public.workouts(owner_id, scheduled_for desc)
  where scheduled_for is not null;

drop trigger if exists program_day_schedules_set_updated_at on public.program_day_schedules;
create trigger program_day_schedules_set_updated_at
  before update on public.program_day_schedules
  for each row execute function public.set_updated_at();

alter table public.program_day_schedules enable row level security;

drop policy if exists "program_day_schedules_select_accessible" on public.program_day_schedules;
create policy "program_day_schedules_select_accessible"
  on public.program_day_schedules for select
  to authenticated
  using (
    private.can_read_program(program_id)
    and exists (
      select 1
      from public.program_days pd
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pd.id = program_day_id
        and pw.program_id = program_day_schedules.program_id
    )
  );

drop policy if exists "program_day_schedules_insert_owned_program" on public.program_day_schedules;
create policy "program_day_schedules_insert_owned_program"
  on public.program_day_schedules for insert
  to authenticated
  with check (
    private.can_write_program(program_id)
    and exists (
      select 1
      from public.program_days pd
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pd.id = program_day_id
        and pw.program_id = program_day_schedules.program_id
    )
  );

drop policy if exists "program_day_schedules_update_owned_program" on public.program_day_schedules;
create policy "program_day_schedules_update_owned_program"
  on public.program_day_schedules for update
  to authenticated
  using (private.can_write_program(program_id))
  with check (
    private.can_write_program(program_id)
    and exists (
      select 1
      from public.program_days pd
      join public.program_weeks pw on pw.id = pd.program_week_id
      where pd.id = program_day_id
        and pw.program_id = program_day_schedules.program_id
    )
  );

drop policy if exists "program_day_schedules_delete_owned_program" on public.program_day_schedules;
create policy "program_day_schedules_delete_owned_program"
  on public.program_day_schedules for delete
  to authenticated
  using (private.can_write_program(program_id));
