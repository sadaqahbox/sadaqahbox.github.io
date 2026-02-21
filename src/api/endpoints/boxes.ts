/**
 * Box endpoints - Refactored
 *
 * Uses service layer for business logic and DTOs for type safety.
 */

import type { Context } from "hono";
import { requireAuth, getCurrentUser } from "../middleware";
import { getBoxService, type CreateBoxInput, type UpdateBoxInput } from "../services";
import {
	buildRoute,
	getParams,
	getQuery,
	getBody,
	jsonSuccess,
	type RouteDefinition,
} from "../shared/route-builder";
import * as routes from "./boxes.routes";

// ============== Handlers ==============

// List
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

// ============== Route Definitions Export ==============

export const boxRouteDefinitions: RouteDefinition[] = [
	{ route: routes.listRoute, handler: listHandler, middleware: [requireAuth] },
	{ route: routes.createRoute, handler: createHandler, middleware: [requireAuth] },
	{ route: routes.getRoute, handler: getHandler, middleware: [requireAuth] },
	{ route: routes.updateRoute, handler: updateHandler, middleware: [requireAuth] },
	{ route: routes.deleteRoute, handler: deleteHandler, middleware: [requireAuth] },
	{ route: routes.emptyRoute, handler: emptyHandler, middleware: [requireAuth] },
	{ route: routes.collectionsRoute, handler: collectionsHandler, middleware: [requireAuth] },
];
