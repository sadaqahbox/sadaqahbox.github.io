/**
 * Sadaqah entity - Database operations only
 */

import { eq, desc, count, and, gte, lte, sql } from "drizzle-orm";
import type { Database } from "../../db";
import { boxes, sadaqahs } from "../../db/schema";
import type { Sadaqah, Box, AddMultipleResult, ListSadaqahsResult } from "../domain/types";
import { DEFAULT_SADAQAH_VALUE, DEFAULT_SADAQAH_AMOUNT, MAX_SADAQAH_AMOUNT } from "../domain/constants";
import { generateSadaqahId } from "../shared/id-generator";
import { mapSadaqah } from "./mappers";
import { CurrencyEntity } from "./currency";
import { dbBatch } from "../shared/transaction";

export class SadaqahEntity {
	constructor(private db: Database) {}

	// ============== CRUD Operations ==============

	async create(data: {
		boxId: string;
		value: number;
		currencyId: string;
		userId: string;
		metadata?: Record<string, string>;
	}): Promise<{ sadaqah: Sadaqah; updatedBox: Box } | null> {
		const boxResult = await this.db.select().from(boxes).where(eq(boxes.id, data.boxId)).limit(1);
		const box = boxResult[0];
		if (!box) return null;

		const timestamp = new Date();
		const id = generateSadaqahId();

		await dbBatch(this.db, async (b) => {
			b.add(this.db.insert(sadaqahs).values({
				id,
				boxId: data.boxId,
				value: data.value,
				currencyId: data.currencyId,
				userId: data.userId,
				createdAt: timestamp,
			}));

			const newCount = box.count + 1;
			const newTotalValue = box.totalValue + data.value;
			const currencyId = box.currencyId || data.currencyId;

			b.add(this.db.update(boxes).set({
				count: newCount,
				totalValue: newTotalValue,
				currencyId,
				updatedAt: timestamp,
			}).where(eq(boxes.id, data.boxId)));
		});

		const updatedBox: Box = {
			id: box.id,
			name: box.name,
			description: box.description || undefined,
			count: box.count + 1,
			totalValue: box.totalValue + data.value,
			currencyId: box.currencyId || data.currencyId,
			createdAt: new Date(box.createdAt).toISOString(),
			updatedAt: timestamp.toISOString(),
		};

		return {
			sadaqah: {
				id,
				boxId: data.boxId,
				value: data.value,
				currencyId: data.currencyId,
				userId: data.userId,
				createdAt: timestamp.toISOString(),
			},
			updatedBox,
		};
	}

	async get(boxId: string, sadaqahId: string): Promise<Sadaqah | null> {
		const result = await this.db
			.select()
			.from(sadaqahs)
			.where(eq(sadaqahs.id, sadaqahId))
			.limit(1);

		const sadaqah = result[0];
		if (!sadaqah || sadaqah.boxId !== boxId) return null;

		const mapped = mapSadaqah(sadaqah);
		if (mapped.currencyId) {
			const currency = await new CurrencyEntity(this.db).get(mapped.currencyId);
			if (currency) mapped.currency = currency;
		}
		return mapped;
	}

	async delete(boxId: string, sadaqahId: string, userId?: string): Promise<boolean> {
		// Build query with optional user filter
		const query = userId
			? this.db.select().from(sadaqahs).where(and(eq(sadaqahs.id, sadaqahId), eq(sadaqahs.userId, userId))).limit(1)
			: this.db.select().from(sadaqahs).where(eq(sadaqahs.id, sadaqahId)).limit(1);
		
		const sadaqahResult = await query;
		const sadaqah = sadaqahResult[0];
		if (!sadaqah || sadaqah.boxId !== boxId) return false;

		const boxResult = await this.db.select().from(boxes).where(eq(boxes.id, boxId)).limit(1);
		const box = boxResult[0];
		if (!box) return false;

		await dbBatch(this.db, async (b) => {
			b.add(this.db.delete(sadaqahs).where(eq(sadaqahs.id, sadaqahId)));

			const newCount = Math.max(0, box.count - 1);
			const newTotalValue = Math.max(0, box.totalValue - sadaqah.value);

			b.add(this.db.update(boxes).set({
				count: newCount,
				totalValue: newTotalValue,
				updatedAt: new Date(),
			}).where(eq(boxes.id, boxId)));
		});

		return true;
	}

	async list(
		boxId: string,
		options?: { page?: number; limit?: number; from?: string; to?: string },
		userId?: string
	): Promise<ListSadaqahsResult> {
		const page = options?.page || 1;
		const limit = Math.min(options?.limit || 50, 100);
		const from = options?.from;
		const to = options?.to;

		// Verify box ownership if userId provided
		const boxQuery = userId
			? this.db.select().from(boxes).where(and(eq(boxes.id, boxId), eq(boxes.userId, userId))).limit(1)
			: this.db.select().from(boxes).where(eq(boxes.id, boxId)).limit(1);
		const boxResult = await boxQuery;
		const box = boxResult[0];
		if (!box) {
			return { sadaqahs: [], total: 0, summary: { totalSadaqahs: 0, totalValue: 0, currency: await new CurrencyEntity(this.db).getDefault() } };
		}

		// Build where conditions
		const conditions: ReturnType<typeof eq>[] = [eq(sadaqahs.boxId, boxId)];
		if (from) conditions.push(gte(sadaqahs.createdAt, new Date(from)));
		if (to) conditions.push(lte(sadaqahs.createdAt, new Date(to)));
		const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

		const [sadaqahList, totalResult, totalValueResult] = await Promise.all([
			this.db
				.select()
				.from(sadaqahs)
				.where(whereClause)
				.orderBy(desc(sadaqahs.createdAt))
				.limit(limit)
				.offset((page - 1) * limit),
			this.db.select({ count: count() }).from(sadaqahs).where(whereClause),
			this.db
				.select({ total: sql<number>`COALESCE(SUM(${sadaqahs.value}), 0)` })
				.from(sadaqahs)
				.where(eq(sadaqahs.boxId, boxId)),
		]);

		const total = totalResult[0]?.count ?? 0;
		const currencyIds = [...new Set(sadaqahList.map((s) => s.currencyId))];
		const currencyMap = await new CurrencyEntity(this.db).getMany(currencyIds);

		const mappedSadaqahs = sadaqahList.map((s) => {
			const sadaqah = mapSadaqah(s);
			const currency = currencyMap.get(s.currencyId);
			if (currency) sadaqah.currency = currency;
			return sadaqah;
		});

		const summaryCurrency = box?.currencyId 
			? currencyMap.get(box.currencyId) || await new CurrencyEntity(this.db).getDefault()
			: await new CurrencyEntity(this.db).getDefault();

		return {
			sadaqahs: mappedSadaqahs,
			total,
			summary: {
				totalSadaqahs: total,
				totalValue: totalValueResult[0]?.total ?? 0,
				currency: summaryCurrency,
			},
		};
	}

	// ============== Batch Operations ==============

	async addMultiple(options: {
		boxId: string;
		amount?: number;
		value?: number;
		currencyId: string;
		userId: string;
		metadata?: Record<string, string>;
	}): Promise<AddMultipleResult | null> {
		const amount = Math.min(
			Math.max(1, options.amount || DEFAULT_SADAQAH_AMOUNT),
			MAX_SADAQAH_AMOUNT
		);
		const value = options.value || DEFAULT_SADAQAH_VALUE;

		const boxResult = await this.db.select().from(boxes).where(eq(boxes.id, options.boxId)).limit(1);
		const box = boxResult[0];
		if (!box) return null;

		const timestamp = new Date();
		const createdSadaqahs: Sadaqah[] = [];

		await dbBatch(this.db, async (b) => {
			for (let i = 0; i < amount; i++) {
				const id = generateSadaqahId(i);
				b.add(this.db.insert(sadaqahs).values({
					id,
					boxId: options.boxId,
					value,
					currencyId: options.currencyId,
					userId: options.userId,
					createdAt: timestamp,
				}));
				createdSadaqahs.push({
					id,
					boxId: options.boxId,
					value,
					currencyId: options.currencyId,
					userId: options.userId,
					createdAt: timestamp.toISOString(),
				});
			}

			const newCount = box.count + amount;
			const newTotalValue = box.totalValue + value * amount;
			const currencyId = box.currencyId || options.currencyId;

			b.add(this.db.update(boxes).set({
				count: newCount,
				totalValue: newTotalValue,
				currencyId,
				updatedAt: timestamp,
			}).where(eq(boxes.id, options.boxId)));
		});

		const updatedBox: Box = {
			id: box.id,
			name: box.name,
			description: box.description || undefined,
			count: box.count + amount,
			totalValue: box.totalValue + value * amount,
			currencyId: box.currencyId || options.currencyId,
			createdAt: new Date(box.createdAt).toISOString(),
			updatedAt: timestamp.toISOString(),
		};

		return { sadaqahs: createdSadaqahs, box: updatedBox };
	}
}
