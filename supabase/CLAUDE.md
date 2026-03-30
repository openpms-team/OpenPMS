# supabase — Database & Edge Functions

## Migrations
- Files: `supabase/migrations/NNN_description.sql` (sequential numbering)
- Always include RLS policies in the same migration that creates the table
- Use `pgcrypto` for encryption of sensitive fields
- All tables must have: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`

## Edge Functions
- Files: `supabase/functions/[function-name]/index.ts`
- Used for webhooks, scheduled jobs, and operations requiring service role

## Naming
- Tables: snake_case plural
- Columns: snake_case
- Enums: lowercase values
- Foreign keys: `singular_table_id`
