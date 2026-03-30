# OpenPMS

OpenPMS is a free, open-source Property Management System for short-term rental managers. Deploy your own instance on Vercel + Supabase at zero cost.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fopenpms-team%2FOpenPMS&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ENCRYPTION_KEY)

## Features

- **Properties** -- Manage multiple rental properties with photos, amenities, and details
- **Reservations** -- Full reservation lifecycle with status tracking and guest management
- **Calendar** -- Visual calendar with drag-and-drop and multi-property views
- **iCal & CSV Import** -- Sync with Airbnb, Booking.com, and other platforms via iCal feeds
- **Channel Bridges** -- Connect to OTAs for two-way availability sync
- **Guest Check-in** -- Mobile-first guest portal with document scanning (AI OCR)
- **SEF/SIBA Compliance** -- Automated Portuguese authority reporting via Web Service and .DAT files
- **Messaging & Automation** -- Templated messages with conditional workflow triggers
- **Team & Tasks** -- Staff management with role-based access and kanban task boards
- **Finance** -- Tourist tax engine, expense tracking, and invoice integration (Moloni, InvoiceXpress)
- **Dynamic Pricing** -- Integration with PriceLabs and Beyond Pricing
- **Owner Portal** -- Read-only owner access with PDF statements and earnings reports
- **Analytics** -- Business intelligence dashboard with occupancy, revenue, and performance charts
- **AI Features** -- OCR, concierge chatbot, BI chat, NL automation, review replies, listing optimization, smart alerts, auto-translation
- **REST API & Webhooks** -- Full API with OpenAPI documentation and webhook event system

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router), TypeScript strict |
| Database | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| UI | Tailwind CSS + shadcn/ui |
| i18n | next-intl (PT, EN, FR) |
| Validation | Zod |
| Testing | Vitest + Testing Library + Playwright |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| Fonts | Geist Sans + Geist Mono |

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/openpms-team/OpenPMS.git
cd OpenPMS
npm install
```

### 2. Configure environment

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_KEY=your-32-char-hex-key
```

### 3. Set up the database

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

Run unit tests:

```bash
npm run test
```

Run E2E tests (requires a running dev server):

```bash
npm run test:e2e
```

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full deployment instructions, or use the one-click Vercel deploy button above.

## Project Structure

```
src/
  app/              # Next.js App Router pages
  components/       # React components organized by feature
  lib/              # Business logic, utilities, Supabase client
  hooks/            # Custom React hooks
  messages/         # i18n translation files (pt.json, en.json, fr.json)
supabase/
  migrations/       # Database migration SQL files
tests/
  e2e/              # Playwright E2E tests
```

## Auth Roles

| Role | Access |
|------|--------|
| Admin | Full system access |
| Manager | All features except system configuration |
| Receptionist | Reservations, check-in, messages |
| Cleaner | Assigned tasks only |
| Owner | Read-only owner portal |

## i18n

OpenPMS supports three languages out of the box:

- **Portuguese** (default)
- **English**
- **French**

All user-facing strings are managed through next-intl. Translation files live in `src/messages/`.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Run `npm run test` and ensure all tests pass
5. Commit your changes: `git commit -m 'Add my feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Open a Pull Request

Please follow the existing code conventions:

- TypeScript strict mode, no `any`
- Zod validation on all inputs
- All strings through i18n (add to `pt.json` first)
- Server Components by default, Client Components only when needed
- Mobile-first responsive layouts

## Support

- Email: openpms@protonmail.com
- Issues: https://github.com/openpms-team/OpenPMS/issues

## License

MIT License. See [LICENSE](./LICENSE) for details.
