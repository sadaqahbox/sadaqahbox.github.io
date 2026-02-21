import { DateTime, Num, Str } from "chanfana";
import { z } from "zod";
import type { Context } from "hono";

// Re-export AppContext from a central location
export type AppContext = Context<{ Bindings: Env }>;

// ============== ID Generation ==============

export function generateBoxId(): string {
	return `box_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateSadaqahId(index?: number): string {
	const suffix = index !== undefined ? `_${index}_${Math.random().toString(36).slice(2, 6)}` : `_${Math.random().toString(36).slice(2, 9)}`;
	return `sadaqah_${Date.now()}${suffix}`;
}

export function generateCollectionId(): string {
	return `col_${Date.now()}`;
}

// ============== Box Entity ==============
export const BoxSchema = z.object({
	id: Str({ example: "box_abc123" }),
	name: Str({ example: "Ramadan Charity" }),
	description: Str({ required: false }),
	count: Num({ default: 0, description: "Total sadaqahs in box" }),
	totalValue: Num({ default: 0, description: "Sum of all sadaqah values" }),
	currency: Str({ required: false, description: "Currency of sadaqahs in box" }),
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
	currency: Str({ example: "USD", description: "This sadaqah's currency" }),
	createdAt: z.union([z.date(), z.string().datetime()]).transform((val) =>
		val instanceof Date ? val.toISOString() : val
	),
	location: Str({ required: false, description: "Where sadaqah was added" }),
	ipAddress: Str({ required: false }),
	userAgent: Str({ required: false }),
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
	currency: Str(),
});

export type Collection = z.infer<typeof CollectionSchema>;
