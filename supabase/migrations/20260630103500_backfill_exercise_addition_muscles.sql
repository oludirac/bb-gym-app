-- Ensures broad muscle rows exist for the exercise additions and backfills links.

insert into public.muscles (name, slug, muscle_group, body_region)
values
  ('Back', 'back', 'back', 'upper'),
  ('Core', 'core', 'core', 'trunk'),
  ('Shoulders', 'shoulders', 'shoulders', 'upper'),
  ('Upper Back', 'upper-back', 'back', 'upper')
on conflict (slug) do update
set
  name = excluded.name,
  muscle_group = excluded.muscle_group,
  body_region = excluded.body_region;

with seed_exercise_muscles (exercise_slug, muscle_slug, role) as (
  values
    ('dumbbell-close-grip-bench-press', 'shoulders', 'secondary'::public.muscle_role),
    ('machine-ab-crunch', 'core', 'primary'::public.muscle_role),
    ('barbell-incline-bench-row', 'back', 'primary'::public.muscle_role),
    ('dumbbell-ab-twist', 'core', 'primary'::public.muscle_role),
    ('barbell-plate-ab-twist', 'core', 'primary'::public.muscle_role),
    ('cable-flat-bench-triceps-extension', 'shoulders', 'secondary'::public.muscle_role),
    ('barbell-reverse-grip-bent-over-row', 'back', 'primary'::public.muscle_role),
    ('barbell-incline-bench-triceps-extension', 'shoulders', 'secondary'::public.muscle_role),
    ('weighted-hanging-leg-raise', 'core', 'primary'::public.muscle_role),
    ('dumbbell-reverse-grip-bent-over-row', 'back', 'primary'::public.muscle_role),
    ('dumbbell-incline-bench-triceps-extension', 'shoulders', 'secondary'::public.muscle_role),
    ('cable-incline-bench-triceps-extension', 'shoulders', 'secondary'::public.muscle_role),
    ('weighted-plank', 'core', 'primary'::public.muscle_role),
    ('machine-decline-chest-press', 'shoulders', 'secondary'::public.muscle_role),
    ('barbell-decline-bench-triceps-extension', 'shoulders', 'secondary'::public.muscle_role),
    ('barbell-one-arm-row', 'back', 'primary'::public.muscle_role),
    ('dumbbell-decline-bench-triceps-extension', 'shoulders', 'secondary'::public.muscle_role),
    ('smith-machine-bent-over-row', 'back', 'primary'::public.muscle_role),
    ('cable-standing-shoulder-press', 'shoulders', 'primary'::public.muscle_role),
    ('cable-decline-bench-triceps-extension', 'shoulders', 'secondary'::public.muscle_role),
    ('smith-machine-decline-chest-press', 'shoulders', 'secondary'::public.muscle_role),
    ('barbell-chest-supported-t-bar-row', 'back', 'primary'::public.muscle_role),
    ('seated-cable-shoulder-press', 'shoulders', 'primary'::public.muscle_role),
    ('zercher-carries', 'core', 'primary'::public.muscle_role),
    ('zercher-carries', 'upper-back', 'secondary'::public.muscle_role),
    ('cable-incline-bench-press', 'shoulders', 'secondary'::public.muscle_role),
    ('weighted-push-up', 'shoulders', 'secondary'::public.muscle_role),
    ('machine-iso-row', 'back', 'primary'::public.muscle_role),
    ('weighted-pull-up', 'back', 'primary'::public.muscle_role),
    ('weighted-incline-push-up', 'shoulders', 'secondary'::public.muscle_role),
    ('smith-machine-close-grip-bench-press', 'shoulders', 'secondary'::public.muscle_role),
    ('weighted-decline-push-up', 'shoulders', 'secondary'::public.muscle_role),
    ('weighted-triceps-dip', 'shoulders', 'secondary'::public.muscle_role),
    ('weighted-chin-up', 'back', 'secondary'::public.muscle_role),
    ('cable-reverse-grip-lat-pulldown', 'back', 'primary'::public.muscle_role),
    ('machine-assisted-chin-up', 'back', 'secondary'::public.muscle_role),
    ('cable-v-bar-lat-pulldown', 'back', 'primary'::public.muscle_role),
    ('cable-one-arm-lat-pulldown', 'back', 'primary'::public.muscle_role),
    ('dumbbell-decline-bench-fly', 'shoulders', 'secondary'::public.muscle_role),
    ('machine-back-extension', 'back', 'primary'::public.muscle_role),
    ('machine-upright-row', 'shoulders', 'primary'::public.muscle_role),
    ('weighted-bench-dip', 'shoulders', 'secondary'::public.muscle_role),
    ('cable-upright-row', 'shoulders', 'primary'::public.muscle_role),
    ('machine-shrug', 'back', 'primary'::public.muscle_role),
    ('cable-incline-bench-fly', 'shoulders', 'secondary'::public.muscle_role),
    ('smith-machine-chest-supported-row', 'back', 'primary'::public.muscle_role),
    ('cable-flat-bench-fly', 'shoulders', 'secondary'::public.muscle_role),
    ('machine-chest-supported-low-row', 'back', 'primary'::public.muscle_role)
)
insert into public.exercise_muscles (exercise_id, muscle_id, role)
select e.id, m.id, sem.role
from seed_exercise_muscles sem
join public.exercises e on e.slug = sem.exercise_slug and e.is_builtin = true
join public.muscles m on m.slug = sem.muscle_slug
on conflict (exercise_id, muscle_id, role) do nothing;
