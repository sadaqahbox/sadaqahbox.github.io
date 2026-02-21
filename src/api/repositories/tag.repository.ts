/**
 * Tag Repository
 * 
 * Pure data access layer - no business logic.
 * Handles all database operations for tags.
 * Includes caching for frequently accessed tags.
 * 
 * @module api/repositories/tag
 */

import { eq, desc, inArray, and } from "drizzle-orm";
import type { Database } from "../../db";
import { tags, boxTags, boxes } from "../../db/schema";
import type { Tag, Box } from "../schemas";
import { generateTagId } from "../shared/id-generator";
import { tagCache } from "../shared/cache";

// ============== Types ==============

export interface TagRecord {
  id: string;
  name: string;
  color?: string | null;
  createdAt: Date | string;
}

export interface CreateTagData {
  name: string;
  color?: string;
}

export interface TagWithRelations extends Tag {
  boxes?: Box[];
}

// ============== Repository ==============

export class TagRepository {
  constructor(private db: Database) {}

  // ============== CRUD Operations ==============

  /**
   * Create a new tag
   */
  async create(data: CreateTagData): Promise<Tag> {
    const timestamp = new Date();
    const id = generateTagId();

    await this.db.insert(tags).values({
      id,
      name: data.name,
      color: data.color || null,
      createdAt: timestamp,
    });

    const tag: Tag = {
      id,
      name: data.name,
      color: data.color,
      createdAt: timestamp.toISOString(),
    };

    tagCache.set(`id:${id}`, tag);
    tagCache.delete("list:all");
    return tag;
  }

  /**
   * Find a tag by ID
   */
  async findById(id: string): Promise<TagRecord | null> {
    const cached = tagCache.get(`id:${id}`) as Tag | undefined;
    if (cached) return cached;

    const result = await this.db
      .select()
      .from(tags)
      .where(eq(tags.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find a tag by name (case-insensitive)
   */
  async findByName(name: string): Promise<TagRecord | null> {
    const normalizedName = name.trim().toLowerCase();
    const allTags = await this.findAll();
    return allTags.find((t) => t.name.toLowerCase() === normalizedName) || null;
  }

  /**
   * Find all tags
   */
  async findAll(): Promise<TagRecord[]> {
    const cached = tagCache.get("list:all") as Tag[] | undefined;
    if (cached) return cached;

    return this.db.select().from(tags);
  }

  /**
   * Find all tags with box relations
   */
  async findAllWithRelations(): Promise<TagWithRelations[]> {
    const results = await this.db.query.tags.findMany({
      with: {
        boxTags: {
          with: {
            box: true,
          },
        },
      },
    });

    return results.map((t) => {
      const tag: TagWithRelations = {
        id: t.id,
        name: t.name,
        color: t.color || undefined,
        createdAt: new Date(t.createdAt).toISOString(),
      };

      if (t.boxTags && t.boxTags.length > 0) {
        tag.boxes = t.boxTags.map((bt) => ({
          id: bt.box.id,
          name: bt.box.name,
          description: bt.box.description || undefined,
          count: bt.box.count,
          totalValue: bt.box.totalValue,
          currencyId: bt.box.currencyId || undefined,
          createdAt: new Date(bt.box.createdAt).toISOString(),
          updatedAt: new Date(bt.box.updatedAt).toISOString(),
        }));
      }

      return tag;
    });
  }

  /**
   * Update a tag
   */
  async update(id: string, data: Partial<CreateTagData>): Promise<TagRecord | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.color !== undefined) {
      updateData.color = data.color || null;
    }

    await this.db.update(tags).set(updateData).where(eq(tags.id, id));

    // Invalidate cache
    tagCache.delete(`id:${id}`);
    tagCache.delete("list:all");

    return this.findById(id);
  }

  /**
   * Delete a tag
   */
  async delete(id: string): Promise<boolean> {
    const tag = await this.findById(id);
    if (!tag) return false;

    await this.db.delete(tags).where(eq(tags.id, id));

    // Invalidate cache
    tagCache.delete(`id:${id}`);
    tagCache.delete("list:all");

    return true;
  }

  // ============== Box Relations ==============

  /**
   * Get all boxes for a tag
   */
  async findBoxesByTagId(tagId: string, userId?: string): Promise<Box[]> {
    const query = userId
      ? this.db
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
          .where(and(eq(boxTags.tagId, tagId), eq(boxes.userId, userId)))
          .orderBy(desc(boxes.createdAt))
      : this.db
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

    const result = await query;

    return result.map((b) => ({
      id: b.boxId,
      name: b.name,
      description: b.description || undefined,
      count: b.count,
      totalValue: b.totalValue,
      currencyId: b.currencyId || undefined,
      createdAt: new Date(b.createdAt).toISOString(),
      updatedAt: new Date(b.updatedAt).toISOString(),
    }));
  }

  /**
   * Get tags for a box
   */
  async findTagsByBoxId(boxId: string): Promise<Tag[]> {
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

  /**
   * Get tags for multiple boxes (batch operation)
   */
  async findTagsForBoxes(boxIds: string[]): Promise<Map<string, Tag[]>> {
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

  /**
   * Add a tag to a box
   */
  async addTagToBox(boxId: string, tagId: string): Promise<boolean> {
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
  async removeTagFromBox(boxId: string, tagId: string): Promise<boolean> {
    await this.db
      .delete(boxTags)
      .where(and(eq(boxTags.boxId, boxId), eq(boxTags.tagId, tagId)));
    return true;
  }

  /**
   * Set all tags for a box
   */
  async setBoxTags(boxId: string, tagIds: string[]): Promise<void> {
    await this.db.delete(boxTags).where(eq(boxTags.boxId, boxId));
    if (tagIds.length > 0) {
      await this.db.insert(boxTags).values(tagIds.map((tagId) => ({ boxId, tagId })));
    }
  }

  // ============== Batch Operations ==============

  /**
   * Get multiple tags by IDs (batch operation with caching)
   */
  async findMany(ids: string[]): Promise<Map<string, Tag>> {
    const uniqueIds = [...new Set(ids)];
    const result = new Map<string, Tag>();
    const missingIds: string[] = [];

    // Check cache first
    for (const id of uniqueIds) {
      const cached = tagCache.get(`id:${id}`) as Tag | undefined;
      if (cached) {
        result.set(id, cached);
      } else {
        missingIds.push(id);
      }
    }

    // Batch fetch missing tags from DB
    if (missingIds.length > 0) {
      const dbTags = await this.db.select().from(tags).where(inArray(tags.id, missingIds));
      for (const tag of dbTags) {
        const mapped = this.mapToTag(tag);
        result.set(tag.id, mapped);
        tagCache.set(`id:${tag.id}`, mapped);
      }
    }

    return result;
  }

  // ============== Helpers ==============

  private mapToTag(t: TagRecord): Tag {
    return {
      id: t.id,
      name: t.name,
      color: t.color || undefined,
      createdAt: new Date(t.createdAt).toISOString(),
    };
  }
}
