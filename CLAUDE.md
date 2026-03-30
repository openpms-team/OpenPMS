# CLAUDE.md — OpenPMS Master Context

## What is this project?
OpenPMS is a free, open-source Property Management System for short-term rental (Alojamento Local) managers. Each manager deploys their own instance on Vercel + Supabase at zero cost.

## Stack
- **Framework:** Next.js 15 (App Router), TypeScript strict
- **Database:** Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime)
- **UI:** Tailwind CSS + shadcn/ui (zinc theme customized)
- **i18n:** next-intl (PT default, EN, FR)
- **Validation:** Zod (shared client/server)
- **Testing:** Vitest + Testing Library + Playwright
- **Charts:** Recharts
- **PDF:** @react-pdf/renderer
- **Fonts:** Geist Sans + Geist Mono

## Critical Rules
1. **NEVER hardcode strings** — Every user-visible string uses `useTranslations('namespace')`. Add keys to `pt.json` first, then `en.json` and `fr.json`.
2. **NEVER store secrets in code** — All API keys go in env vars or encrypted in Supabase.
3. **ALWAYS validate with Zod** — Every form input, API payload, and database write must be validated.
4. **ALWAYS use RLS** — Every Supabase query goes through Row Level Security policies.
5. **NEVER use `any`** — TypeScript strict mode, no escape hatches.
6. **ALWAYS write tests** — Every function, hook, and API route has unit tests. Critical flows have E2E tests.
7. **ALWAYS handle errors** — try/catch with user-friendly error messages (translated). Never show raw errors.
8. **Use Server Components by default** — Client Components only when needed (interactivity, hooks).
9. **Encrypt sensitive data** — API keys, document scans, TOTP secrets use pgcrypto.
10. **Mobile-first** — All layouts responsive, guest portal optimized for phones.
11. **NEVER exceed 600 lines per file** — If a file approaches 600 lines, split it into smaller modules. No exceptions.

## Design Tokens (CSS Variables)
```css
--brand-500: #2563eb;   --brand-600: #1d4ed8;   --brand-700: #1e40af;
--surface: #ffffff;      --background: #f8fafc;   --muted: #f1f5f9;
--border: #e2e8f0;       --text: #0f172a;         --text-muted: #64748b;
--success: #16a34a;      --warning: #d97706;      --danger: #dc2626;
```

## i18n Namespaces
common, auth, nav, properties, reservations, calendar, guests, checkin, guestPortal, messages, tasks, team, finance, pricing, owners, analytics, settings, errors, notifications, ai

## Database Naming Conventions
- Tables: snake_case plural (properties, reservations, guests)
- Columns: snake_case (check_in, guest_name, created_at)
- Enums: lowercase (confirmed, cancelled, checked_in)
- Foreign keys: singular_table_id (property_id, reservation_id)
- All tables have: id (uuid PK), created_at (timestamptz default now())

## File Organization
- Pages: `src/app/(dashboard)/[feature]/page.tsx`
- Components: `src/components/[feature]/[Component].tsx`
- Logic/hooks: `src/lib/[module]/` and `src/hooks/`
- Tests: colocated as `__tests__/[file].test.ts` or `[file].test.tsx`
- Translations: `src/messages/{pt,en,fr}.json`
- Supabase migrations: `supabase/migrations/NNN_description.sql`

## Auth Roles
admin (full access), manager (all except system config), receptionist (reservations, checkin, messages), cleaner (assigned tasks only), owner (read-only portal)

## Environment Variables Required
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ENCRYPTION_KEY (for pgcrypto)
