/**
 * Client-side API schemas and types
 * Re-exports and extends server schemas for client use
 */

import { z } from "zod";

// ============== Base Schemas ==============

export const IsoDateSchema = z.union([z.date(), z.string().datetime()]).transform((val) =>
  val instanceof Date ? val.toISOString() : val
);

export const CurrencyTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export const CurrencySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  symbol: z.string().optional(),
  currencyTypeId: z.string().optional(),
  usdValue: z.number().nullable().optional(),
  lastRateUpdate: z.string().nullable().optional(),
});

const TotalValueExtraEntrySchema = z.object({
  total: z.number(),
  code: z.string(),
  name: z.string(),
});

const CollectionConversionSchema = z.object({
  currencyId: z.string(),
  code: z.string(),
  name: z.string(),
  symbol: z.string().nullable().optional(),
  value: z.number(),
  rate: z.number(),
});

export const BoxSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  count: z.number(),
  totalValue: z.number(),
  totalValueExtra: z.record(z.string(), TotalValueExtraEntrySchema).nullable().optional(),
  currencyId: z.string().optional(),
  currency: CurrencySchema.optional(),
  baseCurrencyId: z.string().optional(),
  baseCurrency: CurrencySchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SadaqahSchema = z.object({
  id: z.string(),
  boxId: z.string(),
  value: z.number(),
  currencyId: z.string(),
  currency: CurrencySchema.optional(),
  createdAt: z.string(),
});

export const CollectionSchema = z.object({
  id: z.string(),
  boxId: z.string(),
  emptiedAt: z.string(),
  totalValue: z.number(),
  totalValueExtra: z.record(z.string(), TotalValueExtraEntrySchema).nullable().optional(),
  metadata: z.object({
    conversions: z.array(CollectionConversionSchema).optional(),
    preferredCurrencyId: z.string().optional(),
    preferredCurrencyCode: z.string().optional(),
  }).nullable().optional(),
  currencyId: z.string(),
  currency: CurrencySchema.optional(),
});

export const StatsSchema = z.object({
  totalBoxes: z.number(),
  totalSadaqahs: z.number(),
  totalValue: z.number(),
  totalValueExtra: z.record(z.string(), TotalValueExtraEntrySchema).nullable().optional(),
  uniqueCurrencies: z.number().optional(),
  primaryCurrency: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    symbol: z.string().optional(),
    currencyTypeId: z.string().optional(),
    currencyTypeName: z.string().optional(),
  }).nullable().optional(),
});

// ============== Request Body Schemas ==============

export const CreateBoxBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  baseCurrencyId: z.string().optional(),
});

export const AddSadaqahBodySchema = z.object({
  amount: z.number().optional(),
  value: z.number().optional(),
  currencyId: z.string().optional(),
});

// ============== Response Schemas ==============

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

// ============== API Response Schemas ==============

export const BoxesResponseSchema = z.object({
  success: z.boolean(),
  boxes: BoxSchema.array(),
});

export const BoxResponseSchema = z.object({
  success: z.boolean(),
  box: BoxSchema,
});

export const CurrenciesResponseSchema = z.object({
  success: z.boolean(),
  currencies: CurrencySchema.array(),
});

export const SadaqahsResponseSchema = z.object({
  success: z.boolean(),
  sadaqahs: SadaqahSchema.array(),
});

export const CollectionsResponseSchema = z.object({
  success: z.boolean(),
  collections: CollectionSchema.array(),
});

export const StatsResponseSchema = z.object({
  success: z.boolean(),
  stats: StatsSchema,
});

export const EmptyBoxResponseSchema = z.object({
  success: z.boolean(),
  box: BoxSchema,
  collection: CollectionSchema,
});

export const DeleteBoxResponseSchema = z.object({
  success: z.boolean(),
  deleted: z.boolean(),
  sadaqahsDeleted: z.number(),
  collectionsDeleted: z.number(),
});

export const DeleteSadaqahResponseSchema = z.object({
  success: z.boolean(),
  deleted: z.boolean(),
  updatedBox: BoxSchema.optional(),
});

export const AddSadaqahResponseSchema = z.object({
  success: z.boolean(),
  sadaqahs: SadaqahSchema.array(),
  box: BoxSchema.extend({
    currency: z.any().nullable(),
    baseCurrency: z.any().nullable(),
    totalValueExtra: z.record(z.string(), TotalValueExtraEntrySchema).nullable().optional(),
  }),
  message: z.string(),
});

// ============== Type Exports ==============

export type Currency = z.infer<typeof CurrencySchema>;
export type Box = z.infer<typeof BoxSchema>;
export type Sadaqah = z.infer<typeof SadaqahSchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type Stats = z.infer<typeof StatsSchema>;

export type CreateBoxBody = z.infer<typeof CreateBoxBodySchema>;
export type AddSadaqahBody = z.infer<typeof AddSadaqahBodySchema>;
