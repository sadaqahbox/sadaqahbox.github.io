/**
 * Currency entity - Database operations only
 */

import { eq, inArray } from "drizzle-orm";
import type { Database } from "../../db";
import { currencies } from "../../db/schema";
import type { Currency, CreateCurrencyOptions, GetOrCreateOptions } from "../domain/types";
import { DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_NAME, DEFAULT_CURRENCY_SYMBOL } from "../domain/constants";
import { generateCurrencyId } from "../shared/id-generator";
import { currencyCache } from "../shared/cache";
import { sanitizeString } from "../shared/validators";

export interface CurrencyWithRates extends Currency {
	usdValue?: number | null | undefined;
	lastRateUpdate?: string | null | undefined;
}

// Keep CurrencyWithGold as an alias for backwards compatibility
export type CurrencyWithGold = CurrencyWithRates;

export class CurrencyEntity {
	constructor(private db: Database) {}

	// ============== CRUD Operations ==============

	async create(data: CreateCurrencyOptions & { usdValue?: number }): Promise<CurrencyWithRates> {
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
			usdValue: data.usdValue ?? null,
			lastRateUpdate: data.usdValue ? new Date() : null,
		});

		const currency: CurrencyWithRates = { 
			id, 
			code, 
			name, 
			symbol, 
			currencyTypeId: data.currencyTypeId,
			usdValue: data.usdValue ?? null,
			lastRateUpdate: data.usdValue ? new Date().toISOString() : null,
		};
		this.cacheCurrency(currency);
		return currency;
	}

	async get(id: string): Promise<CurrencyWithRates | null> {
		const cached = currencyCache.get(`id:${id}`) as CurrencyWithRates | undefined;
		if (cached) return cached;

		const result = await this.db.select().from(currencies).where(eq(currencies.id, id)).limit(1);
		if (!result[0]) return null;

		const currency = this.mapCurrency(result[0]);
		this.cacheCurrency(currency);
		return currency;
	}

	async getByCode(code: string): Promise<CurrencyWithRates | null> {
		const upperCode = code.toUpperCase();
		const cached = currencyCache.get(`code:${upperCode}`) as CurrencyWithRates | undefined;
		if (cached) return cached;

		const result = await this.db.select().from(currencies).where(eq(currencies.code, upperCode)).limit(1);
		if (!result[0]) return null;

		const currency = this.mapCurrency(result[0]);
		this.cacheCurrency(currency);
		return currency;
	}

	async getOrCreate(options: GetOrCreateOptions & { usdValue?: number }): Promise<CurrencyWithRates> {
		const existing = await this.getByCode(options.code);
		if (existing) return existing;

		return this.create({
			code: options.code,
			name: options.name || options.code.toUpperCase(),
			symbol: options.symbol,
			currencyTypeId: options.currencyTypeId,
			usdValue: options.usdValue,
		});
	}

	async getDefault(): Promise<CurrencyWithRates> {
		return this.getOrCreate({
			code: DEFAULT_CURRENCY_CODE,
			name: DEFAULT_CURRENCY_NAME,
			symbol: DEFAULT_CURRENCY_SYMBOL,
		});
	}

	async list(): Promise<CurrencyWithRates[]> {
		const cached = currencyCache.get("list:all") as CurrencyWithRates[] | undefined;
		if (cached) return cached;

		const result = await this.db.select().from(currencies);
		const currencies_list = result.map((c) => this.mapCurrency(c));

		for (const currency of currencies_list) {
			this.cacheCurrency(currency);
		}
		currencyCache.set("list:all", currencies_list);

		return currencies_list;
	}

	async delete(id: string): Promise<boolean> {
		const currency = await this.get(id);
		if (!currency) return false;

		await this.db.delete(currencies).where(eq(currencies.id, id));

		currencyCache.delete(`id:${id}`);
		currencyCache.delete(`code:${currency.code}`);
		currencyCache.delete("list:all");

		return true;
	}

	// ============== Rate Operations ==============

	/**
	 * Update USD value for a currency
	 */
	async updateUsdValue(id: string, usdValue: number): Promise<CurrencyWithRates | null> {
		const currency = await this.get(id);
		if (!currency) return null;

		const now = new Date();
		await this.db.update(currencies)
			.set({ usdValue, lastRateUpdate: now })
			.where(eq(currencies.id, id));

		// Invalidate cache
		currencyCache.delete(`id:${id}`);
		currencyCache.delete(`code:${currency.code}`);
		currencyCache.delete("list:all");

		return this.get(id);
	}

	/**
	 * Batch update USD values for multiple currencies
	 */
	async updateUsdValues(updates: Array<{ id: string; usdValue: number }>): Promise<void> {
		const now = new Date();
		for (const update of updates) {
			await this.db.update(currencies)
				.set({ usdValue: update.usdValue, lastRateUpdate: now })
				.where(eq(currencies.id, update.id));
		}
		// Clear all currency cache
		currencyCache.clear();
	}

	/**
	 * Get currencies that need rate updates (older than specified age)
	 */
	async getStaleCurrencies(maxAgeMs: number = 60 * 60 * 1000): Promise<CurrencyWithRates[]> {
		const cutoff = new Date(Date.now() - maxAgeMs);
		const result = await this.db.select().from(currencies);
		
		return result
			.filter((c) => !c.lastRateUpdate || new Date(c.lastRateUpdate) < cutoff)
			.map((c) => this.mapCurrency(c));
	}

	// ============== Batch Operations ==============

	async getMany(ids: string[]): Promise<Map<string, CurrencyWithRates>> {
		const uniqueIds = [...new Set(ids)];
		const result = new Map<string, CurrencyWithRates>();
		const missingIds: string[] = [];

		// Check cache first
		for (const id of uniqueIds) {
			const cached = currencyCache.get(`id:${id}`) as CurrencyWithRates | undefined;
			if (cached) {
				result.set(id, cached);
			} else {
				missingIds.push(id);
			}
		}

		// Batch fetch missing currencies from DB (N+1 fix)
		if (missingIds.length > 0) {
			const dbCurrencies = await this.db
				.select()
				.from(currencies)
				.where(inArray(currencies.id, missingIds));
			
			for (const c of dbCurrencies) {
				const currency = this.mapCurrency(c);
				result.set(c.id, currency);
				this.cacheCurrency(currency);
			}
		}

		return result;
	}

	// ============== Helpers ==============

	private mapCurrency(c: typeof currencies.$inferSelect): CurrencyWithRates {
		return {
			id: c.id,
			code: c.code,
			name: c.name,
			symbol: c.symbol || undefined,
			currencyTypeId: c.currencyTypeId || undefined,
			usdValue: c.usdValue,
			lastRateUpdate: c.lastRateUpdate ? new Date(c.lastRateUpdate).toISOString() : null,
		};
	}

	private cacheCurrency(currency: CurrencyWithRates): void {
		currencyCache.set(`id:${currency.id}`, currency);
		currencyCache.set(`code:${currency.code}`, currency);
	}
}
