---
title: Introduction
description: What is OpenPMS and who is it for
---

## What is OpenPMS?

OpenPMS is a free, open-source Property Management System designed for short-term rental managers. It was built specifically for **Alojamento Local** (licensed short-term rentals) in Portugal, but the feature set applies globally to any vacation rental operation.

Each manager deploys their own instance. There is no shared server, no SaaS subscription, and no per-booking fees. You own your data completely.

## Who is it for?

- **Independent hosts** managing 1-50 properties on platforms like Airbnb, Booking.com, or direct bookings
- **Small property management companies** that need professional tools without enterprise pricing
- **Managers in Portugal** who need SEF/SIBA compliance built in
- **Tech-savvy operators** who want full control over their stack

## Key Features

- **Reservations** — Full CRUD with calendar view, status workflow, and channel sync via iCal
- **Guest Check-In** — Mobile self-check-in wizard with document OCR and SEF compliance
- **Messaging** — Templated messages with automatic triggers across email, SMS, and WhatsApp
- **Task Management** — Kanban boards with auto-generated cleaning tasks and mobile checklists
- **Finance** — Income/expense tracking, owner statements, tourist tax calculation
- **Analytics** — KPI dashboard, property comparison, and AI-powered BI chat
- **AI Suite** — 8 AI features including smart pricing, review responses, and listing optimization

## Architecture

OpenPMS runs on a modern, cost-efficient stack:

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend + API | Next.js 15 (App Router) on Vercel | Free tier |
| Database + Auth | Supabase (PostgreSQL + Auth + Storage) | Free tier |
| AI Features | OpenAI / Anthropic (BYOK) | Pay-per-use |
| Language | TypeScript (strict mode) | — |
| UI | Tailwind CSS + shadcn/ui | — |

All data stays in your Supabase instance. Row Level Security enforces access control at the database level. Sensitive data like API keys and document scans are encrypted with pgcrypto.
