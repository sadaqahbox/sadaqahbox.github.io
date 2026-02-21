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

		const currency: Currency = { id, code, name, symbol, currencyTypeId: data.currencyTypeId };
		this.cacheCurrency(currency);
		return currency;
	}

	async get(id: string): Promise<Currency | null> {
		const cached = currencyCache.get(`id:${id}`) as Currency | undefined;
		if (cached) return cached;

		const result = await this.db.select().from(currencies).where(eq(currencies.id, id)).limit(1);
		if (!result[0]) return null;

		const currency = this.mapCurrency(result[0]);
		this.cacheCurrency(currency);
		return currency;
	}

	async getByCode(code: string): Promise<Currency | null> {
		const upperCode = code.toUpperCase();
		const cached = currencyCache.get(`code:${upperCode}`) as Currency | undefined;
		if (cached) return cached;

		const result = await this.db.select().from(currencies).where(eq(currencies.code, upperCode)).limit(1);
		if (!result[0]) return null;

		const currency = this.mapCurrency(result[0]);
		this.cacheCurrency(currency);
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

	async getDefault(): Promise<Currency> {
		return this.getOrCreate({
			code: DEFAULT_CURRENCY_CODE,
			name: DEFAULT_CURRENCY_NAME,
			symbol: DEFAULT_CURRENCY_SYMBOL,
		});
	}

	async list(): Promise<Currency[]> {
		const cached = currencyCache.get("list:all") as Currency[] | undefined;
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

	// ============== Batch Operations ==============

	async getMany(ids: string[]): Promise<Map<string, Currency>> {
		const uniqueIds = [...new Set(ids)];
		const result = new Map<string, Currency>();
		const missingIds: string[] = [];

		for (const id of uniqueIds) {
			const cached = currencyCache.get(`id:${id}`) as Currency | undefined;
			if (cached) {
				result.set(id, cached);
			} else {
				missingIds.push(id);
			}
		}

		if (missingIds.length > 0) {
			const all = await this.list();
			for (const currency of all) {
				if (missingIds.includes(currency.id)) {
					result.set(currency.id, currency);
				}
			}
		}

		return result;
	}

	// ============== Helpers ==============

	private mapCurrency(c: typeof currencies.$inferSelect): Currency {
		return {
			id: c.id,
			code: c.code,
			name: c.name,
			symbol: c.symbol || undefined,
			currencyTypeId: c.currencyTypeId || undefined,
		};
	}

	private cacheCurrency(currency: Currency): void {
		currencyCache.set(`id:${currency.id}`, currency);
		currencyCache.set(`code:${currency.code}`, currency);
	}
}
