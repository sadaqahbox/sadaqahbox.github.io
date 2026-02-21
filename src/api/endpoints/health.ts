/**
 * Health Check Endpoint
 * 
 * Simple health check endpoint for monitoring.
 */

import { createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { success } from "../shared/response";
import { create200Response } from "../shared/route-builder";

// ============== Schema ==============

const HealthResponseSchema = z.object({
    success: z.boolean(),
    status: z.string(),
    timestamp: z.string(),
    requestId: z.string().optional(),
});

// ============== Route ==============

export const healthRoute = createRoute({
    method: "get",
    path: "/api/health",
    tags: ["System"],
    summary: "Health check",
    description: "Returns API health status",
    responses: create200Response(HealthResponseSchema, "Health check response"),
});

// ============== Handler ==============

export async function healthHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
    return c.json(success({
        status: "ok",
        timestamp: new Date().toISOString(),
        requestId: c.get("requestId"),
    }));
}
