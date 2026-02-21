# Database Schema

This document describes the database schema for Sadaqah Box, including all tables, relationships, and indexes.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Technology](#database-technology)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Tables](#tables)
   - [Users](#users)
   - [Sessions](#sessions)
   - [Currency Types](#currency-types)
   - [Currencies](#currencies)
   - [Boxes](#boxes)
   - [Sadaqahs](#sadaqahs)
   - [Collections](#collections)
   - [Currency Rate Attempts](#currency-rate-attempts)
5. [Relationships](#relationships)
6. [Indexes](#indexes)
7. [Data Types](#data-types)
8. [Migrations](#migrations)

---

## Overview

Sadaqah Box uses a relational database schema optimized for:
- **Multi-tenancy** - User-scoped data isolation
- **Performance** - Strategic indexes for common queries
- **Flexibility** - JSON metadata for extensibility
- **Audit Trail** - Timestamps on all records

---

## Database Technology

| Aspect | Technology |
|--------|------------|
| **Database** | Cloudflare D1 (SQLite) |
| **ORM** | Drizzle ORM |
| **Migrations** | Drizzle Kit |
| **Schema Location** | `src/db/schema.ts` |

### D1 Characteristics

- SQLite-compatible syntax
- HTTP-based access (not TCP)
- Regional replication for reads
- Max 500MB (free), 5GB (paid)

---

## Entity Relationship Diagram

```
                                    +-------------+
                                    |    Users    |
                                    +-------------+
                                          |
                    +---------------------+---------------------+
                    |                     |                     |
              +-----+-----+        +------+------+       +------+------+
              |   Boxes   |        |  Sadaqahs   |       | Collections |
              +-----------+        +-------------+       +-------------+
                    |                     |                     |
                    |    +----------------+                     |
                    |    |                                      |
              +-----+----+-----+                          +-----+------+
              |    Currencies   |<------------------------|  Currency  |
              +-----------------+   (for value tracking)   | Rate Attmp |
                    |                                      +------------+
              +-----+------+
              | Currency   |
              |   Types    |
              +------------+
```

---

## Tables

### Users

Authentication and user profile data. Managed by Better Auth.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | No | Unique user ID |
| `email` | TEXT | Yes | User email |
| `emailVerified` | BOOLEAN | Yes | Email verification status |
| `name` | TEXT | Yes | Display name |
| `image` | TEXT | Yes | Avatar URL |
| `createdAt` | INTEGER | No | Creation timestamp |
| `updatedAt` | INTEGER | No | Update timestamp |
| `defaultBoxId` | TEXT | Yes | User's default box ID |
| `preferredCurrencyId` | TEXT | Yes | Preferred currency for display |

**Custom Fields:**
- `defaultBoxId` - The box to use by default when adding sadaqahs
- `preferredCurrencyId` - Currency for displaying converted values

---

### Sessions

User session management. Managed by Better Auth.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | No | Session ID |
| `userId` | TEXT | No | Foreign key to users |
| `expiresAt` | INTEGER | No | Session expiration |
| `ipAddress` | TEXT | Yes | Client IP address |
| `userAgent` | TEXT | Yes | Client user agent |
| `createdAt` | INTEGER | No | Creation timestamp |
| `updatedAt` | INTEGER | No | Update timestamp |

---

### Currency Types

Categories of currencies (Fiat, Crypto, Commodity).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | No | Unique ID (e.g., `ctyp_fiat`) |
| `name` | TEXT | No | Type name (unique) |
| `description` | TEXT | Yes | Type description |

**Default Types:**
- `ctyp_fiat` - Government-issued currency
- `ctyp_crypto` - Cryptocurrency
- `ctyp_commodity` - Gold, Silver, etc.

---

### Currencies

Available currencies for sadaqah tracking.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | No | Unique ID (e.g., `cur_279`) |
| `code` | TEXT | No | ISO 4217 code (unique) |
| `name` | TEXT | No | Full name |
| `symbol` | TEXT | Yes | Display symbol |
| `currencyTypeId` | TEXT | Yes | Foreign key to currency_types |
| `usdValue` | REAL | Yes | USD value for 1 unit |
| `lastRateUpdate` | INTEGER | Yes | Last rate update timestamp |

**Key Fields:**
- `usdValue` - How many USD one unit of this currency is worth
- Used for converting all sadaqahs to gold grams

**Example Records:**
```
| id       | code | name      | symbol | usdValue |
|----------|------|-----------|--------|----------|
| cur_279  | USD  | US Dollar | $      | 1.0      |
| cur_try  | TRY  | Lira      | ¥      | 0.03     |
| cur_xau  | XAU  | Gold      | Au     | 2000.0   |
```

---

### Boxes

Charity boxes for organizing sadaqah contributions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | No | Unique ID |
| `name` | TEXT | No | Box name |
| `description` | TEXT | Yes | Box description |
| `metadata` | TEXT (JSON) | Yes | Flexible key-value storage |
| `count` | INTEGER | No | Number of sadaqah entries |
| `totalValue` | REAL | No | Total value in gold grams |
| `totalValueExtra` | TEXT (JSON) | Yes | Unconvertible values by currency |
| `currencyId` | TEXT | Yes | Current currency ID |
| `baseCurrencyId` | TEXT | Yes | Default currency for new sadaqahs |
| `userId` | TEXT | No | Owner user ID |
| `createdAt` | INTEGER | No | Creation timestamp |
| `updatedAt` | INTEGER | No | Update timestamp |

**Key Fields:**
- `count` - Number of sadaqah transactions (not total coins)
- `totalValue` - Total value in **gold grams** (not currency units)
- `totalValueExtra` - Values that couldn't be converted to gold

**totalValueExtra Structure:**
```json
{
  "cur_btc": { "total": 0.001, "code": "BTC", "name": "Bitcoin" },
  "cur_eth": { "total": 0.05, "code": "ETH", "name": "Ethereum" }
}
```

---

### Sadaqahs

Individual charity contributions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | No | Unique ID |
| `boxId` | TEXT | No | Foreign key to boxes |
| `value` | REAL | No | Contribution value |
| `currencyId` | TEXT | No | Foreign key to currencies |
| `userId` | TEXT | No | Owner user ID |
| `createdAt` | INTEGER | No | Creation timestamp |

**Key Points:**
- `value` is in the original currency units
- Gold gram equivalent is calculated at add time
- Box `totalValue` is updated with gold grams

---

### Collections

Records of emptied boxes.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | No | Unique ID |
| `boxId` | TEXT | No | Foreign key to boxes |
| `userId` | TEXT | No | Owner user ID |
| `emptiedAt` | INTEGER | No | When box was emptied |
| `totalValue` | REAL | No | Total value at collection |
| `totalValueExtra` | TEXT (JSON) | Yes | Unconvertible values |
| `metadata` | TEXT (JSON) | Yes | Conversion data |
| `currencyId` | TEXT | No | Currency at collection time |

**metadata Structure:**
```json
{
  "conversions": [
    {
      "currencyId": "cur_try",
      "code": "TRY",
      "name": "Turkish Lira",
      "symbol": "¥",
      "value": 1500,
      "rate": 30
    }
  ],
  "preferredCurrencyId": "cur_try",
  "preferredCurrencyCode": "TRY"
}
```

---

### Currency Rate Attempts

Tracks exchange rate fetch attempts per currency.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | No | Unique ID |
| `currencyCode` | TEXT | No | Currency code (unique) |
| `lastAttemptAt` | INTEGER | No | Last fetch attempt |
| `lastSuccessAt` | INTEGER | Yes | Last successful fetch |
| `usdValue` | REAL | Yes | Cached USD value |
| `sourceApi` | TEXT | Yes | API that provided rate |
| `attemptCount` | INTEGER | No | Total attempts |
| `found` | BOOLEAN | No | Whether rate was found |

**Purpose:**
- Prevents excessive API calls
- Implements 1-hour cooldown per currency
- Caches successful rates

---

## Relationships

### Drizzle Relations

```typescript
// Box -> User (many-to-one)
boxesRelations = relations(boxes, ({ one }) => ({
  owner: one(users, {
    fields: [boxes.userId],
    references: [users.id],
  }),
}));

// Box -> Sadaqahs (one-to-many)
boxesRelations = relations(boxes, ({ many }) => ({
  sadaqahs: many(sadaqahs),
}));

// Box -> Currency (many-to-one)
boxesRelations = relations(boxes, ({ one }) => ({
  currency: one(currencies, {
    fields: [boxes.currencyId],
    references: [currencies.id],
  }),
  baseCurrency: one(currencies, {
    fields: [boxes.baseCurrencyId],
    references: [currencies.id],
    relationName: "boxBaseCurrency",
  }),
}));

// Sadaqah -> Box (many-to-one)
sadaqahsRelations = relations(sadaqahs, ({ one }) => ({
  box: one(boxes, {
    fields: [sadaqahs.boxId],
    references: [boxes.id],
  }),
  currency: one(currencies, {
    fields: [sadaqahs.currencyId],
    references: [currencies.id],
  }),
}));
```

---

## Indexes

### Performance Indexes

```sql
-- Boxes
CREATE INDEX box_user_id_idx ON box(userId);
CREATE INDEX box_created_at_idx ON box(createdAt);
CREATE INDEX box_user_id_created_at_idx ON box(userId, createdAt);
CREATE INDEX box_user_id_count_idx ON box(userId, count);
CREATE INDEX box_user_id_total_value_idx ON box(userId, totalValue);

-- Sadaqahs
CREATE INDEX sadaqah_box_id_idx ON sadaqah(boxId);
CREATE INDEX sadaqah_user_id_idx ON sadaqah(userId);
CREATE INDEX sadaqah_created_at_idx ON sadaqah(createdAt);
CREATE INDEX sadaqah_box_id_created_at_idx ON sadaqah(boxId, createdAt);
CREATE INDEX sadaqah_currency_id_value_idx ON sadaqah(currencyId, value);

-- Currencies
CREATE INDEX currency_code_idx ON currency(code);
CREATE INDEX currency_currency_type_id_idx ON currency(currencyTypeId);

-- Collections
CREATE INDEX collection_box_id_idx ON collection(boxId);
CREATE INDEX collection_user_id_idx ON collection(userId);
CREATE INDEX collection_emptied_at_idx ON collection(emptiedAt);

-- Currency Rate Attempts
CREATE INDEX currency_rate_attempt_code_idx ON currency_rate_attempt(currencyCode);
CREATE INDEX currency_rate_attempt_found_idx ON currency_rate_attempt(found);
```

### Index Strategy

1. **User-scoped queries** - All user data indexed by `userId`
2. **Time-based queries** - `createdAt` indexes for chronological access
3. **Composite indexes** - Common query patterns (user + time, box + time)
4. **Foreign keys** - All FK columns indexed for JOIN performance

---

## Data Types

### SQLite to TypeScript Mapping

| SQLite Type | Drizzle Type | TypeScript Type |
|-------------|--------------|-----------------|
| TEXT | `text()` | `string` |
| INTEGER | `integer()` | `number` |
| REAL | `real()` | `number` |
| TEXT (JSON) | `text({ mode: "json" })` | `object` |

### Timestamp Handling

All timestamps are stored as Unix epoch seconds (INTEGER):

```typescript
// Schema definition
createdAt: integer("createdAt", { mode: "timestamp" }).notNull()

// TypeScript usage
const now = new Date();
const timestamp = now.getTime(); // Unix epoch ms
```

### JSON Fields

JSON fields are used for flexible data:

```typescript
// Schema
metadata: text("metadata", { mode: "json" }).$type<{
  conversions?: ConversionData[];
  preferredCurrencyId?: string;
}>()

// Usage
const metadata = {
  conversions: [...],
  preferredCurrencyId: "cur_try"
};
```

---

## Migrations

### Migration Files

Migrations are stored in `migrations/`:

```
migrations/
+-- 0000_hesitant_makkari.sql    # Initial schema
+-- 0001_needy_tarantula.sql     # Add currency rate attempts
+-- 0002_amazing_big_bertha.sql  # Add preferred currency
+-- meta/
    +-- _journal.json
    +-- 0000_snapshot.json
    +-- 0001_snapshot.json
    +-- 0002_snapshot.json
```

### Running Migrations

```bash
# Generate migration from schema changes
bun run db:generate

# Apply to local D1
bun run migrate:local

# Apply to production D1
bun run migrate:remote
```

### Migration Best Practices

1. **Always review generated SQL** before applying
2. **Test locally first** with `migrate:local`
3. **Backup production** before remote migrations
4. **Use transactions** for complex migrations

---

## Query Examples

### Common Queries

#### Get User's Boxes with Stats

```typescript
const userBoxes = await db.query.boxes.findMany({
  where: eq(boxes.userId, userId),
  with: {
    currency: true,
    baseCurrency: true,
  },
  orderBy: desc(boxes.createdAt),
});
```

#### Get Sadaqahs with Currency

```typescript
const sadaqahList = await db.query.sadaqahs.findMany({
  where: eq(sadaqahs.boxId, boxId),
  with: { currency: true },
  orderBy: desc(sadaqahs.createdAt),
  limit: 20,
});
```

#### Calculate Total Gold Grams

```typescript
// totalValue is already in gold grams
const total = await db
  .select({ total: sum(boxes.totalValue) })
  .from(boxes)
  .where(eq(boxes.userId, userId));
```

---

## See Also

- [Architecture Guide](ARCHITECTURE.md) - System design
- [API Reference](API.md) - REST endpoints
- [Development Guide](DEVELOPMENT.md) - Local setup