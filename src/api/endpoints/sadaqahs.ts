/**
 * Sadaqah endpoints - Refactored
 *
 * Uses service layer for business logic and DTOs for type safety.
 */

import type { Context } from "hono";
import { requireAuth, getCurrentUser } from "../middleware";
import { getSadaqahService, type AddSadaqahInput } from "../services";
import {
	getParams,
	getQuery,
	getBody,
	jsonSuccess,
	type RouteDefinition,
} from "../shared/route-builder";

import * as routes from "./sadaqahs.routes";

// ============== Handlers ==============

// List Sadaqahs
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
export const createHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);
	const { boxId } = getParams<{ boxId: string }>(c);
	const body = getBody<AddSadaqahInput>(c);

	const result = await getSadaqahService(c).addSadaqah(boxId, body, user.id);

	if (!result) {
		return c.json({ success: false, error: "Box not found", code: "NOT_FOUND" }, 404);
	}

	return jsonSuccess(c, {
		sadaqahs: [result.sadaqah],
		box: {
			id: result.updatedBox.id,
			name: result.updatedBox.name,
			description: result.updatedBox.description,
			count: result.updatedBox.count,
			totalValue: result.updatedBox.totalValue,
			totalValueExtra: result.updatedBox.totalValueExtra,
			currencyId: result.updatedBox.currencyId,
			currency: result.updatedBox.currency ?? null,
			baseCurrencyId: result.updatedBox.baseCurrencyId,
			baseCurrency: result.updatedBox.baseCurrency ?? null,
			createdAt: result.updatedBox.createdAt,
			updatedAt: result.updatedBox.updatedAt,
		},
		message: "Sadaqah added successfully",
	}, 201);
};

// Delete Sadaqah
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
	{ route: routes.listRoute, handler: listHandler, middleware: [requireAuth] },
	{ route: routes.createRoute, handler: createHandler, middleware: [requireAuth] },
	{ route: routes.deleteRoute, handler: deleteHandler, middleware: [requireAuth] },
];
