import { z } from "zod";
import { Bool, Str } from "chanfana";

// ============== Standard Response Schemas ==============

export const SuccessResponseSchema = z.object({
	success: Bool(),
});

export const ErrorResponseSchema = z.object({
	success: Bool(),
	error: Str(),
});

export const PaginationSchema = z.object({
	page: z.number().int().positive(),
	limit: z.number().int().positive(),
	total: z.number().int().nonnegative(),
	totalPages: z.number().int().nonnegative(),
});

// ============== Type Helpers ==============

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type PaginationInfo = z.infer<typeof PaginationSchema>;

// ============== Response Builders ==============

/**
 * Creates a success response object
 */
export function successResponse<T extends Record<string, unknown>>(data: T): { success: true } & T {
	return { success: true, ...data } as { success: true } & T;
}

/**
 * Creates an error response object
 */
export function errorResponse(error: string): ErrorResponse {
	return { success: false, error };
}

/**
 * Creates a JSON error response with status code
 */
export function jsonError(error: string, status: number = 400): Response {
	return Response.json(errorResponse(error), { status });
}

/**
 * Creates pagination info from page, limit, and total count
 */
export function createPagination(page: number, limit: number, total: number): PaginationInfo {
	return {
		page,
		limit,
		total,
		totalPages: Math.ceil(total / limit),
	};
}

// ============== Common Response Schema Builders ==============

/**
 * Creates a standard list response schema
 */
export function createListResponseSchema<T extends z.ZodType>(itemSchema: T, itemName: string) {
	return z.object({
		success: Bool(),
		[itemName]: itemSchema.array(),
		pagination: PaginationSchema,
	});
}

/**
 * Creates a standard single item response schema
 */
export function createItemResponseSchema<T extends z.ZodType>(itemSchema: T, itemName: string) {
	return z.object({
		success: Bool(),
		[itemName]: itemSchema,
	});
}
