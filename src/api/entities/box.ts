/**
 * Box entity - Database operations only
 */

import { eq, desc, count, and, sql, inArray } from "drizzle-orm";
import type { Database } from "../../db";
import { boxes, sadaqahs, collections, boxTags, tags } from "../../db/schema";
import type { Box, BoxStats, CollectionResult, CollectionsListResult, DeleteBoxResult, Tag } from "../domain/types";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "../domain/constants";
import { generateBoxId, generateCollectionId } from "../shared/id-generator";
import { sanitizeString } from "../shared/validators";
import { mapBox } from "./mappers";
import { CurrencyEntity } from "./currency";
import { TagEntity } from "./tag";
import { dbBatch } from "../shared/transaction";

export class BoxEntity {
	constructor(private db: Database) {}

	// ============== CRUD Operations ==============

	async create(data: { 
		name: string; 
		description?: string; 
		metadata?: Record<string, string>; 
		tagIds?: string[];
		userId: string;
	}): Promise<Box> {
		const timestamp = new Date();
		const id = generateBoxId();
		const name = sanitizeString(data.name);

		if (!name) {
			throw new Error("Box name is required");
		}

		return dbBatch(this.db, async (b) => {
			b.add(this.db.insert(boxes).values({
				id,
				name,
				description: sanitizeString(data.description) || null,
				metadata: data.metadata ? JSON.stringify(data.metadata) : null,
				count: 0,
				totalValue: 0,
				currencyId: null,
				userId: data.userId,
				createdAt: timestamp,
				updatedAt: timestamp,
			}));

			if (data.tagIds?.length) {
				b.add(this.db.insert(boxTags).values(
					data.tagIds.map((tagId) => ({ boxId: id, tagId }))
				));
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

	async get(id: string, userId?: string): Promise<Box | null> {
		const query = userId
			? this.db.select().from(boxes).where(and(eq(boxes.id, id), eq(boxes.userId, userId))).limit(1)
			: this.db.select().from(boxes).where(eq(boxes.id, id)).limit(1);
		const result = await query;
		if (!result[0]) return null;

		const box = mapBox(result[0]);
		
		// Fetch currency and tags in parallel
		const [currency, boxTags] = await Promise.all([
			box.currencyId ? new CurrencyEntity(this.db).get(box.currencyId) : Promise.resolve(null),
			this.getTagsForBoxes([id]),
		]);

		if (currency) box.currency = currency;
		box.tags = boxTags.get(id);
		return box;
	}

	async list(userId?: string): Promise<Box[]> {
		// Query boxes with user filter
		const query = userId
			? this.db.select().from(boxes).where(eq(boxes.userId, userId)).orderBy(desc(boxes.createdAt))
			: this.db.select().from(boxes).orderBy(desc(boxes.createdAt));
		const result = await query;
		if (result.length === 0) return [];

		const boxIds = result.map((b) => b.id);
		const currencyIds = [...new Set(result.map((b) => b.currencyId).filter(Boolean))] as string[];

		// Batch fetch only needed currencies and tags (N+1 fix)
		const [currencyMap, tagsByBox] = await Promise.all([
			new CurrencyEntity(this.db).getMany(currencyIds),
			this.getTagsForBoxes(boxIds),
		]);

		return result.map((box) => {
			const mapped = mapBox(box);
			if (mapped.currencyId) {
				const currency = currencyMap.get(mapped.currencyId);
				if (currency) mapped.currency = currency;
			}
			mapped.tags = tagsByBox.get(box.id);
			return mapped;
		});
	}

	/**
	 * Batch fetch tags for multiple boxes (N+1 optimization)
	 */
	private async getTagsForBoxes(boxIds: string[]): Promise<Map<string, Tag[]>> {
		if (boxIds.length === 0) return new Map();

		const result = await this.db
			.select({
				boxId: boxTags.boxId,
				tagId: tags.id,
				name: tags.name,
				color: tags.color,
				createdAt: tags.createdAt,
			})
			.from(boxTags)
			.innerJoin(tags, eq(boxTags.tagId, tags.id))
			.where(inArray(boxTags.boxId, boxIds));

		const tagsByBox = new Map<string, Tag[]>();
		for (const row of result) {
			const tag: Tag = {
				id: row.tagId,
				name: row.name,
				color: row.color || undefined,
				createdAt: new Date(row.createdAt).toISOString(),
			};
			const existing = tagsByBox.get(row.boxId) || [];
			existing.push(tag);
			tagsByBox.set(row.boxId, existing);
		}

		return tagsByBox;
	}

	async update(id: string, updates: Partial<Box> & { metadata?: Record<string, string> | null }, userId?: string): Promise<Box | null> {
		const existing = await this.get(id, userId);
		if (!existing) return null;

		const updateData: Record<string, unknown> = { updatedAt: new Date() };

		if (updates.name !== undefined) {
			updateData.name = sanitizeString(updates.name);
		}
		if (updates.description !== undefined) {
			updateData.description = sanitizeString(updates.description) || null;
		}
		if (updates.metadata !== undefined) {
			updateData.metadata = updates.metadata ? JSON.stringify(updates.metadata) : null;
		}

		await this.db.update(boxes).set(updateData).where(eq(boxes.id, id));
		return this.get(id);
	}

	async delete(id: string, userId?: string): Promise<DeleteBoxResult> {
		// Verify ownership if userId provided
		if (userId) {
			const boxResult = await this.db.select({ id: boxes.id }).from(boxes).where(and(eq(boxes.id, id), eq(boxes.userId, userId))).limit(1);
			if (!boxResult[0]) {
				return { deleted: false, sadaqahsDeleted: 0, collectionsDeleted: 0 };
			}
		}

		const [sadaqahCount, collectionCount] = await Promise.all([
			this.db.select({ count: count() }).from(sadaqahs).where(eq(sadaqahs.boxId, id)).then((r) => r[0]?.count ?? 0),
			this.db.select({ count: count() }).from(collections).where(eq(collections.boxId, id)).then((r) => r[0]?.count ?? 0),
		]);

		await this.db.delete(boxes).where(eq(boxes.id, id));

		return {
			deleted: true,
			sadaqahsDeleted: sadaqahCount,
			collectionsDeleted: collectionCount,
		};
	}

	// ============== Tag Operations ==============

	async addTag(boxId: string, tagId: string): Promise<boolean> {
		try {
			await this.db.insert(boxTags).values({ boxId, tagId });
			return true;
		} catch {
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
		return dbBatch(this.db, async (b) => {
			b.add(this.db.delete(boxTags).where(eq(boxTags.boxId, boxId)));
			if (tagIds.length > 0) {
				b.add(this.db.insert(boxTags).values(tagIds.map((tagId) => ({ boxId, tagId }))));
			}
			return true;
		});
	}

	// ============== Stats ==============

	async getStats(id: string): Promise<BoxStats | null> {
		const box = await this.db.select().from(boxes).where(eq(boxes.id, id)).limit(1);
		if (!box[0]) return null;

		const sadaqahList = await this.db
			.select({ createdAt: sadaqahs.createdAt })
			.from(sadaqahs)
			.where(eq(sadaqahs.boxId, id))
			.orderBy(sadaqahs.createdAt);

		if (sadaqahList.length === 0) {
			return { firstSadaqahAt: null, lastSadaqahAt: null, totalSadaqahs: 0 };
		}

		return {
			firstSadaqahAt: new Date(sadaqahList[0]!.createdAt).toISOString(),
			lastSadaqahAt: new Date(sadaqahList[sadaqahList.length - 1]!.createdAt).toISOString(),
			totalSadaqahs: sadaqahList.length,
		};
	}

	// ============== Collection (Empty Box) ==============

	async collect(id: string, userId?: string): Promise<CollectionResult | null> {
		const query = userId
			? this.db.select().from(boxes).where(and(eq(boxes.id, id), eq(boxes.userId, userId))).limit(1)
			: this.db.select().from(boxes).where(eq(boxes.id, id)).limit(1);
		const boxResult = await query;
		const box = boxResult[0];
		if (!box) return null;

		const timestamp = new Date();
		const collectionId = generateCollectionId();
		const currencyId = box.currencyId || "cur_default";
		const boxUserId = box.userId;

		await dbBatch(this.db, async (b) => {
			b.add(this.db.insert(collections).values({
				id: collectionId,
				boxId: id,
				userId: boxUserId,
				emptiedAt: timestamp,
				sadaqahsCollected: box.count,
				totalValue: box.totalValue,
				currencyId,
			}));

			b.add(this.db.delete(sadaqahs).where(eq(sadaqahs.boxId, id)));

			b.add(this.db.update(boxes).set({
				count: 0,
				totalValue: 0,
				currencyId: null,
				updatedAt: timestamp,
			}).where(eq(boxes.id, id)));
		});

		const updatedBoxResult = await this.db.select().from(boxes).where(eq(boxes.id, id)).limit(1);
		const updatedBox = mapBox(updatedBoxResult[0]!);

		const tagEntity = new TagEntity(this.db);
		updatedBox.tags = await tagEntity.getTagsForBox(id);

		if (currencyId !== "cur_default") {
			const currency = await new CurrencyEntity(this.db).get(currencyId);
			if (currency) updatedBox.currency = currency;
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
	}

	// ============== Collections List ==============

	async getCollections(
		boxId: string,
		options?: { page?: number; limit?: number },
		userId?: string
	): Promise<CollectionsListResult> {
		const page = options?.page || DEFAULT_PAGE;
		const limit = Math.min(options?.limit || DEFAULT_LIMIT, 100);
		const offset = (page - 1) * limit;

		// Verify box ownership
		if (userId) {
			const boxResult = await this.db.select({ id: boxes.id }).from(boxes).where(and(eq(boxes.id, boxId), eq(boxes.userId, userId))).limit(1);
			if (!boxResult[0]) {
				return { collections: [], total: 0 };
			}
		}

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

		const currencyIds = [...new Set(cols.map((c) => c.currencyId))];
		const currencyMap = await new CurrencyEntity(this.db).getMany(currencyIds);

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
					(collection as { currency?: typeof currency }).currency = currency;
				}
				return collection;
			}),
			total: totalResult[0]?.count ?? 0,
		};
	}
}
