---
title: Deploy
description: Step-by-step guide to deploy your own OpenPMS instance
---

## Prerequisites

- A GitHub account
- A Supabase account (free tier works)
- A Vercel account (free tier works)

## Step 1: Fork the Repository

Go to [github.com/openpms/openpms](https://github.com/openpms/openpms) and click **Fork**. This creates your own copy of the codebase.

## Step 2: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a strong database password and save it somewhere safe
3. Select the region closest to your properties (e.g., `eu-west-1` for Portugal)
4. Wait for the project to finish provisioning

## Step 3: Run Database Migrations

1. Install the Supabase CLI: `npm install -g supabase`
2. Clone your forked repo locally
3. Link to your project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Run migrations: `supabase db push`

This creates all tables, RLS policies, functions, and seed data.

## Step 4: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your forked repo
2. Set the framework preset to **Next.js**
3. Add the following environment variables:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API |
| `ENCRYPTION_KEY` | Generate with `openssl rand -hex 32` |

4. Click **Deploy**

## Step 5: Verify

Open your Vercel deployment URL. You should see the login screen. Proceed to [First Setup](/getting-started/first-setup/) to configure your instance.

## Updating

When the main OpenPMS repo releases updates, sync your fork and Vercel will automatically redeploy. Run `supabase db push` if there are new migrations.
