/**
 * Zod schemas for OpenAPI/validation
 * Separate from pure types to avoid mixing concerns
 */

import { z } from "@hono/zod-openapi";
import * as constants from "./constants";

// ============== Helpers ==============

const IsoDate = z.union([z.date(), z.string().datetime()]).transform((val) =>
	val instanceof Date ? val.toISOString() : val
);

// ============== Currency Type ==============

export const CurrencyTypeSchema = z.object({
	id: z.string().openapi({ example: "ctyp_abc123" }),
	name: z.string().openapi({ example: "Fiat", description: "Currency type name" }),
	description: z.string().optional().openapi({ example: "Government-issued currency" }),
});

export type CurrencyTypeSchema = z.infer<typeof CurrencyTypeSchema>;

// ============== Currency ==============

export const CurrencySchema = z.object({
	id: z.string().openapi({ example: "cur_abc123" }),
	code: z.string().openapi({ example: "USD", description: "ISO 4217 currency code" }),
	name: z.string().openapi({ example: "US Dollar" }),
	symbol: z.string().optional().openapi({ example: "$" }),
	currencyTypeId: z.string().optional().openapi({ example: "ctyp_abc123" }),
	currencyType: CurrencyTypeSchema.optional(),
});

export type CurrencySchema = z.infer<typeof CurrencySchema>;

// ============== Tag ==============

export const TagSchema = z.object({
	id: z.string().openapi({ example: "tag_abc123" }),
	name: z.string().openapi({ example: "Ramadan" }),
	color: z.string().optional().openapi({ example: "#FF6B6B" }),
	createdAt: IsoDate,
});

export type TagSchema = z.infer<typeof TagSchema>;

// ============== Box ==============

export const BoxSchema = z.object({
	id: z.string().openapi({ example: "box_abc123" }),
	name: z.string().openapi({ example: "Ramadan Charity" }),
	description: z.optional(z.string()),
	metadata: z.any().optional(),
	count: z.number().openapi({ description: "Total sadaqahs in box" }),
	totalValue: z.number().openapi({ description: "Sum of all sadaqah values" }),
	currencyId: z.optional(z.string()),
	currency: CurrencySchema.optional(),
	tags: z.optional(TagSchema.array()),
	createdAt: IsoDate,
	updatedAt: IsoDate,
});

export type BoxSchema = z.infer<typeof BoxSchema>;

// ============== Sadaqah ==============

export const SadaqahSchema = z.object({
	id: z.string().openapi({ example: "sadaqah_xyz789" }),
	boxId: z.string().openapi({ description: "ID of the box containing this sadaqah" }),
	value: z.number().openapi({ example: 5, description: "This sadaqah's specific value" }),
	currencyId: z.string().openapi({ description: "ID of the currency" }),
	currency: CurrencySchema.optional(),
	createdAt: IsoDate,
});

export type SadaqahSchema = z.infer<typeof SadaqahSchema>;

// ============== Collection ==============

export const CollectionSchema = z.object({
	id: z.string().openapi({ example: "col_abc123" }),
	boxId: z.string(),
	emptiedAt: IsoDate,
	sadaqahsCollected: z.number(),
	totalValue: z.number(),
	currencyId: z.string(),
	currency: CurrencySchema.optional(),
});

export type CollectionSchema = z.infer<typeof CollectionSchema>;

// ============== Stats ==============

export const BoxStatsSchema = z.object({
	firstSadaqahAt: z.string().nullable(),
	lastSadaqahAt: z.string().nullable(),
	totalSadaqahs: z.number(),
});

// ============== Box Summary ==============

export const BoxSummarySchema = z.object({
	totalBoxes: z.number(),
	totalCoins: z.number(),
	totalValue: z.number(),
});

// ============== Request Schemas ==============

export const CreateBoxBodySchema = z.object({
	name: z.string().openapi({ 
		example: "Ramadan Charity",
		description: `Box name (max ${constants.MAX_BOX_NAME_LENGTH} characters)`,
	}),
	description: z.optional(z.string()),
	metadata: z.any().optional(),
	tagIds: z.array(z.string()).optional(),
});

export const UpdateBoxBodySchema = z.object({
	name: z.optional(z.string()),
	description: z.optional(z.string()),
	metadata: z.any().optional(),
});

export const AddSadaqahBodySchema = z.object({
	amount: z.optional(z.number()),
	value: z.optional(z.number()),
	currencyCode: z.optional(z.string()),
	metadata: z.any().optional(),
});

export const CreateTagBodySchema = z.object({
	name: z.string(),
	color: z.string().optional(),
});

export const CreateCurrencyBodySchema = z.object({
	code: z.string(),
	name: z.string(),
	symbol: z.string().optional(),
	currencyTypeId: z.string().optional(),
});

export const CreateCurrencyTypeBodySchema = z.object({
	name: z.string(),
	description: z.string().optional(),
});

// ============== Response Schemas ==============

export const SuccessResponseSchema = z.object({
	success: z.boolean(),
});

export const ErrorResponseSchema = z.object({
	success: z.boolean(),
	error: z.string(),
	code: z.string().optional(),
});

export const PaginationSchema = z.object({
	page: z.number().int().positive(),
	limit: z.number().int().positive(),
	total: z.number().int().nonnegative(),
	totalPages: z.number().int().nonnegative(),
});

// ============== List Response Builders ==============

export function createListResponseSchema<T extends z.ZodType>(itemSchema: T, itemName: string) {
	return z.object({
		success: z.boolean(),
		[itemName]: itemSchema.array(),
		pagination: PaginationSchema,
	});
}

export function createItemResponseSchema<T extends z.ZodType>(itemSchema: T, itemName: string) {
	return z.object({
		success: z.boolean(),
		[itemName]: itemSchema,
	});
}
