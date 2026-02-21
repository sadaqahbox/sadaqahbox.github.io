/**
 * Currency Type endpoints
 *
 * Uses service layer for business logic.
 */

import type { Context } from "hono";
import { requireAuth, requireAdmin, getCurrentUser } from "../middleware";
import { getCurrencyTypeService } from "../services";
import {
	getParams,
	getBody,
	jsonSuccess,
	type RouteDefinition,
} from "../shared/route-builder";

import * as routes from "./currency-types.routes";

// ============== Handlers ==============

// List
export const listHandler = async (c: Context<{ Bindings: Env }>) => {
	const currencyTypes = await getCurrencyTypeService(c).listCurrencyTypes();
	return jsonSuccess(c, { currencyTypes });
};

// Create
export const createHandler = async (c: Context<{ Bindings: Env }>) => {
	const body = getBody<{ name: string; description?: string }>(c);

	try {
		const currencyType = await getCurrencyTypeService(c).createCurrencyType({
			name: body.name,
			description: body.description,
		});
		return jsonSuccess(c, { currencyType }, 201);
	} catch (error) {
		if (error instanceof Error && error.message.includes("already exists")) {
			return c.json({ success: false, error: error.message }, 409);
		}
		throw error;
	}
};

// Get
export const getHandler = async (c: Context<{ Bindings: Env }>) => {
	const { currencyTypeId } = getParams<{ currencyTypeId: string }>(c);
	const currencyType = await getCurrencyTypeService(c).getCurrencyType(currencyTypeId);

	if (!currencyType) {
		return c.json({ success: false, error: "Currency type not found" }, 404);
	}

	return jsonSuccess(c, { currencyType });
};

// Delete
export const deleteHandler = async (c: Context<{ Bindings: Env }>) => {
	const { currencyTypeId } = getParams<{ currencyTypeId: string }>(c);
	const deleted = await getCurrencyTypeService(c).deleteCurrencyType(currencyTypeId);

	if (!deleted) {
		return c.json({ success: false, error: "Currency type not found" }, 404);
	}

	return jsonSuccess(c, { deleted: true });
};

// ============== Route Definitions ==============

export const currencyTypeRouteDefinitions: RouteDefinition[] = [
	{ route: routes.listRoute, handler: listHandler, middleware: [requireAuth] },
	{ route: routes.createRoute, handler: createHandler, middleware: [requireAuth, requireAdmin] },
	{ route: routes.getRoute, handler: getHandler, middleware: [requireAuth] },
	{ route: routes.deleteRoute, handler: deleteHandler, middleware: [requireAuth, requireAdmin] },
];
