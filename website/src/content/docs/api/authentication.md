---
title: Authentication
description: API key management, rate limits, and auth headers
---

## Overview

The OpenPMS API uses API keys for authentication. Each key is scoped to a specific role and can be revoked independently.

## Creating API Keys

1. Go to **Settings > API Keys**
2. Click **Generate New Key**
3. Assign a label (e.g., "Channel Manager Integration")
4. Select the permission scope (read-only, read-write, or admin)
5. Copy the key immediately — it is only shown once

API keys are stored encrypted in the database using pgcrypto. The plaintext key is never stored.

## Using the API

Include your API key in the `Authorization` header:

```
Authorization: Bearer opms_live_xxxxxxxxxxxxxxxxxxxx
```

All API requests must be made over HTTPS. HTTP requests are rejected.

## Rate Limits

| Scope | Limit |
|-------|-------|
| Read endpoints | 100 requests/minute |
| Write endpoints | 30 requests/minute |
| Bulk operations | 10 requests/minute |

When a rate limit is exceeded, the API returns `429 Too Many Requests` with a `Retry-After` header indicating how many seconds to wait.

## Key Rotation

To rotate a key without downtime:

1. Generate a new key with the same scope
2. Update your integration to use the new key
3. Verify the integration works
4. Revoke the old key

## Revoking Keys

Go to **Settings > API Keys**, find the key, and click **Revoke**. The key stops working immediately. This action cannot be undone.
