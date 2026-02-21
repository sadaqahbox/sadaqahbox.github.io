/**
 * Data Transfer Objects (DTOs)
 * 
 * Re-exported from unified Zod schemas for single source of truth.
 * Additional DTOs specific to API request/response are defined here.
 * 
 * @see src/api/schemas/index.ts
 */

import { z } from "@hono/zod-openapi";
import * as constants from "../config/constants";
import {
  IsoDateSchema,
  PaginationQuerySchema,
  createPaginatedResponse,
  // Re-export schemas
  CurrencyTypeSchema,
  CurrencySchema,
  BoxSchema,
  SadaqahSchema,
  CollectionSchema,
  BoxStatsSchema,
  BoxSummarySchema,
  CreateCurrencyTypeSchema,
  CreateCurrencySchema,
  CreateBoxSchema,
  UpdateBoxSchema,
  AddSadaqahSchema,
  // Re-export types
  type CurrencyType,
  type Currency,
  type Box,
  type Sadaqah,
  type Collection,
  type BoxStats,
  type BoxSummary,
  type PaginationQuery,
  type CreateCurrencyTypeInput,
  type CreateCurrencyInput,
  type CreateBoxInput,
  type UpdateBoxInput,
  type AddSadaqahInput,
} from "../schemas";

// ============== Re-export all from schemas ==============

export {
  // Schemas
  CurrencyTypeSchema,
  CurrencySchema,
  BoxSchema,
  SadaqahSchema,
  CollectionSchema,
  BoxStatsSchema,
  BoxSummarySchema,
  PaginationQuerySchema,
  // Input schemas
  CreateCurrencyTypeSchema,
  CreateCurrencySchema,
  CreateBoxSchema,
  UpdateBoxSchema,
  AddSadaqahSchema,
  // Types
  type CurrencyType,
  type Currency,
  type Box,
  type Sadaqah,
  type Collection,
  type BoxStats,
  type BoxSummary,
  type PaginationQuery,
  type CreateCurrencyTypeInput,
  type CreateCurrencyInput,
  type CreateBoxInput,
  type UpdateBoxInput,
  type AddSadaqahInput,
};

// ============== DTO Type Aliases ==============
// These maintain backward compatibility with existing code

export type CurrencyTypeDto = CurrencyType;
export type CurrencyDto = Currency;
export type BoxDto = Box;
export type SadaqahDto = Sadaqah;
export type CollectionDto = Collection;
export type BoxStatsDto = BoxStats;
export type BoxSummaryDto = BoxSummary;
export type PaginationQueryDto = PaginationQuery;

// ============== Request Body DTOs ==============

export const CreateCurrencyTypeBodySchema = CreateCurrencyTypeSchema;

export type CreateCurrencyTypeBodyDto = z.infer<typeof CreateCurrencyTypeBodySchema>;

export const CreateCurrencyBodySchema = CreateCurrencySchema;

export type CreateCurrencyBodyDto = z.infer<typeof CreateCurrencyBodySchema>;

export const CreateBoxBodySchema = CreateBoxSchema;

export type CreateBoxBodyDto = z.infer<typeof CreateBoxBodySchema>;

export const UpdateBoxBodySchema = UpdateBoxSchema;

export type UpdateBoxBodyDto = z.infer<typeof UpdateBoxBodySchema>;

export const AddSadaqahBodySchema = AddSadaqahSchema;

export type AddSadaqahBodyDto = z.infer<typeof AddSadaqahBodySchema>;

// ============== Response Schemas ==============

export const ListBoxesResponseSchema = z.object({
  success: z.boolean(),
  boxes: BoxSchema.array(),
  summary: BoxSummarySchema,
});

export const GetBoxResponseSchema = z.object({
  success: z.boolean(),
  box: BoxSchema,
  stats: BoxStatsSchema,
});

export const EmptyBoxResponseSchema = z.object({
  success: z.boolean(),
  box: BoxSchema,
  collection: CollectionSchema,
});

export const DeleteBoxResponseSchema = z.object({
  success: z.boolean(),
  deleted: z.boolean(),
  sadaqahsDeleted: z.number().int().nonnegative(),
  collectionsDeleted: z.number().int().nonnegative(),
});

export const ListCollectionsResponseSchema = createPaginatedResponse(CollectionSchema, "collections");

export const ListSadaqahsResponseSchema = createPaginatedResponse(SadaqahSchema, "sadaqahs");

// ============== Health DTOs ==============

export const HealthResponseSchema = z.object({
  success: z.boolean(),
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  timestamp: z.string().datetime(),
  version: z.string(),
});

export type HealthResponseDto = z.infer<typeof HealthResponseSchema>;

// ============== Stats DTOs ==============

const PrimaryCurrencySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  symbol: z.string().optional(),
  currencyTypeId: z.string().optional(),
  currencyTypeName: z.string().optional(),
});

const TotalValueExtraEntrySchema = z.object({
  total: z.number().nonnegative(),
  code: z.string(),
  name: z.string(),
});

export const StatsResponseSchema = z.object({
  success: z.boolean(),
  totalBoxes: z.number().int().nonnegative(),
  totalSadaqahs: z.number().int().nonnegative(),
  totalValue: z.number().nonnegative(),
  totalValueExtra: z.record(z.string(), TotalValueExtraEntrySchema).nullable().optional(),
  uniqueCurrencies: z.number().int().nonnegative(),
  primaryCurrency: PrimaryCurrencySchema.nullable(),
});

export type StatsResponseDto = z.infer<typeof StatsResponseSchema>;

// ============== Pagination DTO ==============

export const PaginationQueryDto = PaginationQuerySchema;

// ============== Re-exports for backward compatibility ==============

export {
  CurrencyTypeSchema as CurrencyTypeDtoSchema,
  CurrencySchema as CurrencyDtoSchema,
  BoxSchema as BoxDtoSchema,
  SadaqahSchema as SadaqahDtoSchema,
  CollectionSchema as CollectionDtoSchema,
};
