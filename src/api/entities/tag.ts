/**
 * Tag entity - Database operations only
 */

import { eq, desc, inArray } from "drizzle-orm";
import type { Database } from "../../db";
import { tags, boxTags, boxes } from "../../db/schema";
import type { Tag, Box, CreateTagOptions } from "../domain/types";
import { DEFAULT_TAG_COLOR } from "../domain/constants";
import { generateTagId } from "../shared/id-generator";
import { tagCache } from "../shared/cache";
import { sanitizeString } from "../shared/validators";
import { CurrencyEntity } from "./currency";

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

		tagCache.set(`id:${id}`, tag);
		tagCache.delete("list:all");
		return tag;
	}

	async get(id: string): Promise<Tag | null> {
		const cached = tagCache.get(`id:${id}`) as Tag | undefined;
		if (cached) return cached;

		const result = await this.db.select().from(tags).where(eq(tags.id, id)).limit(1);
		if (!result[0]) return null;

		const tag = this.mapTag(result[0]);
		tagCache.set(`id:${id}`, tag);
		return tag;
	}

	async getByName(name: string): Promise<Tag | null> {
		const normalizedName = name.trim().toLowerCase();
		const allTags = await this.list();
		return allTags.find((t) => t.name.toLowerCase() === normalizedName) || null;
	}

	async list(): Promise<Tag[]> {
		const cached = tagCache.get("list:all") as Tag[] | undefined;
		if (cached) return cached;

		const result = await this.db.select().from(tags);
		const tags_list = result.map((t) => this.mapTag(t));

		for (const tag of tags_list) {
			tagCache.set(`id:${tag.id}`, tag);
		}
		tagCache.set("list:all", tags_list);

		return tags_list;
	}

	async delete(id: string): Promise<boolean> {
		const tag = await this.get(id);
		if (!tag) return false;

		await this.db.delete(tags).where(eq(tags.id, id));

		tagCache.delete(`id:${id}`);
		tagCache.delete("list:all");
		return true;
	}

	// ============== Box Relations ==============

	async getBoxes(tagId: string): Promise<Box[]> {
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

		const currencyIds = [...new Set(result.map((r) => r.currencyId).filter(Boolean))];
		const currencyMap = await new CurrencyEntity(this.db).getMany(currencyIds as string[]);

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
				if (currency) box.currency = currency;
			}
			return box;
		});
	}

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

	// ============== Batch Operations ==============

	async getMany(ids: string[]): Promise<Map<string, Tag>> {
		const uniqueIds = [...new Set(ids)];
		const result = new Map<string, Tag>();
		const missingIds: string[] = [];

		for (const id of uniqueIds) {
			const cached = tagCache.get(`id:${id}`) as Tag | undefined;
			if (cached) {
				result.set(id, cached);
			} else {
				missingIds.push(id);
			}
		}

		if (missingIds.length > 0) {
			const dbTags = await this.db.select().from(tags).where(inArray(tags.id, missingIds));
			for (const tag of dbTags) {
				const mapped = this.mapTag(tag);
				result.set(tag.id, mapped);
				tagCache.set(`id:${tag.id}`, mapped);
			}
		}

		return result;
	}

	// ============== Helpers ==============

	private mapTag(t: typeof tags.$inferSelect): Tag {
		return {
			id: t.id,
			name: t.name,
			color: t.color || undefined,
			createdAt: new Date(t.createdAt).toISOString(),
		};
	}
}
