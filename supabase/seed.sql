insert into public.muscles (name, slug, muscle_group, body_region)
values
  ('Pectoralis Major', 'pectoralis-major', 'chest', 'upper'),
  ('Latissimus Dorsi', 'latissimus-dorsi', 'back', 'upper'),
  ('Trapezius', 'trapezius', 'back', 'upper'),
  ('Anterior Deltoid', 'anterior-deltoid', 'shoulders', 'upper'),
  ('Lateral Deltoid', 'lateral-deltoid', 'shoulders', 'upper'),
  ('Posterior Deltoid', 'posterior-deltoid', 'shoulders', 'upper'),
  ('Biceps Brachii', 'biceps-brachii', 'arms', 'upper'),
  ('Triceps Brachii', 'triceps-brachii', 'arms', 'upper'),
  ('Forearms', 'forearms', 'arms', 'upper'),
  ('Rectus Abdominis', 'rectus-abdominis', 'core', 'trunk'),
  ('Obliques', 'obliques', 'core', 'trunk'),
  ('Spinal Erectors', 'spinal-erectors', 'core', 'trunk'),
  ('Gluteus Maximus', 'gluteus-maximus', 'glutes', 'lower'),
  ('Quadriceps', 'quadriceps', 'legs', 'lower'),
  ('Hamstrings', 'hamstrings', 'legs', 'lower'),
  ('Calves', 'calves', 'legs', 'lower')
on conflict (slug) do update
set
  name = excluded.name,
  muscle_group = excluded.muscle_group,
  body_region = excluded.body_region;

with seed_exercises (
  name,
  slug,
  category,
  equipment,
  movement_pattern,
  difficulty,
  instructions,
  notes
) as (
  values
    ('Barbell Back Squat', 'barbell-back-squat', 'barbell'::public.exercise_category, array['barbell', 'rack'], 'squat', 'intermediate'::public.difficulty_level, 'Set the bar on the upper back, brace, squat to depth, and drive through the mid-foot.', 'Use safeties and keep reps controlled.'),
    ('Barbell Bench Press', 'barbell-bench-press', 'barbell'::public.exercise_category, array['barbell', 'bench'], 'horizontal_push', 'intermediate'::public.difficulty_level, 'Lower the bar under control to the chest, press up while maintaining shoulder position.', 'Keep wrists stacked and feet planted.'),
    ('Conventional Deadlift', 'conventional-deadlift', 'barbell'::public.exercise_category, array['barbell'], 'hinge', 'intermediate'::public.difficulty_level, 'Brace, hinge to the bar, pull slack out, and stand tall with the bar close.', 'Avoid bouncing reps from the floor.'),
    ('Overhead Press', 'overhead-press', 'barbell'::public.exercise_category, array['barbell', 'rack'], 'vertical_push', 'intermediate'::public.difficulty_level, 'Press the bar from shoulders to overhead while braced and stacked.', 'Move the head through after the bar clears the forehead.'),
    ('Pull-Up', 'pull-up', 'bodyweight'::public.exercise_category, array['pull-up bar'], 'vertical_pull', 'intermediate'::public.difficulty_level, 'Pull from a dead hang until the chin clears the bar, then lower under control.', 'Use assistance or load as appropriate.'),
    ('Dumbbell Row', 'dumbbell-row', 'dumbbell'::public.exercise_category, array['dumbbell', 'bench'], 'horizontal_pull', 'beginner'::public.difficulty_level, 'Brace on a bench and row the dumbbell toward the hip.', 'Keep the torso stable.'),
    ('Romanian Deadlift', 'romanian-deadlift', 'barbell'::public.exercise_category, array['barbell'], 'hinge', 'intermediate'::public.difficulty_level, 'Hinge with soft knees, lower the bar along the thighs, then extend the hips.', 'Stop when hamstrings limit range without spinal rounding.'),
    ('Leg Press', 'leg-press', 'machine'::public.exercise_category, array['leg press'], 'squat', 'beginner'::public.difficulty_level, 'Lower the sled under control and press through the platform.', 'Do not lock knees aggressively.'),
    ('Cable Triceps Pressdown', 'cable-triceps-pressdown', 'cable'::public.exercise_category, array['cable stack', 'rope or bar'], 'elbow_extension', 'beginner'::public.difficulty_level, 'Keep elbows pinned and extend the arms down.', 'Control the return.'),
    ('Dumbbell Curl', 'dumbbell-curl', 'dumbbell'::public.exercise_category, array['dumbbells'], 'elbow_flexion', 'beginner'::public.difficulty_level, 'Curl the dumbbells without swinging, then lower under control.', 'Use alternating or simultaneous reps.'),
    ('Plank', 'plank', 'bodyweight'::public.exercise_category, array['bodyweight'], 'anti_extension', 'beginner'::public.difficulty_level, 'Hold a straight line from shoulders to heels while braced.', 'Stop before the lower back sags.'),
    ('Treadmill Run', 'treadmill-run', 'cardio'::public.exercise_category, array['treadmill'], 'locomotion', 'beginner'::public.difficulty_level, 'Run at the prescribed pace, incline, and duration.', 'Track distance, time, and effort.')
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
from seed_exercises se
where not exists (
  select 1
  from public.exercises e
  where e.slug = se.slug
    and e.is_builtin = true
);

with mappings (exercise_slug, muscle_slug, role) as (
  values
    ('barbell-back-squat', 'quadriceps', 'primary'::public.muscle_role),
    ('barbell-back-squat', 'gluteus-maximus', 'primary'::public.muscle_role),
    ('barbell-back-squat', 'hamstrings', 'secondary'::public.muscle_role),
    ('barbell-back-squat', 'spinal-erectors', 'secondary'::public.muscle_role),
    ('barbell-bench-press', 'pectoralis-major', 'primary'::public.muscle_role),
    ('barbell-bench-press', 'triceps-brachii', 'secondary'::public.muscle_role),
    ('barbell-bench-press', 'anterior-deltoid', 'secondary'::public.muscle_role),
    ('conventional-deadlift', 'spinal-erectors', 'primary'::public.muscle_role),
    ('conventional-deadlift', 'gluteus-maximus', 'primary'::public.muscle_role),
    ('conventional-deadlift', 'hamstrings', 'secondary'::public.muscle_role),
    ('conventional-deadlift', 'trapezius', 'secondary'::public.muscle_role),
    ('overhead-press', 'anterior-deltoid', 'primary'::public.muscle_role),
    ('overhead-press', 'lateral-deltoid', 'secondary'::public.muscle_role),
    ('overhead-press', 'triceps-brachii', 'secondary'::public.muscle_role),
    ('pull-up', 'latissimus-dorsi', 'primary'::public.muscle_role),
    ('pull-up', 'biceps-brachii', 'secondary'::public.muscle_role),
    ('pull-up', 'trapezius', 'secondary'::public.muscle_role),
    ('dumbbell-row', 'latissimus-dorsi', 'primary'::public.muscle_role),
    ('dumbbell-row', 'posterior-deltoid', 'secondary'::public.muscle_role),
    ('dumbbell-row', 'biceps-brachii', 'secondary'::public.muscle_role),
    ('romanian-deadlift', 'hamstrings', 'primary'::public.muscle_role),
    ('romanian-deadlift', 'gluteus-maximus', 'primary'::public.muscle_role),
    ('romanian-deadlift', 'spinal-erectors', 'secondary'::public.muscle_role),
    ('leg-press', 'quadriceps', 'primary'::public.muscle_role),
    ('leg-press', 'gluteus-maximus', 'secondary'::public.muscle_role),
    ('cable-triceps-pressdown', 'triceps-brachii', 'primary'::public.muscle_role),
    ('dumbbell-curl', 'biceps-brachii', 'primary'::public.muscle_role),
    ('dumbbell-curl', 'forearms', 'secondary'::public.muscle_role),
    ('plank', 'rectus-abdominis', 'primary'::public.muscle_role),
    ('plank', 'obliques', 'secondary'::public.muscle_role),
    ('treadmill-run', 'quadriceps', 'secondary'::public.muscle_role),
    ('treadmill-run', 'hamstrings', 'secondary'::public.muscle_role),
    ('treadmill-run', 'calves', 'secondary'::public.muscle_role)
)
insert into public.exercise_muscles (exercise_id, muscle_id, role)
select e.id, m.id, mappings.role
from mappings
join public.exercises e on e.slug = mappings.exercise_slug and e.is_builtin = true
join public.muscles m on m.slug = mappings.muscle_slug
on conflict do nothing;

with new_program as (
  insert into public.programs (
    is_public,
    name,
    description,
    difficulty,
    days_per_week,
    avg_session_minutes,
    equipment_required
  )
  select
    true,
    '3 Day Strength Foundation',
    'A simple public starter program built around squat, bench, deadlift, press, and pulls.',
    'beginner'::public.difficulty_level,
    3,
    60,
    array['barbell', 'dumbbell', 'rack', 'bench', 'pull-up bar']
  where not exists (
    select 1
    from public.programs
    where is_public = true
      and name = '3 Day Strength Foundation'
  )
  returning id
),
program_ref as (
  select id from new_program
  union all
  select id
  from public.programs
  where is_public = true
    and name = '3 Day Strength Foundation'
  limit 1
),
week_ref as (
  insert into public.program_weeks (program_id, week_number, notes)
  select id, 1, 'Repeat this structure while progressively adding load where appropriate.'
  from program_ref
  on conflict (program_id, week_number) do update
  set notes = excluded.notes
  returning id, program_id
),
day_seed (day_number, name, focus) as (
  values
    (1, 'Strength A', 'Squat and bench focus'),
    (2, 'Strength B', 'Deadlift and press focus'),
    (3, 'Strength C', 'Full-body volume focus')
),
day_ref as (
  insert into public.program_days (program_week_id, day_number, name, focus)
  select week_ref.id, day_seed.day_number, day_seed.name, day_seed.focus
  from week_ref
  cross join day_seed
  on conflict (program_week_id, day_number) do update
  set
    name = excluded.name,
    focus = excluded.focus
  returning id, day_number
),
exercise_seed (day_number, sort_order, exercise_slug, notes) as (
  values
    (1, 1, 'barbell-back-squat', 'Build to crisp working sets.'),
    (1, 2, 'barbell-bench-press', 'Use controlled pauses if needed.'),
    (1, 3, 'dumbbell-row', 'Keep reps strict.'),
    (2, 1, 'conventional-deadlift', 'Reset each rep from the floor.'),
    (2, 2, 'overhead-press', 'Stay braced.'),
    (2, 3, 'pull-up', 'Use assistance if needed.'),
    (3, 1, 'romanian-deadlift', 'Moderate load and clean hinge.'),
    (3, 2, 'leg-press', 'Controlled range of motion.'),
    (3, 3, 'dumbbell-curl', 'No swinging.')
),
program_exercise_ref as (
  insert into public.program_exercises (program_day_id, exercise_id, sort_order, notes)
  select day_ref.id, e.id, exercise_seed.sort_order, exercise_seed.notes
  from exercise_seed
  join day_ref on day_ref.day_number = exercise_seed.day_number
  join public.exercises e on e.slug = exercise_seed.exercise_slug and e.is_builtin = true
  on conflict (program_day_id, sort_order) do update
  set
    exercise_id = excluded.exercise_id,
    notes = excluded.notes
  returning id, sort_order
)
insert into public.program_sets (
  program_exercise_id,
  sort_order,
  set_type,
  target_reps_min,
  target_reps_max,
  target_rpe,
  rest_seconds
)
select
  pe.id,
  set_order,
  'working'::public.set_type,
  reps_min,
  reps_max,
  rpe,
  rest_seconds
from program_exercise_ref pe
cross join (
  values
    (1, 5, 5, 7.0, 180),
    (2, 5, 5, 7.0, 180),
    (3, 5, 5, 8.0, 180)
) as set_seed(set_order, reps_min, reps_max, rpe, rest_seconds)
on conflict (program_exercise_id, sort_order) do update
set
  set_type = excluded.set_type,
  target_reps_min = excluded.target_reps_min,
  target_reps_max = excluded.target_reps_max,
  target_rpe = excluded.target_rpe,
  rest_seconds = excluded.rest_seconds;
