# Deploying OpenPMS

This guide walks you through deploying your own OpenPMS instance on Vercel + Supabase (free tier).

## Prerequisites

- Node.js 20+ installed
- A GitHub account
- A [Supabase](https://supabase.com) account (free)
- A [Vercel](https://vercel.com) account (free)
- Supabase CLI installed: `npm install -g supabase`

## Step 1: Fork the Repository

Fork this repository on GitHub to your own account:

```
https://github.com/YOUR_ORG/openpms → Fork
```

Then clone your fork locally:

```bash
git clone https://github.com/YOUR_USER/openpms.git
cd openpms
npm install
```

## Step 2: Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose a name, database password, and region (choose one close to your guests)
4. Wait for the project to be provisioned
5. Copy the following from **Settings > API**:
   - `Project URL` (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public` key (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` key (this is your `SUPABASE_SERVICE_ROLE_KEY`)

## Step 3: Run Database Migrations

Link your local project to Supabase and apply all migrations:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Alternatively, you can run the SQL files manually in the Supabase SQL Editor. Migrations are located in `supabase/migrations/` and should be executed in order.

## Step 4: Deploy to Vercel

### Option A: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_ORG%2Fopenpms&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ENCRYPTION_KEY)

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Required Environment Variables

Set these in Vercel > Project Settings > Environment Variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `ENCRYPTION_KEY` | 32-character key for pgcrypto encryption |

To generate an encryption key:

```bash
openssl rand -hex 16
```

## Step 5: Initial Setup

1. Visit `https://your-app.vercel.app/setup`
2. Create your admin account
3. Configure your first property
4. You are ready to manage reservations

## Custom Domain (Optional)

1. In Vercel, go to Project Settings > Domains
2. Add your custom domain (e.g., `pms.yourbusiness.com`)
3. Update DNS records as instructed by Vercel

## Troubleshooting

- **Migrations fail**: Ensure your Supabase project is on a supported Postgres version and that you linked the correct project.
- **Auth not working**: Verify that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly in Vercel.
- **RLS errors**: Make sure all migrations ran successfully. Check the Supabase SQL Editor for any failed statements.

## Updating

To update your instance after pulling new changes:

```bash
git pull origin main
supabase db push
vercel --prod
```
