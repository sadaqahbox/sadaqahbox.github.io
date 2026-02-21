/**
 * Sadaqah endpoints - Refactored
 * 
 * Uses service layer for business logic and DTOs for type safety.
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { requireAuth, getCurrentUser } from "../middleware";
import { getSadaqahService, type AddSadaqahInput } from "../services";
import {
	SadaqahSchema,
	AddSadaqahBodySchema,
	ListSadaqahsResponseSchema,
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
	type RouteDefinition,
} from "../shared/route-builder";
import { jsonSuccess } from "../shared/route-builder";

// ============== Schemas ==============

const BoxIdParamSchema = createIdParamSchema("boxId");

const SadaqahIdParamSchema = createIdParamSchema("sadaqahId");

const AddSadaqahResponseSchema = z.object({
	success: z.boolean(),
	sadaqah: SadaqahSchema,
	updatedBox: z.object({
		id: z.string(),
		name: z.string(),
		count: z.number(),
		totalValue: z.number(),
		currencyId: z.string().optional(),
	}),
});

const DeleteSadaqahResponseSchema = z.object({
	success: z.boolean(),
	deleted: z.boolean(),
	updatedBox: z.object({
		id: z.string(),
		name: z.string(),
		count: z.number(),
		totalValue: z.number(),
		currencyId: z.string().optional(),
	}).optional(),
});

// ============== Routes & Handlers ==============

// List Sadaqahs
export const listRoute = buildRoute({
	method: "get",
	path: "/api/boxes/{boxId}/sadaqahs",
	tags: ["Sadaqahs"],
	summary: "List all sadaqahs in a box",
	params: BoxIdParamSchema,
	query: z.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(20),
	}),
	responses: {
		...create200Response(ListSadaqahsResponseSchema, "Returns sadaqahs in the box"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const listHandler = async (c: Context<{ Bindings: Env }>) => {
	const { boxId } = getParams<{ boxId: string }>(c);
	const query = getQuery<{ page: number; limit: number }>(c);

	const result = await getSadaqahService(c).listSadaqahs(boxId, {
		page: query.page,
		limit: query.limit,
	});

	return jsonSuccess(c, {
		sadaqahs: result.sadaqahs,
		total: result.total,
	});
};

// Add Sadaqah
export const createRoute = buildRoute({
	method: "post",
	path: "/api/boxes/{boxId}/sadaqahs",
	tags: ["Sadaqahs"],
	summary: "Add a sadaqah to a box",
	params: BoxIdParamSchema,
	body: AddSadaqahBodySchema,
	responses: {
		...create201Response(AddSadaqahResponseSchema, "Returns the created sadaqah and updated box"),
		...create404Response("Box not found"),
	},
	requireAuth: true,
});

export const createHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);
	const body = getBody<AddSadaqahInput>(c);

	const result = await getSadaqahService(c).addSadaqah(boxId, body, user.id);

	if (!result) {
		return c.json({ success: false, error: "Box not found", code: "NOT_FOUND" }, 404);
	}

	return jsonSuccess(c, {
		sadaqah: result.sadaqah,
		updatedBox: {
			id: result.updatedBox.id,
			name: result.updatedBox.name,
			count: result.updatedBox.count,
			totalValue: result.updatedBox.totalValue,
			currencyId: result.updatedBox.currencyId,
		},
	}, 201);
};

// Delete Sadaqah
export const deleteRoute = buildRoute({
	method: "delete",
	path: "/api/boxes/{boxId}/sadaqahs/{sadaqahId}",
	tags: ["Sadaqahs"],
	summary: "Delete a sadaqah",
	params: z.object({
		boxId: z.string(),
		sadaqahId: z.string(),
	}),
	responses: {
		...create200Response(DeleteSadaqahResponseSchema, "Sadaqah deleted"),
		...create404Response("Sadaqah not found"),
	},
	requireAuth: true,
});

export const deleteHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { sadaqahId } = getParams<{ sadaqahId: string }>(c);

	const result = await getSadaqahService(c).deleteSadaqah(sadaqahId, user.id);

	if (!result.deleted) {
		return c.json({ success: false, error: "Sadaqah not found", code: "NOT_FOUND" }, 404);
	}

	return jsonSuccess(c, {
		deleted: true,
		updatedBox: result.updatedBox ? {
			id: result.updatedBox.id,
			name: result.updatedBox.name,
			count: result.updatedBox.count,
			totalValue: result.updatedBox.totalValue,
			currencyId: result.updatedBox.currencyId,
		} : undefined,
	});
};

// ============== Route Definitions Export ==============

export const sadaqahRouteDefinitions: RouteDefinition[] = [
	{ route: listRoute, handler: listHandler, middleware: [requireAuth] },
	{ route: createRoute, handler: createHandler, middleware: [requireAuth] },
	{ route: deleteRoute, handler: deleteHandler, middleware: [requireAuth] },
];
