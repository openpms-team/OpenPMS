---
title: Reservations
description: Manage bookings with calendar view and status workflow
---

## Overview

The reservations module is the core of OpenPMS. It handles the full booking lifecycle from creation to checkout, with a visual calendar and automated status transitions.

## Creating Reservations

Create reservations manually or import them via iCal sync. Each reservation includes:

- Guest name and contact details
- Property and room assignment
- Check-in and check-out dates
- Number of guests (adults + children)
- Pricing (nightly rate, cleaning fee, tourist tax)
- Source channel (direct, Airbnb, Booking.com, other)
- Internal notes

## Status Workflow

Reservations follow a defined status flow:

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting confirmation |
| `confirmed` | Booking confirmed, awaiting arrival |
| `checked_in` | Guest has arrived and checked in |
| `checked_out` | Guest has departed |
| `cancelled` | Booking was cancelled |
| `no_show` | Guest did not arrive |

Status transitions trigger automated actions: messaging templates, task generation, and compliance submissions.

## Calendar View

The calendar displays all reservations across properties in a timeline view. Color-coded by status. Drag-and-drop to adjust dates. Click any reservation to open its detail panel.

Filters available: property, status, source channel, date range.

## Quick Actions

From the reservation list or calendar, you can:

- Send a message to the guest
- Generate the check-in link
- View or submit SEF bulletin
- Create manual tasks
- Record payments
