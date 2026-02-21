/**
 * Box endpoints
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import {
	BoxSchema,
	BoxStatsSchema,
	BoxSummarySchema,
	CreateBoxBodySchema,
	UpdateBoxBodySchema,
	CollectionSchema,
	createItemResponseSchema,
} from "../domain/schemas";
import { getBoxEntity, getTagEntity } from "../entities";
import { getCurrentUser } from "../middleware";
import {
	success,
	notFound,
	validationError,
	conflict,
} from "../shared/response";
import {
	buildRoute,
	getParams,
	getQuery,
	getBody,
	jsonSuccess,
	createIdParamSchema,
	createPaginatedResponse,
	PaginationQuerySchema,
	create200Response,
	create201Response,
	create404Response,
	create400Response,
	create409Response,
} from "../shared/route-builder";
import { MAX_BOX_NAME_LENGTH, MAX_BOX_DESCRIPTION_LENGTH } from "../domain/constants";

// ============== Common Schemas ==============

const BoxIdParamSchema = createIdParamSchema("boxId");

const BoxTagParamsSchema = z.object({
	boxId: z.string(),
	tagId: z.string(),
});

// ============== List Boxes ==============

const ListQuerySchema = z.object({
	sortBy: z.enum(["name", "createdAt", "count", "totalValue"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const ListResponseSchema = z.object({
	success: z.boolean(),
	boxes: BoxSchema.array(),
	summary: BoxSummarySchema,
});

export const listRoute = buildRoute({
	method: "get",
	path: "/api/boxes",
	tags: ["Boxes"],
	summary: "List all charity boxes",
	query: ListQuerySchema,
	responses: create200Response(ListResponseSchema, "Returns a list of boxes"),
	requireAuth: true,
});

export const listHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { sortBy, sortOrder } = getQuery<{
		sortBy: "name" | "createdAt" | "count" | "totalValue";
		sortOrder: "asc" | "desc";
	}>(c);

	const boxes = await getBoxEntity(c).list(user.id);

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

	return c.json(success({
		boxes,
		summary: {
			totalBoxes: boxes.length,
			totalCoins: boxes.reduce((sum, b) => sum + b.count, 0),
			totalValue: boxes.reduce((sum, b) => sum + b.totalValue, 0),
		},
	}));
};

// ============== Create Box ==============

const CreateResponseSchema = createItemResponseSchema(BoxSchema, "box");

export const createRoute = buildRoute({
	method: "post",
	path: "/api/boxes",
	tags: ["Boxes"],
	summary: "Create a new charity box",
	body: CreateBoxBodySchema,
	responses: {
		...create201Response(CreateResponseSchema, "Returns the created box"),
		...create400Response("Invalid input"),
		...create404Response("Tag not found"),
	},
	requireAuth: true,
});

export const createHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { name, description, metadata, tagIds } = getBody<{
		name: string;
		description?: string;
		metadata?: Record<string, string>;
		tagIds?: string[];
	}>(c);

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
		userId: user.id,
	});

	return jsonSuccess(c, { box }, 201);
};

// ============== Get Box ==============

const GetResponseSchema = z.object({
	success: z.boolean(),
	box: BoxSchema,
	stats: BoxStatsSchema,
});

export const getRoute = buildRoute({
	method: "get",
	path: "/api/boxes/{boxId}",
	tags: ["Boxes"],
	summary: "Get a box with detailed stats",
	params: BoxIdParamSchema,
	responses: {
		...create200Response(GetResponseSchema, "Returns the box"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const getHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);

	const boxEntity = getBoxEntity(c);
	const box = await boxEntity.get(boxId, user.id);

	if (!box) {
		return notFound("Box", boxId);
	}

	const stats = await boxEntity.getStats(boxId);
	return c.json(success({ box, stats }));
};

// ============== Update Box ==============

const UpdateResponseSchema = createItemResponseSchema(BoxSchema, "box");

export const updateRoute = buildRoute({
	method: "patch",
	path: "/api/boxes/{boxId}",
	tags: ["Boxes"],
	summary: "Update a box",
	params: BoxIdParamSchema,
	body: UpdateBoxBodySchema,
	responses: {
		...create200Response(UpdateResponseSchema, "Returns the updated box"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const updateHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);
	const updates = getBody<{
		name?: string;
		description?: string;
		metadata?: Record<string, string> | null;
	}>(c);

	const boxEntity = getBoxEntity(c);
	const box = await boxEntity.update(boxId, updates, user.id);

	if (!box) {
		return notFound("Box", boxId);
	}

	return c.json(success({ box }));
};

// ============== Delete Box ==============

const DeleteResponseSchema = z.object({
	success: z.boolean(),
	deleted: z.boolean(),
	sadaqahsDeleted: z.number(),
	collectionsDeleted: z.number(),
});

export const deleteRoute = buildRoute({
	method: "delete",
	path: "/api/boxes/{boxId}",
	tags: ["Boxes"],
	summary: "Delete a box",
	params: BoxIdParamSchema,
	responses: {
		...create200Response(DeleteResponseSchema, "Box deleted"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const deleteHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);

	const result = await getBoxEntity(c).delete(boxId, user.id);

	if (!result.deleted) {
		return notFound("Box", boxId);
	}

	return c.json(success({
		deleted: true,
		sadaqahsDeleted: result.sadaqahsDeleted,
		collectionsDeleted: result.collectionsDeleted,
	}));
};

// ============== Empty Box ==============

const EmptyResponseSchema = z.object({
	success: z.boolean(),
	box: BoxSchema,
	collection: CollectionSchema,
});

export const emptyRoute = buildRoute({
	method: "post",
	path: "/api/boxes/{boxId}/empty",
	tags: ["Boxes"],
	summary: "Empty a box (collect all sadaqahs)",
	params: BoxIdParamSchema,
	responses: {
		...create200Response(EmptyResponseSchema, "Box emptied"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const emptyHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);

	const result = await getBoxEntity(c).collect(boxId, user.id);

	if (!result) {
		return notFound("Box", boxId);
	}

	return c.json(success({
		box: result.box,
		collection: result.collection,
	}));
};

// ============== Get Collections ==============

const CollectionsResponseSchema = createPaginatedResponse(CollectionSchema, "collections");

export const collectionsRoute = buildRoute({
	method: "get",
	path: "/api/boxes/{boxId}/collections",
	tags: ["Boxes"],
	summary: "Get collection history for a box",
	params: BoxIdParamSchema,
	query: PaginationQuerySchema,
	responses: {
		...create200Response(CollectionsResponseSchema, "Returns collection history"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const collectionsHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);
	const { page, limit } = getQuery<{ page: number; limit: number }>(c);

	const boxEntity = getBoxEntity(c);

	const box = await boxEntity.get(boxId, user.id);
	if (!box) {
		return notFound("Box", boxId);
	}

	const result = await boxEntity.getCollections(boxId, { page, limit }, user.id);
	return c.json(success({
		collections: result.collections,
		total: result.total,
	}));
};

// ============== Add Tag to Box ==============

const AddTagBodySchema = z.object({
	tagId: z.string(),
});

const AddTagResponseSchema = createItemResponseSchema(BoxSchema, "box");

export const addTagRoute = buildRoute({
	method: "post",
	path: "/api/boxes/{boxId}/tags",
	tags: ["Boxes"],
	summary: "Add a tag to a box",
	params: BoxIdParamSchema,
	body: AddTagBodySchema,
	responses: {
		...create200Response(AddTagResponseSchema, "Tag added"),
		...create404Response("Box or tag not found"),
		...create409Response("Tag already added"),
	},
	requireAuth: true,
});

export const addTagHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);
	const { tagId } = getBody<{ tagId: string }>(c);

	const boxEntity = getBoxEntity(c);
	const tagEntity = getTagEntity(c);

	const [box, tag] = await Promise.all([
		boxEntity.get(boxId, user.id),
		tagEntity.get(tagId),
	]);

	if (!box) return notFound("Box", boxId);
	if (!tag) return notFound("Tag", tagId);

	const added = await boxEntity.addTag(boxId, tagId);
	if (!added) {
		return conflict("Tag already added to this box");
	}

	const updatedBox = await boxEntity.get(boxId);
	return c.json(success({ box: updatedBox }));
};

// ============== Remove Tag from Box ==============

const RemoveTagResponseSchema = createItemResponseSchema(BoxSchema, "box");

export const removeTagRoute = buildRoute({
	method: "delete",
	path: "/api/boxes/{boxId}/tags/{tagId}",
	tags: ["Boxes"],
	summary: "Remove a tag from a box",
	params: BoxTagParamsSchema,
	responses: {
		...create200Response(RemoveTagResponseSchema, "Tag removed"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const removeTagHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId, tagId } = getParams<{ boxId: string; tagId: string }>(c);

	const boxEntity = getBoxEntity(c);

	const box = await boxEntity.get(boxId, user.id);
	if (!box) {
		return notFound("Box", boxId);
	}

	await boxEntity.removeTag(boxId, tagId);
	const updatedBox = await boxEntity.get(boxId);
	return c.json(success({ box: updatedBox }));
};

// ============== Set Tags for Box ==============

const SetTagsBodySchema = z.object({
	tagIds: z.string().array(),
});

const SetTagsResponseSchema = createItemResponseSchema(BoxSchema, "box");

export const setTagsRoute = buildRoute({
	method: "put",
	path: "/api/boxes/{boxId}/tags",
	tags: ["Boxes"],
	summary: "Set all tags for a box (replaces existing)",
	params: BoxIdParamSchema,
	body: SetTagsBodySchema,
	responses: {
		...create200Response(SetTagsResponseSchema, "Tags updated"),
		...create404Response("Box or tag not found"),
	},
	requireAuth: true,
});

export const setTagsHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);
	const { tagIds } = getBody<{ tagIds: string[] }>(c);

	const boxEntity = getBoxEntity(c);
	const tagEntity = getTagEntity(c);

	const box = await boxEntity.get(boxId, user.id);
	if (!box) {
		return notFound("Box", boxId);
	}

	if (tagIds.length > 0) {
		const tagChecks = await Promise.all(tagIds.map((id) => tagEntity.get(id)));
		const missingIndex = tagChecks.findIndex((t) => !t);
		if (missingIndex !== -1) {
			return notFound("Tag", tagIds[missingIndex]);
		}
	}

	await boxEntity.setTags(boxId, tagIds);
	const updatedBox = await boxEntity.get(boxId);
	return c.json(success({ box: updatedBox }));
};
