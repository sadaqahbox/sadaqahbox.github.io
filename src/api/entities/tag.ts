import type { AppContext, Tag, Box, CreateTagOptions } from "./types";
import { TagSchema } from "./types";
import type { Database } from "../../db";
import { getDbFromContext } from "../../db";
import { eq, desc, inArray } from "drizzle-orm";
import { tags, boxTags, boxes } from "../../db/schema";
import { generateTagId } from "../services/id-generator";
import { tagCache } from "../services/cache";
import { CurrencyEntity } from "./currency";
import { sanitizeString } from "../utils/validators";
import { DEFAULT_TAG_COLOR } from "../utils/constants";

export { TagSchema, type Tag };

/**
 * Entity class for managing tags
 * Includes caching for improved performance
 */
export class TagEntity {
	constructor(private db: Database) {}

	// ============== CRUD Operations ==============

	async create(data: CreateTagOptions): Promise<Tag> {
		const timestamp = new Date();
		const id = generateTagId();
		const name = sanitizeString(data.name);
		
		if (!name) {
			throw new Error("Tag name is required");
		}

		await this.db.insert(tags).values({
			id,
			name,
			color: sanitizeString(data.color) || DEFAULT_TAG_COLOR,
			createdAt: timestamp,
		});

		const tag: Tag = {
			id,
			name,
			color: data.color || DEFAULT_TAG_COLOR,
			createdAt: timestamp.toISOString(),
		};

		// Cache the new tag
		tagCache.set(`id:${id}`, tag);
		tagCache.delete("list:all"); // Invalidate list cache

		return tag;
	}

	async get(id: string): Promise<Tag | null> {
		// Check cache first
		const cached = tagCache.get(`id:${id}`);
		if (cached) return cached;

		const result = await this.db
			.select()
			.from(tags)
			.where(eq(tags.id, id))
			.limit(1);

		if (!result[0]) return null;

		const tag: Tag = {
			id: result[0].id,
			name: result[0].name,
			color: result[0].color || undefined,
			createdAt: new Date(result[0].createdAt).toISOString(),
		};

		// Cache the result
		tagCache.set(`id:${id}`, tag);

		return tag;
	}

	async getByName(name: string): Promise<Tag | null> {
		const normalizedName = name.trim().toLowerCase();
		
		// Check all cached tags
		const allTags = await this.list();
		return allTags.find((t) => t.name.toLowerCase() === normalizedName) || null;
	}

	async list(): Promise<Tag[]> {
		// Check cache for full list
		const cacheKey = "list:all";
		const cached = tagCache.get(cacheKey) as Tag[] | undefined;
		if (cached) return cached;

		const result = await this.db.select().from(tags);

		const tags_list = result.map((t) => ({
			id: t.id,
			name: t.name,
			color: t.color || undefined,
			createdAt: new Date(t.createdAt).toISOString(),
		}));

		// Cache individual tags and the list
		for (const tag of tags_list) {
			tagCache.set(`id:${tag.id}`, tag);
		}
		tagCache.set(cacheKey, tags_list);

		return tags_list;
	}

	async delete(id: string): Promise<boolean> {
		const tag = await this.get(id);
		if (!tag) return false;

		await this.db.delete(tags).where(eq(tags.id, id));

		// Invalidate cache
		tagCache.delete(`id:${id}`);
		tagCache.delete("list:all");

		return true;
	}

	// ============== Box Relations ==============

	async getBoxes(tagId: string): Promise<Box[]> {
		// First verify tag exists
		const tag = await this.get(tagId);
		if (!tag) return [];

		const result = await this.db
			.select({
				boxId: boxes.id,
				name: boxes.name,
				description: boxes.description,
				count: boxes.count,
				totalValue: boxes.totalValue,
				currencyId: boxes.currencyId,
				createdAt: boxes.createdAt,
				updatedAt: boxes.updatedAt,
			})
			.from(boxTags)
			.innerJoin(boxes, eq(boxTags.boxId, boxes.id))
			.where(eq(boxTags.tagId, tagId))
			.orderBy(desc(boxes.createdAt));

		// Batch fetch currencies to avoid N+1
		const currencyIds = [...new Set(result.map((r) => r.currencyId).filter(Boolean))];
		const currencyEntity = new CurrencyEntity(this.db);
		const currencyMap = await currencyEntity.getMany(currencyIds as string[]);

		return result.map((b) => {
			const box: Box = {
				id: b.boxId,
				name: b.name,
				description: b.description || undefined,
				count: b.count,
				totalValue: b.totalValue,
				currencyId: b.currencyId || undefined,
				createdAt: new Date(b.createdAt).toISOString(),
				updatedAt: new Date(b.updatedAt).toISOString(),
			};
			if (box.currencyId) {
				const currency = currencyMap.get(box.currencyId);
				if (currency) {
					box.currency = currency;
				}
			}
			return box;
		});
	}

	/**
	 * Gets multiple tags by IDs - optimized batch fetch
	 */
	async getMany(ids: string[]): Promise<Map<string, Tag>> {
		const uniqueIds = [...new Set(ids)];
		const result = new Map<string, Tag>();
		const missingIds: string[] = [];

		// Check cache first
		for (const id of uniqueIds) {
			const cached = tagCache.get(`id:${id}`);
			if (cached) {
				result.set(id, cached);
			} else {
				missingIds.push(id);
			}
		}

		// Fetch missing from DB
		if (missingIds.length > 0) {
			const dbTags = await this.db
				.select()
				.from(tags)
				.where(inArray(tags.id, missingIds));

			for (const tag of dbTags) {
				const mapped: Tag = {
					id: tag.id,
					name: tag.name,
					color: tag.color || undefined,
					createdAt: new Date(tag.createdAt).toISOString(),
				};
				result.set(tag.id, mapped);
				tagCache.set(`id:${tag.id}`, mapped);
			}
		}

		return result;
	}

	/**
	 * Gets all tags for a box - optimized batch fetch
	 */
	async getTagsForBox(boxId: string): Promise<Tag[]> {
		const result = await this.db
			.select({
				tagId: boxTags.tagId,
				name: tags.name,
				color: tags.color,
				createdAt: tags.createdAt,
			})
			.from(boxTags)
			.innerJoin(tags, eq(boxTags.tagId, tags.id))
			.where(eq(boxTags.boxId, boxId));

		return result.map((t) => ({
			id: t.tagId,
			name: t.name,
			color: t.color || undefined,
			createdAt: new Date(t.createdAt).toISOString(),
		}));
	}
}

// Factory function
export function getTagEntity(c: AppContext): TagEntity {
	return new TagEntity(getDbFromContext(c));
}
