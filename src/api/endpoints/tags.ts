/**
 * Tag endpoints
 */

import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { Context } from "hono";
import { TagSchema, BoxSchema, CreateTagBodySchema } from "../domain/schemas";
import { getTagEntity } from "../entities";
import { success, notFound, conflict } from "../shared/response";

// ============== List Tags ==============

export class TagList extends OpenAPIRoute {
	schema = {
		tags: ["Tags"],
		summary: "List all tags",
		responses: {
			"200": {
				description: "Returns all tags",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							tags: TagSchema.array(),
						}),
					},
				},
			},
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const tags = await getTagEntity(c).list();
		return success({ tags });
	}
}

// ============== Create Tag ==============

export class TagCreate extends OpenAPIRoute {
	schema = {
		tags: ["Tags"],
		summary: "Create a new tag",
		request: {
			body: {
				content: {
					"application/json": { schema: CreateTagBodySchema },
				},
			},
		},
		responses: {
			"201": {
				description: "Returns the created tag",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), tag: TagSchema }),
					},
				},
			},
			"409": { description: "Tag already exists" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { name, color } = data.body;

		const tagEntity = getTagEntity(c);

		// Check if tag already exists
		const existing = await tagEntity.getByName(name);
		if (existing) {
			return conflict("Tag with this name already exists");
		}

		const tag = await tagEntity.create({ name, color });

		c.status(201);
		return success({ tag });
	}
}

// ============== Get Tag ==============

export class TagGet extends OpenAPIRoute {
	schema = {
		tags: ["Tags"],
		summary: "Get a tag",
		request: {
			params: z.object({ tagId: Str() }),
		},
		responses: {
			"200": {
				description: "Returns the tag",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), tag: TagSchema }),
					},
				},
			},
			"404": { description: "Tag not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { tagId } = data.params;

		const tag = await getTagEntity(c).get(tagId);

		if (!tag) {
			return notFound("Tag", tagId);
		}

		return success({ tag });
	}
}

// ============== Delete Tag ==============

export class TagDelete extends OpenAPIRoute {
	schema = {
		tags: ["Tags"],
		summary: "Delete a tag",
		request: {
			params: z.object({ tagId: Str() }),
		},
		responses: {
			"200": {
				description: "Tag deleted",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), deleted: Bool() }),
					},
				},
			},
			"404": { description: "Tag not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { tagId } = data.params;

		const deleted = await getTagEntity(c).delete(tagId);

		if (!deleted) {
			return notFound("Tag", tagId);
		}

		return success({ deleted: true });
	}
}

// ============== Get Boxes with Tag ==============

export class TagBoxes extends OpenAPIRoute {
	schema = {
		tags: ["Tags"],
		summary: "Get all boxes with a specific tag",
		request: {
			params: z.object({ tagId: Str() }),
		},
		responses: {
			"200": {
				description: "Returns boxes",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							tag: TagSchema,
							boxes: BoxSchema.array(),
						}),
					},
				},
			},
			"404": { description: "Tag not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { tagId } = data.params;

		const tagEntity = getTagEntity(c);

		const tag = await tagEntity.get(tagId);
		if (!tag) {
			return notFound("Tag", tagId);
		}

		const boxes = await tagEntity.getBoxes(tagId);
		return success({ tag, boxes });
	}
}
