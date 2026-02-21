import type { AppContext, Box, BoxStats, CollectionResult, CollectionsListResult, DeleteBoxResult, Tag } from "./types";
import { BoxSchema } from "./types";
import { mapBox } from "../lib/mappers";
import type { Database } from "../../db";
import { getDbFromContext } from "../../db";
import { eq, desc, count, sql, and } from "drizzle-orm";
import { boxes, sadaqahs, collections, boxTags } from "../../db/schema";
import { CurrencyEntity } from "./currency";
import { TagEntity } from "./tag";
import { generateBoxId, generateCollectionId } from "../services/id-generator";
import { sanitizeString } from "../utils/validators";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "../utils/constants";

export { BoxSchema, type Box };

/**
 * Entity class for managing charity boxes
 * Includes transaction support and optimized queries
 */
export class BoxEntity {
	constructor(private db: Database) {}

	// ============== CRUD Operations ==============

	async create(data: { name: string; description?: string; metadata?: Record<string, string>; tagIds?: string[] }): Promise<Box> {
		const timestamp = new Date();
		const id = generateBoxId();
		const name = sanitizeString(data.name);

		if (!name) {
			throw new Error("Box name is required");
		}

		return this.db.transaction(async (tx) => {
			// Create box
			await tx.insert(boxes).values({
				id,
				name,
				description: sanitizeString(data.description) || null,
				metadata: data.metadata ? JSON.stringify(data.metadata) : null,
				count: 0,
				totalValue: 0,
				currencyId: null,
				createdAt: timestamp,
				updatedAt: timestamp,
			});

			// Add tags if provided
			if (data.tagIds && data.tagIds.length > 0) {
				await tx.insert(boxTags).values(
					data.tagIds.map((tagId) => ({
						boxId: id,
						tagId,
					}))
				);
			}

			return {
				id,
				name,
				description: sanitizeString(data.description),
				metadata: data.metadata,
				count: 0,
				totalValue: 0,
				createdAt: timestamp.toISOString(),
				updatedAt: timestamp.toISOString(),
			};
		});
	}

	async get(id: string): Promise<Box | null> {
		const result = await this.db.select().from(boxes).where(eq(boxes.id, id)).limit(1);
		if (!result[0]) return null;

		const box = mapBox(result[0]);
		
		// Fetch currency if exists
		if (box.currencyId) {
			const currencyEntity = new CurrencyEntity(this.db);
			const currency = await currencyEntity.get(box.currencyId);
			if (currency) {
				box.currency = currency;
			}
		}

		// Fetch tags using optimized method
		const tagEntity = new TagEntity(this.db);
		box.tags = await tagEntity.getTagsForBox(id);

		return box;
	}

	async list(): Promise<Box[]> {
		const result = await this.db.select().from(boxes).orderBy(desc(boxes.createdAt));
		
		// Early return for empty list
		if (result.length === 0) return [];

		// Batch fetch all currencies and tags
		const currencyEntity = new CurrencyEntity(this.db);
		const tagEntity = new TagEntity(this.db);

		const [allCurrencies, allTags, boxTagRelations] = await Promise.all([
			currencyEntity.list(),
			tagEntity.list(),
			this.db.select().from(boxTags),
		]);

		const currencyMap = new Map(allCurrencies.map((c) => [c.id, c]));
		const tagMap = new Map(allTags.map((t) => [t.id, t]));

		// Build tags by box map
		const tagsByBox = new Map<string, Tag[]>();
		for (const relation of boxTagRelations) {
			const tag = tagMap.get(relation.tagId);
			if (tag) {
				const existing = tagsByBox.get(relation.boxId) || [];
				existing.push(tag);
				tagsByBox.set(relation.boxId, existing);
			}
		}

		return result.map((box) => {
			const mapped = mapBox(box);
			if (mapped.currencyId) {
				const currency = currencyMap.get(mapped.currencyId);
				if (currency) {
					mapped.currency = currency;
				}
			}
			const boxTagsList = tagsByBox.get(box.id);
			if (boxTagsList) {
				mapped.tags = boxTagsList;
			}
			return mapped;
		});
	}

	async update(id: string, updates: Partial<Box> & { metadata?: Record<string, string> | null }): Promise<Box | null> {
		const existing = await this.get(id);
		if (!existing) return null;

		const timestamp = new Date();
		const updateData: Record<string, unknown> = {
			updatedAt: timestamp,
		};

		if (updates.name !== undefined) {
			updateData.name = sanitizeString(updates.name);
		}
		if (updates.description !== undefined) {
			updateData.description = sanitizeString(updates.description) || null;
		}
		if (updates.metadata !== undefined) {
			updateData.metadata = updates.metadata ? JSON.stringify(updates.metadata) : null;
		}

		await this.db
			.update(boxes)
			.set(updateData)
			.where(eq(boxes.id, id));

		return this.get(id);
	}

	async delete(id: string): Promise<DeleteBoxResult> {
		return this.db.transaction(async (tx) => {
			// Get counts before deletion
			const [sadaqahCount, collectionCount] = await Promise.all([
				tx.select({ count: count() }).from(sadaqahs).where(eq(sadaqahs.boxId, id)).then((r) => r[0]?.count ?? 0),
				tx.select({ count: count() }).from(collections).where(eq(collections.boxId, id)).then((r) => r[0]?.count ?? 0),
			]);

			// Delete box (cascades to sadaqahs, collections, and boxTags via foreign key)
			await tx.delete(boxes).where(eq(boxes.id, id));

			return {
				deleted: true,
				sadaqahsDeleted: sadaqahCount,
				collectionsDeleted: collectionCount,
			};
		});
	}

	// ============== Tag Operations ==============

	async addTag(boxId: string, tagId: string): Promise<boolean> {
		try {
			await this.db.insert(boxTags).values({
				boxId,
				tagId,
			});
			return true;
		} catch {
			// Tag already exists or other error
			return false;
		}
	}

	async removeTag(boxId: string, tagId: string): Promise<boolean> {
		await this.db
			.delete(boxTags)
			.where(and(eq(boxTags.boxId, boxId), eq(boxTags.tagId, tagId)));
		return true;
	}

	async setTags(boxId: string, tagIds: string[]): Promise<boolean> {
		return this.db.transaction(async (tx) => {
			// Remove all existing tags
			await tx.delete(boxTags).where(eq(boxTags.boxId, boxId));

			// Add new tags
			if (tagIds.length > 0) {
				await tx.insert(boxTags).values(
					tagIds.map((tagId) => ({
						boxId,
						tagId,
					}))
				);
			}

			return true;
		});
	}

	// ============== Stats ==============

	async getStats(id: string): Promise<BoxStats | null> {
		const box = await this.db.select().from(boxes).where(eq(boxes.id, id)).limit(1);
		if (!box[0]) return null;

		const sadaqahList = await this.db
			.select({
				createdAt: sadaqahs.createdAt,
			})
			.from(sadaqahs)
			.where(eq(sadaqahs.boxId, id))
			.orderBy(sadaqahs.createdAt);

		if (sadaqahList.length === 0) {
			return { firstSadaqahAt: null, lastSadaqahAt: null, totalSadaqahs: 0 };
		}

		return {
			firstSadaqahAt: new Date(sadaqahList[0].createdAt).toISOString(),
			lastSadaqahAt: new Date(sadaqahList[sadaqahList.length - 1].createdAt).toISOString(),
			totalSadaqahs: sadaqahList.length,
		};
	}

	// ============== Collection (Empty Box) ==============

	async collect(id: string): Promise<CollectionResult | null> {
		return this.db.transaction(async (tx) => {
			// Get box within transaction
			const boxResult = await tx.select().from(boxes).where(eq(boxes.id, id)).limit(1);
			const box = boxResult[0];
			
			if (!box) return null;

			const timestamp = new Date();
			const collectionId = generateCollectionId();

			// Use box's currency or default currency ID
			const currencyId = box.currencyId || "cur_default";

			// Create collection record
			await tx.insert(collections).values({
				id: collectionId,
				boxId: id,
				emptiedAt: timestamp,
				sadaqahsCollected: box.count,
				totalValue: box.totalValue,
				currencyId,
			});

			// Delete all sadaqahs in the box
			await tx.delete(sadaqahs).where(eq(sadaqahs.boxId, id));

			// Reset box
			await tx
				.update(boxes)
				.set({
					count: 0,
					totalValue: 0,
					currencyId: null,
					updatedAt: timestamp,
				})
				.where(eq(boxes.id, id));

			// Get updated box with relations
			const updatedBoxResult = await tx.select().from(boxes).where(eq(boxes.id, id)).limit(1);
			const updatedBox = mapBox(updatedBoxResult[0]!);

			// Fetch tags and currency for the response
			const tagEntity = new TagEntity(this.db);
			updatedBox.tags = await tagEntity.getTagsForBox(id);

			if (currencyId !== "cur_default") {
				const currencyEntity = new CurrencyEntity(this.db);
				const currency = await currencyEntity.get(currencyId);
				if (currency) {
					updatedBox.currency = currency;
				}
			}

			return {
				box: updatedBox,
				collection: {
					id: collectionId,
					sadaqahsCollected: box.count,
					totalValue: box.totalValue,
					currencyId,
					emptiedAt: timestamp.toISOString(),
				},
			};
		});
	}

	// ============== Collections List ==============

	async getCollections(
		boxId: string,
		options?: { page?: number; limit?: number }
	): Promise<CollectionsListResult> {
		const page = options?.page || DEFAULT_PAGE;
		const limit = Math.min(options?.limit || DEFAULT_LIMIT, 100); // Cap at 100
		const offset = (page - 1) * limit;

		const [cols, totalResult] = await Promise.all([
			this.db
				.select()
				.from(collections)
				.where(eq(collections.boxId, boxId))
				.orderBy(desc(collections.emptiedAt))
				.limit(limit)
				.offset(offset),
			this.db.select({ count: count() }).from(collections).where(eq(collections.boxId, boxId)),
		]);

		// Batch fetch currencies to avoid N+1
		const currencyIds = [...new Set(cols.map((c) => c.currencyId))];
		const currencyEntity = new CurrencyEntity(this.db);
		const currencyMap = await currencyEntity.getMany(currencyIds);

		return {
			collections: cols.map((c) => {
				const collection = {
					id: c.id,
					boxId: c.boxId,
					emptiedAt: new Date(c.emptiedAt).toISOString(),
					sadaqahsCollected: c.sadaqahsCollected,
					totalValue: c.totalValue,
					currencyId: c.currencyId,
				};
				const currency = currencyMap.get(c.currencyId);
				if (currency) {
					(collection as any).currency = currency;
				}
				return collection;
			}),
			total: totalResult[0]?.count ?? 0,
		};
	}
}

// Factory function for creating BoxEntity from context
export function getBoxEntity(c: AppContext): BoxEntity {
	return new BoxEntity(getDbFromContext(c));
}
