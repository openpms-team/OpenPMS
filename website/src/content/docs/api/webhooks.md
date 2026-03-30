---
title: Webhooks
description: Receive real-time notifications for events in your OpenPMS instance
---

## Overview

Webhooks let external systems receive real-time HTTP POST notifications when events occur in OpenPMS. Use them to trigger automations, sync with external tools, or build custom integrations.

## Setting Up a Webhook

1. Go to **Settings > Webhooks**
2. Click **Add Webhook**
3. Enter the endpoint URL (must be HTTPS)
4. Select which events to subscribe to
5. Save — OpenPMS sends a test ping to verify the endpoint

## Events

| Event | Trigger |
|-------|---------|
| `reservation.created` | A new reservation is created |
| `reservation.updated` | A reservation is modified |
| `reservation.cancelled` | A reservation is cancelled |
| `checkin.completed` | A guest completes the check-in process |
| `checkout.completed` | A guest is checked out |
| `task.created` | A new task is created |
| `task.completed` | A task is marked as done |
| `payment.received` | A payment is recorded |

## Payload Format

Each webhook sends a JSON payload:

```json
{
  "event": "reservation.created",
  "timestamp": "2026-03-29T14:30:00Z",
  "data": {
    "id": "uuid",
    "property_id": "uuid",
    "guest_name": "Maria Silva",
    "check_in": "2026-04-15",
    "check_out": "2026-04-18"
  }
}
```

## HMAC Signature Verification

Every webhook request includes an `X-OpenPMS-Signature` header containing an HMAC-SHA256 signature. Verify it using your webhook secret:

```
signature = HMAC-SHA256(webhook_secret, request_body)
```

Compare the computed signature with the header value to confirm the request came from your OpenPMS instance.

## Retry Policy

If your endpoint returns a non-2xx status code, OpenPMS retries with exponential backoff: 1 minute, 5 minutes, 30 minutes, 2 hours. After 4 failed attempts, the webhook is marked as failing and you receive an email notification.
