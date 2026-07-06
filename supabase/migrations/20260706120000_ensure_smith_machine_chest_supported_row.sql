-- Ensure the Smith machine chest-supported row exists as a back exercise.
-- This is idempotent and also updates the older seed row to mention bench support.

with seed_exercise as (
  select
    'Smith Machine Chest-Supported Row'::text as name,
    'smith-machine-chest-supported-row'::text as slug,
    'back'::public.exercise_category as category,
    array['smith machine', 'bench']::text[] as equipment,
    'horizontal pull'::text as movement_pattern,
    'beginner'::public.difficulty_level as difficulty,
    null::text as instructions,
    'Chest-supported row using a bench for support with a Smith machine.'::text as notes
)
insert into public.exercises (
  name,
  slug,
  category,
  equipment,
  movement_pattern,
  difficulty,
  instructions,
  notes,
  is_builtin
)
select
  name,
  slug,
  category,
  equipment,
  movement_pattern,
  difficulty,
  instructions,
  notes,
  true
from seed_exercise
where not exists (
  select 1
  from public.exercises
  where slug = seed_exercise.slug
    and is_builtin = true
);

update public.exercises
set
  category = 'back'::public.exercise_category,
  equipment = array['smith machine', 'bench'],
  movement_pattern = 'horizontal pull',
  difficulty = coalesce(difficulty, 'beginner'::public.difficulty_level),
  notes = 'Chest-supported row using a bench for support with a Smith machine.',
  updated_at = now()
where slug = 'smith-machine-chest-supported-row'
  and is_builtin = true;

with exercise_row as (
  select id
  from public.exercises
  where slug = 'smith-machine-chest-supported-row'
    and is_builtin = true
),
muscle_links (muscle_slug, role) as (
  values
    ('back', 'primary'::public.muscle_role),
    ('biceps-brachii', 'secondary'::public.muscle_role),
    ('posterior-deltoid', 'secondary'::public.muscle_role)
)
insert into public.exercise_muscles (exercise_id, muscle_id, role)
select exercise_row.id, muscles.id, muscle_links.role
from exercise_row
join muscle_links on true
join public.muscles on muscles.slug = muscle_links.muscle_slug
on conflict do nothing;
