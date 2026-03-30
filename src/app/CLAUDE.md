# src/app — Routing & Layouts

## Conventions
- Route groups: `(auth)` for login/setup, `(dashboard)` for authenticated pages
- Each feature folder has a `page.tsx` (Server Component by default)
- Layouts: `layout.tsx` at group level handles shared chrome (sidebar, nav)
- Loading states: `loading.tsx` with skeleton components
- Error boundaries: `error.tsx` with translated error messages
- `guest/[token]` — public guest portal (no auth required)
- `owner/` — owner read-only portal (owner role auth)
