/**
 * Data Transfer Objects (DTOs)
 * 
 * Type-safe request/response contracts for the API.
 * All API input/output shapes are defined here.
 */

import { z } from "@hono/zod-openapi";
import * as constants from "../config/constants";
import {
	IsoDateSchema,
	PaginationQuerySchema,
	createItemResponseSchema,
	createPaginatedResponse,
} from "../shared/schema-helpers";

// ============== Common DTOs ==============

export const PaginationQueryDto = PaginationQuerySchema;
export type PaginationQueryDto = z.infer<typeof PaginationQueryDto>;

// ============== Currency Type DTOs ==============

export const CurrencyTypeSchema = z.object({
	id: z.string().openapi({ example: "ctyp_abc123" }),
	name: z.string().openapi({ example: "Fiat", description: "Currency type name" }),
	description: z.string().optional().openapi({ example: "Government-issued currency" }),
});

export type CurrencyTypeDto = z.infer<typeof CurrencyTypeSchema>;

export const CreateCurrencyTypeBodySchema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().optional(),
});

export type CreateCurrencyTypeBodyDto = z.infer<typeof CreateCurrencyTypeBodySchema>;

// ============== Currency DTOs ==============

export const CurrencySchema = z.object({
	id: z.string().openapi({ example: "cur_abc123" }),
	code: z.string().openapi({ example: "USD", description: "ISO 4217 currency code" }),
	name: z.string().openapi({ example: "US Dollar" }),
	symbol: z.string().optional().openapi({ example: "$" }),
	currencyTypeId: z.string().optional().openapi({ example: "ctyp_abc123" }),
	currencyType: CurrencyTypeSchema.optional(),
});

export type CurrencyDto = z.infer<typeof CurrencySchema>;

export const CreateCurrencyBodySchema = z.object({
	code: z.string().min(1).max(constants.MAX_CURRENCY_CODE_LENGTH),
	name: z.string().min(1).max(constants.MAX_CURRENCY_NAME_LENGTH),
	symbol: z.string().optional(),
	currencyTypeId: z.string().optional(),
});

export type CreateCurrencyBodyDto = z.infer<typeof CreateCurrencyBodySchema>;

// ============== Tag DTOs ==============

export const TagSchema = z.object({
	id: z.string().openapi({ example: "tag_abc123" }),
	name: z.string().openapi({ example: "Ramadan" }),
	color: z.string().optional().openapi({ example: "#FF6B6B" }),
	createdAt: IsoDateSchema,
});

export type TagDto = z.infer<typeof TagSchema>;

export const CreateTagBodySchema = z.object({
	name: z.string().min(1).max(constants.MAX_TAG_NAME_LENGTH),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type CreateTagBodyDto = z.infer<typeof CreateTagBodySchema>;

// ============== Box DTOs ==============

export const BoxSchema = z.object({
	id: z.string().openapi({ example: "box_abc123" }),
	name: z.string().openapi({ example: "Ramadan Charity" }),
	description: z.string().optional(),
	metadata: z.record(z.string(), z.string()).optional(),
	count: z.number().int().nonnegative().openapi({ description: "Total sadaqahs in box" }),
	totalValue: z.number().nonnegative().openapi({ description: "Sum of all sadaqah values" }),
	currencyId: z.string().optional(),
	currency: CurrencySchema.optional(),
	tags: TagSchema.array().optional(),
	createdAt: IsoDateSchema,
	updatedAt: IsoDateSchema,
});

export type BoxDto = z.infer<typeof BoxSchema>;

export const CreateBoxBodySchema = z.object({
	name: z.string().min(1).max(constants.MAX_BOX_NAME_LENGTH).openapi({
		example: "Ramadan Charity",
		description: `Box name (max ${constants.MAX_BOX_NAME_LENGTH} characters)`,
	}),
	description: z.string().optional(),
	metadata: z.record(z.string(), z.string()).optional(),
	tagIds: z.array(z.string()).optional(),
});

export type CreateBoxBodyDto = z.infer<typeof CreateBoxBodySchema>;

export const UpdateBoxBodySchema = z.object({
	name: z.string().min(1).max(constants.MAX_BOX_NAME_LENGTH).optional(),
	description: z.string().optional(),
	metadata: z.record(z.string(), z.string()).optional(),
});

export type UpdateBoxBodyDto = z.infer<typeof UpdateBoxBodySchema>;

export const BoxStatsSchema = z.object({
	firstSadaqahAt: z.string().nullable(),
	lastSadaqahAt: z.string().nullable(),
	totalSadaqahs: z.number().int().nonnegative(),
});

export type BoxStatsDto = z.infer<typeof BoxStatsSchema>;

export const BoxSummarySchema = z.object({
	totalBoxes: z.number().int().nonnegative(),
	totalCoins: z.number().int().nonnegative(),
	totalValue: z.number().nonnegative(),
});

export type BoxSummaryDto = z.infer<typeof BoxSummarySchema>;

// ============== Collection DTOs ==============

export const CollectionSchema = z.object({
	id: z.string().openapi({ example: "col_abc123" }),
	boxId: z.string(),
	emptiedAt: IsoDateSchema,
	sadaqahsCollected: z.number().int().nonnegative(),
	totalValue: z.number().nonnegative(),
	currencyId: z.string(),
	currency: CurrencySchema.optional(),
});

export type CollectionDto = z.infer<typeof CollectionSchema>;

// ============== Sadaqah DTOs ==============

export const SadaqahSchema = z.object({
	id: z.string().openapi({ example: "sadaqah_xyz789" }),
	boxId: z.string().openapi({ description: "ID of the box containing this sadaqah" }),
	value: z.number().nonnegative().openapi({ example: 5, description: "This sadaqah's specific value" }),
	currencyId: z.string().openapi({ description: "ID of the currency" }),
	currency: CurrencySchema.optional(),
	createdAt: IsoDateSchema,
});

export type SadaqahDto = z.infer<typeof SadaqahSchema>;

export const AddSadaqahBodySchema = z.object({
	amount: z.number().int().positive().optional(),
	value: z.number().positive().optional(),
	currencyId: z.string().optional(),
	metadata: z.record(z.string(), z.string()).optional(),
});

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

export const StatsResponseSchema = z.object({
	success: z.boolean(),
	totalBoxes: z.number().int().nonnegative(),
	totalSadaqahs: z.number().int().nonnegative(),
	totalValue: z.number().nonnegative(),
	uniqueCurrencies: z.number().int().nonnegative(),
});

export type StatsResponseDto = z.infer<typeof StatsResponseSchema>;

// ============== Re-exports for backward compatibility ==============

export {
	CurrencyTypeSchema as CurrencyTypeDtoSchema,
	CurrencySchema as CurrencyDtoSchema,
	TagSchema as TagDtoSchema,
	BoxSchema as BoxDtoSchema,
	SadaqahSchema as SadaqahDtoSchema,
	CollectionSchema as CollectionDtoSchema,
};
