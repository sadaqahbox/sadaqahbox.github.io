/**
 * Tag endpoints
 *
 * Uses service layer for business logic.
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { requireAuth, requireAdmin, getCurrentUser } from "../middleware";
import { getTagService } from "../services";
import { TagSchema, CreateTagBodySchema } from "../dtos";
import {
	buildRoute,
	getParams,
	getBody,
	jsonSuccess,
	createIdParamSchema,
	create200Response,
	create201Response,
	create404Response,
	create409Response,
	type RouteDefinition,
} from "../shared/route-builder";

// ============== Schemas ==============

const TagIdParamSchema = createIdParamSchema("tagId");

// ============== Routes & Handlers ==============

// List
export const listRoute = buildRoute({
	method: "get",
	path: "/api/tags",
	tags: ["Tags"],
	summary: "List all tags",
	responses: create200Response(z.object({
		success: z.boolean(),
		tags: z.array(TagSchema),
	}), "Returns a list of tags"),
	requireAuth: true,
});

export const listHandler = async (c: Context<{ Bindings: Env }>) => {
	const tags = await getTagService(c).listTags();
	return jsonSuccess(c, { tags });
};

// Create
export const createRoute = buildRoute({
	method: "post",
	path: "/api/tags",
	tags: ["Tags"],
	summary: "Create a new tag",
	body: CreateTagBodySchema,
	responses: create201Response(z.object({
		success: z.boolean(),
		tag: TagSchema,
	}), "Returns the created tag"),
	requireAuth: true,
});

export const createHandler = async (c: Context<{ Bindings: Env }>) => {
	const body = getBody<{ name: string; color?: string }>(c);

	try {
		const tag = await getTagService(c).createTag({
			name: body.name,
			color: body.color,
		});
		return jsonSuccess(c, { tag }, 201);
	} catch (error) {
		if (error instanceof Error && error.message.includes("already exists")) {
			return c.json({ success: false, error: error.message }, 409);
		}
		throw error;
	}
};

// Get
export const getRoute = buildRoute({
	method: "get",
	path: "/api/tags/{tagId}",
	tags: ["Tags"],
	summary: "Get a tag by ID",
	params: TagIdParamSchema,
	responses: create200Response(z.object({
		success: z.boolean(),
		tag: TagSchema,
	}), "Returns the tag"),
	requireAuth: true,
});

export const getHandler = async (c: Context<{ Bindings: Env }>) => {
	const { tagId } = getParams<{ tagId: string }>(c);
	const tag = await getTagService(c).getTag(tagId);

	if (!tag) {
		return c.json({ success: false, error: "Tag not found" }, 404);
	}

	return jsonSuccess(c, { tag });
};

// Delete
export const deleteRoute = buildRoute({
	method: "delete",
	path: "/api/tags/{tagId}",
	tags: ["Tags"],
	summary: "Delete a tag",
	params: TagIdParamSchema,
	responses: create200Response(z.object({
		success: z.boolean(),
		deleted: z.boolean(),
	}), "Returns deletion status"),
	requireAuth: true,
});

export const deleteHandler = async (c: Context<{ Bindings: Env }>) => {
	const { tagId } = getParams<{ tagId: string }>(c);
	const deleted = await getTagService(c).deleteTag(tagId);

	if (!deleted) {
		return c.json({ success: false, error: "Tag not found" }, 404);
	}

	return jsonSuccess(c, { deleted: true });
};

// ============== Route Definitions ==============

export const tagRouteDefinitions: RouteDefinition[] = [
	{ route: listRoute, handler: listHandler, middleware: [requireAuth] },
	{ route: createRoute, handler: createHandler, middleware: [requireAuth, requireAdmin] },
	{ route: getRoute, handler: getHandler, middleware: [requireAuth] },
	{ route: deleteRoute, handler: deleteHandler, middleware: [requireAuth, requireAdmin] },
];
