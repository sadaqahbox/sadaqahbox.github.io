/**
 * Box Service
 * 
 * Business logic for box operations.
 * Orchestrates BoxEntity, SadaqahEntity, and Collection operations.
 */

import type { Context } from "hono";
import { BaseService, createServiceFactory } from "./base-service";
import { BoxEntity, SadaqahEntity, CurrencyEntity, TagEntity } from "../entities";
import type { BoxDto, CollectionDto, BoxStatsDto, BoxSummaryDto } from "../dtos";
import { generateCollectionId } from "../shared/id-generator";
import { dbBatch } from "../shared/transaction";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "../config/constants";

export interface CreateBoxInput {
	name: string;
	description?: string;
	metadata?: Record<string, string>;
	tagIds?: string[];
	userId: string;
}

export interface UpdateBoxInput {
	name?: string;
	description?: string;
	metadata?: Record<string, string> | null;
}

export interface ListBoxesOptions {
	sortBy?: "name" | "createdAt" | "count" | "totalValue";
	sortOrder?: "asc" | "desc";
}

export interface ListCollectionsOptions {
	page?: number;
	limit?: number;
}

export class BoxService extends BaseService {
	private get boxEntity() {
		return new BoxEntity(this.db);
	}

	private get sadaqahEntity() {
		return new SadaqahEntity(this.db);
	}

	private get currencyEntity() {
		return new CurrencyEntity(this.db);
	}

	private get tagEntity() {
		return new TagEntity(this.db);
	}

	// ============== CRUD Operations ==============

	async createBox(input: CreateBoxInput): Promise<BoxDto> {
		return this.boxEntity.create(input);
	}

	async getBox(boxId: string, userId?: string): Promise<BoxDto | null> {
		return this.boxEntity.get(boxId, userId);
	}

	async listBoxes(
		userId: string,
		options: ListBoxesOptions = {}
	): Promise<{ boxes: BoxDto[]; summary: BoxSummaryDto }> {
		const { sortBy = "createdAt", sortOrder = "desc" } = options;

		const boxes = await this.boxEntity.list(userId);

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

		const summary: BoxSummaryDto = {
			totalBoxes: boxes.length,
			totalCoins: boxes.reduce((sum, b) => sum + b.count, 0),
			totalValue: boxes.reduce((sum, b) => sum + b.totalValue, 0),
		};

		return { boxes, summary };
	}

	async updateBox(
		boxId: string,
		input: UpdateBoxInput,
		userId?: string
	): Promise<BoxDto | null> {
		return this.boxEntity.update(boxId, input as Partial<BoxDto> & { metadata?: Record<string, string> | null }, userId);
	}

	async deleteBox(boxId: string, userId?: string): Promise<{
		deleted: boolean;
		sadaqahsDeleted: number;
		collectionsDeleted: number;
	}> {
		return this.boxEntity.delete(boxId, userId);
	}

	// ============== Stats ==============

	async getBoxStats(boxId: string): Promise<BoxStatsDto | null> {
		return this.boxEntity.getStats(boxId);
	}

	// ============== Collections ==============

	async emptyBox(
		boxId: string,
		userId: string
	): Promise<{ box: BoxDto; collection: CollectionDto } | null> {
		const result = await this.boxEntity.collect(boxId, userId);
		if (!result) return null;

		return {
			box: result.box,
			collection: {
				id: result.collection.id,
				boxId,
				emptiedAt: result.collection.emptiedAt,
				sadaqahsCollected: result.collection.sadaqahsCollected,
				totalValue: result.collection.totalValue,
				currencyId: result.collection.currencyId,
			},
		};
	}

	async listCollections(
		boxId: string,
		options: ListCollectionsOptions = {}
	): Promise<{ collections: CollectionDto[]; total: number }> {
		const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = options;
		const result = await this.boxEntity.getCollections(boxId, { page, limit });
		return result;
	}

	// ============== Tags ==============

	async addTagToBox(boxId: string, tagId: string, userId: string): Promise<boolean> {
		// Verify box ownership
		const box = await this.boxEntity.get(boxId, userId);
		if (!box) return false;

		// Verify tag exists
		const tag = await this.tagEntity.get(tagId);
		if (!tag) return false;

		return this.boxEntity.addTag(boxId, tagId);
	}

	async removeTagFromBox(boxId: string, tagId: string, userId: string): Promise<boolean> {
		// Verify box ownership
		const box = await this.boxEntity.get(boxId, userId);
		if (!box) return false;

		return this.boxEntity.removeTag(boxId, tagId);
	}
}

export const getBoxService = createServiceFactory(BoxService);
