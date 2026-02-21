/**
 * Box Service
 * 
 * Business logic layer for box operations.
 * Uses Repository pattern for data access and implements proper error handling.
 * 
 * @module api/services/box-service
 */

import type { Context } from "hono";
import { BaseService, createServiceFactory } from "./base-service";
import { BoxRepository, SadaqahRepository, CurrencyRepository, TagRepository, CollectionRepository } from "../repositories";
import type { BoxRecord } from "../repositories/box.repository";
import type { Box, BoxStats, BoxSummary, Collection, Tag, Currency } from "../schemas";
import { DEFAULT_PAGE, DEFAULT_LIMIT, DEFAULT_BASE_CURRENCY_CODE } from "../config/constants";
import { sanitizeString } from "../shared/validators";
import { dbBatch } from "../shared/transaction";
import {
  BoxNotFoundError,
  BoxValidationError,
  AuthorizationError,
  Result,
  type Result as ResultType,
} from "../errors";

// ============== Types ==============

export interface CreateBoxInput {
  name: string;
  description?: string;
  metadata?: Record<string, string>;
  tagIds?: string[];
  userId: string;
  baseCurrencyId?: string;
}

export interface UpdateBoxInput {
  name?: string;
  description?: string;
  metadata?: Record<string, string> | null;
  baseCurrencyId?: string;
}

export interface ListBoxesOptions {
  sortBy?: "name" | "createdAt" | "count" | "totalValue";
  sortOrder?: "asc" | "desc";
}

export interface ListCollectionsOptions {
  page?: number;
  limit?: number;
}

// ============== Helper Functions ==============

function mapBoxRecord(record: BoxRecord): Box {
  return {
    id: record.id,
    name: record.name,
    description: record.description || undefined,
    metadata: record.metadata as Record<string, string> | undefined,
    count: record.count,
    totalValue: record.totalValue,
    currencyId: record.currencyId || undefined,
    createdAt: new Date(record.createdAt).toISOString(),
    updatedAt: new Date(record.updatedAt).toISOString(),
  };
}

// ============== Service ==============

export class BoxService extends BaseService {
  private get boxRepo() {
    return new BoxRepository(this.db);
  }

  private get sadaqahRepo() {
    return new SadaqahRepository(this.db);
  }

  private get currencyRepo() {
    return new CurrencyRepository(this.db);
  }

  private get tagRepo() {
    return new TagRepository(this.db);
  }

  private get collectionRepo() {
    return new CollectionRepository(this.db);
  }

  // ============== CRUD Operations ==============

  /**
   * Create a new box with validation
   */
  async createBox(input: CreateBoxInput): Promise<Box> {
    // Validate input
    const name = sanitizeString(input.name);
    if (!name) {
      throw new BoxValidationError("Box name is required");
    }

    // Get or set default base currency
    let baseCurrencyId = input.baseCurrencyId;
    if (!baseCurrencyId) {
      // Try to find the default currency (USD)
      const defaultCurrency = await this.currencyRepo.findByCode(DEFAULT_BASE_CURRENCY_CODE);
      if (defaultCurrency) {
        baseCurrencyId = defaultCurrency.id;
      }
    }

    // Create box via repository
    const box = await this.boxRepo.create({
      name,
      description: input.description,
      metadata: input.metadata,
      userId: input.userId,
      baseCurrencyId,
    });

    // Add tags if provided
    if (input.tagIds?.length) {
      await this.boxRepo.setTags(box.id, input.tagIds);
    }

    return box;
  }

  /**
   * Get a box by ID with optional user ownership check
   * Uses Drizzle relations for efficient N+1 prevention
   */
  async getBox(boxId: string, userId?: string): Promise<Box | null> {
    // Use the optimized method with relations
    const box = await this.boxRepo.findByIdWithRelations(boxId, userId);
    return box;
  }

  /**
   * List all boxes for a user with summary stats
   * Uses Drizzle relations for efficient N+1 prevention
   */
  async listBoxes(
    userId: string,
    options: ListBoxesOptions = {}
  ): Promise<{ boxes: Box[]; summary: BoxSummary }> {
    const { sortBy = "createdAt", sortOrder = "desc" } = options;

    // Use the optimized method with relations
    let boxes = await this.boxRepo.findByUserIdWithRelations(userId);

    if (boxes.length === 0) {
      return {
        boxes: [],
        summary: { totalBoxes: 0, totalCoins: 0, totalValue: 0 },
      };
    }

    // Sort boxes
    boxes.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "count":
          comparison = a.count - b.count;
          break;
        case "totalValue":
          comparison = a.totalValue - b.totalValue;
          break;
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    const summary: BoxSummary = {
      totalBoxes: boxes.length,
      totalCoins: boxes.reduce((sum, b) => sum + b.count, 0),
      totalValue: boxes.reduce((sum, b) => sum + b.totalValue, 0),
    };

    return { boxes, summary };
  }

  /**
   * Update a box with validation
   */
  async updateBox(
    boxId: string,
    input: UpdateBoxInput,
    userId?: string
  ): Promise<Box | null> {
    // Verify box exists and user owns it
    const existing = await this.boxRepo.findById(boxId, userId);
    if (!existing) return null;

    // Validate input
    const updateData: { name?: string; description?: string | null; metadata?: Record<string, string> | null; baseCurrencyId?: string } = {};

    if (input.name !== undefined) {
      const name = sanitizeString(input.name);
      if (!name) {
        throw new BoxValidationError("Box name cannot be empty");
      }
      updateData.name = name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description || null;
    }
    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata;
    }
    
    // Handle baseCurrencyId update - only allowed if box has no sadaqahs
    if (input.baseCurrencyId !== undefined) {
      // Check if box has sadaqahs
      const sadaqahCount = await this.sadaqahRepo.countByBoxId(boxId);
      if (sadaqahCount > 0) {
        throw new BoxValidationError("Cannot change base currency after sadaqahs have been added to the box");
      }
      updateData.baseCurrencyId = input.baseCurrencyId;
    }

    // Update via repository
    const updated = await this.boxRepo.update(boxId, updateData);
    if (!updated) return null;

    return this.getBox(boxId);
  }

  /**
   * Delete a box and return deletion stats
   */
  async deleteBox(boxId: string, userId?: string): Promise<{
    deleted: boolean;
    sadaqahsDeleted: number;
    collectionsDeleted: number;
  }> {
    // Verify ownership if userId provided
    if (userId) {
      const box = await this.boxRepo.findById(boxId, userId);
      if (!box) {
        return { deleted: false, sadaqahsDeleted: 0, collectionsDeleted: 0 };
      }
    }

    // Count related records before deletion
    const counts = await this.boxRepo.countRelatedRecords(boxId);

    // Delete the box (cascade deletes will handle related records)
    await this.boxRepo.delete(boxId);

    return {
      deleted: true,
      sadaqahsDeleted: counts.sadaqahs,
      collectionsDeleted: counts.collections,
    };
  }

  // ============== Stats ==============

  /**
   * Get statistics for a box
   */
  async getBoxStats(boxId: string): Promise<BoxStats | null> {
    return this.boxRepo.getBoxStats(boxId);
  }

  // ============== Collections ==============

  /**
   * Empty a box (create a collection)
   */
  async emptyBox(
    boxId: string,
    userId: string
  ): Promise<{ box: Box; collection: Collection } | null> {
    // Verify box exists and user owns it
    const record = await this.boxRepo.findById(boxId, userId);
    if (!record) return null;

    const currencyId = record.currencyId || "cur_default";

    // Create collection and reset box counters
    const collection = await this.boxRepo.createCollection(
      boxId,
      userId,
      record.count,
      record.totalValue,
      currencyId
    );

    // Delete all sadaqahs in the box
    await this.sadaqahRepo.deleteByBoxId(boxId);

    // Reset box counters
    await this.boxRepo.resetCounters(boxId);

    // Fetch updated box
    const updatedBox = await this.getBox(boxId);
    if (!updatedBox) return null;

    return {
      box: updatedBox,
      collection: {
        id: collection.id,
        boxId,
        emptiedAt: collection.emptiedAt,
        sadaqahsCollected: record.count,
        totalValue: record.totalValue,
        currencyId,
      },
    };
  }

  /**
   * List collections for a box with currency relations
   */
  async listCollections(
    boxId: string,
    options: ListCollectionsOptions = {}
  ): Promise<{ collections: Collection[]; total: number }> {
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = options;
    
    // Use the optimized method with relations
    const result = await this.boxRepo.getCollectionsWithRelations(boxId, { page, limit });
    
    return {
      collections: result.collections,
      total: result.total,
    };
  }

  // ============== Tags ==============

  /**
   * Add a tag to a box
   */
  async addTagToBox(boxId: string, tagId: string, userId: string): Promise<boolean> {
    // Verify box ownership
    const box = await this.boxRepo.findById(boxId, userId);
    if (!box) return false;

    // Verify tag exists
    const tag = await this.tagRepo.findById(tagId);
    if (!tag) return false;

    return this.boxRepo.addTag(boxId, tagId);
  }

  /**
   * Remove a tag from a box
   */
  async removeTagFromBox(boxId: string, tagId: string, userId: string): Promise<boolean> {
    // Verify box ownership
    const box = await this.boxRepo.findById(boxId, userId);
    if (!box) return false;

    return this.boxRepo.removeTag(boxId, tagId);
  }

  /**
   * Set all tags for a box
   */
  async setBoxTags(boxId: string, tagIds: string[], userId: string): Promise<boolean> {
    // Verify box ownership
    const box = await this.boxRepo.findById(boxId, userId);
    if (!box) return false;

    await this.boxRepo.setTags(boxId, tagIds);
    return true;
  }
}

export const getBoxService = createServiceFactory(BoxService);
