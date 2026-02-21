/**
 * Box Repository
 * 
 * Pure data access layer - no business logic.
 * Handles all database operations for boxes.
 * Uses Drizzle relations for N+1 query prevention.
 * 
 * @module api/repositories/box
 */

import { eq, desc, count, and, inArray, sql } from "drizzle-orm";
import type { Database } from "../../db";
import { boxes, sadaqahs, collections, boxTags, tags, currencies, boxesRelations } from "../../db/schema";
import type { Box, Tag, Currency, Collection } from "../schemas";
import { generateBoxId, generateCollectionId } from "../shared/id-generator";

// ============== Types ==============

export interface TotalValueExtraEntry {
  total: number;
  code: string;
  name: string;
}

export interface TotalValueExtra {
  [currencyId: string]: TotalValueExtraEntry;
}

export interface BoxRecord {
  id: string;
  name: string;
  description: string | null;
  metadata: unknown;
  count: number;
  totalValue: number;
  totalValueExtra: TotalValueExtra | null;
  currencyId: string | null;
  baseCurrencyId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBoxData {
  name: string;
  description?: string;
  metadata?: Record<string, string>;
  userId: string;
  baseCurrencyId?: string;
}

export interface UpdateBoxData {
  name?: string;
  description?: string | null;
  metadata?: Record<string, string> | null;
  baseCurrencyId?: string;
  totalValueExtra?: TotalValueExtra | null;
}

export interface BoxWithRelations extends Box {
  currency?: Currency;
  baseCurrency?: Currency;
  tags?: Tag[];
  totalValueExtra?: TotalValueExtra;
}

// ============== Repository ==============

export class BoxRepository {
  constructor(private db: Database) {}

  // ============== CRUD Operations ==============

  /**
   * Create a new box
   */
  async create(data: CreateBoxData): Promise<Box> {
    const timestamp = new Date();
    const id = generateBoxId();

    await this.db.insert(boxes).values({
      id,
      name: data.name,
      description: data.description || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      count: 0,
      totalValue: 0,
      currencyId: null,
      baseCurrencyId: data.baseCurrencyId || null,
      userId: data.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return {
      id,
      name: data.name,
      description: data.description,
      metadata: data.metadata,
      count: 0,
      totalValue: 0,
      totalValueExtra: undefined,
      baseCurrencyId: data.baseCurrencyId,
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
    };
  }

  /**
   * Find a box by ID
   */
  async findById(id: string, userId?: string): Promise<BoxRecord | null> {
    const query = userId
      ? this.db.select().from(boxes).where(and(eq(boxes.id, id), eq(boxes.userId, userId))).limit(1)
      : this.db.select().from(boxes).where(eq(boxes.id, id)).limit(1);

    const result = await query;
    return result[0] || null;
  }

  /**
   * Find a box by ID with all relations using Drizzle relational queries
   * This prevents N+1 queries by fetching all related data in a single query
   */
  async findByIdWithRelations(id: string, userId?: string): Promise<BoxWithRelations | null> {
    // Use Drizzle's relational query API for efficient loading
    const result = await this.db.query.boxes.findFirst({
      where: userId 
        ? and(eq(boxes.id, id), eq(boxes.userId, userId))
        : eq(boxes.id, id),
      with: {
        currency: true,
        baseCurrency: true,
        boxTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!result) return null;

    // Map to domain type
    const box: BoxWithRelations = {
      id: result.id,
      name: result.name,
      description: result.description || undefined,
      metadata: result.metadata as Record<string, string> | undefined,
      count: result.count,
      totalValue: result.totalValue,
      totalValueExtra: result.totalValueExtra as TotalValueExtra | undefined,
      currencyId: result.currencyId || undefined,
      baseCurrencyId: result.baseCurrencyId || undefined,
      createdAt: new Date(result.createdAt).toISOString(),
      updatedAt: new Date(result.updatedAt).toISOString(),
    };

    // Map currency if present
    if (result.currency) {
      box.currency = {
        id: result.currency.id,
        code: result.currency.code,
        name: result.currency.name,
        symbol: result.currency.symbol || undefined,
        currencyTypeId: result.currency.currencyTypeId || undefined,
      };
    }

    // Map baseCurrency if present
    if (result.baseCurrency) {
      box.baseCurrency = {
        id: result.baseCurrency.id,
        code: result.baseCurrency.code,
        name: result.baseCurrency.name,
        symbol: result.baseCurrency.symbol || undefined,
        currencyTypeId: result.baseCurrency.currencyTypeId || undefined,
        usdValue: result.baseCurrency.usdValue,
        lastRateUpdate: result.baseCurrency.lastRateUpdate ? new Date(result.baseCurrency.lastRateUpdate).toISOString() : null,
      };
    }

    // Map tags from boxTags relation
    if (result.boxTags && result.boxTags.length > 0) {
      box.tags = result.boxTags.map((bt) => ({
        id: bt.tag.id,
        name: bt.tag.name,
        color: bt.tag.color || undefined,
        createdAt: new Date(bt.tag.createdAt).toISOString(),
      }));
    }

    return box;
  }

  /**
   * Find all boxes for a user with relations using Drizzle relational queries
   * This prevents N+1 queries by fetching all related data efficiently
   */
  async findByUserIdWithRelations(userId: string): Promise<BoxWithRelations[]> {
    // Use Drizzle's relational query API for efficient loading
    const results = await this.db.query.boxes.findMany({
      where: eq(boxes.userId, userId),
      orderBy: [desc(boxes.createdAt)],
      with: {
        currency: true,
        baseCurrency: true,
        boxTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    // Map to domain types
    return results.map((result) => {
      const box: BoxWithRelations = {
        id: result.id,
        name: result.name,
        description: result.description || undefined,
        metadata: result.metadata as Record<string, string> | undefined,
        count: result.count,
        totalValue: result.totalValue,
        totalValueExtra: result.totalValueExtra as TotalValueExtra | undefined,
        currencyId: result.currencyId || undefined,
        baseCurrencyId: result.baseCurrencyId || undefined,
        createdAt: new Date(result.createdAt).toISOString(),
        updatedAt: new Date(result.updatedAt).toISOString(),
      };

      // Map currency if present
      if (result.currency) {
        box.currency = {
          id: result.currency.id,
          code: result.currency.code,
          name: result.currency.name,
          symbol: result.currency.symbol || undefined,
          currencyTypeId: result.currency.currencyTypeId || undefined,
        };
      }

      // Map baseCurrency if present
      if (result.baseCurrency) {
        box.baseCurrency = {
          id: result.baseCurrency.id,
          code: result.baseCurrency.code,
          name: result.baseCurrency.name,
          symbol: result.baseCurrency.symbol || undefined,
          currencyTypeId: result.baseCurrency.currencyTypeId || undefined,
          usdValue: result.baseCurrency.usdValue,
          lastRateUpdate: result.baseCurrency.lastRateUpdate ? new Date(result.baseCurrency.lastRateUpdate).toISOString() : null,
        };
      }

      // Map tags from boxTags relation
      if (result.boxTags && result.boxTags.length > 0) {
        box.tags = result.boxTags.map((bt) => ({
          id: bt.tag.id,
          name: bt.tag.name,
          color: bt.tag.color || undefined,
          createdAt: new Date(bt.tag.createdAt).toISOString(),
        }));
      }

      return box;
    });
  }

  /**
   * Find all boxes for a user (without relations - for counts/summaries)
   */
  async findByUserId(userId: string): Promise<BoxRecord[]> {
    return this.db
      .select()
      .from(boxes)
      .where(eq(boxes.userId, userId))
      .orderBy(desc(boxes.createdAt));
  }

  /**
   * Find all boxes (admin/system use)
   */
  async findAll(): Promise<BoxRecord[]> {
    return this.db.select().from(boxes).orderBy(desc(boxes.createdAt));
  }

  /**
   * Update a box
   */
  async update(id: string, data: UpdateBoxData): Promise<BoxRecord | null> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description || null;
    }
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
    }
    if (data.baseCurrencyId !== undefined) {
      updateData.baseCurrencyId = data.baseCurrencyId || null;
    }
    if (data.totalValueExtra !== undefined) {
      updateData.totalValueExtra = data.totalValueExtra ? JSON.stringify(data.totalValueExtra) : null;
    }

    await this.db.update(boxes).set(updateData).where(eq(boxes.id, id));
    return this.findById(id);
  }

  /**
   * Delete a box
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(boxes).where(eq(boxes.id, id));
    return true;
  }

  /**
   * Update box counters
   */
  async updateCounters(
    id: string,
    countDelta: number,
    valueDelta: number,
    currencyId?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      count: sql`${boxes.count} + ${countDelta}`,
      totalValue: sql`${boxes.totalValue} + ${valueDelta}`,
      updatedAt: new Date(),
    };

    if (currencyId !== undefined) {
      updateData.currencyId = currencyId;
    }

    await this.db.update(boxes).set(updateData).where(eq(boxes.id, id));
  }

  /**
   * Reset box counters (after collection)
   */
  async resetCounters(id: string): Promise<void> {
    await this.db
      .update(boxes)
      .set({
        count: 0,
        totalValue: 0,
        totalValueExtra: null,
        currencyId: null,
        updatedAt: new Date(),
      })
      .where(eq(boxes.id, id));
  }

  // ============== Tag Operations ==============

  /**
   * Add a tag to a box
   */
  async addTag(boxId: string, tagId: string): Promise<boolean> {
    try {
      await this.db.insert(boxTags).values({ boxId, tagId });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove a tag from a box
   */
  async removeTag(boxId: string, tagId: string): Promise<boolean> {
    await this.db
      .delete(boxTags)
      .where(and(eq(boxTags.boxId, boxId), eq(boxTags.tagId, tagId)));
    return true;
  }

  /**
   * Set all tags for a box
   */
  async setTags(boxId: string, tagIds: string[]): Promise<void> {
    await this.db.delete(boxTags).where(eq(boxTags.boxId, boxId));
    if (tagIds.length > 0) {
      await this.db.insert(boxTags).values(tagIds.map((tagId) => ({ boxId, tagId })));
    }
  }

  /**
   * Get tags for multiple boxes (batch operation)
   */
  async getTagsForBoxes(boxIds: string[]): Promise<Map<string, Tag[]>> {
    if (boxIds.length === 0) return new Map();

    const result = await this.db
      .select({
        boxId: boxTags.boxId,
        tagId: tags.id,
        name: tags.name,
        color: tags.color,
        createdAt: tags.createdAt,
      })
      .from(boxTags)
      .innerJoin(tags, eq(boxTags.tagId, tags.id))
      .where(inArray(boxTags.boxId, boxIds));

    const tagsByBox = new Map<string, Tag[]>();
    for (const row of result) {
      const tag: Tag = {
        id: row.tagId,
        name: row.name,
        color: row.color || undefined,
        createdAt: new Date(row.createdAt).toISOString(),
      };
      const existing = tagsByBox.get(row.boxId) || [];
      existing.push(tag);
      tagsByBox.set(row.boxId, existing);
    }

    return tagsByBox;
  }

  // ============== Collection Operations ==============

  /**
   * Create a collection (empty box)
   */
  async createCollection(
    boxId: string,
    userId: string,
    sadaqahsCollected: number,
    totalValue: number,
    currencyId: string
  ): Promise<{ id: string; emptiedAt: string }> {
    const timestamp = new Date();
    const id = generateCollectionId();

    await this.db.insert(collections).values({
      id,
      boxId,
      userId,
      emptiedAt: timestamp,
      sadaqahsCollected,
      totalValue,
      currencyId,
    });

    return {
      id,
      emptiedAt: timestamp.toISOString(),
    };
  }

  /**
   * Get collections for a box with currency relations
   */
  async getCollectionsWithRelations(
    boxId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ collections: (Collection & { currency?: Currency })[]; total: number }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const offset = (page - 1) * limit;

    // Use relational query for efficient loading
    const results = await this.db.query.collections.findMany({
      where: eq(collections.boxId, boxId),
      orderBy: [desc(collections.emptiedAt)],
      limit,
      offset,
      with: {
        currency: true,
      },
    });

    // Get total count
    const totalResult = await this.db
      .select({ count: count() })
      .from(collections)
      .where(eq(collections.boxId, boxId));

    return {
      collections: results.map((c) => ({
        id: c.id,
        boxId: c.boxId,
        emptiedAt: new Date(c.emptiedAt).toISOString(),
        sadaqahsCollected: c.sadaqahsCollected,
        totalValue: c.totalValue,
        currencyId: c.currencyId,
        currency: c.currency ? {
          id: c.currency.id,
          code: c.currency.code,
          name: c.currency.name,
          symbol: c.currency.symbol || undefined,
          currencyTypeId: c.currency.currencyTypeId || undefined,
        } : undefined,
      })),
      total: totalResult[0]?.count ?? 0,
    };
  }

  /**
   * Get collections for a box (without relations)
   */
  async getCollections(
    boxId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ collections: Collection[]; total: number }> {
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
      this.db.select({ count: count() }).from(collections).where(eq(collections.boxId, boxId)),
    ]);

    return {
      collections: cols.map((c) => ({
        id: c.id,
        boxId: c.boxId,
        emptiedAt: new Date(c.emptiedAt).toISOString(),
        sadaqahsCollected: c.sadaqahsCollected,
        totalValue: c.totalValue,
        currencyId: c.currencyId,
      })),
      total: totalResult[0]?.count ?? 0,
    };
  }

  // ============== Stats Operations ==============

  /**
   * Get sadaqah stats for a box
   */
  async getBoxStats(id: string): Promise<{ firstSadaqahAt: string | null; lastSadaqahAt: string | null; totalSadaqahs: number } | null> {
    const box = await this.findById(id);
    if (!box) return null;

    const sadaqahList = await this.db
      .select({ createdAt: sadaqahs.createdAt })
      .from(sadaqahs)
      .where(eq(sadaqahs.boxId, id))
      .orderBy(sadaqahs.createdAt);

    if (sadaqahList.length === 0) {
      return { firstSadaqahAt: null, lastSadaqahAt: null, totalSadaqahs: 0 };
    }

    return {
      firstSadaqahAt: new Date(sadaqahList[0]!.createdAt).toISOString(),
      lastSadaqahAt: new Date(sadaqahList[sadaqahList.length - 1]!.createdAt).toISOString(),
      totalSadaqahs: sadaqahList.length,
    };
  }

  /**
   * Count sadaqahs and collections for a box
   */
  async countRelatedRecords(id: string): Promise<{ sadaqahs: number; collections: number }> {
    const [sadaqahCount, collectionCount] = await Promise.all([
      this.db.select({ count: count() }).from(sadaqahs).where(eq(sadaqahs.boxId, id)).then((r) => r[0]?.count ?? 0),
      this.db.select({ count: count() }).from(collections).where(eq(collections.boxId, id)).then((r) => r[0]?.count ?? 0),
    ]);

    return { sadaqahs: sadaqahCount, collections: collectionCount };
  }
}
