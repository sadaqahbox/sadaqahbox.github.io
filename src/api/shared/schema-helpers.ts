/**
 * Schema Helpers
 * 
 * Reusable Zod schema utilities and response builders.
 * Separated from route-builder to avoid circular dependencies.
 */

import { z } from "@hono/zod-openapi";

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
 * Creates a standard 204 (No Content) response config
 */
export function create204Response(description = "No content") {
	return {
		204: {
			description,
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
 * Creates a standard 401 response config
 */
export function create401Response(description = "Unauthorized") {
	return {
		401: {
			description,
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	};
}

/**
 * Creates a standard 403 response config
 */
export function create403Response(description = "Forbidden") {
	return {
		403: {
			description,
			content: { "application/json": { schema: ErrorResponseSchema } },
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

/**
 * Creates a standard 422 response config for validation errors
 */
export function create422Response(description = "Validation error") {
	return {
		422: {
			description,
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	};
}

/**
 * Creates a standard 429 response config for rate limiting
 */
export function create429Response(description = "Too many requests") {
	return {
		429: {
			description,
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	};
}

/**
 * Creates a standard 500 response config
 */
export function create500Response(description = "Internal server error") {
	return {
		500: {
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
	page: z.number().int().positive(),
	limit: z.number().int().positive(),
	total: z.number().int().nonnegative(),
	totalPages: z.number().int().nonnegative(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

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
		total: z.number().int().nonnegative(),
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

// ============== Item Response Helpers ==============

/**
 * Creates a single item response schema
 */
export function createItemResponseSchema<T extends z.ZodType>(
	itemSchema: T,
	itemName: string
) {
	return z.object({
		success: z.boolean(),
		[itemName]: itemSchema,
	});
}

/**
 * Creates a success response with additional data
 */
export function createSuccessResponseSchema<T extends z.ZodType>(
	dataSchema: T,
	dataName: string
) {
	return z.object({
		success: z.boolean(),
		[dataName]: dataSchema,
	});
}

// ============== Common Field Schemas ==============

export const IsoDateSchema = z
	.union([z.date(), z.string().datetime()])
	.transform((val) => (val instanceof Date ? val.toISOString() : val));

export const IdSchema = z.string().regex(/^[a-z]+_[a-zA-Z0-9]+$/);

export const NonEmptyStringSchema = z.string().min(1);

export const OptionalStringSchema = z.string().optional();

export const MetadataSchema = z.record(z.string(), z.string()).optional();

// ============== Error Code Enum ==============

export const ErrorCodeSchema = z.enum([
	"BAD_REQUEST",
	"UNAUTHORIZED",
	"FORBIDDEN",
	"NOT_FOUND",
	"CONFLICT",
	"VALIDATION_ERROR",
	"RATE_LIMIT_EXCEEDED",
	"INTERNAL_ERROR",
]);

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
