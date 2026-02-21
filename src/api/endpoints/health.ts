/**
 * Health Check Endpoint
 *
 * Comprehensive health check with dependency status monitoring.
 * Used by load balancers and monitoring systems.
 */

import { createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { success } from "../shared/response";
import { create200Response } from "../shared/route-builder";
import { getDbFromContext } from "../../db";
import { sql } from "drizzle-orm";

// ============== Schema ==============

const DependencyStatusSchema = z.object({
    name: z.string(),
    status: z.enum(["healthy", "degraded", "unhealthy"]),
    responseTime: z.number().optional(),
    error: z.string().optional(),
});

const HealthResponseSchema = z.object({
    success: z.boolean(),
    status: z.enum(["healthy", "degraded", "unhealthy"]),
    timestamp: z.string(),
    requestId: z.string().optional(),
    version: z.string().optional(),
    uptime: z.number(),
    dependencies: z.array(DependencyStatusSchema),
});

// ============== Route ==============

export const healthRoute = createRoute({
    method: "get",
    path: "/api/health",
    tags: ["System"],
    summary: "Health check",
    description: "Returns API health status with dependency checks",
    responses: create200Response(HealthResponseSchema, "Health check response"),
});

// ============== Health Checks ==============

interface HealthCheckResult {
    name: string;
    status: "healthy" | "degraded" | "unhealthy";
    responseTime?: number;
    error?: string;
}

/**
 * Check database health
 */
async function checkDatabase(c: Context<{ Bindings: Env }>): Promise<HealthCheckResult> {
    const startTime = performance.now();
    try {
        const db = getDbFromContext(c);
        // Simple query to verify database connection using drizzle
        await db.run(sql`SELECT 1`);
        return {
            name: "database",
            status: "healthy",
            responseTime: Math.round(performance.now() - startTime),
        };
    } catch (error) {
        return {
            name: "database",
            status: "unhealthy",
            responseTime: Math.round(performance.now() - startTime),
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get overall health status from dependencies
 */
function getOverallStatus(dependencies: HealthCheckResult[]): "healthy" | "degraded" | "unhealthy" {
    const hasUnhealthy = dependencies.some(d => d.status === "unhealthy");
    const hasDegraded = dependencies.some(d => d.status === "degraded");

    if (hasUnhealthy) return "unhealthy";
    if (hasDegraded) return "degraded";
    return "healthy";
}

// ============== Handler ==============

export async function healthHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
    // Run health checks
    const dependencies = await Promise.all([
        checkDatabase(c),
    ]);

    const overallStatus = getOverallStatus(dependencies);

    // Get app version from environment or package.json
    const version = typeof process !== "undefined" ? process.env.APP_VERSION : undefined;

    // Calculate uptime (if available)
    const uptime = typeof process !== "undefined" && process.uptime ? process.uptime() : 0;

    const response = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        requestId: c.get("requestId"),
        version,
        uptime,
        dependencies,
    };

    // Return appropriate status code
    const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

    return c.json(success(response), statusCode);
}

/**
 * Liveness probe - basic check that the server is running
 */
export async function livenessHandler(c: Context): Promise<Response> {
    return c.json({
        status: "alive",
        timestamp: new Date().toISOString(),
    });
}

/**
 * Readiness probe - check if the server is ready to accept traffic
 */
export async function readinessHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
    const dbCheck = await checkDatabase(c);

    if (dbCheck.status === "unhealthy") {
        return c.json({
            status: "not ready",
            reason: "database unavailable",
            timestamp: new Date().toISOString(),
        }, 503);
    }

    return c.json({
        status: "ready",
        timestamp: new Date().toISOString(),
    });
}
