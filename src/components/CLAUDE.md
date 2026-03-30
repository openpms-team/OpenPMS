# src/components — Component Conventions

## Structure
- `ui/` — shadcn/ui primitives (auto-generated, avoid manual edits)
- `layout/` — shared layout components (Sidebar, Header, MobileNav)
- `[feature]/` — feature-specific components (e.g., `properties/PropertyCard.tsx`)

## Rules
- One component per file, named export matching filename
- Client Components only when interactivity is needed (`'use client'` directive)
- All visible text via `useTranslations()`
- Props validated with TypeScript interfaces (no `any`)
- Colocate tests in `__tests__/` subdirectory
