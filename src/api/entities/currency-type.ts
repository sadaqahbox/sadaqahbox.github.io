/**
 * Currency Type entity - Database operations only
 */

import { eq } from "drizzle-orm";
import type { Database } from "../../db";
import { currencyTypes } from "../../db/schema";
import type { CurrencyType, CreateCurrencyTypeOptions } from "../domain/types";
import { DEFAULT_CURRENCY_TYPES } from "../domain/constants";
import { generateCurrencyTypeId } from "../shared/id-generator";
import { currencyTypeCache } from "../shared/cache";
import { sanitizeString } from "../shared/validators";

export class CurrencyTypeEntity {
	constructor(private db: Database) {}

	// ============== CRUD Operations ==============

	async create(data: CreateCurrencyTypeOptions): Promise<CurrencyType> {
		const id = generateCurrencyTypeId();
		const name = sanitizeString(data.name);
		const description = sanitizeString(data.description);

		await this.db.insert(currencyTypes).values({
			id,
			name,
			description: description || null,
		});

		const currencyType: CurrencyType = { id, name, description };
		this.cacheCurrencyType(currencyType);
		return currencyType;
	}

	async get(id: string): Promise<CurrencyType | null> {
		const cached = currencyTypeCache.get(`id:${id}`) as CurrencyType | undefined;
		if (cached) return cached;

		const result = await this.db.select().from(currencyTypes).where(eq(currencyTypes.id, id)).limit(1);
		if (!result[0]) return null;

		const currencyType = this.mapCurrencyType(result[0]);
		this.cacheCurrencyType(currencyType);
		return currencyType;
	}

	async getByName(name: string): Promise<CurrencyType | null> {
		const normalizedName = name.trim();
		const cached = currencyTypeCache.get(`name:${normalizedName}`) as CurrencyType | undefined;
		if (cached) return cached;

		const result = await this.db
			.select()
			.from(currencyTypes)
			.where(eq(currencyTypes.name, normalizedName))
			.limit(1);

		if (!result[0]) return null;

		const currencyType = this.mapCurrencyType(result[0]);
		this.cacheCurrencyType(currencyType);
		return currencyType;
	}

	async getOrCreate(name: string, description?: string): Promise<CurrencyType> {
		const existing = await this.getByName(name);
		if (existing) return existing;
		return this.create({ name, description });
	}

	async list(): Promise<CurrencyType[]> {
		const cached = currencyTypeCache.get("list:all") as CurrencyType[] | undefined;
		if (cached) return cached;

		const result = await this.db.select().from(currencyTypes);
		const currencyTypes_list = result.map((ct) => this.mapCurrencyType(ct));

		for (const ct of currencyTypes_list) {
			this.cacheCurrencyType(ct);
		}
		currencyTypeCache.set("list:all", currencyTypes_list);

		return currencyTypes_list;
	}

	async delete(id: string): Promise<boolean> {
		const currencyType = await this.get(id);
		if (!currencyType) return false;

		await this.db.delete(currencyTypes).where(eq(currencyTypes.id, id));

		currencyTypeCache.delete(`id:${id}`);
		currencyTypeCache.delete(`name:${currencyType.name}`);
		currencyTypeCache.delete("list:all");

		return true;
	}

	// ============== Default Values ==============

	async initializeDefaults(): Promise<CurrencyType[]> {
		const defaults = Object.values(DEFAULT_CURRENCY_TYPES);
		const results: CurrencyType[] = [];

		for (const def of defaults) {
			const ct = await this.getOrCreate(def.name, def.description);
			results.push(ct);
		}

		return results;
	}

	async getFiatType(): Promise<CurrencyType> {
		return this.getOrCreate(DEFAULT_CURRENCY_TYPES.FIAT.name, DEFAULT_CURRENCY_TYPES.FIAT.description);
	}

	async getCryptoType(): Promise<CurrencyType> {
		return this.getOrCreate(DEFAULT_CURRENCY_TYPES.CRYPTO.name, DEFAULT_CURRENCY_TYPES.CRYPTO.description);
	}

	async getCommodityType(): Promise<CurrencyType> {
		return this.getOrCreate(DEFAULT_CURRENCY_TYPES.COMMODITY.name, DEFAULT_CURRENCY_TYPES.COMMODITY.description);
	}

	// ============== Batch Operations ==============

	async getMany(ids: string[]): Promise<Map<string, CurrencyType>> {
		const uniqueIds = [...new Set(ids)];
		const result = new Map<string, CurrencyType>();
		const missingIds: string[] = [];

		for (const id of uniqueIds) {
			const cached = currencyTypeCache.get(`id:${id}`) as CurrencyType | undefined;
			if (cached) {
				result.set(id, cached);
			} else {
				missingIds.push(id);
			}
		}

		if (missingIds.length > 0) {
			const all = await this.list();
			for (const ct of all) {
				if (missingIds.includes(ct.id)) {
					result.set(ct.id, ct);
				}
			}
		}

		return result;
	}

	// ============== Helpers ==============

	private mapCurrencyType(ct: typeof currencyTypes.$inferSelect): CurrencyType {
		return {
			id: ct.id,
			name: ct.name,
			description: ct.description || undefined,
		};
	}

	private cacheCurrencyType(currencyType: CurrencyType): void {
		currencyTypeCache.set(`id:${currencyType.id}`, currencyType);
		currencyTypeCache.set(`name:${currencyType.name}`, currencyType);
	}
}
