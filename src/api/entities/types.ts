import { DateTime, Num, Str } from "chanfana";
import { z } from "zod";
import type { Context } from "hono";

// Re-export ID generators from services for backwards compatibility
export {
	generateBoxId,
	generateSadaqahId,
	generateCollectionId,
	generateCurrencyId,
	generateCurrencyTypeId,
	generateTagId,
	isValidId,
} from "../services/id-generator";

// Re-export AppContext from a central location
export type AppContext = Context<{ Bindings: Env }>;

// ============== Currency Type Entity ==============
export const CurrencyTypeSchema = z.object({
	id: Str({ example: "ctyp_abc123" }),
	name: Str({ example: "Fiat", description: "Currency type name (e.g., Fiat, Crypto, Commodity)" }),
	description: Str({ required: false, example: "Government-issued currency", description: "Description of the currency type" }),
});

export type CurrencyType = z.infer<typeof CurrencyTypeSchema>;

// ============== Currency Entity ==============
export const CurrencySchema = z.object({
	id: Str({ example: "cur_abc123" }),
	code: Str({ example: "USD", description: "ISO 4217 currency code" }),
	name: Str({ example: "US Dollar", description: "Currency name" }),
	symbol: Str({ required: false, example: "$", description: "Currency symbol" }),
	currencyTypeId: Str({ required: false, example: "ctyp_abc123", description: "ID of the currency type" }),
	currencyType: CurrencyTypeSchema.optional().describe("Currency type details"),
});

export type Currency = z.infer<typeof CurrencySchema>;

// ============== Tag Entity ==============
export const TagSchema = z.object({
	id: Str({ example: "tag_abc123" }),
	name: Str({ example: "Ramadan", description: "Tag name" }),
	color: Str({ required: false, example: "#FF6B6B", description: "Tag color hex code" }),
	createdAt: z.union([z.date(), z.string().datetime()]).transform((val) =>
		val instanceof Date ? val.toISOString() : val
	),
});

export type Tag = z.infer<typeof TagSchema>;

// ============== Box Entity ==============
export const BoxSchema = z.object({
	id: Str({ example: "box_abc123" }),
	name: Str({ example: "Ramadan Charity" }),
	description: Str({ required: false }),
	metadata: z.record(z.string()).optional().describe("Optional metadata key-value pairs"),
	count: Num({ default: 0, description: "Total sadaqahs in box" }),
	totalValue: Num({ default: 0, description: "Sum of all sadaqah values" }),
	currencyId: Str({ required: false, description: "ID of the currency used in box" }),
	currency: CurrencySchema.optional().describe("Currency details"),
	tags: TagSchema.array().optional().describe("Tags associated with this box"),
	createdAt: z.union([z.date(), z.string().datetime()]).transform((val) =>
		val instanceof Date ? val.toISOString() : val
	),
	updatedAt: z.union([z.date(), z.string().datetime()]).transform((val) =>
		val instanceof Date ? val.toISOString() : val
	),
});

export type Box = z.infer<typeof BoxSchema>;

// ============== Sadaqah Entity ==============
export const SadaqahSchema = z.object({
	id: Str({ example: "sadaqah_xyz789" }),
	boxId: Str({ description: "ID of the box containing this sadaqah" }),
	value: Num({ example: 5, description: "This sadaqah's specific value" }),
	currencyId: Str({ description: "ID of the currency" }),
	currency: CurrencySchema.optional().describe("Currency details"),
	createdAt: z.union([z.date(), z.string().datetime()]).transform((val) =>
		val instanceof Date ? val.toISOString() : val
	),
});

export type Sadaqah = z.infer<typeof SadaqahSchema>;

// ============== Collection History ==============
export const CollectionSchema = z.object({
	id: Str({ example: "col_abc123" }),
	boxId: Str(),
	emptiedAt: z.union([z.date(), z.string().datetime()]).transform((val) =>
		val instanceof Date ? val.toISOString() : val
	),
	sadaqahsCollected: Num(),
	totalValue: Num(),
	currencyId: Str({ description: "ID of the currency" }),
	currency: CurrencySchema.optional().describe("Currency details"),
});

export type Collection = z.infer<typeof CollectionSchema>;

// ============== Result Types ==============

export interface BoxStats {
	firstSadaqahAt: string | null;
	lastSadaqahAt: string | null;
	totalSadaqahs: number;
}

export interface CollectionResult {
	box: Box;
	collection: {
		id: string;
		sadaqahsCollected: number;
		totalValue: number;
		currencyId: string;
		emptiedAt: string;
	};
}

export interface CollectionsListResult {
	collections: Collection[];
	total: number;
}

export interface DeleteBoxResult {
	deleted: boolean;
	sadaqahsDeleted: number;
	collectionsDeleted: number;
}

export interface CreateSadaqahResult {
	sadaqah: Sadaqah;
	updatedBox: Box;
}

export interface ListSadaqahsResult {
	sadaqahs: Sadaqah[];
	total: number;
	summary: {
		totalSadaqahs: number;
		totalValue: number;
		currency: Currency;
	};
}

export interface AddMultipleResult {
	sadaqahs: Sadaqah[];
	box: Box;
}

// ============== Options Interfaces ==============

export interface AddSadaqahOptions {
	boxId: string;
	value: number;
	currencyId: string;
	amount?: number;
	metadata?: Record<string, string>;
}

export interface CreateTagOptions {
	name: string;
	color?: string;
}

export interface CreateCurrencyOptions {
	code: string;
	name: string;
	symbol?: string;
	currencyTypeId?: string;
}

export interface GetOrCreateOptions {
	code: string;
	name?: string;
	symbol?: string;
	currencyTypeId?: string;
}

export interface CreateCurrencyTypeOptions {
	name: string;
	description?: string;
}
