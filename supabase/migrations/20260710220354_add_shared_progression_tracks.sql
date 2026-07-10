create table if not exists public.progression_tracks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  name text not null,
  track_key text not null,
  progression_style public.progression_style not null default 'double_progression',
  reps_min integer check (reps_min is null or reps_min >= 0),
  reps_max integer check (reps_max is null or reps_max >= 0),
  current_weight_kg numeric(8,2) check (current_weight_kg is null or current_weight_kg >= 0),
  weight_increment_kg numeric(8,2) not null default 2.5 check (weight_increment_kg >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, track_key),
  constraint progression_tracks_rep_range check (
    reps_min is null
    or reps_max is null
    or reps_min <= reps_max
  )
);

alter table public.program_sets
  add column if not exists progression_track_id uuid references public.progression_tracks(id) on delete set null;

create index if not exists progression_tracks_owner_program_idx
  on public.progression_tracks(owner_id, program_id);

create index if not exists progression_tracks_program_match_idx
  on public.progression_tracks(program_id, exercise_id, reps_min, reps_max, progression_style);

create index if not exists program_sets_progression_track_idx
  on public.program_sets(progression_track_id)
  where progression_track_id is not null;

drop trigger if exists progression_tracks_set_updated_at on public.progression_tracks;
create trigger progression_tracks_set_updated_at
  before update on public.progression_tracks
  for each row execute function public.set_updated_at();

alter table public.progression_tracks enable row level security;

drop policy if exists "progression_tracks_select_accessible" on public.progression_tracks;
create policy "progression_tracks_select_accessible"
  on public.progression_tracks for select
  to authenticated
  using (private.can_read_program(program_id));

drop policy if exists "progression_tracks_insert_owned_program" on public.progression_tracks;
create policy "progression_tracks_insert_owned_program"
  on public.progression_tracks for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and private.can_write_program(program_id)
    and private.can_read_exercise(exercise_id)
  );

drop policy if exists "progression_tracks_update_owned_program" on public.progression_tracks;
create policy "progression_tracks_update_owned_program"
  on public.progression_tracks for update
  to authenticated
  using (private.can_write_program(program_id))
  with check (
    owner_id = (select auth.uid())
    and private.can_write_program(program_id)
    and private.can_read_exercise(exercise_id)
  );

drop policy if exists "progression_tracks_delete_owned_program" on public.progression_tracks;
create policy "progression_tracks_delete_owned_program"
  on public.progression_tracks for delete
  to authenticated
  using (private.can_write_program(program_id));

with eligible_sets as (
  select
    ps.id as program_set_id,
    p.id as program_id,
    p.owner_id,
    pe.exercise_id,
    e.name as exercise_name,
    pe.progression_style,
    pe.weight_increment_kg,
    ps.target_reps_min,
    ps.target_reps_max,
    ps.target_weight_kg,
    concat_ws(
      ':',
      'shared',
      pe.exercise_id::text,
      pe.progression_style::text,
      coalesce(ps.target_reps_min::text, 'null'),
      coalesce(ps.target_reps_max::text, 'null')
    ) as track_key
  from public.program_sets ps
  join public.program_exercises pe on pe.id = ps.program_exercise_id
  join public.program_days pd on pd.id = pe.program_day_id
  join public.program_weeks pw on pw.id = pd.program_week_id
  join public.programs p on p.id = pw.program_id
  join public.exercises e on e.id = pe.exercise_id
  where p.is_public = false
    and p.owner_id is not null
    and pe.progression_style <> 'fixed'
    and ps.set_type = 'working'
    and ps.target_weight_kg is not null
    and ps.target_reps_max is not null
    and ps.progression_track_id is null
),
weight_counts as (
  select
    program_id,
    owner_id,
    exercise_id,
    exercise_name,
    progression_style,
    weight_increment_kg,
    target_reps_min,
    target_reps_max,
    track_key,
    target_weight_kg,
    count(*) as weight_count
  from eligible_sets
  group by
    program_id,
    owner_id,
    exercise_id,
    exercise_name,
    progression_style,
    weight_increment_kg,
    target_reps_min,
    target_reps_max,
    track_key,
    target_weight_kg
),
track_groups as (
  select distinct on (program_id, track_key)
    program_id,
    owner_id,
    exercise_id,
    exercise_name,
    progression_style,
    weight_increment_kg,
    target_reps_min,
    target_reps_max,
    track_key,
    target_weight_kg as current_weight_kg
  from weight_counts
  order by program_id, track_key, weight_count desc, target_weight_kg desc
),
inserted_tracks as (
  insert into public.progression_tracks (
    owner_id,
    program_id,
    exercise_id,
    name,
    track_key,
    progression_style,
    reps_min,
    reps_max,
    current_weight_kg,
    weight_increment_kg
  )
  select
    owner_id,
    program_id,
    exercise_id,
    exercise_name || ' ' || coalesce(target_reps_min::text, '-') || '-' || coalesce(target_reps_max::text, '-'),
    track_key,
    progression_style,
    target_reps_min,
    target_reps_max,
    current_weight_kg,
    weight_increment_kg
  from track_groups
  on conflict (program_id, track_key) do update
    set
      current_weight_kg = excluded.current_weight_kg,
      weight_increment_kg = excluded.weight_increment_kg,
      updated_at = now()
  returning id, program_id, track_key, current_weight_kg
)
update public.program_sets ps
set
  progression_track_id = pt.id,
  target_weight_kg = pt.current_weight_kg
from eligible_sets es
join inserted_tracks pt
  on pt.program_id = es.program_id
  and pt.track_key = es.track_key
where ps.id = es.program_set_id;
