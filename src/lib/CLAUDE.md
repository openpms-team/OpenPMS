# src/lib — Business Logic

## Structure
- `supabase/` — client and server Supabase client factories
- `auth/` — authentication helpers, session management
- `validators/` — Zod schemas shared between client and server
- `utils/` — pure utility functions (cn, formatters, etc.)

## Rules
- No UI imports — this is logic only
- All database access through Supabase clients (never raw SQL in app code)
- Zod schemas are the source of truth for data shapes
- Export TypeScript types inferred from Zod schemas with `z.infer<>`
