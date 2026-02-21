/**
 * Error handling middleware
 */

import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { error } from "../shared/response";

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

	toJSON() {
		return {
			message: this.message,
			code: this.code,
			status: this.status,
			details: this.details,
		};
	}
}

/**
 * Common error factory functions
 */
export const Errors = {
	notFound: (resource: string, id?: string) =>
		new AppError(
			id ? `${resource} with id "${id}" not found` : `${resource} not found`,
			"NOT_FOUND",
			404
		),

	validation: (message: string, details?: unknown) =>
		new AppError(message, "VALIDATION_ERROR", 400, details),

	unauthorized: (message = "Unauthorized") =>
		new AppError(message, "UNAUTHORIZED", 401),

	forbidden: (message = "Forbidden") =>
		new AppError(message, "FORBIDDEN", 403),

	conflict: (message: string) =>
		new AppError(message, "CONFLICT", 409),

	internal: (message = "Internal server error") =>
		new AppError(message, "INTERNAL_ERROR", 500),

	badRequest: (message: string) =>
		new AppError(message, "BAD_REQUEST", 400),
} as const;

/**
 * Formats Zod validation errors
 */
function formatZodError(zodError: ZodError): string {
	const issues = zodError.issues.map((issue) => {
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
		
		console.error(`[Error] Request ${requestId}:`, err);

		// AppError handling
		if (err instanceof AppError) {
			const statusCode = err.status as 200 | 400 | 401 | 403 | 404 | 409 | 500;
			return c.json(
				{ ...error(err.message, err.code), ...(err.details && { details: err.details }) },
				statusCode
			);
		}

		// Zod validation errors
		if (err instanceof ZodError) {
			return c.json(
				{ ...error(formatZodError(err), "VALIDATION_ERROR"), errors: err.issues },
				400
			);
		}

		// Hono HTTP exceptions
		if (err instanceof HTTPException) {
			return c.json(error(err.message, "HTTP_ERROR"), err.status);
		}

		// Database errors
		if (err instanceof Error && err.message?.includes("UNIQUE constraint failed")) {
			return c.json(error("Resource already exists", "DUPLICATE_ERROR"), 409);
		}

		if (err instanceof Error && err.message?.includes("FOREIGN KEY constraint failed")) {
			return c.json(error("Referenced resource does not exist", "FOREIGN_KEY_ERROR"), 400);
		}

		// Generic error
		return c.json(
			{ ...error("Internal server error", "INTERNAL_ERROR"), requestId },
			500
		);
	}
}
