create table if not exists public.dismissed_program_day_misses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  program_day_id uuid not null references public.program_days(id) on delete cascade,
  scheduled_for date not null,
  created_at timestamptz not null default now(),
  unique (user_id, program_enrollment_id, program_day_id, scheduled_for)
);

create index if not exists dismissed_program_day_misses_enrollment_date_idx
  on public.dismissed_program_day_misses(program_enrollment_id, scheduled_for);

alter table public.dismissed_program_day_misses enable row level security;

drop policy if exists "dismissed_program_day_misses_select_own"
  on public.dismissed_program_day_misses;
create policy "dismissed_program_day_misses_select_own"
  on public.dismissed_program_day_misses for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "dismissed_program_day_misses_insert_own"
  on public.dismissed_program_day_misses;
create policy "dismissed_program_day_misses_insert_own"
  on public.dismissed_program_day_misses for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "dismissed_program_day_misses_delete_own"
  on public.dismissed_program_day_misses;
create policy "dismissed_program_day_misses_delete_own"
  on public.dismissed_program_day_misses for delete
  to authenticated
  using ((select auth.uid()) = user_id);
