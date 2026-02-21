/**
 * Box endpoints - Refactored
 * 
 * Uses service layer for business logic and DTOs for type safety.
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { requireAuth, getCurrentUser } from "../middleware";
import { getBoxService, type CreateBoxInput, type UpdateBoxInput } from "../services";
import {
	BoxSchema,
	CreateBoxBodySchema,
	UpdateBoxBodySchema,
	BoxStatsSchema,
	ListBoxesResponseSchema,
	GetBoxResponseSchema,
	EmptyBoxResponseSchema,
	DeleteBoxResponseSchema,
	ListCollectionsResponseSchema,
	TagSchema,
} from "../dtos";
import {
	buildRoute,
	getParams,
	getQuery,
	getBody,
	createIdParamSchema,
	create200Response,
	create201Response,
	create404Response,
	create409Response,
	type RouteDefinition,
} from "../shared/route-builder";
import { jsonSuccess } from "../shared/route-builder";

// ============== Schemas ==============

const BoxIdParamSchema = createIdParamSchema("boxId");

const BoxTagParamsSchema = z.object({
	boxId: z.string(),
	tagId: z.string(),
});

const ListQuerySchema = z.object({
	sortBy: z.enum(["name", "createdAt", "count", "totalValue"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============== Routes & Handlers ==============

// List
export const listRoute = buildRoute({
	method: "get",
	path: "/api/boxes",
	tags: ["Boxes"],
	summary: "List all charity boxes",
	query: ListQuerySchema,
	responses: create200Response(ListBoxesResponseSchema, "Returns a list of boxes"),
	requireAuth: true,
});

export const listHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const query = getQuery<{ sortBy: "name" | "createdAt" | "count" | "totalValue"; sortOrder: "asc" | "desc" }>(c);

	const { boxes, summary } = await getBoxService(c).listBoxes(user.id, {
		sortBy: query.sortBy,
		sortOrder: query.sortOrder,
	});

	return jsonSuccess(c, { boxes, summary });
};

// Create
export const createRoute = buildRoute({
	method: "post",
	path: "/api/boxes",
	tags: ["Boxes"],
	summary: "Create a new charity box",
	body: CreateBoxBodySchema,
	responses: create201Response(z.object({
		success: z.boolean(),
		box: BoxSchema,
	}), "Returns the created box"),
	requireAuth: true,
});

export const createHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const body = getBody<CreateBoxInput>(c);

	const box = await getBoxService(c).createBox({
		...body,
		userId: user.id,
	});

	return jsonSuccess(c, { box }, 201);
};

// Get
export const getRoute = buildRoute({
	method: "get",
	path: "/api/boxes/{boxId}",
	tags: ["Boxes"],
	summary: "Get a box with detailed stats",
	params: BoxIdParamSchema,
	responses: {
		...create200Response(GetBoxResponseSchema, "Returns the box"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const getHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);

	const service = getBoxService(c);
	const box = await service.getBox(boxId, user.id);

	if (!box) {
		return c.json({ success: false, error: "Box not found", code: "NOT_FOUND" }, 404);
	}

	const stats = await service.getBoxStats(boxId);
	return jsonSuccess(c, { box, stats });
};

// Update
export const updateRoute = buildRoute({
	method: "patch",
	path: "/api/boxes/{boxId}",
	tags: ["Boxes"],
	summary: "Update a box",
	params: BoxIdParamSchema,
	body: UpdateBoxBodySchema,
	responses: {
		...create200Response(z.object({ success: z.boolean(), box: BoxSchema }), "Returns the updated box"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const updateHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);
	const updates = getBody<UpdateBoxInput>(c);

	const box = await getBoxService(c).updateBox(boxId, updates, user.id);

	if (!box) {
		return c.json({ success: false, error: "Box not found", code: "NOT_FOUND" }, 404);
	}

	return jsonSuccess(c, { box });
};

// Delete
export const deleteRoute = buildRoute({
	method: "delete",
	path: "/api/boxes/{boxId}",
	tags: ["Boxes"],
	summary: "Delete a box",
	params: BoxIdParamSchema,
	responses: {
		...create200Response(DeleteBoxResponseSchema, "Box deleted"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const deleteHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);

	const result = await getBoxService(c).deleteBox(boxId, user.id);

	if (!result.deleted) {
		return c.json({ success: false, error: "Box not found", code: "NOT_FOUND" }, 404);
	}

	return jsonSuccess(c, {
		deleted: true,
		sadaqahsDeleted: result.sadaqahsDeleted,
		collectionsDeleted: result.collectionsDeleted,
	});
};

// Empty Box
export const emptyRoute = buildRoute({
	method: "post",
	path: "/api/boxes/{boxId}/empty",
	tags: ["Boxes"],
	summary: "Empty a box (collect all sadaqahs)",
	params: BoxIdParamSchema,
	responses: {
		...create200Response(EmptyBoxResponseSchema, "Box emptied"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const emptyHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);

	const result = await getBoxService(c).emptyBox(boxId, user.id);

	if (!result) {
		return c.json({ success: false, error: "Box not found", code: "NOT_FOUND" }, 404);
	}

	return jsonSuccess(c, {
		box: result.box,
		collection: result.collection,
	});
};

// Get Collections
export const collectionsRoute = buildRoute({
	method: "get",
	path: "/api/boxes/{boxId}/collections",
	tags: ["Boxes"],
	summary: "Get collection history for a box",
	params: BoxIdParamSchema,
	query: z.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(20),
	}),
	responses: {
		...create200Response(ListCollectionsResponseSchema, "Returns collection history"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const collectionsHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);
	const query = getQuery<{ page: number; limit: number }>(c);

	// Verify box exists and belongs to user
	const box = await getBoxService(c).getBox(boxId, user.id);
	if (!box) {
		return c.json({ success: false, error: "Box not found", code: "NOT_FOUND" }, 404);
	}

	const result = await getBoxService(c).listCollections(boxId, {
		page: query.page,
		limit: query.limit,
	});

	return jsonSuccess(c, {
		collections: result.collections,
		total: result.total,
	});
};

// Add Tag
export const addTagRoute = buildRoute({
	method: "post",
	path: "/api/boxes/{boxId}/tags/{tagId}",
	tags: ["Boxes"],
	summary: "Add a tag to a box",
	params: BoxTagParamsSchema,
	responses: {
		...create200Response(z.object({ success: z.boolean() }), "Tag added"),
		...create404Response("Box or tag not found"),
		...create409Response("Tag already added"),
	},
	requireAuth: true,
});

export const addTagHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId, tagId } = getParams<{ boxId: string; tagId: string }>(c);

	const success = await getBoxService(c).addTagToBox(boxId, tagId, user.id);

	if (!success) {
		return c.json({ success: false, error: "Box or tag not found", code: "NOT_FOUND" }, 404);
	}

	return jsonSuccess(c, { success: true });
};

// Remove Tag
export const removeTagRoute = buildRoute({
	method: "delete",
	path: "/api/boxes/{boxId}/tags/{tagId}",
	tags: ["Boxes"],
	summary: "Remove a tag from a box",
	params: BoxTagParamsSchema,
	responses: {
		...create200Response(z.object({ success: z.boolean() }), "Tag removed"),
		...create404Response("Box or tag not found"),
	},
	requireAuth: true,
});

export const removeTagHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId, tagId } = getParams<{ boxId: string; tagId: string }>(c);

	const success = await getBoxService(c).removeTagFromBox(boxId, tagId, user.id);

	if (!success) {
		return c.json({ success: false, error: "Box or tag not found", code: "NOT_FOUND" }, 404);
	}

	return jsonSuccess(c, { success: true });
};

// ============== Route Definitions Export ==============

export const boxRouteDefinitions: RouteDefinition[] = [
	{ route: listRoute, handler: listHandler, middleware: [requireAuth] },
	{ route: createRoute, handler: createHandler, middleware: [requireAuth] },
	{ route: getRoute, handler: getHandler, middleware: [requireAuth] },
	{ route: updateRoute, handler: updateHandler, middleware: [requireAuth] },
	{ route: deleteRoute, handler: deleteHandler, middleware: [requireAuth] },
	{ route: emptyRoute, handler: emptyHandler, middleware: [requireAuth] },
	{ route: collectionsRoute, handler: collectionsHandler, middleware: [requireAuth] },
	{ route: addTagRoute, handler: addTagHandler, middleware: [requireAuth] },
	{ route: removeTagRoute, handler: removeTagHandler, middleware: [requireAuth] },
];
