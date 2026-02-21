import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import * as authSchema from "./auth.schema";

// Re-export auth tables for drizzle-kit migrations
export const { users, sessions, accounts, verifications, passkeys, apikeys, usersRelations } = authSchema;

// Combine all schemas for drizzle-orm
export const schema = {
    ...authSchema,
} as const;

// ============== Currency Type Table ==============
export const currencyTypes = sqliteTable(
  "currency_type",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
  },
  (table) => [index("currency_type_name_idx").on(table.name)]
);

// ============== Currency Table ==============
export const currencies = sqliteTable(
  "currency",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    symbol: text("symbol"),
    currencyTypeId: text("currencyTypeId").references(() => currencyTypes.id),
    usdValue: real("usdValue"), // USD value for 1 unit of this currency
    lastRateUpdate: integer("lastRateUpdate", { mode: "timestamp" }), // When the rate was last updated
  },
  (table) => [index("currency_code_idx").on(table.code), index("currency_currency_type_id_idx").on(table.currencyTypeId)]
);

// ============== Box Table ==============
export const boxes = sqliteTable(
  "box",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    metadata: text("metadata", { mode: "json" }), // JSON metadata for flexible key-value storage
    count: integer("count").notNull().default(0),
    totalValue: real("totalValue").notNull().default(0),
    totalValueExtra: text("totalValueExtra", { mode: "json" }).$type<{
      [currencyId: string]: { total: number; code: string; name: string };
    }>(), // Values that couldn't be converted to base currency, keyed by currencyId
    currencyId: text("currencyId").references(() => currencies.id),
    baseCurrencyId: text("baseCurrencyId").references(() => currencies.id),
    userId: text("userId")
      .notNull()
      .references(() => authSchema.users.id, { onDelete: "cascade" }),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("box_created_at_idx").on(table.createdAt),
    index("box_user_id_idx").on(table.userId),
    index("box_base_currency_id_idx").on(table.baseCurrencyId),
    // Composite indexes for common query patterns
    index("box_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("box_user_id_count_idx").on(table.userId, table.count),
    index("box_user_id_total_value_idx").on(table.userId, table.totalValue),
  ]
);

// ============== Sadaqah Table ==============
export const sadaqahs = sqliteTable(
  "sadaqah",
  {
    id: text("id").primaryKey(),
    boxId: text("boxId")
      .notNull()
      .references(() => boxes.id, { onDelete: "cascade" }),
    value: real("value").notNull(),
    currencyId: text("currencyId")
      .notNull()
      .references(() => currencies.id),
    userId: text("userId")
      .notNull()
      .references(() => authSchema.users.id, { onDelete: "cascade" }),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("sadaqah_box_id_idx").on(table.boxId),
    index("sadaqah_created_at_idx").on(table.createdAt),
    index("sadaqah_currency_id_idx").on(table.currencyId),
    index("sadaqah_user_id_idx").on(table.userId),
    // Composite indexes for common query patterns
    index("sadaqah_box_id_created_at_idx").on(table.boxId, table.createdAt),
    index("sadaqah_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("sadaqah_currency_id_value_idx").on(table.currencyId, table.value),
  ]
);

// ============== Collection Table ==============
export const collections = sqliteTable(
  "collection",
  {
    id: text("id").primaryKey(),
    boxId: text("boxId")
      .notNull()
      .references(() => boxes.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => authSchema.users.id, { onDelete: "cascade" }),
    emptiedAt: integer("emptiedAt", { mode: "timestamp" }).notNull(),
    totalValue: real("totalValue").notNull(),
    totalValueExtra: text("totalValueExtra", { mode: "json" }).$type<{
      [currencyId: string]: { total: number; code: string; name: string };
    }>(),
    metadata: text("metadata", { mode: "json" }).$type<{
      conversions?: Array<{
        currencyId: string;
        code: string;
        name: string;
        symbol?: string | null;
        value: number;
        rate: number;
      }>;
      preferredCurrencyId?: string;
      preferredCurrencyCode?: string;
    }>(),
    currencyId: text("currencyId")
      .notNull()
      .references(() => currencies.id),
  },
  (table) => [
    index("collection_box_id_idx").on(table.boxId),
    index("collection_user_id_idx").on(table.userId),
    index("collection_emptied_at_idx").on(table.emptiedAt),
    index("collection_currency_id_idx").on(table.currencyId),
  ]
);

// ============== Currency Rate Attempts Table ==============
// Tracks per-currency rate fetch attempts with granular control
export const currencyRateAttempts = sqliteTable(
  "currency_rate_attempt",
  {
    id: text("id").primaryKey(),
    currencyCode: text("currencyCode").notNull().unique(), // e.g., "TRY", "BTC", "XAU"
    lastAttemptAt: integer("lastAttemptAt", { mode: "timestamp" }).notNull(),
    lastSuccessAt: integer("lastSuccessAt", { mode: "timestamp" }), // null if not found
    usdValue: real("usdValue"), // cached USD value if found
    sourceApi: text("sourceApi"), // which API provided the rate (e.g., "fawazahmed0", "frankfurter")
    attemptCount: integer("attemptCount").notNull().default(0),
    found: integer("found", { mode: "boolean" }).notNull().default(false), // whether rate was found
  },
  (table) => [
    index("currency_rate_attempt_code_idx").on(table.currencyCode),
    index("currency_rate_attempt_last_attempt_idx").on(table.lastAttemptAt),
    index("currency_rate_attempt_found_idx").on(table.found),
  ]
);

// ============== API Rate Limiting Table (Deprecated - kept for compatibility) ==============
// Tracks when API calls were last attempted to prevent hitting rate limits
export const apiRateCalls = sqliteTable(
  "api_rate_call",
  {
    id: text("id").primaryKey(),
    endpoint: text("endpoint").notNull().unique(), // e.g., "fiat_rates", "crypto_rates", "gold_price"
    lastAttemptAt: integer("lastAttemptAt", { mode: "timestamp" }).notNull(),
    lastSuccessAt: integer("lastSuccessAt", { mode: "timestamp" }), // null if last attempt failed
    errorCount: integer("errorCount").notNull().default(0),
  },
  (table) => [index("api_rate_call_endpoint_idx").on(table.endpoint)]
);

// ============== Relations ==============
export const currencyTypesRelations = relations(currencyTypes, ({ many }) => ({
  currencies: many(currencies),
}));

export const currenciesRelations = relations(currencies, ({ one, many }) => ({
  currencyType: one(currencyTypes, {
    fields: [currencies.currencyTypeId],
    references: [currencyTypes.id],
  }),
  sadaqahs: many(sadaqahs),
  boxes: many(boxes),
  baseCurrencyBoxes: many(boxes, { relationName: "boxBaseCurrency" }),
  collections: many(collections),
  preferredCurrencyUsers: many(users, { relationName: "userPreferredCurrency" }),
}));

export const boxesRelations = relations(boxes, ({ one, many }) => ({
  currency: one(currencies, {
    fields: [boxes.currencyId],
    references: [currencies.id],
  }),
  baseCurrency: one(currencies, {
    fields: [boxes.baseCurrencyId],
    references: [currencies.id],
    relationName: "boxBaseCurrency",
  }),
  owner: one(authSchema.users, {
    fields: [boxes.userId],
    references: [authSchema.users.id],
  }),
  sadaqahs: many(sadaqahs),
  collections: many(collections),
}));

export const sadaqahsRelations = relations(sadaqahs, ({ one }) => ({
  box: one(boxes, {
    fields: [sadaqahs.boxId],
    references: [boxes.id],
  }),
  currency: one(currencies, {
    fields: [sadaqahs.currencyId],
    references: [currencies.id],
  }),
  owner: one(authSchema.users, {
    fields: [sadaqahs.userId],
    references: [authSchema.users.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one }) => ({
  box: one(boxes, {
    fields: [collections.boxId],
    references: [boxes.id],
  }),
  currency: one(currencies, {
    fields: [collections.currencyId],
    references: [currencies.id],
  }),
  owner: one(authSchema.users, {
    fields: [collections.userId],
    references: [authSchema.users.id],
  }),
}));

// ============== Types ==============
export type CurrencyType = typeof currencyTypes.$inferSelect;
export type NewCurrencyType = typeof currencyTypes.$inferInsert;
export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;
export type Box = typeof boxes.$inferSelect;
export type NewBox = typeof boxes.$inferInsert;
export type Sadaqah = typeof sadaqahs.$inferSelect;
export type NewSadaqah = typeof sadaqahs.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type ApiRateCall = typeof apiRateCalls.$inferSelect;
export type NewApiRateCall = typeof apiRateCalls.$inferInsert;
export type CurrencyRateAttempt = typeof currencyRateAttempts.$inferSelect;
export type NewCurrencyRateAttempt = typeof currencyRateAttempts.$inferInsert;
