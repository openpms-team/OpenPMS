---
title: Messaging
description: Automated guest communication across multiple channels
---

## Overview

OpenPMS handles guest communication through templated messages sent via email, SMS, or WhatsApp. Messages can be triggered automatically at key moments in the booking lifecycle or sent manually.

## Message Templates

Create reusable templates with dynamic variables:

- `{{guest_name}}` — Guest's first name
- `{{property_name}}` — Property name
- `{{check_in_date}}` — Arrival date (formatted)
- `{{check_in_link}}` — Unique check-in portal URL
- `{{access_code}}` — Door code or lockbox combination
- `{{wifi_password}}` — WiFi credentials

Templates support multiple languages. The system selects the template matching the guest's preferred language, falling back to the property's default.

## Automatic Triggers

Configure messages to send automatically based on events:

| Trigger | Typical Use |
|---------|------------|
| Reservation confirmed | Booking confirmation with details |
| 3 days before check-in | Check-in link and instructions |
| 1 day before check-in | Reminder with access details |
| Check-in completed | Welcome message |
| Check-out day morning | Checkout instructions and review request |

Triggers are configurable per property. Set the timing (days/hours before or after the event) and the template to use.

## Channels

- **Email** — Sent via your configured SMTP or transactional email provider
- **SMS** — Via Twilio integration (requires Twilio account)
- **WhatsApp** — Via Twilio WhatsApp Business API

## Message Log

Every sent message is logged with delivery status, timestamp, and channel. View the full conversation history per guest or per reservation.
