/**
 * Zod schemas for OpenAPI/validation
 * Separate from pure types to avoid mixing concerns
 */

import { z } from "zod";
import { Bool, Num, Str, DateTime } from "chanfana";
import * as constants from "./constants";

// ============== Helpers ==============

const IsoDate = z.union([z.date(), z.string().datetime()]).transform((val) =>
	val instanceof Date ? val.toISOString() : val
);

// ============== Currency Type ==============

export const CurrencyTypeSchema = z.object({
	id: Str({ example: "ctyp_abc123" }),
	name: Str({ example: "Fiat", description: "Currency type name" }),
	description: Str({ required: false, example: "Government-issued currency" }),
});

export type CurrencyTypeSchema = z.infer<typeof CurrencyTypeSchema>;

// ============== Currency ==============

export const CurrencySchema = z.object({
	id: Str({ example: "cur_abc123" }),
	code: Str({ example: "USD", description: "ISO 4217 currency code" }),
	name: Str({ example: "US Dollar" }),
	symbol: Str({ required: false, example: "$" }),
	currencyTypeId: Str({ required: false, example: "ctyp_abc123" }),
	currencyType: CurrencyTypeSchema.optional(),
});

export type CurrencySchema = z.infer<typeof CurrencySchema>;

// ============== Tag ==============

export const TagSchema = z.object({
	id: Str({ example: "tag_abc123" }),
	name: Str({ example: "Ramadan" }),
	color: Str({ required: false, example: "#FF6B6B" }),
	createdAt: IsoDate,
});

export type TagSchema = z.infer<typeof TagSchema>;

// ============== Box ==============

export const BoxSchema = z.object({
	id: Str({ example: "box_abc123" }),
	name: Str({ example: "Ramadan Charity" }),
	description: Str({ required: false }),
	metadata: z.record(z.string()).optional(),
	count: Num({ default: 0, description: "Total sadaqahs in box" }),
	totalValue: Num({ default: 0, description: "Sum of all sadaqah values" }),
	currencyId: Str({ required: false }),
	currency: CurrencySchema.optional(),
	tags: TagSchema.array().optional(),
	createdAt: IsoDate,
	updatedAt: IsoDate,
});

export type BoxSchema = z.infer<typeof BoxSchema>;

// ============== Sadaqah ==============

export const SadaqahSchema = z.object({
	id: Str({ example: "sadaqah_xyz789" }),
	boxId: Str({ description: "ID of the box containing this sadaqah" }),
	value: Num({ example: 5, description: "This sadaqah's specific value" }),
	currencyId: Str({ description: "ID of the currency" }),
	currency: CurrencySchema.optional(),
	createdAt: IsoDate,
});

export type SadaqahSchema = z.infer<typeof SadaqahSchema>;

// ============== Collection ==============

export const CollectionSchema = z.object({
	id: Str({ example: "col_abc123" }),
	boxId: Str(),
	emptiedAt: IsoDate,
	sadaqahsCollected: Num(),
	totalValue: Num(),
	currencyId: Str(),
	currency: CurrencySchema.optional(),
});

export type CollectionSchema = z.infer<typeof CollectionSchema>;

// ============== Stats ==============

export const BoxStatsSchema = z.object({
	firstSadaqahAt: Str().nullable(),
	lastSadaqahAt: Str().nullable(),
	totalSadaqahs: Num(),
});

// ============== Box Summary ==============

export const BoxSummarySchema = z.object({
	totalBoxes: Num(),
	totalCoins: Num(),
	totalValue: Num(),
});

// ============== Request Schemas ==============

export const CreateBoxBodySchema = z.object({
	name: Str({ 
		example: "Ramadan Charity",
		description: `Box name (max ${constants.MAX_BOX_NAME_LENGTH} characters)`,
	}),
	description: Str({ 
		required: false,
		description: `Optional description (max ${constants.MAX_BOX_DESCRIPTION_LENGTH} characters)`,
	}),
	metadata: z.record(z.string()).optional(),
	tagIds: Str().array().optional(),
});

export const UpdateBoxBodySchema = z.object({
	name: Str({ required: false }),
	description: Str({ required: false }),
	metadata: z.record(z.string()).optional().nullable(),
});

export const AddSadaqahBodySchema = z.object({
	amount: Num({ 
		default: 1, 
		description: `Number of sadaqahs to add (max ${constants.MAX_SADAQAH_AMOUNT})`,
	}).optional(),
	value: Num({ 
		example: 1, 
		description: "Value per sadaqah (must be positive)",
	}).optional(),
	currencyCode: Str({ 
		default: constants.DEFAULT_CURRENCY_CODE, 
		description: "Currency code (USD, EUR, TRY, etc.)" 
	}).optional(),
	metadata: z.record(z.string()).optional(),
});

export const CreateTagBodySchema = z.object({
	name: Str({ example: "Ramadan", description: "Tag name" }),
	color: Str({ required: false, example: "#FF6B6B", description: "Tag color hex code" }),
});

export const CreateCurrencyBodySchema = z.object({
	code: Str({ example: "USD", description: "ISO 4217 currency code" }),
	name: Str({ example: "US Dollar" }),
	symbol: Str({ required: false, example: "$" }),
	currencyTypeId: Str({ required: false }),
});

export const CreateCurrencyTypeBodySchema = z.object({
	name: Str({ example: "Fiat" }),
	description: Str({ required: false }),
});

// ============== Response Schemas ==============

export const SuccessResponseSchema = z.object({
	success: Bool(),
});

export const ErrorResponseSchema = z.object({
	success: Bool(),
	error: Str(),
	code: Str().optional(),
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
		success: Bool(),
		[itemName]: itemSchema.array(),
		pagination: PaginationSchema,
	});
}

export function createItemResponseSchema<T extends z.ZodType>(itemSchema: T, itemName: string) {
	return z.object({
		success: Bool(),
		[itemName]: itemSchema,
	});
}
