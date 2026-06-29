create index if not exists profiles_unit_preference_idx on public.profiles(unit_preference);

create index if not exists muscles_slug_idx on public.muscles(slug);
create index if not exists muscles_group_idx on public.muscles(muscle_group);
create index if not exists muscles_region_idx on public.muscles(body_region);

create index if not exists exercises_owner_id_idx on public.exercises(owner_id);
create index if not exists exercises_is_builtin_idx on public.exercises(is_builtin);
create index if not exists exercises_category_idx on public.exercises(category);
create index if not exists exercises_movement_pattern_idx on public.exercises(movement_pattern);
create index if not exists exercises_difficulty_idx on public.exercises(difficulty);
create index if not exists exercises_name_lower_idx on public.exercises(lower(name));
create index if not exists exercises_name_trgm_idx on public.exercises using gin (name gin_trgm_ops);

create index if not exists exercise_muscles_muscle_id_idx on public.exercise_muscles(muscle_id);
create index if not exists exercise_muscles_exercise_id_idx on public.exercise_muscles(exercise_id);
create index if not exists exercise_muscles_role_idx on public.exercise_muscles(role);

create index if not exists workout_templates_owner_id_idx on public.workout_templates(owner_id);
create index if not exists workout_templates_owner_name_idx on public.workout_templates(owner_id, name);
create index if not exists template_exercises_template_order_idx on public.template_exercises(template_id, sort_order);
create index if not exists template_exercises_exercise_id_idx on public.template_exercises(exercise_id);
create index if not exists template_sets_exercise_order_idx on public.template_sets(template_exercise_id, sort_order);

create index if not exists programs_public_idx on public.programs(is_public);
create index if not exists programs_owner_id_idx on public.programs(owner_id);
create index if not exists programs_difficulty_idx on public.programs(difficulty);
create index if not exists programs_days_per_week_idx on public.programs(days_per_week);
create index if not exists programs_name_lower_idx on public.programs(lower(name));
create index if not exists program_categories_program_id_idx on public.program_categories(program_id);
create index if not exists program_categories_category_idx on public.program_categories(category);
create index if not exists program_phases_program_id_idx on public.program_phases(program_id);
create index if not exists program_weeks_program_order_idx on public.program_weeks(program_id, week_number);
create index if not exists program_days_week_order_idx on public.program_days(program_week_id, day_number);
create index if not exists program_exercises_day_order_idx on public.program_exercises(program_day_id, sort_order);
create index if not exists program_exercises_exercise_id_idx on public.program_exercises(exercise_id);
create index if not exists program_sets_exercise_order_idx on public.program_sets(program_exercise_id, sort_order);

create index if not exists program_enrollments_user_status_idx on public.program_enrollments(user_id, status);
create index if not exists program_enrollments_program_id_idx on public.program_enrollments(program_id);

create index if not exists user_settings_active_program_enrollment_idx on public.user_settings(active_program_enrollment_id);

create index if not exists workouts_owner_status_idx on public.workouts(owner_id, status);
create index if not exists workouts_owner_started_idx on public.workouts(owner_id, started_at desc);
create index if not exists workouts_owner_finished_idx on public.workouts(owner_id, finished_at desc);
create index if not exists workouts_template_id_idx on public.workouts(template_id);
create index if not exists workouts_program_day_id_idx on public.workouts(program_day_id);
create index if not exists workouts_program_enrollment_id_idx on public.workouts(program_enrollment_id);

create index if not exists workout_exercises_workout_order_idx on public.workout_exercises(workout_id, sort_order);
create index if not exists workout_exercises_exercise_id_idx on public.workout_exercises(exercise_id);
create index if not exists workout_sets_exercise_order_idx on public.workout_sets(workout_exercise_id, sort_order);
create index if not exists workout_sets_completed_at_idx on public.workout_sets(completed_at);

create index if not exists bodyweight_logs_owner_date_idx on public.bodyweight_logs(owner_id, logged_on desc);
create index if not exists goals_owner_status_type_idx on public.goals(owner_id, status, type);
create index if not exists goals_exercise_id_idx on public.goals(exercise_id);
create index if not exists personal_records_owner_exercise_metric_idx on public.personal_records(owner_id, exercise_id, metric, achieved_at desc);
create index if not exists personal_records_workout_set_id_idx on public.personal_records(workout_set_id);
create index if not exists program_imports_owner_status_idx on public.program_imports(owner_id, status);
create index if not exists import_errors_import_row_idx on public.import_errors(import_id, row_number);
