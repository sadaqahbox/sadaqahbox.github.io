# Architecture Guide

This document describes the technical architecture of Sadaqah Box, including system design, technology choices, and key implementation details.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Data Flow](#data-flow)
5. [Authentication & Security](#authentication--security)
6. [Currency & Gold Conversion](#currency--gold-conversion)
7. [Progressive Web App](#progressive-web-app)
8. [Design Decisions](#design-decisions)

---

## System Overview

Sadaqah Box is a full-stack TypeScript application built on the Cloudflare Workers platform. It follows a modern edge-first architecture where the frontend and backend are deployed together as a single Worker.

### High-Level Architecture

```
                                    Cloudflare Edge
                                    Network
                              +-------------------+
                              |                   |
    User Request -----------> |  Cloudflare       |
                              |  Worker           |
                              |                   |
                              |  +-------------+  |
                              |  | Hono API    |  |
                              |  +-------------+  |
                              |        |          |
                              |  +-------------+  |
                              |  | React SPA   |  |
                              |  +-------------+  |
                              |        |          |
                              +--------+----------+
                                       |
                    +------------------+------------------+
                    |                  |                 |
              +-----+-----+     +------+------+   +------+------+
              | D1 Database|     | KV Namespace |   | External    |
              | (SQLite)   |     | (Auth Store) |   | APIs        |
              +------------+     +--------------+   +-------------+
                                                        |
                                                   Exchange Rates
                                                   Gold Prices
```

---

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 19.x |
| **TypeScript** | Type Safety | 5.9.x |
| **Vite** | Build Tool | 6.x |
| **Tailwind CSS** | Styling | 4.x |
| **Motion** | Animations | 12.x |
| **TanStack Query** | Data Fetching | 5.x |
| **React Router** | Routing | 7.x |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Hono** | Web Framework | 4.x |
| **Drizzle ORM** | Database ORM | 0.45.x |
| **Zod** | Validation | 4.x |
| **Better Auth** | Authentication | 1.4.x |

### Platform

| Technology | Purpose |
|------------|---------|
| **Cloudflare Workers** | Serverless Compute |
| **Cloudflare D1** | SQLite Database |
| **Cloudflare KV** | Key-Value Store |
| **Cloudflare Assets** | Static File Hosting |

### UI Components

| Library | Purpose |
|---------|---------|
| **shadcn/ui** | Component Library |
| **Radix UI** | Primitive Components |
| **Huge Icons** | Icon Library |
| **Lucide React** | Additional Icons |

---

## Application Architecture

### Backend Architecture (Hono API)

The backend follows a layered architecture pattern:

```
src/api/
+-- index.ts              # App entry point, middleware setup
+-- routes.ts             # Route registration
+-- endpoints/            # Route handlers (Controllers)
|   +-- boxes.ts
|   +-- sadaqahs.ts
|   +-- currencies.ts
|   +-- ...
+-- services/             # Business Logic Layer
|   +-- box-service.ts
|   +-- sadaqah-service.ts
|   +-- exchange-rate-service.ts
|   +-- ...
+-- repositories/         # Data Access Layer
|   +-- box.repository.ts
|   +-- sadaqah.repository.ts
|   +-- ...
+-- entities/             # Database Entity Layer
|   +-- box.ts
|   +-- sadaqah.ts
|   +-- ...
+-- middleware/           # Cross-cutting concerns
|   +-- auth.ts
|   +-- csrf.ts
|   +-- rate-limit.ts
|   +-- error-handler.ts
+-- schemas/              # Zod validation schemas
+-- domain/               # Domain types & constants
+-- shared/               # Utilities
```

#### Layer Responsibilities

1. **Endpoints (Controllers)** - Handle HTTP requests/responses, input validation
2. **Services** - Business logic, orchestration, error handling
3. **Repositories** - Data access, query building, caching
4. **Entities** - Low-level database operations, transactions
5. **Middleware** - Authentication, CSRF, rate limiting, logging

### Frontend Architecture (React)

The frontend follows a feature-based organization:

```
src/components/
+-- app/                  # App root, routing
+-- auth/                 # Authentication pages
+-- account/              # Account management
+-- boxes/                # Box management
+-- dashboard/            # Main dashboard
+-- landing/              # Landing page
+-- layout/               # Header, navigation, logo
+-- providers/            # Context providers
+-- sadaqah/              # Sadaqah tracking
+-- stats/                # Statistics display
+-- ui/                   # Reusable UI components
```

#### Key Patterns

- **React Query** for server state management
- **React Router** for client-side routing
- **Context Providers** for global state (theme, auth)
- **Composition** over inheritance for UI components

---

## Data Flow

### Adding a Sadaqah

```
User Input                    Frontend                      Backend                      Database
   |                            |                             |                            |
   +-- Enter amount --------->  |                             |                            |
   +-- Select currency ----->  |                             |                            |
   |                            +-- POST /api/boxes/:id/sadaqahs                           |
   |                            |                             +-- Validate input          |
   |                            |                             +-- Get currency rate        |
   |                            |                             +-- Calculate gold grams     |
   |                            |                             +-- Create sadaqah record -->|
   |                            |                             +-- Update box total ------->|
   |                            |<-- Return updated box ------+                            |
   |<-- Update UI -------------+                             |                            |
```

### Currency Rate Fetching

```
Exchange Rate Service
        |
        +-- Check cache (D1 currency_rate_attempt table)
        |
        +-- If cache expired or missing:
        |       |
        |       +-- Try API sources in order:
        |       |       1. Fawaz Ahmed Currency API
        |       |       2. Frankfurter API
        |       |       3. ExchangeRate-API
        |       |
        |       +-- Update cache with result
        |
        +-- Return USD value for currency
```

---

## Authentication & Security

### Authentication Flow

Sadaqah Box uses [Better Auth](https://better-auth.com/) with multiple authentication methods:

```
                    Authentication Methods
                            |
        +-------------------+-------------------+
        |                   |                   |
    Email/Password      Passkeys                |  
        |                   |                   |
        +-- D1 Database ----+-- WebAuthn -------+-- KV Store
        |                   |                   |
        +-- Sessions stored in KV Namespace ----+
```

### Security Features

1. **CSRF Protection** - Double-submit cookie pattern
2. **Rate Limiting** - Per-endpoint limits (100 req/min)
3. **Input Validation** - Zod schemas for all inputs
4. **SQL Injection Prevention** - Drizzle ORM parameterized queries
5. **XSS Prevention** - React auto-escaping
6. **Secure Cookies** - HttpOnly, SameSite=Lax

### Middleware Stack

```typescript
// Order matters - executed top to bottom
app.use("*", securityHeaders());      // Add security headers
app.use("*", requestLogger);          // Log requests
app.use("*", errorHandler);           // Handle errors
app.use("/api/auth/**", authCors);    // CORS for auth
app.use("/api/*", authMiddleware);    // Require authentication
app.use("/api/*", csrfMiddleware);    // Validate CSRF token
```

---

## Currency & Gold Conversion

### Why Gold?

Gold provides a stable, universal measure of value that:
- Is recognized across all cultures and times
- Maintains purchasing power over long periods
- Is mentioned in Islamic texts for nisab calculations

### Conversion Process

```typescript
// Step 1: Get currency USD value
const currencyUsdValue = currency.usdValue; // e.g., 1 TRY = 0.03 USD

// Step 2: Get gold (XAU) USD value
const xauUsdValue = xau.usdValue; // e.g., 1 XAU = 2000 USD

// Step 3: Calculate gold grams
const goldGrams = (amount * currencyUsdValue) / xauUsdValue;

// Example: 1000 TRY
// = (1000 * 0.03) / 2000
// = 30 / 2000
// = 0.015 XAU
// = 0.015 * 31.1035 (troy ounce to grams)
// = 0.467 grams of gold
```

### Exchange Rate Sources

| Currency Type | Primary Source | Fallback Sources |
|---------------|----------------|------------------|
| Fiat | Fawaz Ahmed API | Frankfurter, ExchangeRate-API |
| Crypto | CoinGecko | CryptoCompare |
| Gold (XAU) | Metals.live | GoldAPI.io |

Rate caching: 1 hour cooldown per currency to prevent API abuse.

---

## Progressive Web App

### PWA Features

1. **Service Worker** - Caches assets and API responses
2. **Web App Manifest** - Install on home screen
3. **Offline Support** - Basic functionality without network
4. **Background Sync** - Sync data when connection restored

### Caching Strategy

```javascript
// Runtime caching configuration
runtimeCaching: [
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: "CacheFirst",
    expiration: { maxAgeSeconds: 365 * 24 * 60 * 60 } // 1 year
  },
  {
    urlPattern: /^https:\/\/api\.sadaqahbox\.com\/api\/.*/i,
    handler: "NetworkFirst",
    expiration: { maxAgeSeconds: 5 * 60 } // 5 minutes
  }
]
```

---

## Design Decisions

### Why Cloudflare Workers?

- **Edge Performance** - Code runs close to users globally
- **Cost Efficiency** - Generous free tier, pay-per-request
- **Integrated Services** - D1, KV, and Workers in one platform
- **TypeScript Native** - First-class TypeScript support

### Why Hono over Express?

- **Lightweight** - Smaller bundle size for edge deployment
- **TypeScript First** - Better type inference
- **OpenAPI Support** - Built-in OpenAPI documentation
- **Modern API** - Cleaner, more intuitive API

### Why Drizzle ORM?

- **Type Safety** - Full TypeScript support with inference
- **SQL-like** - Familiar SQL syntax, not abstracted away
- **Performance** - Minimal overhead, optimized queries
- **Migrations** - Built-in migration tooling

### Why Better Auth?

- **Self-hosted** - No external auth service dependency
- **Multiple Methods** - Email, passkeys
- **Cloudflare Support** - Native D1 and KV adapters
- **OpenAPI Integration** - Auth endpoints documented

### Why Gold Grams for Tracking?

- **Islamic Context** - Gold is used for nisab calculations
- **Stability** - Less volatile than fiat currencies
- **Universality** - Recognized value across all times
- **Consistency** - Single unit for all comparisons

---

## Performance Considerations

### Frontend Optimization

- **Code Splitting** - Route-based lazy loading
- **Virtual Lists** - Efficient rendering of large lists
- **Memoization** - React.memo for expensive components
- **Bundle Size** - Tree-shaking, minimal dependencies

### Backend Optimization

- **Edge Caching** - Static assets cached at edge
- **Query Optimization** - Indexed columns, efficient joins
- **Batch Operations** - Single queries for multiple records
- **Connection Pooling** - D1 handles connection management

### Database Optimization

- **Indexes** - Strategic indexes on query columns
- **Composite Indexes** - Multi-column indexes for common queries
- **Relations** - Drizzle relations for N+1 prevention

---

## Scalability

### Current Limits

- **Workers** - 10ms CPU time per request (free), 50ms (paid)
- **D1** - 500MB max database size (free), 5GB (paid)
- **KV** - 100k reads/day (free), unlimited (paid)

### Scaling Strategy

1. **Read Replicas** - D1 supports read replication
2. **Caching** - KV for session and rate caching
3. **Sharding** - User-based sharding if needed
4. **External Services** - Move heavy operations to external APIs

---

## Monitoring & Observability

### Built-in Observability

```jsonc
// wrangler.jsonc
{
  "observability": {
    "enabled": true
  }
}
```

### Logging

- **Request Logger** - Logs all API requests
- **Error Tracking** - Structured error logging
- **Performance** - Request duration tracking

### Future Improvements

- [ ] Sentry integration for error tracking
- [ ] Analytics for user behavior
- [ ] Performance monitoring dashboard

---

## See Also

- [API Reference](API.md) - REST API documentation
- [Database Schema](DATABASE.md) - Database models
- [Development Guide](DEVELOPMENT.md) - Local setup
- [Deployment Guide](DEPLOYMENT.md) - Production deployment