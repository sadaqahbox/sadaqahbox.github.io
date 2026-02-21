import type { AppContext, CurrencyType, CreateCurrencyTypeOptions } from "./types";
import { CurrencyTypeSchema } from "./types";
import type { Database } from "../../db";
import { getDbFromContext } from "../../db";
import { eq } from "drizzle-orm";
import { currencyTypes } from "../../db/schema";
import { generateCurrencyTypeId } from "../services/id-generator";
import { currencyTypeCache } from "../services/cache";
import { DEFAULT_CURRENCY_TYPES } from "../utils/constants";
import { sanitizeString } from "../utils/validators";

export { CurrencyTypeSchema, type CurrencyType };

/**
 * Entity class for managing currency types
 * Includes caching for improved performance
 */
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

		const currencyType: CurrencyType = {
			id,
			name,
			description,
		};

		// Cache the new currency type
		currencyTypeCache.set(`id:${id}`, currencyType);
		currencyTypeCache.set(`name:${name}`, currencyType);

		return currencyType;
	}

	async get(id: string): Promise<CurrencyType | null> {
		// Check cache first
		const cached = currencyTypeCache.get(`id:${id}`);
		if (cached) return cached;

		const result = await this.db
			.select()
			.from(currencyTypes)
			.where(eq(currencyTypes.id, id))
			.limit(1);

		if (!result[0]) return null;

		const currencyType: CurrencyType = {
			id: result[0].id,
			name: result[0].name,
			description: result[0].description || undefined,
		};

		// Cache the result
		currencyTypeCache.set(`id:${id}`, currencyType);
		currencyTypeCache.set(`name:${result[0].name}`, currencyType);

		return currencyType;
	}

	async getByName(name: string): Promise<CurrencyType | null> {
		const normalizedName = name.trim();

		// Check cache first
		const cached = currencyTypeCache.get(`name:${normalizedName}`);
		if (cached) return cached;

		const result = await this.db
			.select()
			.from(currencyTypes)
			.where(eq(currencyTypes.name, normalizedName))
			.limit(1);

		if (!result[0]) return null;

		const currencyType: CurrencyType = {
			id: result[0].id,
			name: result[0].name,
			description: result[0].description || undefined,
		};

		// Cache the result
		currencyTypeCache.set(`id:${result[0].id}`, currencyType);
		currencyTypeCache.set(`name:${normalizedName}`, currencyType);

		return currencyType;
	}

	async getOrCreate(name: string, description?: string): Promise<CurrencyType> {
		const existing = await this.getByName(name);
		if (existing) return existing;

		return this.create({
			name,
			description,
		});
	}

	async list(): Promise<CurrencyType[]> {
		// Check cache for full list
		const cacheKey = "list:all";
		const cached = currencyTypeCache.get(cacheKey) as CurrencyType[] | undefined;
		if (cached) return cached;

		const result = await this.db.select().from(currencyTypes);

		const currencyTypes_list = result.map((ct) => ({
			id: ct.id,
			name: ct.name,
			description: ct.description || undefined,
		}));

		// Cache individual currency types and the list
		for (const ct of currencyTypes_list) {
			currencyTypeCache.set(`id:${ct.id}`, ct);
			currencyTypeCache.set(`name:${ct.name}`, ct);
		}
		currencyTypeCache.set(cacheKey, currencyTypes_list);

		return currencyTypes_list;
	}

	async delete(id: string): Promise<boolean> {
		const currencyType = await this.get(id);
		if (!currencyType) return false;

		await this.db.delete(currencyTypes).where(eq(currencyTypes.id, id));

		// Invalidate cache
		currencyTypeCache.delete(`id:${id}`);
		currencyTypeCache.delete(`name:${currencyType.name}`);
		currencyTypeCache.delete("list:all");

		return true;
	}

	// ============== Default Values ==============

	/**
	 * Initializes default currency types (Fiat, Crypto, Commodity)
	 */
	async initializeDefaults(): Promise<CurrencyType[]> {
		const defaults = Object.values(DEFAULT_CURRENCY_TYPES);
		const results: CurrencyType[] = [];

		for (const def of defaults) {
			const ct = await this.getOrCreate(def.name, def.description);
			results.push(ct);
		}

		return results;
	}

	/**
	 * Gets the Fiat currency type
	 */
	async getFiatType(): Promise<CurrencyType> {
		return this.getOrCreate(
			DEFAULT_CURRENCY_TYPES.FIAT.name,
			DEFAULT_CURRENCY_TYPES.FIAT.description
		);
	}

	/**
	 * Gets the Crypto currency type
	 */
	async getCryptoType(): Promise<CurrencyType> {
		return this.getOrCreate(
			DEFAULT_CURRENCY_TYPES.CRYPTO.name,
			DEFAULT_CURRENCY_TYPES.CRYPTO.description
		);
	}

	/**
	 * Gets the Commodity currency type
	 */
	async getCommodityType(): Promise<CurrencyType> {
		return this.getOrCreate(
			DEFAULT_CURRENCY_TYPES.COMMODITY.name,
			DEFAULT_CURRENCY_TYPES.COMMODITY.description
		);
	}

	/**
	 * Batch get currency types by IDs - optimized for N+1 prevention
	 */
	async getMany(ids: string[]): Promise<Map<string, CurrencyType>> {
		const uniqueIds = [...new Set(ids)];
		const result = new Map<string, CurrencyType>();
		const missingIds: string[] = [];

		// Check cache first
		for (const id of uniqueIds) {
			const cached = currencyTypeCache.get(`id:${id}`);
			if (cached) {
				result.set(id, cached);
			} else {
				missingIds.push(id);
			}
		}

		// Fetch missing from DB
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
}

// Factory function
export function getCurrencyTypeEntity(c: AppContext): CurrencyTypeEntity {
	return new CurrencyTypeEntity(getDbFromContext(c));
}
