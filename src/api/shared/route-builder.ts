/**
 * Route Builder
 * 
 * Simplified OpenAPI route creation utilities.
 * Schema helpers have been moved to schema-helpers.ts to avoid circular dependencies.
 */

import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import type { Context, Next } from "hono";
import type { MiddlewareHandler } from "hono";

// Re-export schema helpers for convenience
export {
	SuccessResponseSchema,
	ErrorResponseSchema,
	NotFoundResponseSchema,
	PaginationQuerySchema,
	PaginationSchema,
	createIdParamSchema,
	createPaginatedResponse,
	createItemResponseSchema,
	create200Response,
	create201Response,
	create204Response,
	create400Response,
	create401Response,
	create403Response,
	create404Response,
	create409Response,
	create422Response,
	create429Response,
	create500Response,
	IsoDateSchema,
	IdSchema,
	NonEmptyStringSchema,
	OptionalStringSchema,
	MetadataSchema,
	ErrorCodeSchema,
	type Pagination,
	type ErrorCode,
} from "./schema-helpers";

// ============== Route Configuration ==============

export interface RouteConfig<
	P extends z.ZodType | undefined = undefined,
	Q extends z.ZodType | undefined = undefined,
	B extends z.ZodType | undefined = undefined,
> {
	method: "get" | "post" | "patch" | "put" | "delete";
	path: string;
	tags: string[];
	summary: string;
	description?: string;
	params?: P;
	query?: Q;
	body?: B;
	responses: Record<string, unknown>;
	/** Whether this route requires authentication (adds security to OpenAPI docs) */
	requireAuth?: boolean;
}

/**
 * Builds a standardized OpenAPI route
 */
export function buildRoute<
	P extends z.ZodType | undefined = undefined,
	Q extends z.ZodType | undefined = undefined,
	B extends z.ZodType | undefined = undefined,
>(config: RouteConfig<P, Q, B>) {
	const request: Record<string, unknown> = {};

	if (config.params) request.params = config.params;
	if (config.query) request.query = config.query;
	if (config.body) {
		request.body = {
			content: { "application/json": { schema: config.body } },
		};
	}

	return createRoute({
		method: config.method,
		path: config.path,
		tags: config.tags,
		summary: config.summary,
		description: config.description,
		request: Object.keys(request).length > 0 ? request : undefined,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		responses: config.responses as Record<string, any>,
		...(config.requireAuth ? {
			security: [
				{ apiKeyCookie: [] },
				{ bearerAuth: [] },
				{ apiKeyHeader: [] },
			],
		} : {}),
	});
}

// ============== Route Definition Type ==============

export interface RouteDefinition {
	route: ReturnType<typeof createRoute>;
	handler: (c: Context<{ Bindings: Env }>) => Promise<Response>;
	middleware?: MiddlewareHandler<{ Bindings: Env }>[];
}

// ============== Handler Helpers ==============

/**
 * Type-safe wrapper for extracting validated params
 */
export function getParams<T extends Record<string, string>>(
	c: Context
): T {
	return (c.req.valid as (type: string) => T)("param");
}

/**
 * Type-safe wrapper for extracting validated query
 */
export function getQuery<T extends Record<string, unknown>>(
	c: Context
): T {
	return (c.req.valid as (type: string) => T)("query");
}

/**
 * Type-safe wrapper for extracting validated body
 */
export function getBody<T>(c: Context): T {
	return (c.req.valid as (type: string) => T)("json");
}

/**
 * Creates a success JSON response helper
 */
export function jsonSuccess<T>(c: Context, data: T, status: 200 | 201 = 200): Response {
	return c.json({ success: true, ...data }, status);
}

// ============== Route Registration ==============

/**
 * Registers a group of routes with optional middleware
 */
export function registerRoutes(
	app: OpenAPIHono<{ Bindings: Env }>,
	routes: RouteDefinition[]
): void {
	for (const { route, handler, middleware } of routes) {
		if (middleware && middleware.length > 0) {
			// Apply middleware then route handler
			app.use(route.getRoutingPath(), ...middleware);
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		app.openapi(route as any, handler);
	}
}

// ============== Middleware Composition ==============

/**
 * Composes multiple middleware handlers into a single handler
 */
export function composeMiddleware(
	...handlers: MiddlewareHandler<{ Bindings: Env }>[]
): MiddlewareHandler<{ Bindings: Env }> {
	return async (c: Context<{ Bindings: Env }>, next: Next) => {
		for (const handler of handlers) {
			await handler(c, async () => {});
		}
		await next();
	};
}
