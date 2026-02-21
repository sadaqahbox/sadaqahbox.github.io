# Development Guide

This guide covers local development setup, workflows, and best practices for contributing to Sadaqah Box.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Database Development](#database-development)
6. [Authentication Development](#authentication-development)
7. [Testing](#testing)
8. [Code Style & Conventions](#code-style--conventions)
9. [Debugging](#debugging)
10. [Common Tasks](#common-tasks)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| [Bun](https://bun.sh/) | >= 1.0 | Runtime & package manager |
| [Node.js](https://nodejs.org/) | >= 18 | Some tooling compatibility |
| [Git](https://git-scm.com/) | Latest | Version control |

### Optional Tools

| Tool | Purpose |
|------|---------|
| [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) | Cloudflare Workers management |
| [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) | Database GUI |

### Cloudflare Account

For full functionality, you'll need:
- Cloudflare account (free tier works)
- D1 database created
- KV namespace created

---

## Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd sadaqahbox

# Install dependencies
bun install
```

### 2. Environment Setup

Create a `.dev.vars` file for local secrets:

```bash
# .dev.vars
GOLD_API_TOKEN=your_gold_api_token
COINGECKO_API_KEY=your_coingecko_key
CRYPTOCOMPARE_API_KEY=your_cryptocompare_key
```

### 3. Database Setup

```bash
# Generate migrations from schema
bun run db:generate

# Apply migrations locally
bun run migrate:local
```

### 4. Start Development Server

```bash
bun run dev
```

The app will be available at `http://localhost:5173`

### 5. Open Drizzle Studio (Optional)

```bash
bun run studio:dev
```

Opens a GUI to view and edit the local database.

---

## Project Structure

```
sadaqahbox/
├── src/
│   ├── api/                    # Backend API
│   │   ├── index.ts           # App entry point
│   │   ├── routes.ts          # Route registration
│   │   ├── endpoints/         # Route handlers
│   │   ├── services/          # Business logic
│   │   ├── repositories/      # Data access
│   │   ├── entities/          # Database operations
│   │   ├── middleware/        # Auth, CSRF, etc.
│   │   ├── schemas/           # Zod validation
│   │   ├── domain/            # Types & constants
│   │   ├── shared/            # Utilities
│   │   ├── config/            # Configuration
│   │   ├── dtos/              # Data transfer objects
│   │   ├── errors/            # Error classes
│   │   └── setup/             # Auth setup, CORS
│   │
│   ├── components/            # React components
│   │   ├── app/              # App root
│   │   ├── auth/             # Auth pages
│   │   ├── account/          # Account management
│   │   ├── boxes/            # Box management
│   │   ├── dashboard/        # Main dashboard
│   │   ├── landing/          # Landing page
│   │   ├── layout/           # Header, navigation
│   │   ├── providers/        # Context providers
│   │   ├── sadaqah/          # Sadaqah tracking
│   │   ├── stats/            # Statistics
│   │   └── ui/               # UI primitives
│   │
│   ├── db/                    # Database
│   │   ├── schema.ts         # Drizzle schema
│   │   ├── auth.schema.ts    # Auth tables
│   │   └── index.ts          # Database client
│   │
│   ├── auth/                  # Auth configuration
│   ├── hooks/                 # React hooks
│   ├── lib/                   # Utilities
│   ├── api-client/           # API client
│   │
│   ├── main.tsx              # React entry
│   └── index.css             # Global styles
│
├── migrations/                # Database migrations
├── public/                    # Static assets
├── scripts/                   # Build scripts
├── docs/                      # Documentation
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── wrangler.jsonc
└── drizzle.config.ts
```

---

## Development Workflow

### Branch Strategy

```
main
  └── develop
        ├── feature/new-feature
        ├── fix/bug-fix
        └── refactor/improvement
```

### Commit Convention

We use conventional commits:

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

### Development Commands

```bash
# Start dev server with hot reload
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Type check
bunx tsc --noEmit

# Lint (if configured)
bunx eslint src/
```

---

## Database Development

### Schema Changes

1. **Modify the schema** in `src/db/schema.ts`

2. **Generate migration**:
   ```bash
   bun run db:generate
   ```

3. **Review the generated SQL** in `migrations/`

4. **Apply locally**:
   ```bash
   bun run migrate:local
   ```

5. **Test the changes**

### Schema Example

```typescript
// src/db/schema.ts
export const boxes = sqliteTable(
  "box",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("box_user_id_idx").on(table.userId),
  ]
);
```

### Relations

Define relations for efficient querying:

```typescript
export const boxesRelations = relations(boxes, ({ one, many }) => ({
  owner: one(users, {
    fields: [boxes.userId],
    references: [users.id],
  }),
  sadaqahs: many(sadaqahs),
}));
```

### Query Patterns

```typescript
// Simple query
const box = await db.query.boxes.findFirst({
  where: eq(boxes.id, boxId),
});

// With relations
const boxWithSadaqahs = await db.query.boxes.findFirst({
  where: eq(boxes.id, boxId),
  with: {
    sadaqahs: {
      with: { currency: true },
      limit: 10,
    },
    currency: true,
  },
});

// Insert
const [newBox] = await db.insert(boxes).values({
  id: generateBoxId(),
  name: "New Box",
  userId: userId,
  createdAt: new Date(),
}).returning();

// Update
await db.update(boxes)
  .set({ name: "Updated Name" })
  .where(eq(boxes.id, boxId));

// Delete
await db.delete(boxes).where(eq(boxes.id, boxId));
```

---

## Authentication Development

### Auth Configuration

Auth is configured in `src/auth/index.ts`:

```typescript
export function createAuth(env?: AuthEnv, cf?: IncomingRequestCfProperties) {
  return betterAuth({
    ...withCloudflare({
      d1: env ? { db, options: { usePlural: true } } : undefined,
      kv: env?.AUTH_KV,
    }, {
      emailAndPassword: { enabled: true },
      user: {
        additionalFields: {
          defaultBoxId: { type: "string", required: false },
          preferredCurrencyId: { type: "string", required: false },
        },
      },
      plugins: [
        admin(),
        passkey(),
        apiKey(),
      ],
    }),
  });
}
```

### Adding Custom Fields

1. **Add to auth config**:
   ```typescript
   user: {
     additionalFields: {
       myCustomField: {
         type: "string",
         required: false,
         input: true,
       },
     },
   },
   ```

2. **Regenerate auth schema**:
   ```bash
   bun run auth:generate
   bun run auth:format
   ```

3. **Generate and apply migration**:
   ```bash
   bun run db:generate
   bun run migrate:local
   ```

### Using Auth in Components

```tsx
import { useSession, SignedIn, SignedOut } from "@daveyplate/better-auth-ui";

function MyComponent() {
  const session = useSession();
  
  return (
    <>
      <SignedIn>
        <p>Welcome, {session.data?.user?.name}</p>
      </SignedIn>
      <SignedOut>
        <p>Please sign in</p>
      </SignedOut>
    </>
  );
}
```

### Using Auth in API

```typescript
import { getCurrentUser, requireAuth } from "../middleware";

// In route handler
export const myHandler = async (c: Context) => {
  const user = getCurrentUser(c);
  // user.id, user.email, etc.
};
```

---

## Testing

### Running Tests

```bash
# Run all tests
bun run test

# Run specific test file
bun test src/api/services/box-service.test.ts

# Run with coverage
bun run test:coverage

# Watch mode
bun test --watch
```

### Test Structure

```
src/
├── api/
│   └── services/
│       └── box-service.test.ts
└── lib/
    └── utils.test.ts
```

### Test Example

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { BoxService } from "./box-service";
import { createTestDb } from "@/test/helpers";

describe("BoxService", () => {
  let service: BoxService;
  let db: Database;

  beforeEach(() => {
    db = createTestDb();
    service = new BoxService(db);
  });

  it("should create a box", async () => {
    const box = await service.createBox({
      name: "Test Box",
      userId: "user_123",
    });

    expect(box.name).toBe("Test Box");
    expect(box.count).toBe(0);
  });
});
```

---

## Code Style & Conventions

### TypeScript

- **Strict mode** enabled
- **No implicit any** - explicit types required
- **Use interfaces** for object shapes
- **Use types** for unions, primitives

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `BoxList.tsx` |
| Functions | camelCase | `getBoxById()` |
| Constants | SCREAMING_SNAKE | `MAX_BOXES_PER_USER` |
| Files | kebab-case | `box-service.ts` |
| Types | PascalCase | `Box`, `CreateBoxInput` |

### File Organization

```typescript
// 1. Imports (grouped)
import { eq } from "drizzle-orm";           // External
import { db } from "@/db";                  // Internal
import { BoxSchema } from "./schemas";      // Relative

// 2. Types
interface CreateBoxInput { ... }

// 3. Constants
const MAX_NAME_LENGTH = 100;

// 4. Functions/Classes
export class BoxService { ... }

// 5. Exports (if not inline)
export { BoxService };
```

### React Components

```tsx
// Component structure
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface BoxCardProps {
  box: Box;
  onSelect?: (id: string) => void;
}

export function BoxCard({ box, onSelect }: BoxCardProps) {
  // Hooks at top
  const [isOpen, setIsOpen] = useState(false);
  
  // Handlers
  const handleClick = () => {
    onSelect?.(box.id);
  };
  
  // Render
  return (
    <div className="...">
      <h3>{box.name}</h3>
      <Button onClick={handleClick}>Select</Button>
    </div>
  );
}
```

### API Endpoints

```typescript
// Endpoint structure
import { z } from "@hono/zod-openapi";
import { buildRoute, jsonSuccess } from "../shared/route-builder";

// 1. Schemas
const CreateBoxSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

// 2. Route definition
export const createRoute = buildRoute({
  method: "post",
  path: "/api/boxes",
  body: CreateBoxSchema,
  responses: { 201: ... },
  requireAuth: true,
});

// 3. Handler
export const createHandler = async (c: Context) => {
  const body = c.req.valid("json");
  // ... business logic
  return jsonSuccess(c, { box }, 201);
};
```

---

## Debugging

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Dev Server",
      "runtime": "bun",
      "script": "dev",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

### Logging

```typescript
import { logger } from "@/api/shared/logger";

// In development
logger.debug("Processing request", { boxId, userId });
logger.info("Box created", { boxId });
logger.error("Failed to create box", error);
```

### Database Queries

Enable query logging in Drizzle:

```typescript
// In auth/index.ts or db/index.ts
const db = drizzle(env.DB, { 
  schema, 
  logger: process.env.NODE_ENV === "development" 
});
```

### Network Requests

Use browser DevTools:
1. Open Network tab
2. Filter by `/api/`
3. Inspect request/response payloads

---

## Common Tasks

### Add a New API Endpoint

1. Create endpoint file in `src/api/endpoints/`
2. Define Zod schemas for input/output
3. Create route definition with `buildRoute()`
4. Implement handler function
5. Register in `src/api/routes.ts`

### Add a New UI Component

1. Create component in appropriate folder under `src/components/`
2. Export from `index.ts` in that folder
3. Use in parent component

### Add a New Database Table

1. Add table definition in `src/db/schema.ts`
2. Define relations if needed
3. Run `bun run db:generate`
4. Review and apply migration

### Add a New Currency

1. Insert into `currencies` table via Drizzle Studio or migration
2. Ensure `currencyTypeId` is set correctly
3. Rate will be fetched automatically on first use

### Update Exchange Rate Sources

1. Modify `src/api/services/exchange-rate-service.ts`
2. Add new API function
3. Update the try order in `fetchRates()`

---

## Troubleshooting

### Common Issues

#### "D1 database not found"

```bash
# Create local D1 database
bunx wrangler d1 create sadaqahbox --local
```

#### "KV namespace not found"

```bash
# Create local KV namespace
bunx wrangler kv:namespace create AUTH_KV --local
```

#### "Module not found"

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lock
bun install
```

#### "Type errors after schema change"

```bash
# Regenerate types
bun run cf-typegen
```

### Getting Help

1. Check existing documentation in `docs/`
2. Review similar code in the codebase
3. Check Cloudflare Workers docs
4. Check Drizzle ORM docs

---

## See Also

- [Architecture Guide](ARCHITECTURE.md) - System design
- [API Reference](API.md) - REST endpoints
- [Database Schema](DATABASE.md) - Data models
- [Deployment Guide](DEPLOYMENT.md) - Production deployment