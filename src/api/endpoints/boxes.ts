/**
 * Box endpoints
 */

import { Bool, Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { Context } from "hono";
import {
	BoxSchema,
	BoxStatsSchema,
	BoxSummarySchema,
	CreateBoxBodySchema,
	UpdateBoxBodySchema,
	CollectionSchema,
	TagSchema,
} from "../domain/schemas";
import { getBoxEntity, getTagEntity } from "../entities";
import { success, notFound, validationError, conflict } from "../shared/response";
import { MAX_BOX_NAME_LENGTH, MAX_BOX_DESCRIPTION_LENGTH } from "../domain/constants";

// ============== List Boxes ==============

export class BoxList extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "List all charity boxes",
		request: {
			query: z.object({
				sortBy: z.enum(["name", "createdAt", "count", "totalValue"]).default("createdAt"),
				sortOrder: z.enum(["asc", "desc"]).default("desc"),
			}),
		},
		responses: {
			"200": {
				description: "Returns a list of boxes",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							boxes: BoxSchema.array(),
							summary: BoxSummarySchema,
						}),
					},
				},
			},
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { sortBy, sortOrder } = data.query;

		const boxes = await getBoxEntity(c).list();

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

		return success({
			boxes,
			summary: {
				totalBoxes: boxes.length,
				totalCoins: boxes.reduce((sum, b) => sum + b.count, 0),
				totalValue: boxes.reduce((sum, b) => sum + b.totalValue, 0),
			},
		});
	}
}

// ============== Create Box ==============

export class BoxCreate extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Create a new charity box",
		request: {
			body: {
				content: {
					"application/json": { schema: CreateBoxBodySchema },
				},
			},
		},
		responses: {
			"201": {
				description: "Returns the created box",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), box: BoxSchema }),
					},
				},
			},
			"400": { description: "Invalid input" },
			"404": { description: "Tag not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { name, description, metadata, tagIds } = data.body;

		const sanitizedName = name?.trim();
		if (!sanitizedName) {
			return validationError("Box name is required");
		}
		if (sanitizedName.length > MAX_BOX_NAME_LENGTH) {
			return validationError(`Box name must be less than ${MAX_BOX_NAME_LENGTH} characters`);
		}

		if (description && description.length > MAX_BOX_DESCRIPTION_LENGTH) {
			return validationError(`Description must be less than ${MAX_BOX_DESCRIPTION_LENGTH} characters`);
		}

		// Validate tags if provided
		if (tagIds?.length) {
			const tagEntity = getTagEntity(c);
			for (const tagId of tagIds) {
				const tag = await tagEntity.get(tagId);
				if (!tag) {
					return notFound("Tag", tagId);
				}
			}
		}

		const box = await getBoxEntity(c).create({
			name: sanitizedName,
			description: description?.trim(),
			metadata,
			tagIds,
		});

		c.status(201);
		return success({ box });
	}
}

// ============== Get Box ==============

export class BoxGet extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Get a box with detailed stats",
		request: {
			params: z.object({ boxId: Str({ description: "Box ID" }) }),
		},
		responses: {
			"200": {
				description: "Returns the box",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							box: BoxSchema,
							stats: BoxStatsSchema,
						}),
					},
				},
			},
			"404": { description: "Box not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId } = data.params;

		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.get(boxId);

		if (!box) {
			return notFound("Box", boxId);
		}

		const stats = await boxEntity.getStats(boxId);
		return success({ box, stats });
	}
}

// ============== Update Box ==============

export class BoxUpdate extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Update a box",
		request: {
			params: z.object({ boxId: Str() }),
			body: {
				content: {
					"application/json": { schema: UpdateBoxBodySchema },
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the updated box",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), box: BoxSchema }),
					},
				},
			},
			"404": { description: "Box not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId } = data.params;
		const updates = data.body;

		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.update(boxId, updates);

		if (!box) {
			return notFound("Box", boxId);
		}

		return success({ box });
	}
}

// ============== Delete Box ==============

export class BoxDelete extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Delete a box",
		request: {
			params: z.object({ boxId: Str() }),
		},
		responses: {
			"200": {
				description: "Box deleted",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							deleted: Bool(),
							sadaqahsDeleted: Num(),
							collectionsDeleted: Num(),
						}),
					},
				},
			},
			"404": { description: "Box not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId } = data.params;

		const result = await getBoxEntity(c).delete(boxId);

		if (!result.deleted) {
			return notFound("Box", boxId);
		}

		return success({
			deleted: true,
			sadaqahsDeleted: result.sadaqahsDeleted,
			collectionsDeleted: result.collectionsDeleted,
		});
	}
}

// ============== Empty Box ==============

export class BoxEmpty extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Empty a box (collect all sadaqahs)",
		request: {
			params: z.object({ boxId: Str() }),
		},
		responses: {
			"200": {
				description: "Box emptied",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							box: BoxSchema,
							collection: CollectionSchema,
						}),
					},
				},
			},
			"404": { description: "Box not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId } = data.params;

		const result = await getBoxEntity(c).collect(boxId);

		if (!result) {
			return notFound("Box", boxId);
		}

		return success({
			box: result.box,
			collection: result.collection,
		});
	}
}

// ============== Get Collections ==============

export class BoxCollections extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Get collection history for a box",
		request: {
			params: z.object({ boxId: Str() }),
			query: z.object({
				page: z.coerce.number().int().positive().default(1),
				limit: z.coerce.number().int().positive().max(100).default(20),
			}),
		},
		responses: {
			"200": {
				description: "Returns collection history",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							collections: CollectionSchema.array(),
							total: Num(),
						}),
					},
				},
			},
			"404": { description: "Box not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId } = data.params;
		const { page, limit } = data.query;

		const boxEntity = getBoxEntity(c);

		// Verify box exists
		const box = await boxEntity.get(boxId);
		if (!box) {
			return notFound("Box", boxId);
		}

		const result = await boxEntity.getCollections(boxId, { page, limit });
		return success({
			collections: result.collections,
			total: result.total,
		});
	}
}

// ============== Add Tag to Box ==============

export class BoxAddTag extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Add a tag to a box",
		request: {
			params: z.object({ boxId: Str() }),
			body: {
				content: {
					"application/json": {
						schema: z.object({ tagId: Str() }),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Tag added",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							box: BoxSchema,
						}),
					},
				},
			},
			"404": { description: "Box or tag not found" },
			"409": { description: "Tag already added" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId } = data.params;
		const { tagId } = data.body;

		const boxEntity = getBoxEntity(c);
		const tagEntity = getTagEntity(c);

		// Verify both exist
		const [box, tag] = await Promise.all([
			boxEntity.get(boxId),
			tagEntity.get(tagId),
		]);

		if (!box) return notFound("Box", boxId);
		if (!tag) return notFound("Tag", tagId);

		const added = await boxEntity.addTag(boxId, tagId);
		if (!added) {
			return conflict("Tag already added to this box");
		}

		const updatedBox = await boxEntity.get(boxId);
		return success({ box: updatedBox });
	}
}

// ============== Remove Tag from Box ==============

export class BoxRemoveTag extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Remove a tag from a box",
		request: {
			params: z.object({ boxId: Str(), tagId: Str() }),
		},
		responses: {
			"200": {
				description: "Tag removed",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), box: BoxSchema }),
					},
				},
			},
			"404": { description: "Box not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId, tagId } = data.params;

		const boxEntity = getBoxEntity(c);

		// Verify box exists
		const box = await boxEntity.get(boxId);
		if (!box) {
			return notFound("Box", boxId);
		}

		await boxEntity.removeTag(boxId, tagId);
		const updatedBox = await boxEntity.get(boxId);
		return success({ box: updatedBox });
	}
}

// ============== Set Tags for Box ==============

export class BoxSetTags extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Set all tags for a box (replaces existing)",
		request: {
			params: z.object({ boxId: Str() }),
			body: {
				content: {
					"application/json": {
						schema: z.object({ tagIds: Str().array() }),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Tags updated",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), box: BoxSchema }),
					},
				},
			},
			"404": { description: "Box or tag not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId } = data.params;
		const { tagIds } = data.body;

		const boxEntity = getBoxEntity(c);
		const tagEntity = getTagEntity(c);

		// Verify box exists
		const box = await boxEntity.get(boxId);
		if (!box) {
			return notFound("Box", boxId);
		}

		// Validate all tags exist
		if (tagIds.length > 0) {
			const tagChecks = await Promise.all(tagIds.map((id) => tagEntity.get(id)));
			const missingIndex = tagChecks.findIndex((t) => !t);
			if (missingIndex !== -1) {
				return notFound("Tag", tagIds[missingIndex]);
			}
		}

		await boxEntity.setTags(boxId, tagIds);
		const updatedBox = await boxEntity.get(boxId);
		return success({ box: updatedBox });
	}
}
