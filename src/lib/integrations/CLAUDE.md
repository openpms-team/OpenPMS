# src/lib/integrations — External Service Integrations

## How to Add a New Integration
1. Create a folder: `src/lib/integrations/[service-name]/`
2. Add `client.ts` — API client with typed methods
3. Add `types.ts` — Request/response types
4. Add `schemas.ts` — Zod validation for API payloads
5. Add `__tests__/` — Unit tests mocking external calls
6. Store API keys in Supabase encrypted columns, never env vars per-user

## Existing Integrations (planned)
- `sef/` — SEF/SIBA compliance reporting
- `moloni/` — Invoice generation
- `invoicexpress/` — Invoice generation (alternative)
- `pricelabs/` — Dynamic pricing
- `beyond/` — Dynamic pricing (alternative)
