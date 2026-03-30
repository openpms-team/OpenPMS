---
title: iCal Sync
description: Import and export calendar feeds from booking channels
---

## Overview

OpenPMS syncs reservations with external booking platforms (Airbnb, Booking.com, Vrbo, and others) using the iCal standard. This prevents double bookings when you list on multiple channels.

## Importing Feeds

### Setup

1. Go to the property's settings page
2. Under **Channel Sync**, click **Add iCal Feed**
3. Paste the iCal URL from your booking platform
4. Label the feed (e.g., "Airbnb", "Booking.com")
5. Save — the system imports existing reservations immediately

### Where to find iCal URLs

- **Airbnb** — Listing > Availability > Connect a calendar > Export calendar
- **Booking.com** — Property > Rates & Availability > Sync calendars
- **Vrbo** — Calendar > Import/Export > Export

### Sync Frequency

Feeds are refreshed automatically every **15 minutes**. You can also trigger a manual sync from the property settings page.

## Exporting Feeds

OpenPMS generates a unique iCal feed URL for each property. Add this URL to your booking platforms to block dates when you receive direct bookings or bookings from other channels.

Find your export URL under the property's **Channel Sync** settings.

## Conflict Detection

When an imported event overlaps with an existing reservation, the system flags it as a conflict. Conflicts appear in a dedicated view and trigger a notification to the property manager.

Resolution options:

- Keep the existing reservation and ignore the import
- Cancel the existing reservation in favor of the import
- Mark as intentional overlap (e.g., same guest extending stay)

## Limitations

iCal is a one-way, poll-based protocol. It does not support real-time updates or guest details. For full channel management with pricing and availability sync, a channel manager integration is planned for a future release.
