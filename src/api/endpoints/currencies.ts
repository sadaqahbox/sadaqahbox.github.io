/**
 * Currency endpoints
 *
 * Uses service layer for business logic.
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { requireAuth, requireAdmin, getCurrentUser } from "../middleware";
import { getCurrencyService, GoldRateService } from "../services";
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
import { getDbFromContext } from "../../db";

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
	const body = getBody<{ code: string; name: string; symbol?: string; currencyTypeId?: string; usdValue?: number }>(c);

	try {
		const currency = await getCurrencyService(c).createCurrency({
			code: body.code,
			name: body.name,
			symbol: body.symbol,
			currencyTypeId: body.currencyTypeId,
			usdValue: body.usdValue,
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

// Update Gold Rates (Admin only)
export const updateGoldRatesRoute = buildRoute({
	method: "post",
	path: "/api/currencies/update-gold-rates",
	tags: ["Currencies"],
	summary: "Update gold rates for all currencies",
	description: "Fetches latest gold prices from external APIs and updates all currency gold values. Admin only.",
	responses: create200Response(z.object({
		success: z.boolean(),
		updated: z.number(),
		errors: z.array(z.string()).optional(),
	}), "Returns number of currencies updated"),
	requireAuth: true,
});

export const updateGoldRatesHandler = async (c: Context<{ Bindings: Env }>) => {
	const db = getDbFromContext(c);
	const goldRateService = GoldRateService.getInstance(db);
	
	const result = await goldRateService.updateCurrencyValues();
	
	return jsonSuccess(c, { 
		updated: result.updated,
		errors: result.errors.length > 0 ? result.errors : undefined,
	});
};

// ============== Route Definitions ==============

export const currencyRouteDefinitions: RouteDefinition[] = [
	{ route: listRoute, handler: listHandler, middleware: [requireAuth] },
	{ route: createRoute, handler: createHandler, middleware: [requireAuth, requireAdmin] },
	{ route: getRoute, handler: getHandler, middleware: [requireAuth] },
	{ route: deleteRoute, handler: deleteHandler, middleware: [requireAuth, requireAdmin] },
	{ route: updateGoldRatesRoute, handler: updateGoldRatesHandler, middleware: [requireAuth, requireAdmin] },
];
