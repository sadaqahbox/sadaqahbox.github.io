# API Reference

This document provides comprehensive documentation for the Sadaqah Box REST API.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Request/Response Format](#requestresponse-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Endpoints](#endpoints)
   - [Boxes](#boxes)
   - [Sadaqahs](#sadaqahs)
   - [Currencies](#currencies)
   - [Statistics](#statistics)
   - [Health](#health)
8. [OpenAPI Documentation](#openapi-documentation)

---

## Overview

The Sadaqah Box API is a RESTful API built with [Hono](https://hono.dev/) and deployed on Cloudflare Workers. It provides endpoints for managing charity boxes, tracking sadaqah contributions, and handling multi-currency conversions.

### Key Features

- **OpenAPI Documentation** - Interactive API docs at `/api/docs`
- **Type Safety** - Full TypeScript with Zod validation
- **Authentication Required** - Most endpoints require authentication
- **CSRF Protection** - All mutating operations require CSRF token

---

## Authentication

The API uses [Better Auth](https://better-auth.com/) for authentication. All requests (except public endpoints) must include a valid session cookie.

### Session Cookie

After successful authentication, a session cookie is set:

```
Cookie: sadaqahbox.session_token=<token>
```

### CSRF Token

For POST, PUT, PATCH, and DELETE requests, include the CSRF token:

```http
X-CSRF-Token: <token>
```

The CSRF token is returned in the response headers after authentication.

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-in/email` | POST | Sign in with email/password |
| `/api/auth/sign-up/email` | POST | Sign up with email/password |
| `/api/auth/sign-in/passkey` | POST | Sign in with passkey |
| `/api/auth/sign-out` | POST | Sign out |
| `/api/auth/session` | GET | Get current session |

---

## Base URL

```
Production: https://api.sadaqahbox.com
Development: http://localhost:5173
```

All API endpoints are prefixed with `/api`.

---

## Request/Response Format

### Request Headers

```http
Content-Type: application/json
Accept: application/json
Cookie: sadaqahbox.session_token=<token>
X-CSRF-Token: <token>  # Required for mutations
```

### Response Format

All responses follow a consistent format:

#### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }  // Optional additional details
  }
}
```

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "fields": {
        "name": "Name is required"
      }
    }
  }
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 100 requests | 60 seconds |
| API Endpoints | 100 requests | 60 seconds |

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

---

## Endpoints

### Boxes

Boxes are containers for organizing sadaqah contributions.

#### List Boxes

```http
GET /api/boxes
```

List all boxes for the authenticated user.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sortBy` | string | `createdAt` | Sort field (`name`, `createdAt`, `count`, `totalValue`) |
| `sortOrder` | string | `desc` | Sort direction (`asc`, `desc`) |

**Response:**

```json
{
  "success": true,
  "data": {
    "boxes": [
      {
        "id": "box_1704067200_abc123",
        "name": "Daily Sadaqah",
        "description": "My daily charity box",
        "count": 150,
        "totalValue": 2.5,
        "currencyId": "cur_279",
        "currency": {
          "id": "cur_279",
          "code": "USD",
          "name": "US Dollar",
          "symbol": "$"
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T12:30:00.000Z"
      }
    ],
    "summary": {
      "totalBoxes": 3,
      "totalCoins": 450,
      "totalValue": 7.5
    }
  }
}
```

---

#### Create Box

```http
POST /api/boxes
```

Create a new charity box.

**Request Body:**

```json
{
  "name": "Ramadan Sadaqah",
  "description": "Charity for Ramadan",
  "baseCurrencyId": "cur_279"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Box name (max 100 chars) |
| `description` | string | No | Box description (max 500 chars) |
| `baseCurrencyId` | string | No | Default currency ID |

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "box": {
      "id": "box_1704067200_xyz789",
      "name": "Ramadan Sadaqah",
      "description": "Charity for Ramadan",
      "count": 0,
      "totalValue": 0,
      "baseCurrencyId": "cur_279",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

#### Get Box

```http
GET /api/boxes/{boxId}
```

Get details of a specific box.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `boxId` | string | Box ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "box": {
      "id": "box_1704067200_abc123",
      "name": "Daily Sadaqah",
      "description": "My daily charity box",
      "count": 150,
      "totalValue": 2.5,
      "currency": { ... },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T12:30:00.000Z"
    }
  }
}
```

---

#### Update Box

```http
PUT /api/boxes/{boxId}
```

Update a box's properties.

**Request Body:**

```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Note:** `baseCurrencyId` can only be changed if the box has no sadaqahs.

---

#### Delete Box

```http
DELETE /api/boxes/{boxId}
```

Delete a box and all its sadaqahs.

**Response:**

```json
{
  "success": true,
  "data": {
    "deleted": true,
    "sadaqahsDeleted": 150,
    "collectionsDeleted": 2
  }
}
```

---

#### Empty Box (Create Collection)

```http
POST /api/boxes/{boxId}/collect
```

Empty a box, creating a collection record of the total value.

**Response:**

```json
{
  "success": true,
  "data": {
    "box": {
      "id": "box_...",
      "count": 0,
      "totalValue": 0
    },
    "collection": {
      "id": "col_...",
      "totalValue": 2.5,
      "currencyId": "cur_279",
      "emptiedAt": "2024-01-15T12:30:00.000Z",
      "metadata": {
        "conversions": [
          {
            "currencyId": "cur_try",
            "code": "TRY",
            "value": 750,
            "rate": 30
          }
        ]
      }
    }
  }
}
```

---

#### Get Box Collections

```http
GET /api/boxes/{boxId}/collections
```

Get collection history for a box.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |

---

#### Get Box Statistics

```http
GET /api/boxes/{boxId}/stats
```

Get statistics for a box.

**Response:**

```json
{
  "success": true,
  "data": {
    "firstSadaqahAt": "2024-01-01T00:00:00.000Z",
    "lastSadaqahAt": "2024-01-15T12:30:00.000Z",
    "totalSadaqahs": 150
  }
}
```

---

### Sadaqahs

Sadaqahs are individual charity contributions within a box.

#### List Sadaqahs

```http
GET /api/boxes/{boxId}/sadaqahs
```

List all sadaqahs in a box.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `from` | string | - | Filter from date (ISO 8601) |
| `to` | string | - | Filter to date (ISO 8601) |

**Response:**

```json
{
  "success": true,
  "data": {
    "sadaqahs": [
      {
        "id": "sadaqah_1704067200_abc123",
        "boxId": "box_...",
        "value": 10,
        "currencyId": "cur_279",
        "currency": {
          "id": "cur_279",
          "code": "USD",
          "name": "US Dollar",
          "symbol": "$"
        },
        "createdAt": "2024-01-15T12:30:00.000Z"
      }
    ],
    "total": 150,
    "summary": {
      "totalSadaqahs": 150,
      "totalValue": 1500,
      "currency": { ... }
    }
  }
}
```

---

#### Add Sadaqah

```http
POST /api/boxes/{boxId}/sadaqahs
```

Add a sadaqah contribution to a box.

**Request Body:**

```json
{
  "amount": 5,
  "value": 10,
  "currencyId": "cur_279"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `amount` | number | No | 1 | Number of contributions (max 1000) |
| `value` | number | No | 1 | Value per contribution |
| `currencyId` | string | No | User's preferred | Currency ID |

**Note:** Total value = `amount * value`

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "sadaqahs": [
      {
        "id": "sadaqah_...",
        "value": 50,
        "currencyId": "cur_279",
        "createdAt": "2024-01-15T12:30:00.000Z"
      }
    ],
    "box": {
      "id": "box_...",
      "count": 151,
      "totalValue": 2.52
    },
    "message": "Added 5 sadaqahs of $10.00 each (total: $50.00)"
  }
}
```

---

#### Delete Sadaqah

```http
DELETE /api/boxes/{boxId}/sadaqahs/{sadaqahId}
```

Delete a specific sadaqah.

**Response:**

```json
{
  "success": true,
  "data": {
    "deleted": true,
    "updatedBox": {
      "id": "box_...",
      "count": 149,
      "totalValue": 2.48
    }
  }
}
```

---

### Currencies

#### List Currencies

```http
GET /api/currencies
```

List all available currencies.

**Response:**

```json
{
  "success": true,
  "data": {
    "currencies": [
      {
        "id": "cur_279",
        "code": "USD",
        "name": "US Dollar",
        "symbol": "$",
        "currencyTypeId": "ctyp_fiat",
        "usdValue": 1.0,
        "lastRateUpdate": "2024-01-15T12:00:00.000Z"
      },
      {
        "id": "cur_xau",
        "code": "XAU",
        "name": "Gold",
        "symbol": "Au",
        "currencyTypeId": "ctyp_commodity",
        "usdValue": 2000.0
      }
    ]
  }
}
```

---

#### Get Currency

```http
GET /api/currencies/{currencyId}
```

Get details of a specific currency.

---

### Currency Types

#### List Currency Types

```http
GET /api/currency-types
```

List all currency types (Fiat, Crypto, Commodity).

---

### Statistics

#### Get User Statistics

```http
GET /api/stats
```

Get overall statistics for the authenticated user.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalBoxes": 3,
    "totalSadaqahs": 450,
    "totalValueGoldGrams": 7.5,
    "preferredCurrency": {
      "id": "cur_279",
      "code": "USD",
      "symbol": "$"
    },
    "totalValueInPreferredCurrency": 15000
  }
}
```

---

### Health

#### Health Check

```http
GET /api/health
```

Check API health status.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T12:30:00.000Z",
    "version": "1.0.0"
  }
}
```

---

## OpenAPI Documentation

Interactive API documentation is available at:

- **Swagger UI:** `/api/docs`
- **OpenAPI Spec:** `/api/open-api`

### Using the API Docs

1. Navigate to `/api/docs` in your browser
2. Click "Authorize" to set your session token
3. Explore and test endpoints directly in the browser

### OpenAPI Spec

The full OpenAPI specification is available at `/api/open-api` in JSON format. You can use this to:

- Generate client SDKs
- Import into API testing tools (Postman, Insomnia)
- Create automated tests

---

## Client SDK Example

### TypeScript/JavaScript

```typescript
// API Client Example
const API_BASE = '/api';

async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error.message);
  }
  
  return data.data;
}

// Usage
const boxes = await apiClient<{ boxes: Box[] }>('/boxes');
```

---

## See Also

- [Architecture Guide](ARCHITECTURE.md) - System design
- [Database Schema](DATABASE.md) - Data models
- [Development Guide](DEVELOPMENT.md) - Local setup