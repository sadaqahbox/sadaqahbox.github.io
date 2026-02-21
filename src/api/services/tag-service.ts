/**
 * Tag Service
 * 
 * Business logic layer for tag operations.
 * Uses Repository pattern for data access.
 * 
 * @module api/services/tag-service
 */

import type { Context } from "hono";
import { BaseService, createServiceFactory } from "./base-service";
import { TagRepository } from "../repositories";
import type { Tag, Box } from "../schemas";
import { DEFAULT_TAG_COLOR } from "../domain/constants";
import { sanitizeString } from "../shared/validators";

// ============== Types ==============

export interface CreateTagInput {
  name: string;
  color?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
}

export interface ListTagsOptions {
  includeBoxes?: boolean;
}

// ============== Service ==============

export class TagService extends BaseService {
  private get tagRepo() {
    return new TagRepository(this.db);
  }

  // ============== CRUD Operations ==============

  /**
   * Create a new tag
   */
  async createTag(input: CreateTagInput): Promise<Tag> {
    const name = sanitizeString(input.name);
    if (!name) {
      throw new Error("Tag name is required");
    }

    // Check for duplicate
    const existing = await this.tagRepo.findByName(name);
    if (existing) {
      throw new Error(`Tag "${name}" already exists`);
    }

    const tag = await this.tagRepo.create({
      name,
      color: input.color || DEFAULT_TAG_COLOR,
    });

    return tag;
  }

  /**
   * Get a tag by ID
   */
  async getTag(tagId: string): Promise<Tag | null> {
    const tag = await this.tagRepo.findById(tagId);
    if (!tag) return null;

    return {
      id: tag.id,
      name: tag.name,
      color: tag.color || undefined,
      createdAt: new Date(tag.createdAt).toISOString(),
    };
  }

	/**
   * Get a tag by ID with relations
   */
  async getTagWithRelations(tagId: string) {
    return this.tagRepo.findAllWithRelations().then(tags => tags.find(t => t.id === tagId) || null);
  }

  /**
   * Get a tag by name (case-insensitive)
   */
  async getTagByName(name: string): Promise<Tag | null> {
    const tag = await this.tagRepo.findByName(name);
    if (!tag) return null;

    return {
      id: tag.id,
      name: tag.name,
      color: tag.color || undefined,
      createdAt: new Date(tag.createdAt).toISOString(),
    };
  }

  /**
   * List all tags
   */
  async listTags(options: ListTagsOptions = {}): Promise<Tag[]> {
    const tags = await this.tagRepo.findAll();
    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color || undefined,
      createdAt: new Date(t.createdAt).toISOString(),
    }));
  }

  /**
   * List all tags with box relations
   */
  async listTagsWithRelations() {
    return this.tagRepo.findAllWithRelations();
  }

	/**
   * Update a tag
   */
  async updateTag(tagId: string, input: UpdateTagInput): Promise<Tag | null> {
    const updateData: { name?: string; color?: string } = {};

    if (input.name !== undefined) {
      const name = sanitizeString(input.name);
      if (!name) {
        throw new Error("Tag name cannot be empty");
      }
      updateData.name = name;
    }
    if (input.color !== undefined) {
      updateData.color = input.color;
    }

    const updated = await this.tagRepo.update(tagId, updateData);
    if (!updated) return null;

    return this.getTag(tagId);
  }

  /**
   * Delete a tag
   */
  async deleteTag(tagId: string): Promise<boolean> {
    return this.tagRepo.delete(tagId);
  }

  // ============== Box Relations ==============

  /**
   * Get all boxes for a tag
   */
  async getBoxesForTag(tagId: string, userId?: string): Promise<Box[]> {
    return this.tagRepo.findBoxesByTagId(tagId, userId);
  }

  /**
   * Get tags for a box
   */
  async getTagsForBox(boxId: string): Promise<Tag[]> {
    return this.tagRepo.findTagsByBoxId(boxId);
  }

  /**
   * Add a tag to a box
   */
  async addTagToBox(boxId: string, tagId: string): Promise<boolean> {
    return this.tagRepo.addTagToBox(boxId, tagId);
  }

  /**
   * Remove a tag from a box
   */
  async removeTagFromBox(boxId: string, tagId: string): Promise<boolean> {
    return this.tagRepo.removeTagFromBox(boxId, tagId);
  }

  /**
   * Set all tags for a box
   */
  async setBoxTags(boxId: string, tagIds: string[]): Promise<void> {
    return this.tagRepo.setBoxTags(boxId, tagIds);
  }

  // ============== Batch Operations ==============

  /**
   * Get multiple tags by IDs (batch operation)
   */
  async getManyTags(ids: string[]): Promise<Map<string, Tag>> {
    return this.tagRepo.findMany(ids);
  }

  /**
   * Get tags for multiple boxes (batch operation)
   */
  async getTagsForBoxes(boxIds: string[]): Promise<Map<string, Tag[]>> {
    return this.tagRepo.findTagsForBoxes(boxIds);
  }
}

export const getTagService = createServiceFactory(TagService);
