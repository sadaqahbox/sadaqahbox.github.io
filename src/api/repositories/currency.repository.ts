/**
 * Currency Repository
 * 
 * Pure data access layer - no business logic.
 * Handles all database operations for currencies.
 * Includes caching for frequently accessed currencies.
 * 
 * @module api/repositories/currency
 */

import { eq, inArray } from "drizzle-orm";
import type { Database } from "../../db";
import { currencies } from "../../db/schema";
import type { Currency } from "../schemas";
import { generateCurrencyId } from "../shared/id-generator";
import { currencyCache } from "../shared/cache";

// ============== Types ==============

export interface CurrencyRecord {
  id: string;
  code: string;
  name: string;
  symbol?: string | null;
  currencyTypeId?: string | null;
  usdValue?: number | null;
  lastRateUpdate?: string | null;
}

export interface CreateCurrencyData {
  code: string;
  name: string;
  symbol?: string;
  currencyTypeId?: string;
  usdValue?: number;
}

export interface CurrencyWithRelations extends Currency {
  currencyType?: { id: string; name: string; description?: string };
}

// ============== Repository ==============

export class CurrencyRepository {
  constructor(private db: Database) {}

  // ============== CRUD Operations ==============

  /**
   * Create a new currency
   */
  async create(data: CreateCurrencyData): Promise<Currency> {
    const id = generateCurrencyId();
    const code = data.code.toUpperCase();
    const now = data.usdValue ? new Date() : null;

    await this.db.insert(currencies).values({
      id,
      code,
      name: data.name,
      symbol: data.symbol || null,
      currencyTypeId: data.currencyTypeId || null,
      usdValue: data.usdValue ?? null,
      lastRateUpdate: now,
    });

    const currency: Currency = {
      id,
      code,
      name: data.name,
      symbol: data.symbol,
      currencyTypeId: data.currencyTypeId,
      usdValue: data.usdValue ?? null,
      lastRateUpdate: now ? now.toISOString() : null,
    };

    this.cacheCurrency(currency);
    return currency;
  }

  /**
   * Find a currency by ID
   */
  async findById(id: string): Promise<CurrencyRecord | null> {
    const cached = currencyCache.get(`id:${id}`) as Currency | undefined;
    if (cached) return cached;

    const result = await this.db
      .select()
      .from(currencies)
      .where(eq(currencies.id, id))
      .limit(1);
    
    if (!result[0]) return null;
    
    return {
      id: result[0].id,
      code: result[0].code,
      name: result[0].name,
      symbol: result[0].symbol,
      currencyTypeId: result[0].currencyTypeId,
      usdValue: result[0].usdValue,
      lastRateUpdate: result[0].lastRateUpdate ? new Date(result[0].lastRateUpdate).toISOString() : null,
    };
  }

  /**
   * Find a currency by ID with relations using Drizzle relational queries
   */
  async findByIdWithRelations(id: string): Promise<CurrencyWithRelations | null> {
    const result = await this.db.query.currencies.findFirst({
      where: eq(currencies.id, id),
      with: {
        currencyType: true,
      },
    });

    if (!result) return null;

    const currency: CurrencyWithRelations = {
      id: result.id,
      code: result.code,
      name: result.name,
      symbol: result.symbol || undefined,
      currencyTypeId: result.currencyTypeId || undefined,
      usdValue: result.usdValue,
      lastRateUpdate: result.lastRateUpdate ? new Date(result.lastRateUpdate).toISOString() : null,
    };

    if (result.currencyType) {
      currency.currencyType = {
        id: result.currencyType.id,
        name: result.currencyType.name,
        description: result.currencyType.description || undefined,
      };
    }

    return currency;
  }

  /**
   * Find a currency by code
   */
  async findByCode(code: string): Promise<CurrencyRecord | null> {
    const upperCode = code.toUpperCase();
    const cached = currencyCache.get(`code:${upperCode}`) as Currency | undefined;
    if (cached) return cached;

    const result = await this.db
      .select()
      .from(currencies)
      .where(eq(currencies.code, upperCode))
      .limit(1);
    
    if (!result[0]) return null;
    
    return {
      id: result[0].id,
      code: result[0].code,
      name: result[0].name,
      symbol: result[0].symbol,
      currencyTypeId: result[0].currencyTypeId,
      usdValue: result[0].usdValue,
      lastRateUpdate: result[0].lastRateUpdate ? new Date(result[0].lastRateUpdate).toISOString() : null,
    };
  }

  /**
   * Find all currencies
   */
  async findAll(): Promise<CurrencyRecord[]> {
    const cached = currencyCache.get("list:all") as Currency[] | undefined;
    if (cached) return cached;

    const results = await this.db.select().from(currencies);
    return results.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      symbol: r.symbol,
      currencyTypeId: r.currencyTypeId,
      usdValue: r.usdValue,
      lastRateUpdate: r.lastRateUpdate ? new Date(r.lastRateUpdate).toISOString() : null,
    }));
  }

  /**
   * Find all currencies with relations
   */
  async findAllWithRelations(): Promise<CurrencyWithRelations[]> {
    const results = await this.db.query.currencies.findMany({
      with: {
        currencyType: true,
      },
    });

    return results.map((c) => {
      const currency: CurrencyWithRelations = {
        id: c.id,
        code: c.code,
        name: c.name,
        symbol: c.symbol || undefined,
        currencyTypeId: c.currencyTypeId || undefined,
        usdValue: c.usdValue,
        lastRateUpdate: c.lastRateUpdate ? new Date(c.lastRateUpdate).toISOString() : null,
      };
      if (c.currencyType) {
        currency.currencyType = {
          id: c.currencyType.id,
          name: c.currencyType.name,
          description: c.currencyType.description || undefined,
        };
      }
      return currency;
    });
  }

  /**
   * Update a currency
   */
  async update(
    id: string,
    data: Partial<CreateCurrencyData>
  ): Promise<CurrencyRecord | null> {
    const updateData: Record<string, unknown> = {};

    if (data.code !== undefined) {
      updateData.code = data.code.toUpperCase();
    }
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.symbol !== undefined) {
      updateData.symbol = data.symbol || null;
    }
    if (data.currencyTypeId !== undefined) {
      updateData.currencyTypeId = data.currencyTypeId || null;
    }

    await this.db.update(currencies).set(updateData).where(eq(currencies.id, id));

    // Invalidate cache
    const currency = await this.findById(id);
    if (currency) {
      currencyCache.delete(`id:${id}`);
      currencyCache.delete(`code:${currency.code}`);
      currencyCache.delete("list:all");
    }

    return currency;
  }

  /**
   * Delete a currency
   */
  async delete(id: string): Promise<boolean> {
    const currency = await this.findById(id);
    if (!currency) return false;

    await this.db.delete(currencies).where(eq(currencies.id, id));

    // Invalidate cache
    currencyCache.delete(`id:${id}`);
    currencyCache.delete(`code:${currency.code}`);
    currencyCache.delete("list:all");

    return true;
  }

  // ============== Batch Operations ==============

  /**
   * Get multiple currencies by IDs (batch operation with caching)
   */
  async findMany(ids: string[]): Promise<Map<string, Currency>> {
    const uniqueIds = [...new Set(ids)];
    const result = new Map<string, Currency>();
    const missingIds: string[] = [];

    // Check cache first
    for (const id of uniqueIds) {
      const cached = currencyCache.get(`id:${id}`) as Currency | undefined;
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
        const record: CurrencyRecord = {
          id: c.id,
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          currencyTypeId: c.currencyTypeId,
          usdValue: c.usdValue,
          lastRateUpdate: c.lastRateUpdate ? new Date(c.lastRateUpdate).toISOString() : null,
        };
        const currency = this.mapToCurrency(record);
        result.set(c.id, currency);
        this.cacheCurrency(currency);
      }
    }

    return result;
  }

  /**
   * Get or create a currency by code
   */
  async getOrCreate(data: CreateCurrencyData): Promise<Currency> {
    const existing = await this.findByCode(data.code);
    if (existing) {
      return this.mapToCurrency(existing);
    }

    return this.create(data);
  }

  // ============== Helpers ==============

  private mapToCurrency(c: CurrencyRecord): Currency {
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      symbol: c.symbol || undefined,
      currencyTypeId: c.currencyTypeId || undefined,
      usdValue: c.usdValue,
      lastRateUpdate: c.lastRateUpdate,
    };
  }

  private cacheCurrency(currency: Currency): void {
    currencyCache.set(`id:${currency.id}`, currency);
    currencyCache.set(`code:${currency.code}`, currency);
  }
}
