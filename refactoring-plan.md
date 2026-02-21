# SadaqahBox Refactoring Plan

Comprehensive analysis and improvement roadmap for the SadaqahBox project.

**Last Updated:** 2026-02-10  
**Analysis By:** Architect Mode

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Critical Issues (Priority 1)](#critical-issues-priority-1)
3. [High-Priority Improvements](#high-priority-improvements)
4. [Medium-Priority Improvements](#medium-priority-improvements)
5. [Low-Priority Improvements](#low-priority-improvements)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Detailed Action Items](#detailed-action-items)

---

## Project Overview

### Tech Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend:** Hono, Cloudflare Workers, OpenAPI/Zod
- **Database:** Cloudflare D1 (SQLite), Drizzle ORM
- **Auth:** better-auth with passkey support
- **Build:** Vite 6, Bun

### Architecture
Clean layered architecture with clear separation:
- `src/api/entities/` - Database access layer
- `src/api/endpoints/` - HTTP route handlers
- `src/api/domain/` - Pure TypeScript types and Zod schemas
- `src/api/shared/` - Utilities (CRUD factory, route builder, validators)
- `src/components/` - React UI components
- `src/lib/` - Shared client-side utilities

---

## Critical Issues (Priority 1)

### 1. Type Safety Issues

#### Problem
TypeScript configuration is not strict enough, allowing runtime errors to slip through.

**Files Affected:**
- `tsconfig.json` - `noImplicitAny: false`, `strictNullChecks: false`
- `src/api/entities/base-entity.ts` - Uses `any` for table operations (lines 35, 44, 57, 72)
- `src/api/shared/transaction.ts` - `any` types in batch builder
- 65+ instances of `any` throughout codebase

**Impact:**
- Loss of type safety guarantees
- Runtime errors that could be caught at compile time
- Poor IDE support and autocomplete

**Solution:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 2. Security Vulnerabilities

#### Problem A: Hardcoded API URL
**Location:** `src/lib/auth/client.ts:4`
```typescript
export const authClient = createAuthClient({
  baseURL: "http://localhost:5173/api/auth", // ❌ Hardcoded
});
```

#### Problem B: Manual Cookie Parsing
**Location:** `src/api/middleware/auth.ts:31-43`
The middleware manually parses cookies and verifies sessions instead of using better-auth's built-in verification.

#### Problem C: Missing Security Headers
No CSP, HSTS, X-Frame-Options, or X-Content-Type-Options headers.

### 3. Tight Coupling

#### Problem: API Client Depends on UI
**Location:** `src/api/client/client.ts:1,27`
```typescript
import { toast } from "sonner"; // ❌ UI dependency in API layer

function handleError(error: unknown, defaultMessage: string): never {
  const message = error instanceof Error ? error.message : defaultMessage;
  toast.error(message); // ❌ Direct UI call
  throw error;
}
```

---

## High-Priority Improvements

### 4. Frontend Architecture

#### Problem A: Monolithic Components
- `Dashboard.tsx` - 390 lines
- `BoxList.tsx` - 322 lines
- `BoxDetail.tsx` - Large component with mixed concerns

#### Problem B: Animation Variant Duplication
Animation variants are defined inline in multiple components, making them hard to maintain and inconsistent.

#### Problem C: Prop Drilling
Box and sadaqah data is passed through multiple component layers instead of using context or state management.

#### Problem D: No Server State Management
All data fetching is manual with `useEffect`, no caching, no optimistic updates.

### 5. Database Layer Issues

#### Problem A: N+1 Queries
**Location:** `src/api/entities/box.ts:96-99`
```typescript
const [allCurrencies, allTags, relations] = await Promise.all([
  new CurrencyEntity(this.db).list(),  // ❌ Loads ALL currencies
  new TagEntity(this.db).list(),       // ❌ Loads ALL tags
  this.db.select().from(boxTags),
]);
```

#### Problem B: No Pagination
`BaseEntity.list()` returns all records without pagination support.

#### Problem C: Unsafe Transactions
`dbBatch` uses `any` casting and doesn't properly type queries.

### 6. Missing Testing Infrastructure

- No unit tests (Vitest/Jest)
- No integration tests
- No API mocking (MSW)
- No E2E tests

---

## Medium-Priority Improvements

### 7. API Layer Enhancements

- No retry logic for transient failures
- No request deduplication
- No response caching
- Duplicate schema definitions between `client/schemas.ts` and `domain/schemas.ts`

### 8. Developer Experience

- No pre-commit hooks
- ESLint doesn't forbid `any` types
- No type-safe environment variables
- Unused dependencies in package.json

### 9. Performance

- No API response caching with Cloudflare Cache API
- No virtual scrolling for large lists
- No service worker for offline support
- No request batching

---

## Low-Priority Improvements

### 10. Architecture Patterns

- Repository pattern abstraction over entities
- Unit of Work pattern for complex transactions
- CQRS consideration for read-heavy operations
- Proper DTOs separate from domain types

### 11. Monitoring & Observability

- Structured logging with correlation IDs
- Error tracking (Sentry)
- Performance metrics
- Health check endpoint with dependency status

### 12. Code Organization

- `types/index.ts` should be domain-specific
- Standardize file naming (kebab-case vs camelCase)

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. Enable strict TypeScript
2. Fix critical type safety issues
3. Remove `any` types from core files
4. Fix hardcoded API URLs

### Phase 2: Security (Week 1-2)
1. Implement proper auth middleware using better-auth
2. Add security headers
3. Add rate limiting
4. CSRF protection

### Phase 3: Architecture (Week 2-3)
1. Decouple API client from UI
2. Add state management (Zustand)
3. Add React Query for server state
4. Extract animation variants

### Phase 4: Components (Week 3-4)
1. Split Dashboard component
2. Split BoxList component
3. Create custom hooks for data fetching
4. Component testing

### Phase 5: Testing (Week 4-5)
1. Set up Vitest
2. Add unit tests for entities
3. Add API integration tests
4. Add component tests

### Phase 6: Performance (Week 5-6)
1. Implement API caching
2. Add virtual scrolling
3. Optimize database queries
4. Add performance monitoring

---

## Detailed Action Items

### Code Quality & Type Safety

- [ ] Enable strict TypeScript options: set `noImplicitAny: true` and `strictNullChecks: true`
- [ ] Remove `any` types from `BaseEntity` class and use Drizzle's typed table definitions
- [ ] Type-safe `dbBatch` utility - replace `any` with generic query types
- [ ] Add proper type guards for `unknown` types in API client and validators

### API Layer Improvements

- [ ] Decouple API client from UI - remove `sonner` toast dependency from `client.ts`
- [ ] Add API retry logic with exponential backoff for transient failures
- [ ] Implement request deduplication/caching layer
- [ ] Create proper error classes instead of throwing generic Errors
- [ ] Fix hardcoded API URL in `auth/client.ts` (currently `localhost:5173`)

### Authentication & Security

- [ ] Use better-auth's built-in session verification instead of manual cookie parsing
- [ ] Add rate limiting middleware for auth routes
- [ ] Implement CSRF protection for state-changing operations
- [ ] Add security headers middleware (CSP, HSTS, X-Frame-Options)

### Database & Entity Layer

- [ ] Use Drizzle's relational queries for complex entity relationships
- [ ] Add pagination support to `BaseEntity.list()`
- [ ] Implement database connection pooling for Cloudflare D1
- [ ] Add database query performance monitoring/logging
- [ ] Create proper transaction wrapper with rollback support

### Frontend Architecture

- [ ] Split large components: break `Dashboard.tsx` (390 lines) into smaller sub-components
- [ ] Extract animation variants to shared constants file
- [ ] Implement proper state management (Zustand/Jotai) instead of prop drilling
- [ ] Add React Query/TanStack Query for server state management with caching
- [ ] Create custom hooks for data fetching logic

### Testing Infrastructure

- [ ] Add Vitest for unit testing
- [ ] Set up MSW (Mock Service Worker) for API mocking
- [ ] Create test utilities for Drizzle ORM (in-memory SQLite)
- [ ] Add integration tests for critical user flows

### Performance Optimizations

- [ ] Implement API response caching with Cache API for Cloudflare
- [ ] Add request batching for multiple simultaneous API calls
- [ ] Optimize database queries with proper indexing review
- [ ] Implement virtual scrolling for large lists
- [ ] Add service worker for offline support

### Developer Experience

- [ ] Add ESLint rule to forbid `any` types
- [ ] Set up pre-commit hooks with lint-staged
- [ ] Add type-safe environment variable validation
- [ ] Create API endpoint documentation generation script
- [ ] Add performance budgets to build process

### Architecture Patterns

- [ ] Implement Repository pattern for data access layer
- [ ] Add Unit of Work pattern for complex transactions
- [ ] Create CQRS separation for read/write operations if needed
- [ ] Implement proper DTOs for API responses (separate from domain types)

### Monitoring & Observability

- [ ] Add structured logging with request correlation IDs
- [ ] Implement error tracking (Sentry integration)
- [ ] Add performance metrics collection
- [ ] Create health check endpoint with dependency status

### Code Organization

- [ ] Move `types/index.ts` to proper domain-specific locations
- [ ] Consolidate duplicate schema definitions (client/schemas.ts vs domain/schemas.ts)
- [ ] Remove unused dependencies (check package.json for orphans)
- [ ] Standardize file naming conventions

---

## Code Examples

### Before: Unsafe BaseEntity
```typescript
// src/api/entities/base-entity.ts
export class BaseEntity<T extends BaseEntityOptions, CreateInput> {
    constructor(
        protected db: Database,
        protected table: any,  // ❌ any type
        protected idColumn: string = "id"
    ) {}

    async get(id: string): Promise<T | null> {
        const result: any[] = await this.db  // ❌ any type
            .select()
            .from(this.table)
            .where(eq(this.table[this.idColumn], id))
            .limit(1);
        return result[0] as T | null;
    }
}
```

### After: Type-Safe BaseEntity
```typescript
// src/api/entities/base-entity.ts
import type { SQLiteTable, TableConfig } from "drizzle-orm/sqlite-core";

export class BaseEntity<
    T extends BaseEntityOptions,
    CreateInput,
    TTable extends SQLiteTable<TableConfig>
> {
    constructor(
        protected db: Database,
        protected table: TTable,
        protected idColumn: keyof TTable & string = "id"
    ) {}

    async get(id: string): Promise<T | null> {
        const result = await this.db
            .select()
            .from(this.table)
            .where(eq(this.table[this.idColumn], id))
            .limit(1);
        return result[0] ?? null;
    }
}
```

### Before: Coupled API Client
```typescript
// src/api/client/client.ts
import { toast } from "sonner";

function handleError(error: unknown, defaultMessage: string): never {
    const message = error instanceof Error ? error.message : defaultMessage;
    toast.error(message);  // ❌ Direct UI call
    throw error;
}
```

### After: Decoupled API Client
```typescript
// src/api/client/client.ts
export class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// UI layer handles toast
// src/components/hooks/useApi.ts
import { toast } from "sonner";

export function useApi() {
    const handleError = (error: ApiError) => {
        toast.error(error.message);
    };
    // ...
}
```

---

## Metrics

| Category | Issues Found | Priority |
|----------|-------------|----------|
| Type Safety | 4 | Critical |
| Security | 4 | Critical |
| Coupling | 2 | Critical |
| Frontend | 5 | High |
| Database | 5 | High |
| Testing | 4 | High |
| API Layer | 5 | Medium |
| DX | 5 | Medium |
| Performance | 5 | Medium |
| Architecture | 4 | Low |
| Observability | 4 | Low |
| Organization | 4 | Low |

**Total: 49 improvement opportunities**

---

## Next Steps

1. Review this plan with the team
2. Prioritize based on business needs
3. Create tickets for Phase 1 items
4. Switch to Code mode to begin implementation
