/**
 * Stats endpoints - Refactored
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { requireAuth, getCurrentUser } from "../middleware";
import { getBoxEntity, getSadaqahEntity } from "../entities";
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

	const uniqueCurrencies = new Set(sadaqahs.map((s) => s.currencyId)).size;

	return jsonSuccess(c, {
		totalBoxes: boxes.length,
		totalSadaqahs: sadaqahs.length,
		totalValue: boxes.reduce((sum, b) => sum + b.totalValue, 0),
		uniqueCurrencies,
	});
};

export const statsRouteDefinitions: RouteDefinition[] = [
	{ route: statsRoute, handler: statsHandler, middleware: [requireAuth] },
];
