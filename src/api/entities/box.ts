/**
 * Box entity - Database operations only
 */

import { eq, desc, count, and, sql, inArray } from "drizzle-orm";
import type { Database } from "../../db";
import { boxes, sadaqahs, collections, users } from "../../db/schema";
import type { Box, BoxStats, CollectionResult, CollectionsListResult, DeleteBoxResult } from "../domain/types";
import type { CollectionConversion } from "../schemas";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "../domain/constants";
import { generateBoxId, generateCollectionId } from "../shared/id-generator";
import { sanitizeString } from "../shared/validators";
import { mapBox } from "./mappers";
import { CurrencyEntity } from "./currency";
import { dbBatch } from "../shared/transaction";

export class BoxEntity {
	constructor(private db: Database) {}

	// ============== CRUD Operations ==============

	async create(data: {
		name: string;
		description?: string;
		metadata?: Record<string, string>;
		userId: string;
	}): Promise<Box> {
		const timestamp = new Date();
		const id = generateBoxId();
		const name = sanitizeString(data.name);

		if (!name) {
			throw new Error("Box name is required");
		}

		await this.db.insert(boxes).values({
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
		});

		return {
			id,
			name,
			description: sanitizeString(data.description),
			count: 0,
			totalValue: 0,
			currencyId: null,
			createdAt: timestamp.toISOString(),
			updatedAt: timestamp.toISOString(),
		};
	}

	async getById(id: string, userId?: string): Promise<Box | null> {
		const query = userId
			? this.db.select().from(boxes).where(and(eq(boxes.id, id), eq(boxes.userId, userId))).limit(1)
			: this.db.select().from(boxes).where(eq(boxes.id, id)).limit(1);
		const result = await query;
		if (!result[0]) return null;
		return mapBox(result[0]);
	}

	async list(userId?: string, options?: { page?: number; limit?: number }): Promise<Box[]> {
		const page = options?.page || DEFAULT_PAGE;
		const limit = Math.min(options?.limit || DEFAULT_LIMIT, 100);
		const offset = (page - 1) * limit;

		const query = userId
			? this.db.select().from(boxes).where(eq(boxes.userId, userId)).orderBy(desc(boxes.createdAt)).limit(limit).offset(offset)
			: this.db.select().from(boxes).orderBy(desc(boxes.createdAt)).limit(limit).offset(offset);

		const results = await query;
		return results.map(mapBox);
	}

	async update(id: string, data: { 
		name?: string; 
		description?: string; 
		metadata?: Record<string, string>;
		baseCurrencyId?: string | null;
	}, userId?: string): Promise<Box | null> {
		// Check ownership if userId provided
		if (userId) {
			const existing = await this.getById(id, userId);
			if (!existing) return null;
		}

		const timestamp = new Date();
		
		const updateData: {
			name?: string;
			description?: string | null;
			metadata?: string;
			baseCurrencyId?: string | null;
			updatedAt: Date;
		} = {
			updatedAt: timestamp,
		};

		if (data.name !== undefined) {
			updateData.name = sanitizeString(data.name);
		}
		if (data.description !== undefined) {
			updateData.description = sanitizeString(data.description) || null;
		}
		if (data.metadata !== undefined) {
			updateData.metadata = JSON.stringify(data.metadata);
		}
		if (data.baseCurrencyId !== undefined) {
			updateData.baseCurrencyId = data.baseCurrencyId;
		}

		await this.db.update(boxes).set(updateData).where(eq(boxes.id, id));
		return this.getById(id, userId);
	}

	async delete(id: string, userId?: string): Promise<DeleteBoxResult | null> {
		// Check ownership if userId provided
		if (userId) {
			const existing = await this.getById(id, userId);
			if (!existing) return null;
		}

		// Delete related records first
		await this.db.delete(sadaqahs).where(eq(sadaqahs.boxId, id));
		await this.db.delete(collections).where(eq(collections.boxId, id));
		
		const result = await this.db.delete(boxes).where(eq(boxes.id, id)).returning({ id: boxes.id });
		if (!result[0]) return null;

		return {
			deleted: true,
			sadaqahsDeleted: 0,
			collectionsDeleted: 0,
		};
	}

	// ============== Stats ==============

	async getStats(id: string, userId?: string): Promise<BoxStats | null> {
		const box = await this.getById(id, userId);
		if (!box) return null;

		const sadaqahList = await this.db
			.select({ createdAt: sadaqahs.createdAt })
			.from(sadaqahs)
			.where(eq(sadaqahs.boxId, id))
			.orderBy(sadaqahs.createdAt);

		if (sadaqahList.length === 0) {
			return {
				firstSadaqahAt: null,
				lastSadaqahAt: null,
				totalSadaqahs: 0,
			};
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
		const currencyId = box.baseCurrencyId || box.currencyId || "cur_default";
		const boxUserId = box.userId;

		// Get user's preferred currency
		const userResult = await this.db.select({ preferredCurrencyId: users.preferredCurrencyId })
			.from(users)
			.where(eq(users.id, boxUserId))
			.limit(1);
		const preferredCurrencyId = userResult[0]?.preferredCurrencyId;

		// Get all currencies for conversion calculation
		const currencyEntity = new CurrencyEntity(this.db);
		const allCurrencies = await currencyEntity.list();
		const boxCurrency = currencyId !== "cur_default" 
			? await currencyEntity.get(currencyId) 
			: null;
		const preferredCurrency = preferredCurrencyId 
			? allCurrencies.find(c => c.id === preferredCurrencyId) 
			: null;

		// Calculate conversions for all currencies with usdValue
		const conversions: CollectionConversion[] = [];
		if (boxCurrency?.usdValue) {
			for (const targetCurrency of allCurrencies) {
				if (targetCurrency.usdValue && targetCurrency.id !== currencyId) {
					// Convert: value * (targetUSD / sourceUSD)
					const rate = targetCurrency.usdValue / boxCurrency.usdValue;
					const convertedValue = box.totalValue * rate;
					conversions.push({
						currencyId: targetCurrency.id,
						code: targetCurrency.code,
						name: targetCurrency.name,
						symbol: targetCurrency.symbol,
						value: convertedValue,
						rate: rate,
					});
				}
			}
		}

		// Build metadata
		const metadata: {
			conversions: CollectionConversion[];
			preferredCurrencyId?: string;
			preferredCurrencyCode?: string;
		} = {
			conversions,
		};
		if (preferredCurrency) {
			metadata.preferredCurrencyId = preferredCurrency.id;
			metadata.preferredCurrencyCode = preferredCurrency.code;
		}

		await dbBatch(this.db, async (b) => {
			b.add(this.db.insert(collections).values({
				id: collectionId,
				boxId: id,
				userId: boxUserId,
				emptiedAt: timestamp,
				totalValue: box.totalValue,
				totalValueExtra: box.totalValueExtra,
				metadata,
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

		if (currencyId !== "cur_default") {
			const currency = await currencyEntity.get(currencyId);
			if (currency) updatedBox.currency = currency;
		}

		return {
			box: updatedBox,
			collection: {
				id: collectionId,
				totalValue: box.totalValue,
				totalValueExtra: box.totalValueExtra,
				metadata,
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
				const currency = currencyMap.get(c.currencyId);
				return {
					id: c.id,
					boxId: c.boxId,
					emptiedAt: new Date(c.emptiedAt).toISOString(),
					totalValue: c.totalValue,
					totalValueExtra: c.totalValueExtra,
					metadata: c.metadata,
					currencyId: c.currencyId,
					currency: currency ? {
						id: currency.id,
						code: currency.code,
						name: currency.name,
						symbol: currency.symbol || undefined,
						currencyTypeId: currency.currencyTypeId || undefined,
					} : undefined,
				};
			}),
			total: totalResult[0]?.count || 0,
		};
	}
}
