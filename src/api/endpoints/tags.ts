/**
 * Tag endpoints
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { TagSchema, BoxSchema, CreateTagBodySchema, createItemResponseSchema } from "../domain/schemas";
import { getTagEntity } from "../entities";
import { success, notFound, conflict } from "../shared/response";
import {
	buildRoute,
	getParams,
	getBody,
	jsonSuccess,
	createIdParamSchema,
	createPaginatedResponse,
	create200Response,
	create201Response,
	create404Response,
	create409Response,
} from "../shared/route-builder";

// ============== List Tags ==============

const ListResponseSchema = createPaginatedResponse(TagSchema, "tags");

export const listRoute = buildRoute({
	method: "get",
	path: "/api/tags",
	tags: ["Tags"],
	summary: "List all tags",
	responses: create200Response(ListResponseSchema, "Returns all tags"),
});

export const listHandler = async (c: Context<{ Bindings: Env }>) => {
	const tags = await getTagEntity(c).list();
	return c.json(success({ tags, total: tags.length }));
};

// ============== Create Tag ==============

const CreateResponseSchema = createItemResponseSchema(TagSchema, "tag");

export const createRoute = buildRoute({
	method: "post",
	path: "/api/tags",
	tags: ["Tags"],
	summary: "Create a new tag",
	body: CreateTagBodySchema,
	responses: {
		...create201Response(CreateResponseSchema, "Returns the created tag"),
		...create409Response("Tag already exists"),
	},
});

export const createHandler = async (c: Context<{ Bindings: Env }>) => {
	const { name, color } = getBody<{ name: string; color?: string }>(c);

	const tagEntity = getTagEntity(c);

	const existing = await tagEntity.getByName(name);
	if (existing) {
		return conflict("Tag with this name already exists");
	}

	const tag = await tagEntity.create({ name, color });
	return jsonSuccess(c, { tag }, 201);
};

// ============== Get Tag ==============

const TagIdParamSchema = createIdParamSchema("tagId");

const GetResponseSchema = createItemResponseSchema(TagSchema, "tag");

export const getRoute = buildRoute({
	method: "get",
	path: "/api/tags/{tagId}",
	tags: ["Tags"],
	summary: "Get a tag",
	params: TagIdParamSchema,
	responses: {
		...create200Response(GetResponseSchema, "Returns the tag"),
		...create404Response("Tag not found"),
	},
});

export const getHandler = async (c: Context<{ Bindings: Env }>) => {
	const { tagId } = getParams<{ tagId: string }>(c);

	const tag = await getTagEntity(c).get(tagId);
	if (!tag) {
		return notFound("Tag", tagId);
	}

	return c.json(success({ tag }));
};

// ============== Delete Tag ==============

const DeleteResponseSchema = createItemResponseSchema(z.object({ deleted: z.boolean() }), "data");

export const deleteRoute = buildRoute({
	method: "delete",
	path: "/api/tags/{tagId}",
	tags: ["Tags"],
	summary: "Delete a tag",
	params: TagIdParamSchema,
	responses: {
		...create200Response(DeleteResponseSchema, "Tag deleted"),
		...create404Response("Tag not found"),
	},
});

export const deleteHandler = async (c: Context<{ Bindings: Env }>) => {
	const { tagId } = getParams<{ tagId: string }>(c);

	const deleted = await getTagEntity(c).delete(tagId);
	if (!deleted) {
		return notFound("Tag", tagId);
	}

	return c.json(success({ deleted: true }));
};

// ============== Get Boxes with Tag ==============

const BoxesResponseSchema = z.object({
	success: z.boolean(),
	tag: TagSchema,
	boxes: BoxSchema.array(),
});

export const boxesRoute = buildRoute({
	method: "get",
	path: "/api/tags/{tagId}/boxes",
	tags: ["Tags"],
	summary: "Get all boxes with a specific tag",
	params: TagIdParamSchema,
	responses: {
		...create200Response(BoxesResponseSchema, "Returns boxes"),
		...create404Response("Tag not found"),
	},
});

export const boxesHandler = async (c: Context<{ Bindings: Env }>) => {
	const { tagId } = getParams<{ tagId: string }>(c);

	const tagEntity = getTagEntity(c);

	const tag = await tagEntity.get(tagId);
	if (!tag) {
		return notFound("Tag", tagId);
	}

	const boxes = await tagEntity.getBoxes(tagId);
	return c.json(success({ tag, boxes }));
};
