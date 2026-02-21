/**
 * Unified Schema Definitions
 * 
 * Single source of truth for all types using Zod schema inference.
 * All types are derived from these schemas, ensuring runtime validation
 * matches compile-time types.
 * 
 * @module api/schemas
 */

import { z } from "@hono/zod-openapi";
import * as constants from "../config/constants";

// ============== Helper Schemas ==============

export const IsoDateSchema = z.string().datetime().openapi({
  format: "date-time",
  example: "2024-01-15T10:30:00.000Z",
});

export const MetadataSchema = z.record(z.string(), z.string()).optional();

// ============== Currency Type Schema ==============

export const CurrencyTypeSchema = z.object({
  id: z.string().openapi({ example: "ctyp_abc123" }),
  name: z.string().openapi({ example: "Fiat", description: "Currency type name" }),
  description: z.string().optional().openapi({ example: "Government-issued currency" }),
});

export type CurrencyType = z.infer<typeof CurrencyTypeSchema>;

export const CreateCurrencyTypeSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
});

export type CreateCurrencyTypeInput = z.infer<typeof CreateCurrencyTypeSchema>;

// ============== Currency Schema ==============

export const CurrencySchema = z.object({
  id: z.string().openapi({ example: "cur_abc123" }),
  code: z.string().openapi({ example: "USD", description: "ISO 4217 currency code" }),
  name: z.string().openapi({ example: "US Dollar" }),
  symbol: z.string().optional().openapi({ example: "$" }),
  currencyTypeId: z.string().optional().openapi({ example: "ctyp_abc123" }),
  currencyType: CurrencyTypeSchema.optional(),
  usdValue: z.number().nullable().optional().openapi({ 
    example: 1.0, 
    description: "USD value for 1 unit of this currency" 
  }),
  lastRateUpdate: IsoDateSchema.nullable().optional().openapi({ 
    description: "When the rate was last updated" 
  }),
});

export type Currency = z.infer<typeof CurrencySchema>;

export const CreateCurrencySchema = z.object({
  code: z.string().min(1).max(constants.MAX_CURRENCY_CODE_LENGTH),
  name: z.string().min(1).max(constants.MAX_CURRENCY_NAME_LENGTH),
  symbol: z.string().optional(),
  currencyTypeId: z.string().optional(),
  usdValue: z.number().optional().openapi({ 
    description: "USD value for 1 unit of this currency (optional, will be fetched automatically)" 
  }),
});

export type CreateCurrencyInput = z.infer<typeof CreateCurrencySchema>;

// ============== Tag Schema ==============

export const TagSchema = z.object({
  id: z.string().openapi({ example: "tag_abc123" }),
  name: z.string().openapi({ example: "Ramadan" }),
  color: z.string().optional().openapi({ example: "#FF6B6B" }),
  createdAt: IsoDateSchema,
});

export type Tag = z.infer<typeof TagSchema>;

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(constants.MAX_TAG_NAME_LENGTH),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type CreateTagInput = z.infer<typeof CreateTagSchema>;

// ============== Box Schema ==============

const TotalValueExtraEntrySchema = z.object({
  total: z.number().nonnegative(),
  code: z.string(),
  name: z.string(),
});

export const BoxSchema = z.object({
  id: z.string().openapi({ example: "box_abc123" }),
  name: z.string().openapi({ example: "Ramadan Charity" }),
  description: z.string().optional(),
  metadata: MetadataSchema,
  count: z.number().int().nonnegative().openapi({ description: "Total sadaqahs in box" }),
  totalValue: z.number().nonnegative().openapi({ 
    description: "Total value in base currency" 
  }),
  totalValueExtra: z.record(z.string(), TotalValueExtraEntrySchema).nullable().optional().openapi({
    description: "Values that couldn't be converted to base currency, keyed by currencyId"
  }),
  currencyId: z.string().optional(),
  currency: CurrencySchema.optional(),
  baseCurrencyId: z.string().optional().openapi({ 
    description: "Base currency ID for the box - cannot be changed after sadaqahs are added" 
  }),
  baseCurrency: CurrencySchema.optional().openapi({ 
    description: "Base currency for the box - all values are stored in this currency" 
  }),
  tags: TagSchema.array().optional(),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});

export type Box = z.infer<typeof BoxSchema>;

export const CreateBoxSchema = z.object({
  name: z.string().min(1).max(constants.MAX_BOX_NAME_LENGTH).openapi({
    example: "Ramadan Charity",
    description: `Box name (max ${constants.MAX_BOX_NAME_LENGTH} characters)`,
  }),
  description: z.string().optional(),
  metadata: MetadataSchema,
  tagIds: z.array(z.string()).optional(),
  baseCurrencyId: z.string().optional().openapi({ 
    description: "Base currency ID for the box - defaults to USD if not provided. Cannot be changed after sadaqahs are added." 
  }),
});

export type CreateBoxInput = z.infer<typeof CreateBoxSchema>;

export const UpdateBoxSchema = z.object({
  name: z.string().min(1).max(constants.MAX_BOX_NAME_LENGTH).optional(),
  description: z.string().optional(),
  metadata: MetadataSchema,
  baseCurrencyId: z.string().optional().openapi({ 
    description: "Base currency ID - can only be changed if box has no sadaqahs" 
  }),
});

export type UpdateBoxInput = z.infer<typeof UpdateBoxSchema>;

// ============== Sadaqah Schema ==============

export const SadaqahSchema = z.object({
  id: z.string().openapi({ example: "sadaqah_xyz789" }),
  boxId: z.string().openapi({ description: "ID of the box containing this sadaqah" }),
  value: z.number().nonnegative().openapi({ example: 5, description: "This sadaqah's specific value" }),
  currencyId: z.string().openapi({ description: "ID of the currency" }),
  currency: CurrencySchema.optional(),
  userId: z.string().optional(),
  createdAt: IsoDateSchema,
});

export type Sadaqah = z.infer<typeof SadaqahSchema>;

export const AddSadaqahSchema = z.object({
  amount: z.number().int().positive().optional(),
  value: z.number().positive().optional(),
  currencyId: z.string().optional(),
  metadata: MetadataSchema,
});

export type AddSadaqahInput = z.infer<typeof AddSadaqahSchema>;

// ============== Collection Schema ==============

export const CollectionSchema = z.object({
  id: z.string().openapi({ example: "col_abc123" }),
  boxId: z.string(),
  emptiedAt: IsoDateSchema,
  sadaqahsCollected: z.number().int().nonnegative(),
  totalValue: z.number().nonnegative(),
  currencyId: z.string(),
  currency: CurrencySchema.optional(),
});

export type Collection = z.infer<typeof CollectionSchema>;

// ============== Stats Schemas ==============

export const BoxStatsSchema = z.object({
  firstSadaqahAt: z.string().nullable(),
  lastSadaqahAt: z.string().nullable(),
  totalSadaqahs: z.number().int().nonnegative(),
});

export type BoxStats = z.infer<typeof BoxStatsSchema>;

export const BoxSummarySchema = z.object({
  totalBoxes: z.number().int().nonnegative(),
  totalCoins: z.number().int().nonnegative(),
  totalValue: z.number().nonnegative(),
});

export type BoxSummary = z.infer<typeof BoxSummarySchema>;

// ============== Result Types ==============

export const CollectionResultSchema = z.object({
  box: BoxSchema,
  collection: z.object({
    id: z.string(),
    sadaqahsCollected: z.number().int().nonnegative(),
    totalValue: z.number().nonnegative(),
    currencyId: z.string(),
    emptiedAt: IsoDateSchema,
  }),
});

export type CollectionResult = z.infer<typeof CollectionResultSchema>;

export const DeleteBoxResultSchema = z.object({
  deleted: z.boolean(),
  sadaqahsDeleted: z.number().int().nonnegative(),
  collectionsDeleted: z.number().int().nonnegative(),
});

export type DeleteBoxResult = z.infer<typeof DeleteBoxResultSchema>;

export const CreateSadaqahResultSchema = z.object({
  sadaqah: SadaqahSchema,
  updatedBox: BoxSchema,
});

export type CreateSadaqahResult = z.infer<typeof CreateSadaqahResultSchema>;

// ============== Pagination Schemas ==============

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginationInfoSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type PaginationInfo = z.infer<typeof PaginationInfoSchema>;

export function createPaginatedResponse<T extends z.ZodTypeAny>(
  itemSchema: T,
  itemsKey: string = "items"
) {
  return z.object({
    success: z.boolean(),
    [itemsKey]: z.array(itemSchema),
    pagination: PaginationInfoSchema,
  });
}

// ============== API Response Schemas ==============

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

// ============== Re-export for DTOs (backward compatibility) ==============

export {
  CurrencyTypeSchema as CurrencyTypeDtoSchema,
  CurrencySchema as CurrencyDtoSchema,
  TagSchema as TagDtoSchema,
  BoxSchema as BoxDtoSchema,
  SadaqahSchema as SadaqahDtoSchema,
  CollectionSchema as CollectionDtoSchema,
};
