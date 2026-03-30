---
title: Properties API
description: REST API endpoints for managing properties
---

## Overview

The Properties API lets you create, read, update, and delete properties programmatically. All endpoints require authentication via API key.

## List Properties

```
GET /api/v1/properties
```

Returns all properties the API key has access to. Supports pagination.

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `per_page` | integer | Results per page (default: 20, max: 100) |
| `status` | string | Filter by status: `active`, `inactive` |

## Get Property

```
GET /api/v1/properties/:id
```

Returns a single property by its UUID, including address, settings, and channel sync configuration.

## Create Property

```
POST /api/v1/properties
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Property name |
| `address` | object | yes | `street`, `city`, `postal_code`, `country` |
| `rnal_number` | string | no | Alojamento Local license number |
| `property_type` | string | yes | `apartment`, `house`, `room` |
| `bedrooms` | integer | yes | Number of bedrooms |
| `max_guests` | integer | yes | Maximum guest capacity |
| `timezone` | string | no | IANA timezone (default: `Europe/Lisbon`) |

## Update Property

```
PATCH /api/v1/properties/:id
```

Send only the fields you want to update. Same field definitions as Create.

## Delete Property

```
DELETE /api/v1/properties/:id
```

Soft-deletes the property. Existing reservations are preserved but the property is hidden from active views. Returns `204 No Content` on success.

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Validation error — check the `errors` array in the response body |
| `401` | Missing or invalid API key |
| `403` | API key does not have permission for this operation |
| `404` | Property not found |
| `429` | Rate limit exceeded |
