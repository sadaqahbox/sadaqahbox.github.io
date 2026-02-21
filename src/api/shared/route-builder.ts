/**
 * Route builder utilities for standardized OpenAPI route creation
 * Reduces boilerplate and ensures consistency across endpoints
 */

import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import type { Context, Next } from "hono";
import { success } from "./response";
import type { MiddlewareHandler } from "hono";

// ============== Common Response Schemas ==============

export const SuccessResponseSchema = z.object({
	success: z.boolean(),
});

export const ErrorResponseSchema = z.object({
	success: z.boolean(),
	error: z.string(),
	code: z.string().optional(),
});

export const NotFoundResponseSchema = z.object({
	success: z.boolean(),
	error: z.string(),
});

// ============== Standard Response Helpers ==============

/**
 * Creates a standard 200 response config
 */
export function create200Response<T extends z.ZodType>(
	schema: T,
	description = "Success"
) {
	return {
		200: {
			description,
			content: { "application/json": { schema } },
		},
	};
}

/**
 * Creates a standard 201 response config
 */
export function create201Response<T extends z.ZodType>(
	schema: T,
	description = "Created"
) {
	return {
		201: {
			description,
			content: { "application/json": { schema } },
		},
	};
}

/**
 * Creates a standard 404 response config
 */
export function create404Response(description = "Not found") {
	return {
		404: {
			description,
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	};
}

/**
 * Creates a standard 400 response config
 */
export function create400Response(description = "Bad request") {
	return {
		400: {
			description,
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	};
}

/**
 * Creates a standard 409 response config
 */
export function create409Response(description = "Conflict") {
	return {
		409: {
			description,
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	};
}

// ============== Pagination Helpers ==============

export const PaginationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
});

export const PaginationSchema = z.object({
	page: z.number(),
	limit: z.number(),
	total: z.number(),
	totalPages: z.number(),
});

/**
 * Creates paginated response schema
 */
export function createPaginatedResponse<T extends z.ZodType>(
	itemSchema: T,
	itemName: string
) {
	return z.object({
		success: z.boolean(),
		[itemName]: itemSchema.array(),
		total: z.number(),
	});
}

// ============== ID Parameter Helpers ==============

export function createIdParamSchema(paramName: string, description?: string) {
	return z.object({
		[paramName]: z.string().openapi({
			description: description || `${paramName} ID`,
		}),
	});
}

// ============== Route Builder ==============

export interface RouteConfig<
	P extends z.ZodType | undefined = undefined,
	Q extends z.ZodType | undefined = undefined,
	B extends z.ZodType | undefined = undefined,
> {
	method: "get" | "post" | "patch" | "put" | "delete";
	path: string;
	tags: string[];
	summary: string;
	params?: P;
	query?: Q;
	body?: B;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	responses: Record<string, any>;
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
		request: Object.keys(request).length > 0 ? request : undefined,
		responses: config.responses,
		...(config.requireAuth ? {
			security: [
				{ apiKeyCookie: [] },
				{ bearerAuth: [] },
			],
		} : {}),
	});
}

// ============== Handler Helpers ==============

/**
 * Type-safe wrapper for extracting validated params
 */
export function getParams<T extends Record<string, string>>(
	c: Context
): T {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (c.req.valid as any)("param") as T;
}

/**
 * Type-safe wrapper for extracting validated query
 */
export function getQuery<T extends Record<string, unknown>>(
	c: Context
): T {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (c.req.valid as any)("query") as T;
}

/**
 * Type-safe wrapper for extracting validated body
 */
export function getBody<T extends Record<string, unknown>>(
	c: Context
): T {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (c.req.valid as any)("json") as T;
}

/**
 * Creates a success JSON response
 */
export function jsonSuccess<T extends Record<string, unknown>>(
	c: Context,
	data: T,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	status: any = 200
) {
	return c.json(success(data), status);
}

// ============== Route Registration Helper ==============

export interface RouteDefinition {
	route: ReturnType<typeof createRoute>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	handler: (c: Context<any>) => Promise<Response | void>;
	middleware?: MiddlewareHandler<{ Bindings: Env }>[];
}

/**
 * Registers a route with the app (with type workaround for params mismatch)
 */
export function registerRoute(
	app: OpenAPIHono<{ Bindings: Env }>,
	definition: RouteDefinition
): void {
	// @ts-expect-error - Type mismatch for routes without params
	app.openapi(definition.route, definition.handler, ...(definition.middleware || []));
}

/**
 * Registers multiple routes with the app
 */
export function registerRoutes(
	app: OpenAPIHono<{ Bindings: Env }>,
	definitions: RouteDefinition[]
): void {
	for (const def of definitions) {
		registerRoute(app, def);
	}
}
