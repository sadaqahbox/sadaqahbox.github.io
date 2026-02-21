/**
 * Stats Endpoints
 * 
 * User statistics and legacy counter endpoints.
 */

import { createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { requireAuth, getCurrentUser } from "../middleware";
import { getBoxEntity } from "../entities";
import { create200Response } from "../shared/route-builder";

// ============== Schemas ==============

const StatsSchema = z.object({
    totalBoxes: z.number().int(),
    totalSadaqahs: z.number().int(),
    totalValue: z.number(),
});

const StatsResponseSchema = z.object({
    success: z.boolean(),
    stats: StatsSchema,
});

const CountResponseSchema = z.object({
    success: z.boolean(),
    count: z.number().int(),
});

// ============== Routes ==============

export const statsRoute = createRoute({
    method: "get",
    path: "/api/stats",
    tags: ["Stats"],
    summary: "Get user statistics",
    description: "Returns statistics for the authenticated user",
    security: [{ apiKeyCookie: [] }, { bearerAuth: [] }],
    responses: create200Response(StatsResponseSchema, "User statistics"),
});

export const countRoute = createRoute({
    method: "get",
    path: "/api/count",
    tags: ["Stats"],
    summary: "Get total sadaqah count (legacy)",
    description: "Returns total sadaqah count for the authenticated user",
    security: [{ apiKeyCookie: [] }, { bearerAuth: [] }],
    responses: create200Response(CountResponseSchema, "Total sadaqah count"),
});

// ============== Handlers ==============

async function getUserBoxes(c: Context<{ Bindings: Env }>) {
    const user = getCurrentUser(c);
    return getBoxEntity(c).list(user.id);
}

export async function statsHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
    const boxes = await getUserBoxes(c);

    return c.json({
        success: true,
        stats: {
            totalBoxes: boxes.length,
            totalSadaqahs: boxes.reduce((sum, b) => sum + b.count, 0),
            totalValue: boxes.reduce((sum, b) => sum + b.totalValue, 0),
        },
    });
}

export async function countHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
    const boxes = await getUserBoxes(c);
    return c.json({
        success: true,
        count: boxes.reduce((sum, b) => sum + b.count, 0),
    });
}

// ============== Route Definitions ==============

export const statsRouteDefinitions = [
    { route: statsRoute, handler: statsHandler, middleware: [requireAuth] },
    { route: countRoute, handler: countHandler, middleware: [requireAuth] },
];
