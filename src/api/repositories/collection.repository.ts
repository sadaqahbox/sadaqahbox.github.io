/**
 * Collection Repository
 * 
 * Pure data access layer - no business logic.
 * Handles all database operations for collections (box emptying history).
 * 
 * @module api/repositories/collection
 */

import { eq, desc, count, and, inArray } from "drizzle-orm";
import type { Database } from "../../db";
import { collections, boxes, currencies } from "../../db/schema";
import type { Collection, Currency } from "../schemas";
import { generateCollectionId } from "../shared/id-generator";

// ============== Types ==============

export interface CollectionRecord {
  id: string;
  boxId: string;
  userId: string;
  emptiedAt: Date;
  totalValue: number;
  totalValueExtra: {
    [currencyId: string]: { total: number; code: string; name: string };
  } | null;
  currencyId: string;
}

export interface CreateCollectionData {
  boxId: string;
  userId: string;
  totalValue: number;
  totalValueExtra?: {
    [currencyId: string]: { total: number; code: string; name: string };
  };
  currencyId: string;
}

export interface CollectionWithRelations extends Collection {
  currency?: Currency;
  box?: { id: string; name: string };
}

// ============== Repository ==============

export class CollectionRepository {
  constructor(private db: Database) {}

  // ============== CRUD Operations ==============

  /**
   * Create a new collection
   */
  async create(data: CreateCollectionData): Promise<Collection> {
    const timestamp = new Date();
    const id = generateCollectionId();

    await this.db.insert(collections).values({
      id,
      boxId: data.boxId,
      userId: data.userId,
      emptiedAt: timestamp,
      totalValue: data.totalValue,
      totalValueExtra: data.totalValueExtra || null,
      currencyId: data.currencyId,
    });

    return {
      id,
      boxId: data.boxId,
      emptiedAt: timestamp.toISOString(),
      totalValue: data.totalValue,
      totalValueExtra: data.totalValueExtra || null,
      currencyId: data.currencyId,
    };
  }

  /**
   * Find a collection by ID
   */
  async findById(id: string): Promise<CollectionRecord | null> {
    const result = await this.db
      .select()
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find a collection by ID with relations using Drizzle relational queries
   */
  async findByIdWithRelations(id: string): Promise<CollectionWithRelations | null> {
    const result = await this.db.query.collections.findFirst({
      where: eq(collections.id, id),
      with: {
        currency: true,
        box: true,
      },
    });

    if (!result) return null;

    const collection: CollectionWithRelations = {
      id: result.id,
      boxId: result.boxId,
      emptiedAt: new Date(result.emptiedAt).toISOString(),
      totalValue: result.totalValue,
      totalValueExtra: result.totalValueExtra,
      currencyId: result.currencyId,
    };

    if (result.currency) {
      collection.currency = {
        id: result.currency.id,
        code: result.currency.code,
        name: result.currency.name,
        symbol: result.currency.symbol || undefined,
        currencyTypeId: result.currency.currencyTypeId || undefined,
      };
    }

    if (result.box) {
      collection.box = {
        id: result.box.id,
        name: result.box.name,
      };
    }

    return collection;
  }

  /**
   * Find all collections for a box
   */
  async findByBoxId(
    boxId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ collections: CollectionRecord[]; total: number }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const offset = (page - 1) * limit;

    const [cols, totalResult] = await Promise.all([
      this.db
        .select()
        .from(collections)
        .where(eq(collections.boxId, boxId))
        .orderBy(desc(collections.emptiedAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(collections)
        .where(eq(collections.boxId, boxId)),
    ]);

    return {
      collections: cols,
      total: totalResult[0]?.count ?? 0,
    };
  }

  /**
   * Find all collections for a box with relations
   */
  async findByBoxIdWithRelations(
    boxId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ collections: CollectionWithRelations[]; total: number }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const offset = (page - 1) * limit;

    const results = await this.db.query.collections.findMany({
      where: eq(collections.boxId, boxId),
      orderBy: [desc(collections.emptiedAt)],
      limit,
      offset,
      with: {
        currency: true,
        box: true,
      },
    });

    // Get total count
    const totalResult = await this.db
      .select({ count: count() })
      .from(collections)
      .where(eq(collections.boxId, boxId));

    return {
      collections: results.map((c) => {
        const collection: CollectionWithRelations = {
          id: c.id,
          boxId: c.boxId,
          emptiedAt: new Date(c.emptiedAt).toISOString(),
          totalValue: c.totalValue,
          totalValueExtra: c.totalValueExtra,
          currencyId: c.currencyId,
        };

        if (c.currency) {
          collection.currency = {
            id: c.currency.id,
            code: c.currency.code,
            name: c.currency.name,
            symbol: c.currency.symbol || undefined,
            currencyTypeId: c.currency.currencyTypeId || undefined,
          };
        }

        if (c.box) {
          collection.box = {
            id: c.box.id,
            name: c.box.name,
          };
        }

        return collection;
      }),
      total: totalResult[0]?.count ?? 0,
    };
  }

  /**
   * Find all collections for a user
   */
  async findByUserId(
    userId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ collections: CollectionRecord[]; total: number }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const offset = (page - 1) * limit;

    const [cols, totalResult] = await Promise.all([
      this.db
        .select()
        .from(collections)
        .where(eq(collections.userId, userId))
        .orderBy(desc(collections.emptiedAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(collections)
        .where(eq(collections.userId, userId)),
    ]);

    return {
      collections: cols,
      total: totalResult[0]?.count ?? 0,
    };
  }

  /**
   * Find all collections for a user with relations
   */
  async findByUserIdWithRelations(
    userId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ collections: CollectionWithRelations[]; total: number }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const offset = (page - 1) * limit;

    const results = await this.db.query.collections.findMany({
      where: eq(collections.userId, userId),
      orderBy: [desc(collections.emptiedAt)],
      limit,
      offset,
      with: {
        currency: true,
        box: true,
      },
    });

    // Get total count
    const totalResult = await this.db
      .select({ count: count() })
      .from(collections)
      .where(eq(collections.userId, userId));

    return {
      collections: results.map((c) => {
        const collection: CollectionWithRelations = {
          id: c.id,
          boxId: c.boxId,
          emptiedAt: new Date(c.emptiedAt).toISOString(),
          totalValue: c.totalValue,
          totalValueExtra: c.totalValueExtra,
          currencyId: c.currencyId,
        };

        if (c.currency) {
          collection.currency = {
            id: c.currency.id,
            code: c.currency.code,
            name: c.currency.name,
            symbol: c.currency.symbol || undefined,
            currencyTypeId: c.currency.currencyTypeId || undefined,
          };
        }

        if (c.box) {
          collection.box = {
            id: c.box.id,
            name: c.box.name,
          };
        }

        return collection;
      }),
      total: totalResult[0]?.count ?? 0,
    };
  }

  /**
   * Delete a collection
   */
  async delete(id: string): Promise<boolean> {
    await this.db.delete(collections).where(eq(collections.id, id));
    return true;
  }

  /**
   * Delete all collections for a box
   */
  async deleteByBoxId(boxId: string): Promise<void> {
    await this.db.delete(collections).where(eq(collections.boxId, boxId));
  }

  // ============== Aggregation Operations ==============

  /**
   * Count collections for a box
   */
  async countByBoxId(boxId: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(collections)
      .where(eq(collections.boxId, boxId));
    return result[0]?.count ?? 0;
  }

  /**
   * Get total value collected for a box
   */
  async getTotalCollected(boxId: string): Promise<number> {
    const result = await this.db
      .select({ totalValue: collections.totalValue })
      .from(collections)
      .where(eq(collections.boxId, boxId));

    return result.reduce((sum, c) => sum + (c.totalValue || 0), 0);
  }

  // ============== Batch Operations ==============

  /**
   * Get currencies for multiple collections (batch operation)
   */
  async getCurrenciesForCollections(collectionIds: string[]): Promise<Map<string, Currency>> {
    if (collectionIds.length === 0) return new Map();

    // Get currency IDs from collections
    const collectionList = await this.db
      .select({ id: collections.id, currencyId: collections.currencyId })
      .from(collections)
      .where(inArray(collections.id, collectionIds));

    const currencyIds = [...new Set(collectionList.map((c) => c.currencyId))];

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

    // Map collection ID to currency
    const result = new Map<string, Currency>();
    for (const c of collectionList) {
      const currency = currencyMap.get(c.currencyId);
      if (currency) {
        result.set(c.id, currency);
      }
    }

    return result;
  }
}
