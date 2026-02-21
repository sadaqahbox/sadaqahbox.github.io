/**
 * HTTP response utilities
 */

import type { PaginationInfo } from "../domain/types";

// ============== Response Types ==============

export interface SuccessResponse<T = Record<string, unknown>> {
	success: true;
}

export interface ErrorResponse {
	success: false;
	error: string;
	code?: string;
	details?: unknown;
}

// ============== Success Responses ==============

/**
 * Creates a success response object
 */
export function success<T extends Record<string, unknown>>(data: T): { success: true } & T {
	return { success: true, ...data };
}

/**
 * Creates a paginated list response
 */
export function paginated<T>(items: T[], pagination: PaginationInfo) {
	return success({ items, pagination });
}

// ============== Error Responses ==============

/**
 * Creates an error response object
 */
export function error(message: string, code?: string, details?: unknown): ErrorResponse {
	return { success: false, error: message, code, details };
}

/**
 * Creates a JSON error response with status code
 */
export function jsonError(message: string, status: number = 400): Response {
	return Response.json(error(message), { status });
}

/**
 * Creates a not found error response
 */
export function notFound(resource: string, id?: string): Response {
	const message = id ? `${resource} with id "${id}" not found` : `${resource} not found`;
	return Response.json(error(message, "NOT_FOUND"), { status: 404 });
}

/**
 * Creates a validation error response
 */
export function validationError(message: string, details?: unknown): Response {
	return Response.json(error(message, "VALIDATION_ERROR", details), { status: 400 });
}

/**
 * Creates a conflict error response
 */
export function conflict(message: string): Response {
	return Response.json(error(message, "CONFLICT"), { status: 409 });
}

// ============== Pagination Helpers ==============

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

/**
 * Normalizes pagination params with bounds checking
 */
export function normalizePagination(page?: number, limit?: number): { page: number; limit: number } {
	return {
		page: Math.max(1, page ?? 1),
		limit: Math.min(Math.max(1, limit ?? 20), 100),
	};
}

/**
 * Calculates offset for database queries
 */
export function getOffset(page: number, limit: number): number {
	return (page - 1) * limit;
}
