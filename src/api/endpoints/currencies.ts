/**
 * Currency endpoints
 *
 * Uses service layer for business logic.
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { requireAuth, requireAdmin, getCurrentUser } from "../middleware";
import { getCurrencyService } from "../services";
import { CurrencySchema, CreateCurrencyBodySchema } from "../dtos";
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

const CurrencyIdParamSchema = createIdParamSchema("currencyId");

// ============== Routes & Handlers ==============

// List
export const listRoute = buildRoute({
	method: "get",
	path: "/api/currencies",
	tags: ["Currencies"],
	summary: "List all currencies",
	responses: create200Response(z.object({
		success: z.boolean(),
		currencies: z.array(CurrencySchema),
	}), "Returns a list of currencies"),
	requireAuth: true,
});

export const listHandler = async (c: Context<{ Bindings: Env }>) => {
	const currencies = await getCurrencyService(c).listCurrencies();
	return jsonSuccess(c, { currencies });
};

// Create
export const createRoute = buildRoute({
	method: "post",
	path: "/api/currencies",
	tags: ["Currencies"],
	summary: "Create a new currency",
	body: CreateCurrencyBodySchema,
	responses: create201Response(z.object({
		success: z.boolean(),
		currency: CurrencySchema,
	}), "Returns the created currency"),
	requireAuth: true,
});

export const createHandler = async (c: Context<{ Bindings: Env }>) => {
	const body = getBody<{ code: string; name: string; symbol?: string; currencyTypeId?: string }>(c);

	try {
		const currency = await getCurrencyService(c).createCurrency({
			code: body.code,
			name: body.name,
			symbol: body.symbol,
			currencyTypeId: body.currencyTypeId,
		});
		return jsonSuccess(c, { currency }, 201);
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
	path: "/api/currencies/{currencyId}",
	tags: ["Currencies"],
	summary: "Get a currency by ID",
	params: CurrencyIdParamSchema,
	responses: create200Response(z.object({
		success: z.boolean(),
		currency: CurrencySchema,
	}), "Returns the currency"),
	requireAuth: true,
});

export const getHandler = async (c: Context<{ Bindings: Env }>) => {
	const { currencyId } = getParams<{ currencyId: string }>(c);
	const currency = await getCurrencyService(c).getCurrency(currencyId);

	if (!currency) {
		return c.json({ success: false, error: "Currency not found" }, 404);
	}

	return jsonSuccess(c, { currency });
};

// Delete
export const deleteRoute = buildRoute({
	method: "delete",
	path: "/api/currencies/{currencyId}",
	tags: ["Currencies"],
	summary: "Delete a currency",
	params: CurrencyIdParamSchema,
	responses: create200Response(z.object({
		success: z.boolean(),
		deleted: z.boolean(),
	}), "Returns deletion status"),
	requireAuth: true,
});

export const deleteHandler = async (c: Context<{ Bindings: Env }>) => {
	const { currencyId } = getParams<{ currencyId: string }>(c);
	const deleted = await getCurrencyService(c).deleteCurrency(currencyId);

	if (!deleted) {
		return c.json({ success: false, error: "Currency not found" }, 404);
	}

	return jsonSuccess(c, { deleted: true });
};

// ============== Route Definitions ==============

export const currencyRouteDefinitions: RouteDefinition[] = [
	{ route: listRoute, handler: listHandler, middleware: [requireAuth] },
	{ route: createRoute, handler: createHandler, middleware: [requireAuth, requireAdmin] },
	{ route: getRoute, handler: getHandler, middleware: [requireAuth] },
	{ route: deleteRoute, handler: deleteHandler, middleware: [requireAuth, requireAdmin] },
];
