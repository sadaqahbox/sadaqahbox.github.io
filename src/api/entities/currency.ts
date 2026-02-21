import type { AppContext, Currency, CreateCurrencyOptions, GetOrCreateOptions, CurrencyType } from "./types";
import { CurrencySchema } from "./types";
import type { Database } from "../../db";
import { getDbFromContext } from "../../db";
import { eq } from "drizzle-orm";
import { currencies, currencyTypes } from "../../db/schema";
import { generateCurrencyId } from "../services/id-generator";
import { currencyCache } from "../services/cache";
import { DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_NAME, DEFAULT_CURRENCY_SYMBOL } from "../utils/constants";
import { sanitizeString } from "../utils/validators";
import { getCurrencyTypeEntity } from "./currency-type";

export { CurrencySchema, type Currency };

/**
 * Entity class for managing currencies
 * Includes caching for improved performance
 */
export class CurrencyEntity {
	constructor(private db: Database) {}

	// ============== CRUD Operations ==============

	async create(data: CreateCurrencyOptions): Promise<Currency> {
		const id = generateCurrencyId();
		const code = data.code.toUpperCase();
		const name = sanitizeString(data.name) || code;
		const symbol = sanitizeString(data.symbol);

		await this.db.insert(currencies).values({
			id,
			code,
			name,
			symbol: symbol || null,
			currencyTypeId: data.currencyTypeId || null,
		});

		const currency: Currency = {
			id,
			code,
			name,
			symbol,
			currencyTypeId: data.currencyTypeId,
		};

		// Cache the new currency
		currencyCache.set(`id:${id}`, currency);
		currencyCache.set(`code:${code}`, currency);

		return currency;
	}

	async get(id: string): Promise<Currency | null> {
		// Check cache first
		const cached = currencyCache.get(`id:${id}`);
		if (cached) return cached;

		const result = await this.db
			.select()
			.from(currencies)
			.where(eq(currencies.id, id))
			.limit(1);

		if (!result[0]) return null;

		const currency: Currency = {
			id: result[0].id,
			code: result[0].code,
			name: result[0].name,
			symbol: result[0].symbol || undefined,
			currencyTypeId: result[0].currencyTypeId || undefined,
		};

		// Cache the result
		currencyCache.set(`id:${id}`, currency);
		currencyCache.set(`code:${result[0].code}`, currency);

		return currency;
	}

	async getByCode(code: string): Promise<Currency | null> {
		const upperCode = code.toUpperCase();
		
		// Check cache first
		const cached = currencyCache.get(`code:${upperCode}`);
		if (cached) return cached;

		const result = await this.db
			.select()
			.from(currencies)
			.where(eq(currencies.code, upperCode))
			.limit(1);

		if (!result[0]) return null;

		const currency: Currency = {
			id: result[0].id,
			code: result[0].code,
			name: result[0].name,
			symbol: result[0].symbol || undefined,
			currencyTypeId: result[0].currencyTypeId || undefined,
		};

		// Cache the result
		currencyCache.set(`id:${result[0].id}`, currency);
		currencyCache.set(`code:${upperCode}`, currency);

		return currency;
	}

	async getOrCreate(options: GetOrCreateOptions): Promise<Currency> {
		const existing = await this.getByCode(options.code);
		if (existing) return existing;

		return this.create({
			code: options.code,
			name: options.name || options.code.toUpperCase(),
			symbol: options.symbol,
			currencyTypeId: options.currencyTypeId,
		});
	}

	/**
	 * Gets or creates the default currency (USD)
	 */
	async getDefault(): Promise<Currency> {
		return this.getOrCreate({
			code: DEFAULT_CURRENCY_CODE,
			name: DEFAULT_CURRENCY_NAME,
			symbol: DEFAULT_CURRENCY_SYMBOL,
		});
	}

	async list(): Promise<Currency[]> {
		// Check cache for full list
		const cacheKey = "list:all";
		const cached = currencyCache.get(cacheKey) as Currency[] | undefined;
		if (cached) return cached;

		const result = await this.db.select().from(currencies);

		const currencies_list = result.map((c) => ({
			id: c.id,
			code: c.code,
			name: c.name,
			symbol: c.symbol || undefined,
			currencyTypeId: c.currencyTypeId || undefined,
		}));

		// Cache individual currencies and the list
		for (const currency of currencies_list) {
			currencyCache.set(`id:${currency.id}`, currency);
			currencyCache.set(`code:${currency.code}`, currency);
		}
		currencyCache.set(cacheKey, currencies_list);

		return currencies_list;
	}

	async delete(id: string): Promise<boolean> {
		const currency = await this.get(id);
		if (!currency) return false;

		await this.db.delete(currencies).where(eq(currencies.id, id));

		// Invalidate cache
		currencyCache.delete(`id:${id}`);
		currencyCache.delete(`code:${currency.code}`);
		currencyCache.delete("list:all");

		return true;
	}

	/**
	 * Batch get currencies by IDs - optimized for N+1 prevention
	 */
	async getMany(ids: string[]): Promise<Map<string, Currency>> {
		const uniqueIds = [...new Set(ids)];
		const result = new Map<string, Currency>();
		const missingIds: string[] = [];

		// Check cache first
		for (const id of uniqueIds) {
			const cached = currencyCache.get(`id:${id}`);
			if (cached) {
				result.set(id, cached);
			} else {
				missingIds.push(id);
			}
		}

		// Fetch missing from DB
		if (missingIds.length > 0) {
			// Note: Drizzle doesn't have a direct "in" operator, so we fetch all and filter
			// In production with many currencies, consider a more targeted query
			const all = await this.list();
			for (const currency of all) {
				if (missingIds.includes(currency.id)) {
					result.set(currency.id, currency);
				}
			}
		}

		return result;
	}

	/**
	 * Get a currency with its currency type
	 */
	async getWithCurrencyType(id: string, c: AppContext): Promise<(Currency & { currencyType?: CurrencyType }) | null> {
		const currency = await this.get(id);
		if (!currency || !currency.currencyTypeId) return currency;

		const currencyTypeEntity = getCurrencyTypeEntity(c);
		const currencyType = await currencyTypeEntity.get(currency.currencyTypeId);

		return {
			...currency,
			currencyType: currencyType || undefined,
		};
	}
}

// Factory function

// Factory function
export function getCurrencyEntity(c: AppContext): CurrencyEntity {
	return new CurrencyEntity(getDbFromContext(c));
}
