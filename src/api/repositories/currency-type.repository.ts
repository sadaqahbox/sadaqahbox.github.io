/**
 * Currency Type Repository
 * 
 * Pure data access layer - no business logic.
 * Handles all database operations for currency types.
 * Includes caching for frequently accessed currency types.
 * 
 * @module api/repositories/currency-type
 */

import { eq, inArray } from "drizzle-orm";
import type { Database } from "../../db";
import { currencyTypes } from "../../db/schema";
import type { CurrencyType } from "../schemas";
import { generateCurrencyTypeId } from "../shared/id-generator";
import { currencyTypeCache } from "../shared/cache";
import { DEFAULT_CURRENCY_TYPES } from "../domain/constants";

// ============== Types ==============

export interface CurrencyTypeRecord {
  id: string;
  name: string;
  description?: string | null;
}

export interface CreateCurrencyTypeData {
  name: string;
  description?: string;
}

export interface CurrencyTypeWithRelations extends CurrencyType {
  currencies?: { id: string; code: string; name: string }[];
}

// ============== Repository ==============

export class CurrencyTypeRepository {
  constructor(private db: Database) {}

  // ============== CRUD Operations ==============

  /**
   * Create a new currency type
   */
  async create(data: CreateCurrencyTypeData): Promise<CurrencyType> {
    const id = generateCurrencyTypeId();

    await this.db.insert(currencyTypes).values({
      id,
      name: data.name,
      description: data.description || null,
    });

    const currencyType: CurrencyType = {
      id,
      name: data.name,
      description: data.description,
    };

    this.cacheCurrencyType(currencyType);
    return currencyType;
  }

  /**
   * Find a currency type by ID
   */
  async findById(id: string): Promise<CurrencyTypeRecord | null> {
    const cached = currencyTypeCache.get(`id:${id}`) as CurrencyType | undefined;
    if (cached) return cached;

    const result = await this.db
      .select()
      .from(currencyTypes)
      .where(eq(currencyTypes.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find a currency type by ID with relations using Drizzle relational queries
   */
  async findByIdWithRelations(id: string): Promise<CurrencyTypeWithRelations | null> {
    const result = await this.db.query.currencyTypes.findFirst({
      where: eq(currencyTypes.id, id),
      with: {
        currencies: true,
      },
    });

    if (!result) return null;

    const currencyType: CurrencyTypeWithRelations = {
      id: result.id,
      name: result.name,
      description: result.description || undefined,
    };

    if (result.currencies && result.currencies.length > 0) {
      currencyType.currencies = result.currencies.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
      }));
    }

    return currencyType;
  }

  /**
   * Find a currency type by name
   */
  async findByName(name: string): Promise<CurrencyTypeRecord | null> {
    const normalizedName = name.trim();
    const cached = currencyTypeCache.get(`name:${normalizedName}`) as CurrencyType | undefined;
    if (cached) return cached;

    const result = await this.db
      .select()
      .from(currencyTypes)
      .where(eq(currencyTypes.name, normalizedName))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find all currency types
   */
  async findAll(): Promise<CurrencyTypeRecord[]> {
    const cached = currencyTypeCache.get("list:all") as CurrencyType[] | undefined;
    if (cached) return cached;

    return this.db.select().from(currencyTypes);
  }

  /**
   * Find all currency types with relations
   */
  async findAllWithRelations(): Promise<CurrencyTypeWithRelations[]> {
    const results = await this.db.query.currencyTypes.findMany({
      with: {
        currencies: true,
      },
    });

    return results.map((ct) => {
      const currencyType: CurrencyTypeWithRelations = {
        id: ct.id,
        name: ct.name,
        description: ct.description || undefined,
      };

      if (ct.currencies && ct.currencies.length > 0) {
        currencyType.currencies = ct.currencies.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
        }));
      }

      return currencyType;
    });
  }

  /**
   * Update a currency type
   */
  async update(id: string, data: Partial<CreateCurrencyTypeData>): Promise<CurrencyTypeRecord | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description || null;
    }

    await this.db.update(currencyTypes).set(updateData).where(eq(currencyTypes.id, id));

    // Invalidate cache
    const currencyType = await this.findById(id);
    if (currencyType) {
      currencyTypeCache.delete(`id:${id}`);
      currencyTypeCache.delete(`name:${currencyType.name}`);
      currencyTypeCache.delete("list:all");
    }

    return currencyType;
  }

  /**
   * Delete a currency type
   */
  async delete(id: string): Promise<boolean> {
    const currencyType = await this.findById(id);
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
   * Get or create a currency type by name
   */
  async getOrCreate(name: string, description?: string): Promise<CurrencyType> {
    const existing = await this.findByName(name);
    if (existing) {
      return this.mapToCurrencyType(existing);
    }
    return this.create({ name, description });
  }

  /**
   * Initialize default currency types
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
   * Get Fiat currency type
   */
  async getFiatType(): Promise<CurrencyType> {
    return this.getOrCreate(
      DEFAULT_CURRENCY_TYPES.FIAT.name,
      DEFAULT_CURRENCY_TYPES.FIAT.description
    );
  }

  /**
   * Get Crypto currency type
   */
  async getCryptoType(): Promise<CurrencyType> {
    return this.getOrCreate(
      DEFAULT_CURRENCY_TYPES.CRYPTO.name,
      DEFAULT_CURRENCY_TYPES.CRYPTO.description
    );
  }

  /**
   * Get Commodity currency type
   */
  async getCommodityType(): Promise<CurrencyType> {
    return this.getOrCreate(
      DEFAULT_CURRENCY_TYPES.COMMODITY.name,
      DEFAULT_CURRENCY_TYPES.COMMODITY.description
    );
  }

  // ============== Batch Operations ==============

  /**
   * Get multiple currency types by IDs (batch operation with caching)
   */
  async findMany(ids: string[]): Promise<Map<string, CurrencyType>> {
    const uniqueIds = [...new Set(ids)];
    const result = new Map<string, CurrencyType>();
    const missingIds: string[] = [];

    // Check cache first
    for (const id of uniqueIds) {
      const cached = currencyTypeCache.get(`id:${id}`) as CurrencyType | undefined;
      if (cached) {
        result.set(id, cached);
      } else {
        missingIds.push(id);
      }
    }

    // Batch fetch missing currency types from DB
    if (missingIds.length > 0) {
      const dbCurrencyTypes = await this.db
        .select()
        .from(currencyTypes)
        .where(inArray(currencyTypes.id, missingIds));

      for (const ct of dbCurrencyTypes) {
        const mapped = this.mapToCurrencyType(ct);
        result.set(ct.id, mapped);
        this.cacheCurrencyType(mapped);
      }
    }

    return result;
  }

  // ============== Helpers ==============

  private mapToCurrencyType(ct: CurrencyTypeRecord): CurrencyType {
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
