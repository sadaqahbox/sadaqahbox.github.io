/**
 * Currency Type endpoints
 *
 * Uses service layer for business logic.
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { requireAuth, requireAdmin, getCurrentUser } from "../middleware";
import { getCurrencyTypeService } from "../services";
import { CurrencyTypeSchema, CreateCurrencyTypeBodySchema } from "../dtos";
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

const CurrencyTypeIdParamSchema = createIdParamSchema("currencyTypeId");

// ============== Routes & Handlers ==============

// List
export const listRoute = buildRoute({
	method: "get",
	path: "/api/currency-types",
	tags: ["Currency Types"],
	summary: "List all currency types",
	responses: create200Response(z.object({
		success: z.boolean(),
		currencyTypes: z.array(CurrencyTypeSchema),
	}), "Returns a list of currency types"),
	requireAuth: true,
});

export const listHandler = async (c: Context<{ Bindings: Env }>) => {
	const currencyTypes = await getCurrencyTypeService(c).listCurrencyTypes();
	return jsonSuccess(c, { currencyTypes });
};

// Create
export const createRoute = buildRoute({
	method: "post",
	path: "/api/currency-types",
	tags: ["Currency Types"],
	summary: "Create a new currency type",
	body: CreateCurrencyTypeBodySchema,
	responses: create201Response(z.object({
		success: z.boolean(),
		currencyType: CurrencyTypeSchema,
	}), "Returns the created currency type"),
	requireAuth: true,
});

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
export const getRoute = buildRoute({
	method: "get",
	path: "/api/currency-types/{currencyTypeId}",
	tags: ["Currency Types"],
	summary: "Get a currency type by ID",
	params: CurrencyTypeIdParamSchema,
	responses: create200Response(z.object({
		success: z.boolean(),
		currencyType: CurrencyTypeSchema,
	}), "Returns the currency type"),
	requireAuth: true,
});

export const getHandler = async (c: Context<{ Bindings: Env }>) => {
	const { currencyTypeId } = getParams<{ currencyTypeId: string }>(c);
	const currencyType = await getCurrencyTypeService(c).getCurrencyType(currencyTypeId);

	if (!currencyType) {
		return c.json({ success: false, error: "Currency type not found" }, 404);
	}

	return jsonSuccess(c, { currencyType });
};

// Delete
export const deleteRoute = buildRoute({
	method: "delete",
	path: "/api/currency-types/{currencyTypeId}",
	tags: ["Currency Types"],
	summary: "Delete a currency type",
	params: CurrencyTypeIdParamSchema,
	responses: create200Response(z.object({
		success: z.boolean(),
		deleted: z.boolean(),
	}), "Returns deletion status"),
	requireAuth: true,
});

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
	{ route: listRoute, handler: listHandler, middleware: [requireAuth] },
	{ route: createRoute, handler: createHandler, middleware: [requireAuth, requireAdmin] },
	{ route: getRoute, handler: getHandler, middleware: [requireAuth] },
	{ route: deleteRoute, handler: deleteHandler, middleware: [requireAuth, requireAdmin] },
];
