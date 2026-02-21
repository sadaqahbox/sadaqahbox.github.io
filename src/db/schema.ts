import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import * as authSchema from "./auth.schema";

// Re-export auth tables for drizzle-kit migrations
export const { users, sessions, accounts, verifications, passkeys } = authSchema;

// Combine all schemas for drizzle-orm
export const schema = {
    ...authSchema,
} as const;

// ============== Currency Type Table ==============
export const currencyTypes = sqliteTable(
  "CurrencyType",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
  },
  (table) => [index("CurrencyType_name_idx").on(table.name)]
);

// ============== Currency Table ==============
export const currencies = sqliteTable(
  "Currency",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    symbol: text("symbol"),
    currencyTypeId: text("currencyTypeId").references(() => currencyTypes.id),
  },
  (table) => [index("Currency_code_idx").on(table.code), index("Currency_currencyTypeId_idx").on(table.currencyTypeId)]
);

// ============== Box Table ==============
export const boxes = sqliteTable(
  "Box",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    metadata: text("metadata", { mode: "json" }), // JSON metadata for flexible key-value storage
    count: integer("count").notNull().default(0),
    totalValue: real("totalValue").notNull().default(0),
    currencyId: text("currencyId").references(() => currencies.id),
    userId: text("userId")
      .notNull()
      .references(() => authSchema.users.id, { onDelete: "cascade" }),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("Box_createdAt_idx").on(table.createdAt), index("Box_userId_idx").on(table.userId)]
);

// ============== Sadaqah Table ==============
export const sadaqahs = sqliteTable(
  "Sadaqah",
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
    index("Sadaqah_boxId_idx").on(table.boxId),
    index("Sadaqah_createdAt_idx").on(table.createdAt),
    index("Sadaqah_currencyId_idx").on(table.currencyId),
    index("Sadaqah_userId_idx").on(table.userId),
  ]
);

// ============== Collection Table ==============
export const collections = sqliteTable(
  "Collection",
  {
    id: text("id").primaryKey(),
    boxId: text("boxId")
      .notNull()
      .references(() => boxes.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => authSchema.users.id, { onDelete: "cascade" }),
    emptiedAt: integer("emptiedAt", { mode: "timestamp" }).notNull(),
    sadaqahsCollected: integer("sadaqahsCollected").notNull(),
    totalValue: real("totalValue").notNull(),
    currencyId: text("currencyId")
      .notNull()
      .references(() => currencies.id),
  },
  (table) => [
    index("Collection_boxId_idx").on(table.boxId),
    index("Collection_userId_idx").on(table.userId),
    index("Collection_emptiedAt_idx").on(table.emptiedAt),
    index("Collection_currencyId_idx").on(table.currencyId),
  ]
);

// ============== Tag Table ==============
export const tags = sqliteTable(
  "Tag",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    color: text("color"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("Tag_name_idx").on(table.name)]
);

// ============== Box-Tag Junction Table ==============
export const boxTags = sqliteTable(
  "BoxTag",
  {
    boxId: text("boxId")
      .notNull()
      .references(() => boxes.id, { onDelete: "cascade" }),
    tagId: text("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("BoxTag_boxId_idx").on(table.boxId),
    index("BoxTag_tagId_idx").on(table.tagId),
  ]
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
  collections: many(collections),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  boxTags: many(boxTags),
}));

export const boxTagsRelations = relations(boxTags, ({ one }) => ({
  box: one(boxes, {
    fields: [boxTags.boxId],
    references: [boxes.id],
  }),
  tag: one(tags, {
    fields: [boxTags.tagId],
    references: [tags.id],
  }),
}));

export const boxesRelations = relations(boxes, ({ one, many }) => ({
  currency: one(currencies, {
    fields: [boxes.currencyId],
    references: [currencies.id],
  }),
  owner: one(authSchema.users, {
    fields: [boxes.userId],
    references: [authSchema.users.id],
  }),
  sadaqahs: many(sadaqahs),
  collections: many(collections),
  boxTags: many(boxTags),
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
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type BoxTag = typeof boxTags.$inferSelect;
export type NewBoxTag = typeof boxTags.$inferInsert;
