/**
 * Currency endpoints
 *
 * Uses service layer for business logic.
 */

import type { Context } from "hono";
import { requireAuth, requireAdmin, getCurrentUser } from "../middleware";
import { getCurrencyService, ExchangeRateService } from "../services";
import {
	getParams,
	getBody,
	jsonSuccess,
	type RouteDefinition,
} from "../shared/route-builder";
import { getDbFromContext } from "../../db";

import * as routes from "./currencies.routes";

// ============== Handlers ==============

// List
export const listHandler = async (c: Context<{ Bindings: Env }>) => {
	const currencies = await getCurrencyService(c).listCurrencies();
	return jsonSuccess(c, { currencies });
};

// Create
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
export const getHandler = async (c: Context<{ Bindings: Env }>) => {
	const { currencyId } = getParams<{ currencyId: string }>(c);
	const currency = await getCurrencyService(c).getCurrency(currencyId);

	if (!currency) {
		return c.json({ success: false, error: "Currency not found" }, 404);
	}

	return jsonSuccess(c, { currency });
};

// Delete
export const deleteHandler = async (c: Context<{ Bindings: Env }>) => {
	const { currencyId } = getParams<{ currencyId: string }>(c);
	const deleted = await getCurrencyService(c).deleteCurrency(currencyId);

	if (!deleted) {
		return c.json({ success: false, error: "Currency not found" }, 404);
	}

	return jsonSuccess(c, { deleted: true });
};

// Update Gold Rates (Admin only)
export const updateGoldRatesHandler = async (c: Context<{ Bindings: Env }>) => {
	const db = getDbFromContext(c);
	const exchangeRateService = ExchangeRateService.getInstance(db);

	const result = await exchangeRateService.updateCurrencyValues();

	return jsonSuccess(c, {
		updated: result.updated,
		errors: result.errors.length > 0 ? result.errors : undefined,
	});
};

// ============== Route Definitions ==============

export const currencyRouteDefinitions: RouteDefinition[] = [
	{ route: routes.listRoute, handler: listHandler, middleware: [requireAuth] },
	{ route: routes.createRoute, handler: createHandler, middleware: [requireAuth, requireAdmin] },
	{ route: routes.getRoute, handler: getHandler, middleware: [requireAuth] },
	{ route: routes.deleteRoute, handler: deleteHandler, middleware: [requireAuth, requireAdmin] },
	{ route: routes.updateGoldRatesRoute, handler: updateGoldRatesHandler, middleware: [requireAuth, requireAdmin] },
];
