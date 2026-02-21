import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { errorResponse } from "../lib/response";

/**
 * Structured error information
 */
export interface ErrorInfo {
	message: string;
	code: string;
	status: number;
	details?: unknown;
}

/**
 * Custom application error class
 */
export class AppError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly status: number = 500,
		public readonly details?: unknown
	) {
		super(message);
		this.name = "AppError";
	}

	toJSON(): ErrorInfo {
		return {
			message: this.message,
			code: this.code,
			status: this.status,
			details: this.details,
		};
	}
}

/**
 * Common error types
 */
export const Errors = {
	NOT_FOUND: (resource: string, id?: string) =>
		new AppError(
			id ? `${resource} with id "${id}" not found` : `${resource} not found`,
			"NOT_FOUND",
			404
		),

	VALIDATION: (message: string, details?: unknown) =>
		new AppError(message, "VALIDATION_ERROR", 400, details),

	UNAUTHORIZED: (message = "Unauthorized") => new AppError(message, "UNAUTHORIZED", 401),

	FORBIDDEN: (message = "Forbidden") => new AppError(message, "FORBIDDEN", 403),

	CONFLICT: (message: string) => new AppError(message, "CONFLICT", 409),

	INTERNAL: (message = "Internal server error") => new AppError(message, "INTERNAL_ERROR", 500),

	BAD_REQUEST: (message: string) => new AppError(message, "BAD_REQUEST", 400),
} as const;

/**
 * Formats Zod validation errors into a readable format
 */
function formatZodError(error: ZodError): string {
	const issues = error.issues.map((issue) => {
		const path = issue.path.length > 0 ? issue.path.join(".") : "root";
		return `${path}: ${issue.message}`;
	});
	return `Validation failed: ${issues.join("; ")}`;
}

/**
 * Global error handler middleware
 */
export async function errorHandler(c: Context, next: Next) {
	try {
		await next();
	} catch (err) {
		const requestId = c.get("requestId") || "unknown";
		
		// Log error with request context
		console.error(`[Error] Request ${requestId}:`, err);

		// Handle different error types
		if (err instanceof AppError) {
			c.status(err.status as any);
			return c.json({
				...errorResponse(err.message),
				code: err.code,
				...(err.details && { details: err.details }),
			});
		}

		// Handle Zod validation errors
		if (err instanceof ZodError) {
			c.status(400);
			return c.json({
				...errorResponse(formatZodError(err)),
				code: "VALIDATION_ERROR",
				errors: err.issues,
			});
		}

		// Handle Hono HTTP exceptions
		if (err instanceof HTTPException) {
			c.status(err.status);
			return c.json({
				...errorResponse(err.message),
				code: "HTTP_ERROR",
			});
		}

		// Handle Drizzle/Database errors
		if (err instanceof Error && err.message?.includes("UNIQUE constraint failed")) {
			c.status(409);
			return c.json({
				...errorResponse("Resource already exists"),
				code: "DUPLICATE_ERROR",
			});
		}

		if (err instanceof Error && err.message?.includes("FOREIGN KEY constraint failed")) {
			c.status(400);
			return c.json({
				...errorResponse("Referenced resource does not exist"),
				code: "FOREIGN_KEY_ERROR",
			});
		}

		// Generic error response
		c.status(500);
		return c.json({
			...errorResponse("Internal server error"),
			code: "INTERNAL_ERROR",
			requestId,
		});
	}
}

/**
 * Async handler wrapper for routes
 * Ensures errors are caught and passed to error handler
 */
export function asyncHandler<T extends Context>(
	handler: (c: T) => Promise<Response | void>
): (c: T) => Promise<Response | void> {
	return async (c: T) => {
		try {
			return await handler(c);
		} catch (err) {
			throw err; // Let the error handler middleware catch it
		}
	};
}
