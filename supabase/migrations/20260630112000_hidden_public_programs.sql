create table if not exists public.hidden_public_programs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (user_id, program_id)
);

create index if not exists hidden_public_programs_program_id_idx
  on public.hidden_public_programs(program_id);

alter table public.hidden_public_programs enable row level security;

drop policy if exists "hidden_public_programs_select_own" on public.hidden_public_programs;
create policy "hidden_public_programs_select_own"
  on public.hidden_public_programs for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "hidden_public_programs_insert_own_public_program" on public.hidden_public_programs;
create policy "hidden_public_programs_insert_own_public_program"
  on public.hidden_public_programs for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.programs p
      where p.id = program_id
        and p.is_public = true
    )
  );

drop policy if exists "hidden_public_programs_delete_own" on public.hidden_public_programs;
create policy "hidden_public_programs_delete_own"
  on public.hidden_public_programs for delete
  to authenticated
  using (user_id = (select auth.uid()));
