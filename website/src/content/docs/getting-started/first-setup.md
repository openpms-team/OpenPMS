---
title: First Setup
description: Configure your OpenPMS instance after deployment
---

## Setup Wizard

When you first open your deployed OpenPMS instance, you will be guided through a setup wizard. This configures the core settings for your operation.

### Step 1: Create Admin Account

Enter your email and password. This becomes the **admin** user with full system access. You can invite team members with different roles later.

### Step 2: Business Information

- **Business name** — displayed in guest communications and documents
- **Tax ID (NIF)** — required for Portuguese compliance (SEF/SIBA submissions)
- **Contact email and phone** — used in automated guest messages

### Step 3: Regional Settings

- **Timezone** — defaults to `Europe/Lisbon`, adjust if your properties are elsewhere
- **Currency** — defaults to EUR
- **Default language** — the language for the admin interface (PT, EN, or FR)

### Step 4: Add Your First Property

- Property name and address
- Alojamento Local license number (RNAL)
- Number of bedrooms, beds, and max guests
- Property type (apartment, house, room)

## After Setup

Once the wizard completes, you land on the dashboard. From there:

1. **Add more properties** under Properties > New Property
2. **Invite team members** under Settings > Team (assign roles: manager, receptionist, cleaner, owner)
3. **Connect channels** by importing iCal feeds under each property's settings
4. **Set up messaging** templates under Messages > Templates
5. **Configure AI features** by adding your API key under Settings > AI

All settings can be changed later from the Settings page.
