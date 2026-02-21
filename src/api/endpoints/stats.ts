/**
 * Stats endpoints - Refactored
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { requireAuth, getCurrentUser } from "../middleware";
import { getBoxEntity, getSadaqahEntity, getCurrencyEntity } from "../entities";
import {
	buildRoute,
	create200Response,
	type RouteDefinition,
} from "../shared/route-builder";
import { StatsResponseSchema } from "../dtos";
import { jsonSuccess } from "../shared/route-builder";

export const statsRoute = buildRoute({
	method: "get",
	path: "/api/stats",
	tags: ["Stats"],
	summary: "Get user statistics",
	responses: create200Response(StatsResponseSchema, "User statistics"),
	requireAuth: true,
});

export const statsHandler = async (c: Context<{ Bindings: Env }>) => {
	const user = getCurrentUser(c);

	const boxes = await getBoxEntity(c).list(user.id);
	const sadaqahs = await getSadaqahEntity(c).listByUser(user.id);
	const currencyEntity = getCurrencyEntity(c);

	const uniqueCurrencies = new Set(sadaqahs.map((s) => s.currencyId)).size;

	// Calculate total value and get the most common base currency
	const totalValue = boxes.reduce((sum, b) => sum + b.totalValue, 0);
	
	// Get base currencies from boxes
	const baseCurrencyCounts = new Map<string, { id: string; code: string; name: string; symbol?: string; count: number }>();
	for (const box of boxes) {
		if (box.baseCurrencyId) {
			const existing = baseCurrencyCounts.get(box.baseCurrencyId);
			if (existing) {
				existing.count++;
			} else {
				// Fetch currency info
				const currency = await currencyEntity.get(box.baseCurrencyId);
				if (currency) {
					baseCurrencyCounts.set(box.baseCurrencyId, {
						id: currency.id,
						code: currency.code,
						name: currency.name,
						symbol: currency.symbol || undefined,
						count: 1,
					});
				}
			}
		}
	}
	
	// Find the most common base currency
	let primaryCurrency: { id: string; code: string; name: string; symbol?: string } | null = null;
	let maxCount = 0;
	for (const [, currency] of baseCurrencyCounts) {
		if (currency.count > maxCount) {
			maxCount = currency.count;
			primaryCurrency = {
				id: currency.id,
				code: currency.code,
				name: currency.name,
				symbol: currency.symbol,
			};
		}
	}

	return jsonSuccess(c, {
		totalBoxes: boxes.length,
		totalSadaqahs: sadaqahs.length,
		totalValue,
		uniqueCurrencies,
		primaryCurrency,
	});
};

export const statsRouteDefinitions: RouteDefinition[] = [
	{ route: statsRoute, handler: statsHandler, middleware: [requireAuth] },
];
