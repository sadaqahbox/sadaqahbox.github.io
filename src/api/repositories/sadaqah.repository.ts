/**
 * Sadaqah Repository
 * 
 * Pure data access layer - no business logic.
 * Handles all database operations for sadaqahs.
 * 
 * @module api/repositories/sadaqah
 */

import { eq, desc, count, and, gte, lte, sql, inArray } from "drizzle-orm";
import type { Database } from "../../db";
import { sadaqahs, boxes, currencies } from "../../db/schema";
import type { Sadaqah, Currency } from "../schemas";
import { generateSadaqahId } from "../shared/id-generator";

// ============== Types ==============

export interface SadaqahRecord {
  id: string;
  boxId: string;
  value: number;
  currencyId: string;
  userId: string;
  createdAt: Date;
}

export interface CreateSadaqahData {
  boxId: string;
  value: number;
  currencyId: string;
  userId: string;
}

export interface SadaqahWithRelations extends Sadaqah {
  currency?: Currency;
}

// ============== Repository ==============

export class SadaqahRepository {
  constructor(private db: Database) {}

  // ============== CRUD Operations ==============

  /**
   * Create a new sadaqah
   */
  async create(data: CreateSadaqahData): Promise<Sadaqah> {
    const timestamp = new Date();
    const id = generateSadaqahId();

    await this.db.insert(sadaqahs).values({
      id,
      boxId: data.boxId,
      value: data.value,
      currencyId: data.currencyId,
      userId: data.userId,
      createdAt: timestamp,
    });

    return {
      id,
      boxId: data.boxId,
      value: data.value,
      currencyId: data.currencyId,
      userId: data.userId,
      createdAt: timestamp.toISOString(),
    };
  }

  /**
   * Find a sadaqah by ID
   */
  async findById(id: string): Promise<SadaqahRecord | null> {
    const result = await this.db
      .select()
      .from(sadaqahs)
      .where(eq(sadaqahs.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find a sadaqah by ID with relations using Drizzle relational queries
   */
  async findByIdWithRelations(id: string): Promise<SadaqahWithRelations | null> {
    const result = await this.db.query.sadaqahs.findFirst({
      where: eq(sadaqahs.id, id),
      with: {
        currency: true,
      },
    });

    if (!result) return null;

    const sadaqah: SadaqahWithRelations = {
      id: result.id,
      boxId: result.boxId,
      value: result.value,
      currencyId: result.currencyId,
      userId: result.userId,
      createdAt: new Date(result.createdAt).toISOString(),
    };

    if (result.currency) {
      sadaqah.currency = {
        id: result.currency.id,
        code: result.currency.code,
        name: result.currency.name,
        symbol: result.currency.symbol || undefined,
        currencyTypeId: result.currency.currencyTypeId || undefined,
      };
    }

    return sadaqah;
  }

  /**
   * Find all sadaqahs for a box
   */
  async findByBoxId(
    boxId: string,
    options?: { page?: number; limit?: number; from?: string; to?: string }
  ): Promise<{ sadaqahs: SadaqahRecord[]; total: number }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const from = options?.from;
    const to = options?.to;

    // Build where conditions
    const conditions: ReturnType<typeof eq>[] = [eq(sadaqahs.boxId, boxId)];
    if (from) conditions.push(gte(sadaqahs.createdAt, new Date(from)));
    if (to) conditions.push(lte(sadaqahs.createdAt, new Date(to)));
    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [sadaqahList, totalResult] = await Promise.all([
      this.db
        .select()
        .from(sadaqahs)
        .where(whereClause)
        .orderBy(desc(sadaqahs.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ count: count() }).from(sadaqahs).where(whereClause),
    ]);

    return {
      sadaqahs: sadaqahList,
      total: totalResult[0]?.count ?? 0,
    };
  }

  /**
   * Find all sadaqahs for a box with relations
   */
  async findByBoxIdWithRelations(
    boxId: string,
    options?: { page?: number; limit?: number; from?: string; to?: string }
  ): Promise<{ sadaqahs: SadaqahWithRelations[]; total: number }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const from = options?.from;
    const to = options?.to;

    // Build where conditions
    const conditions: ReturnType<typeof eq>[] = [eq(sadaqahs.boxId, boxId)];
    if (from) conditions.push(gte(sadaqahs.createdAt, new Date(from)));
    if (to) conditions.push(lte(sadaqahs.createdAt, new Date(to)));
    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const results = await this.db.query.sadaqahs.findMany({
      where: whereClause,
      orderBy: [desc(sadaqahs.createdAt)],
      limit,
      offset: (page - 1) * limit,
      with: {
        currency: true,
      },
    });

    // Get total count
    const totalResult = await this.db
      .select({ count: count() })
      .from(sadaqahs)
      .where(whereClause);

    return {
      sadaqahs: results.map((s) => {
        const sadaqah: SadaqahWithRelations = {
          id: s.id,
          boxId: s.boxId,
          value: s.value,
          currencyId: s.currencyId,
          userId: s.userId,
          createdAt: new Date(s.createdAt).toISOString(),
        };
        if (s.currency) {
          sadaqah.currency = {
            id: s.currency.id,
            code: s.currency.code,
            name: s.currency.name,
            symbol: s.currency.symbol || undefined,
            currencyTypeId: s.currency.currencyTypeId || undefined,
          };
        }
        return sadaqah;
      }),
      total: totalResult[0]?.count ?? 0,
    };
  }

  /**
   * Find all sadaqahs for a user
   */
  async findByUserId(userId: string): Promise<SadaqahRecord[]> {
    return this.db
      .select()
      .from(sadaqahs)
      .where(eq(sadaqahs.userId, userId))
      .orderBy(desc(sadaqahs.createdAt));
  }

  /**
   * Find all sadaqahs for a user with relations
   */
  async findByUserIdWithRelations(userId: string): Promise<SadaqahWithRelations[]> {
    const results = await this.db.query.sadaqahs.findMany({
      where: eq(sadaqahs.userId, userId),
      orderBy: [desc(sadaqahs.createdAt)],
      with: {
        currency: true,
      },
    });

    return results.map((s) => {
      const sadaqah: SadaqahWithRelations = {
        id: s.id,
        boxId: s.boxId,
        value: s.value,
        currencyId: s.currencyId,
        userId: s.userId,
        createdAt: new Date(s.createdAt).toISOString(),
      };
      if (s.currency) {
        sadaqah.currency = {
          id: s.currency.id,
          code: s.currency.code,
          name: s.currency.name,
          symbol: s.currency.symbol || undefined,
          currencyTypeId: s.currency.currencyTypeId || undefined,
        };
      }
      return sadaqah;
    });
  }

  /**
   * Delete a sadaqah
   */
  async delete(id: string): Promise<boolean> {
    await this.db.delete(sadaqahs).where(eq(sadaqahs.id, id));
    return true;
  }

  /**
   * Delete all sadaqahs for a box
   */
  async deleteByBoxId(boxId: string): Promise<void> {
    await this.db.delete(sadaqahs).where(eq(sadaqahs.boxId, boxId));
  }

  // ============== Aggregation Operations ==============

  /**
   * Get total value of sadaqahs for a box
   */
  async getTotalValue(boxId: string): Promise<number> {
    const result = await this.db
      .select({ total: sql<number>`COALESCE(SUM(${sadaqahs.value}), 0)` })
      .from(sadaqahs)
      .where(eq(sadaqahs.boxId, boxId));
    return result[0]?.total ?? 0;
  }

  /**
   * Count sadaqahs for a box
   */
  async countByBoxId(boxId: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(sadaqahs)
      .where(eq(sadaqahs.boxId, boxId));
    return result[0]?.count ?? 0;
  }

  /**
   * Get currencies for multiple sadaqahs (batch operation)
   */
  async getCurrenciesForSadaqahs(sadaqahIds: string[]): Promise<Map<string, Currency>> {
    if (sadaqahIds.length === 0) return new Map();

    // Get currency IDs from sadaqahs
    const sadaqahList = await this.db
      .select({ id: sadaqahs.id, currencyId: sadaqahs.currencyId })
      .from(sadaqahs)
      .where(inArray(sadaqahs.id, sadaqahIds));

    const currencyIds = [...new Set(sadaqahList.map((s) => s.currencyId))];
    
    // Batch fetch currencies
    const currencyList = await this.db
      .select()
      .from(currencies)
      .where(inArray(currencies.id, currencyIds));

    const currencyMap = new Map<string, Currency>();
    for (const c of currencyList) {
      currencyMap.set(c.id, {
        id: c.id,
        code: c.code,
        name: c.name,
        symbol: c.symbol || undefined,
        currencyTypeId: c.currencyTypeId || undefined,
      });
    }

    // Map sadaqah ID to currency
    const result = new Map<string, Currency>();
    for (const s of sadaqahList) {
      const currency = currencyMap.get(s.currencyId);
      if (currency) {
        result.set(s.id, currency);
      }
    }

    return result;
  }
}
