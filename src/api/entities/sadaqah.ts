import type { AppContext, Sadaqah, Box, Currency, AddSadaqahOptions, CreateSadaqahResult, ListSadaqahsResult, AddMultipleResult } from "./types";
import { SadaqahSchema } from "./types";
import { mapSadaqah } from "../lib/mappers";
import type { Database } from "../../db";
import { getDbFromContext } from "../../db";
import { eq, desc, count, sql, and, gte, lte } from "drizzle-orm";
import { boxes, sadaqahs } from "../../db/schema";
import { CurrencyEntity } from "./currency";
import { generateSadaqahId } from "../services/id-generator";
import { DEFAULT_SADAQAH_VALUE, DEFAULT_SADAQAH_AMOUNT, MAX_SADAQAH_AMOUNT, DEFAULT_CURRENCY_CODE } from "../utils/constants";

export { SadaqahSchema, type Sadaqah };

/**
 * Entity class for managing sadaqahs (charity items)
 * Includes transaction support for data consistency
 */
export class SadaqahEntity {
	constructor(private db: Database) {}

	// ============== CRUD Operations ==============

	async create(data: {
		boxId: string;
		value: number;
		currencyId: string;
		metadata?: Record<string, string>;
	}): Promise<CreateSadaqahResult | null> {
		return this.db.transaction(async (tx) => {
			// Get box to verify it exists
			const boxResult = await tx.select().from(boxes).where(eq(boxes.id, data.boxId)).limit(1);
			const box = boxResult[0];

			if (!box) return null;

			const timestamp = new Date();
			const id = generateSadaqahId();

			// Create sadaqah
			await tx.insert(sadaqahs).values({
				id,
				boxId: data.boxId,
				value: data.value,
				currencyId: data.currencyId,
				createdAt: timestamp,
			});

			// Update box stats within same transaction
			const newCount = box.count + 1;
			const newTotalValue = box.totalValue + data.value;
			const currencyId = box.currencyId || data.currencyId;

			await tx
				.update(boxes)
				.set({
					count: newCount,
					totalValue: newTotalValue,
					currencyId,
					updatedAt: timestamp,
				})
				.where(eq(boxes.id, data.boxId));

			const updatedBox: Box = {
				id: box.id,
				name: box.name,
				description: box.description || undefined,
				count: newCount,
				totalValue: newTotalValue,
				currencyId,
				createdAt: new Date(box.createdAt).toISOString(),
				updatedAt: timestamp.toISOString(),
			};

			return {
				sadaqah: {
					id,
					boxId: data.boxId,
					value: data.value,
					currencyId: data.currencyId,
					createdAt: timestamp.toISOString(),
				},
				updatedBox,
			};
		});
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
		
		// Fetch currency if exists
		if (mapped.currencyId) {
			const currencyEntity = new CurrencyEntity(this.db);
			const currency = await currencyEntity.get(mapped.currencyId);
			if (currency) {
				mapped.currency = currency;
			}
		}

		return mapped;
	}

	async delete(boxId: string, sadaqahId: string): Promise<boolean> {
		return this.db.transaction(async (tx) => {
			// Get sadaqah to verify it exists and get its value
			const sadaqahResult = await tx
				.select()
				.from(sadaqahs)
				.where(eq(sadaqahs.id, sadaqahId))
				.limit(1);
			
			const sadaqah = sadaqahResult[0];
			if (!sadaqah || sadaqah.boxId !== boxId) return false;

			// Get box to update stats
			const boxResult = await tx.select().from(boxes).where(eq(boxes.id, boxId)).limit(1);
			const box = boxResult[0];
			if (!box) return false;

			// Delete the sadaqah
			await tx.delete(sadaqahs).where(eq(sadaqahs.id, sadaqahId));

			// Update box stats
			const newCount = Math.max(0, box.count - 1);
			const newTotalValue = Math.max(0, box.totalValue - sadaqah.value);

			await tx
				.update(boxes)
				.set({
					count: newCount,
					totalValue: newTotalValue,
					updatedAt: new Date(),
				})
				.where(eq(boxes.id, boxId));

			return true;
		});
	}

	async list(
		boxId: string,
		options?: { page?: number; limit?: number; from?: string; to?: string }
	): Promise<ListSadaqahsResult> {
		const page = options?.page || 1;
		const limit = Math.min(options?.limit || 50, 100); // Cap at 100
		const from = options?.from;
		const to = options?.to;

		// Get box for currency info
		const boxResult = await this.db.select().from(boxes).where(eq(boxes.id, boxId)).limit(1);
		const box = boxResult[0];

		// Build where conditions
		const conditions: ReturnType<typeof eq>[] = [eq(sadaqahs.boxId, boxId)];
		if (from) {
			conditions.push(gte(sadaqahs.createdAt, new Date(from)));
		}
		if (to) {
			conditions.push(lte(sadaqahs.createdAt, new Date(to)));
		}
		const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

		// Fetch sadaqahs with pagination
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

		// Batch fetch currencies to avoid N+1
		const currencyIds = [...new Set(sadaqahList.map((s) => s.currencyId))];
		const currencyEntity = new CurrencyEntity(this.db);
		const currencyMap = await currencyEntity.getMany(currencyIds);

		// Map sadaqahs with their currencies
		const mappedSadaqahs = sadaqahList.map((s) => {
			const sadaqah = mapSadaqah(s);
			const currency = currencyMap.get(s.currencyId);
			if (currency) {
				sadaqah.currency = currency;
			}
			return sadaqah;
		});

		// Get summary currency (box's currency or default to USD)
		let summaryCurrency: Currency;
		if (box?.currencyId) {
			const found = currencyMap.get(box.currencyId);
			if (found) {
				summaryCurrency = found;
			} else {
				summaryCurrency = await currencyEntity.getDefault();
			}
		} else {
			summaryCurrency = await currencyEntity.getDefault();
		}

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

	async addMultiple(options: AddSadaqahOptions): Promise<AddMultipleResult | null> {
		// Validate amount
		const amount = Math.min(Math.max(1, options.amount || DEFAULT_SADAQAH_AMOUNT), MAX_SADAQAH_AMOUNT);
		const value = options.value || DEFAULT_SADAQAH_VALUE;

		return this.db.transaction(async (tx) => {
			const boxResult = await tx.select().from(boxes).where(eq(boxes.id, options.boxId)).limit(1);
			const box = boxResult[0];

			if (!box) return null;

			const timestamp = new Date();

			// Batch create sadaqahs
			const createdSadaqahs: Sadaqah[] = [];
			for (let i = 0; i < amount; i++) {
				const id = generateSadaqahId(i);
				await tx.insert(sadaqahs).values({
					id,
					boxId: options.boxId,
					value,
					currencyId: options.currencyId,
					createdAt: timestamp,
				});
				createdSadaqahs.push({
					id,
					boxId: options.boxId,
					value,
					currencyId: options.currencyId,
					createdAt: timestamp.toISOString(),
				});
			}

			// Update box stats
			const newCount = box.count + amount;
			const newTotalValue = box.totalValue + value * amount;
			const currencyId = box.currencyId || options.currencyId;

			await tx
				.update(boxes)
				.set({
					count: newCount,
					totalValue: newTotalValue,
					currencyId,
					updatedAt: timestamp,
				})
				.where(eq(boxes.id, options.boxId));

			const updatedBox: Box = {
				id: box.id,
				name: box.name,
				description: box.description || undefined,
				count: newCount,
				totalValue: newTotalValue,
				currencyId,
				createdAt: new Date(box.createdAt).toISOString(),
				updatedAt: timestamp.toISOString(),
			};

			return { sadaqahs: createdSadaqahs, box: updatedBox };
		});
	}
}

// Factory function
export function getSadaqahEntity(c: AppContext): SadaqahEntity {
	return new SadaqahEntity(getDbFromContext(c));
}
