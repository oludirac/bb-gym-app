create temporary table seed_starter_programs (
  program_key text primary key,
  name text not null,
  description text not null,
  difficulty public.difficulty_level not null,
  days_per_week integer not null,
  avg_session_minutes integer not null,
  category public.program_category not null
) on commit drop;

insert into seed_starter_programs (
  program_key,
  name,
  description,
  difficulty,
  days_per_week,
  avg_session_minutes,
  category
)
values
  ('stronglifts_5x5', 'StrongLifts 5x5 Style', 'Simple A/B strength plan: squat, press, pull. Add weight when you hit the reps.', 'beginner', 3, 60, 'strength'),
  ('starting_strength', 'Starting Strength Style Novice', 'Simple barbell novice plan built around 3x5 compounds.', 'beginner', 3, 60, 'strength'),
  ('ice_cream_fitness', 'Ice Cream Fitness 5x5 Style', 'Full-body 5x5 base with a small amount of arm/accessory work.', 'beginner', 3, 75, 'powerbuilding'),
  ('basic_ppl', 'Basic Push Pull Legs', 'Three-day PPL using common gym lifts and simple rep ranges.', 'beginner', 3, 60, 'hypertrophy'),
  ('upper_lower_4_day', 'Basic Upper Lower 4 Day', 'Four-day upper/lower split for strength and muscle.', 'intermediate', 4, 60, 'hypertrophy'),
  ('bodybuilding_5_day', 'Basic Bodybuilding 5 Day', 'Simple chest, back, shoulders, legs, arms split.', 'intermediate', 5, 55, 'hypertrophy');

create temporary table seed_starter_days (
  program_key text not null,
  day_number integer not null,
  name text not null,
  focus text not null,
  primary key (program_key, day_number)
) on commit drop;

insert into seed_starter_days (program_key, day_number, name, focus)
values
  ('stronglifts_5x5', 1, 'Workout A', 'Squat, bench, row'),
  ('stronglifts_5x5', 2, 'Workout B', 'Squat, press, deadlift'),
  ('starting_strength', 1, 'Workout A', 'Squat, bench, deadlift'),
  ('starting_strength', 2, 'Workout B', 'Squat, press, row'),
  ('ice_cream_fitness', 1, 'Workout A', 'Squat, bench, row, arms'),
  ('ice_cream_fitness', 2, 'Workout B', 'Squat, deadlift, press, pulls'),
  ('basic_ppl', 1, 'Push', 'Chest, shoulders, triceps'),
  ('basic_ppl', 2, 'Pull', 'Back and biceps'),
  ('basic_ppl', 3, 'Legs', 'Quads, hamstrings, calves'),
  ('upper_lower_4_day', 1, 'Upper A', 'Bench and rows'),
  ('upper_lower_4_day', 2, 'Lower A', 'Squat and hinge'),
  ('upper_lower_4_day', 3, 'Upper B', 'Press and pulls'),
  ('upper_lower_4_day', 4, 'Lower B', 'Deadlift and legs'),
  ('bodybuilding_5_day', 1, 'Chest', 'Chest and triceps'),
  ('bodybuilding_5_day', 2, 'Back', 'Back and biceps'),
  ('bodybuilding_5_day', 3, 'Shoulders', 'Delts and press'),
  ('bodybuilding_5_day', 4, 'Legs', 'Quads, hamstrings, calves'),
  ('bodybuilding_5_day', 5, 'Arms', 'Biceps and triceps');

create temporary table seed_starter_exercises (
  program_key text not null,
  day_number integer not null,
  sort_order integer not null,
  exercise_slug text not null,
  sets integer not null,
  reps_min integer not null,
  reps_max integer not null,
  notes text,
  primary key (program_key, day_number, sort_order)
) on commit drop;

insert into seed_starter_exercises (
  program_key,
  day_number,
  sort_order,
  exercise_slug,
  sets,
  reps_min,
  reps_max,
  notes
)
values
  ('stronglifts_5x5', 1, 1, 'barbell-back-squat', 5, 5, 5, 'Add weight next time when all 5x5 are complete.'),
  ('stronglifts_5x5', 1, 2, 'barbell-bench-press', 5, 5, 5, 'Add weight next time when all 5x5 are complete.'),
  ('stronglifts_5x5', 1, 3, 'barbell-row', 5, 5, 5, 'Strict rows.'),
  ('stronglifts_5x5', 2, 1, 'barbell-back-squat', 5, 5, 5, 'Add weight next time when all 5x5 are complete.'),
  ('stronglifts_5x5', 2, 2, 'overhead-press', 5, 5, 5, 'Add weight next time when all 5x5 are complete.'),
  ('stronglifts_5x5', 2, 3, 'conventional-deadlift', 1, 5, 5, 'One hard work set.'),

  ('starting_strength', 1, 1, 'barbell-back-squat', 3, 5, 5, 'Add weight when all sets are complete.'),
  ('starting_strength', 1, 2, 'barbell-bench-press', 3, 5, 5, 'Add weight when all sets are complete.'),
  ('starting_strength', 1, 3, 'conventional-deadlift', 1, 5, 5, 'One work set after warmups.'),
  ('starting_strength', 2, 1, 'barbell-back-squat', 3, 5, 5, 'Add weight when all sets are complete.'),
  ('starting_strength', 2, 2, 'overhead-press', 3, 5, 5, 'Add weight when all sets are complete.'),
  ('starting_strength', 2, 3, 'barbell-row', 3, 5, 5, 'Used here instead of power cleans for simplicity.'),

  ('ice_cream_fitness', 1, 1, 'barbell-back-squat', 5, 5, 5, 'Main strength lift.'),
  ('ice_cream_fitness', 1, 2, 'barbell-bench-press', 5, 5, 5, 'Main strength lift.'),
  ('ice_cream_fitness', 1, 3, 'barbell-row', 5, 5, 5, 'Main pull.'),
  ('ice_cream_fitness', 1, 4, 'barbell-curl', 3, 8, 10, 'Accessory work.'),
  ('ice_cream_fitness', 1, 5, 'cable-triceps-pressdown', 3, 8, 10, 'Accessory work.'),
  ('ice_cream_fitness', 2, 1, 'barbell-back-squat', 5, 5, 5, 'Main strength lift.'),
  ('ice_cream_fitness', 2, 2, 'conventional-deadlift', 1, 5, 5, 'One hard work set.'),
  ('ice_cream_fitness', 2, 3, 'overhead-press', 5, 5, 5, 'Main press.'),
  ('ice_cream_fitness', 2, 4, 'pull-up', 3, 8, 10, 'Use assistance if needed.'),
  ('ice_cream_fitness', 2, 5, 'skull-crusher', 3, 8, 10, 'Controlled reps.'),

  ('basic_ppl', 1, 1, 'barbell-bench-press', 3, 6, 8, null),
  ('basic_ppl', 1, 2, 'overhead-press', 3, 6, 8, null),
  ('basic_ppl', 1, 3, 'lateral-raise', 3, 12, 15, null),
  ('basic_ppl', 1, 4, 'triceps-pushdown', 3, 10, 12, null),
  ('basic_ppl', 2, 1, 'barbell-row', 3, 6, 8, null),
  ('basic_ppl', 2, 2, 'lat-pulldown', 3, 8, 10, null),
  ('basic_ppl', 2, 3, 'seated-cable-row', 3, 10, 12, null),
  ('basic_ppl', 2, 4, 'barbell-curl', 3, 10, 12, null),
  ('basic_ppl', 3, 1, 'barbell-back-squat', 3, 6, 8, null),
  ('basic_ppl', 3, 2, 'romanian-deadlift', 3, 8, 10, null),
  ('basic_ppl', 3, 3, 'leg-press', 3, 10, 12, null),
  ('basic_ppl', 3, 4, 'standing-calf-raise', 4, 10, 15, null),

  ('upper_lower_4_day', 1, 1, 'barbell-bench-press', 4, 5, 6, null),
  ('upper_lower_4_day', 1, 2, 'barbell-row', 4, 6, 8, null),
  ('upper_lower_4_day', 1, 3, 'overhead-press', 3, 6, 8, null),
  ('upper_lower_4_day', 1, 4, 'lat-pulldown', 3, 8, 10, null),
  ('upper_lower_4_day', 2, 1, 'barbell-back-squat', 4, 5, 6, null),
  ('upper_lower_4_day', 2, 2, 'romanian-deadlift', 3, 8, 10, null),
  ('upper_lower_4_day', 2, 3, 'leg-press', 3, 10, 12, null),
  ('upper_lower_4_day', 2, 4, 'standing-calf-raise', 4, 10, 15, null),
  ('upper_lower_4_day', 3, 1, 'overhead-press', 4, 5, 6, null),
  ('upper_lower_4_day', 3, 2, 'pull-up', 4, 6, 8, null),
  ('upper_lower_4_day', 3, 3, 'barbell-bench-press', 3, 8, 10, null),
  ('upper_lower_4_day', 3, 4, 'dumbbell-row', 3, 8, 10, null),
  ('upper_lower_4_day', 4, 1, 'conventional-deadlift', 3, 3, 5, null),
  ('upper_lower_4_day', 4, 2, 'barbell-back-squat', 3, 8, 10, null),
  ('upper_lower_4_day', 4, 3, 'leg-extension', 3, 10, 12, null),
  ('upper_lower_4_day', 4, 4, 'leg-curl', 3, 10, 12, null),

  ('bodybuilding_5_day', 1, 1, 'barbell-bench-press', 4, 6, 8, null),
  ('bodybuilding_5_day', 1, 2, 'lat-pulldown', 3, 8, 10, null),
  ('bodybuilding_5_day', 1, 3, 'triceps-pushdown', 3, 10, 12, null),
  ('bodybuilding_5_day', 2, 1, 'barbell-row', 4, 6, 8, null),
  ('bodybuilding_5_day', 2, 2, 'seated-cable-row', 3, 8, 10, null),
  ('bodybuilding_5_day', 2, 3, 'barbell-curl', 3, 10, 12, null),
  ('bodybuilding_5_day', 3, 1, 'overhead-press', 4, 6, 8, null),
  ('bodybuilding_5_day', 3, 2, 'lateral-raise', 4, 12, 15, null),
  ('bodybuilding_5_day', 3, 3, 'pull-up', 3, 8, 10, null),
  ('bodybuilding_5_day', 4, 1, 'barbell-back-squat', 4, 6, 8, null),
  ('bodybuilding_5_day', 4, 2, 'romanian-deadlift', 3, 8, 10, null),
  ('bodybuilding_5_day', 4, 3, 'leg-press', 3, 10, 12, null),
  ('bodybuilding_5_day', 4, 4, 'standing-calf-raise', 4, 10, 15, null),
  ('bodybuilding_5_day', 5, 1, 'barbell-curl', 4, 8, 10, null),
  ('bodybuilding_5_day', 5, 2, 'skull-crusher', 4, 8, 10, null),
  ('bodybuilding_5_day', 5, 3, 'cable-triceps-pressdown', 3, 10, 12, null),
  ('bodybuilding_5_day', 5, 4, 'chin-up', 3, 6, 8, null);

insert into public.programs (
  is_public,
  name,
  description,
  difficulty,
  days_per_week,
  avg_session_minutes,
  equipment_required,
  schedule_type
)
select
  true,
  name,
  description,
  difficulty,
  days_per_week,
  avg_session_minutes,
  array['barbell', 'dumbbell', 'machine', 'cable', 'rack', 'bench'],
  'sequence'
from seed_starter_programs seed
where not exists (
  select 1
  from public.programs existing
  where existing.is_public = true
    and existing.name = seed.name
);

update public.programs existing
set
  description = seed.description,
  difficulty = seed.difficulty,
  days_per_week = seed.days_per_week,
  avg_session_minutes = seed.avg_session_minutes,
  equipment_required = array['barbell', 'dumbbell', 'machine', 'cable', 'rack', 'bench'],
  schedule_type = 'sequence',
  updated_at = now()
from seed_starter_programs seed
where existing.is_public = true
  and existing.name = seed.name;

insert into public.program_categories (program_id, category)
select existing.id, seed.category
from seed_starter_programs seed
join public.programs existing on existing.is_public = true and existing.name = seed.name
on conflict (program_id, category) do nothing;

insert into public.program_weeks (program_id, week_number, notes)
select existing.id, 1, 'Repeat this week. Increase the starting weight when you hit the rep target.'
from seed_starter_programs seed
join public.programs existing on existing.is_public = true and existing.name = seed.name
on conflict (program_id, week_number) do update
set notes = excluded.notes;

insert into public.program_days (program_week_id, day_number, name, focus)
select week.id, day_seed.day_number, day_seed.name, day_seed.focus
from seed_starter_days day_seed
join seed_starter_programs seed on seed.program_key = day_seed.program_key
join public.programs existing on existing.is_public = true and existing.name = seed.name
join public.program_weeks week on week.program_id = existing.id and week.week_number = 1
on conflict (program_week_id, day_number) do update
set
  name = excluded.name,
  focus = excluded.focus;

insert into public.program_exercises (program_day_id, exercise_id, sort_order, notes)
select day.id, exercise.id, exercise_seed.sort_order, exercise_seed.notes
from seed_starter_exercises exercise_seed
join seed_starter_programs seed on seed.program_key = exercise_seed.program_key
join public.programs existing on existing.is_public = true and existing.name = seed.name
join public.program_weeks week on week.program_id = existing.id and week.week_number = 1
join public.program_days day on day.program_week_id = week.id and day.day_number = exercise_seed.day_number
join public.exercises exercise on exercise.slug = exercise_seed.exercise_slug and exercise.is_builtin = true
on conflict (program_day_id, sort_order) do update
set
  exercise_id = excluded.exercise_id,
  notes = excluded.notes;

insert into public.program_sets (
  program_exercise_id,
  sort_order,
  set_type,
  target_reps_min,
  target_reps_max
)
select
  program_exercise.id,
  set_order,
  'working',
  exercise_seed.reps_min,
  exercise_seed.reps_max
from seed_starter_exercises exercise_seed
join seed_starter_programs seed on seed.program_key = exercise_seed.program_key
join public.programs existing on existing.is_public = true and existing.name = seed.name
join public.program_weeks week on week.program_id = existing.id and week.week_number = 1
join public.program_days day on day.program_week_id = week.id and day.day_number = exercise_seed.day_number
join public.program_exercises program_exercise on program_exercise.program_day_id = day.id and program_exercise.sort_order = exercise_seed.sort_order
cross join lateral generate_series(1, exercise_seed.sets) as set_order
on conflict (program_exercise_id, sort_order) do update
set
  set_type = excluded.set_type,
  target_reps_min = excluded.target_reps_min,
  target_reps_max = excluded.target_reps_max;
