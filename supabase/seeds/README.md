# Seed Strategy

The MVP seed file is `supabase/seed.sql`.

It is intentionally small and idempotent:

- foundational muscles and muscle groups
- a starter built-in exercise set
- exercise-to-muscle mappings
- one public starter program

Grow the exercise library in batches with stable slugs. Avoid hardcoding generated UUIDs in seed data; prefer slugs and lookups so seeds can be re-run safely.

For hosted Supabase, apply seed data deliberately after schema/RLS migrations are verified.
