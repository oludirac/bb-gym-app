create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  preferred_unit public.unit_preference;
begin
  preferred_unit := case
    when new.raw_user_meta_data->>'unit_preference' = 'lb' then 'lb'::public.unit_preference
    else 'kg'::public.unit_preference
  end;

  insert into public.profiles (id, display_name, unit_preference)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', new.email),
    preferred_unit
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
