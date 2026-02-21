/**
 * Collection Service
 * 
 * Business logic layer for collection operations.
 * Collections represent the history of box emptying events.
 * Uses Repository pattern for data access.
 * 
 * @module api/services/collection-service
 */

import type { Context } from "hono";
import { BaseService, createServiceFactory } from "./base-service";
import { CollectionRepository, BoxRepository, SadaqahRepository } from "../repositories";
import type { Collection } from "../schemas";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "../config/constants";

// ============== Types ==============

export interface ListCollectionsOptions {
  page?: number;
  limit?: number;
}

export interface CreateCollectionInput {
  boxId: string;
  userId: string;
  totalValue: number;
  totalValueExtra?: {
    [currencyId: string]: { total: number; code: string; name: string };
  };
  currencyId: string;
}

// ============== Service ==============

export class CollectionService extends BaseService {
  private get collectionRepo() {
    return new CollectionRepository(this.db);
  }

  private get boxRepo() {
    return new BoxRepository(this.db);
  }

  private get sadaqahRepo() {
    return new SadaqahRepository(this.db);
  }

  // ============== CRUD Operations ==============

  /**
   * Get a collection by ID
   */
  async getCollection(collectionId: string): Promise<Collection | null> {
    const collection = await this.collectionRepo.findById(collectionId);
    if (!collection) return null;

    return {
      id: collection.id,
      boxId: collection.boxId,
      emptiedAt: new Date(collection.emptiedAt).toISOString(),
      totalValue: collection.totalValue,
      totalValueExtra: collection.totalValueExtra,
      currencyId: collection.currencyId,
    };
  }

  /**
   * Get a collection by ID with relations
   */
  async getCollectionWithRelations(collectionId: string) {
    return this.collectionRepo.findByIdWithRelations(collectionId);
  }

  /**
   * List collections for a box
   */
  async listCollectionsByBox(
    boxId: string,
    options: ListCollectionsOptions = {}
  ): Promise<{ collections: Collection[]; total: number }> {
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = options;

    const result = await this.collectionRepo.findByBoxIdWithRelations(boxId, { page, limit });

    return {
      collections: result.collections,
      total: result.total,
    };
  }

  /**
   * List collections for a user
   */
  async listCollectionsByUser(
    userId: string,
    options: ListCollectionsOptions = {}
  ): Promise<{ collections: Collection[]; total: number }> {
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = options;

    const result = await this.collectionRepo.findByUserIdWithRelations(userId, { page, limit });

    return {
      collections: result.collections,
      total: result.total,
    };
  }

  /**
   * Delete a collection
   */
  async deleteCollection(collectionId: string): Promise<boolean> {
    return this.collectionRepo.delete(collectionId);
  }

  // ============== Stats & Aggregation ==============

  /**
   * Count collections for a box
   */
  async countCollectionsByBox(boxId: string): Promise<number> {
    return this.collectionRepo.countByBoxId(boxId);
  }

  /**
   * Get total value collected for a box
   */
  async getTotalCollected(boxId: string): Promise<number> {
    return this.collectionRepo.getTotalCollected(boxId);
  }

  // ============== Batch Operations ==============

  /**
   * Get currencies for multiple collections (batch operation)
   */
  async getCurrenciesForCollections(collectionIds: string[]) {
    return this.collectionRepo.getCurrenciesForCollections(collectionIds);
  }
}

export const getCollectionService = createServiceFactory(CollectionService);
