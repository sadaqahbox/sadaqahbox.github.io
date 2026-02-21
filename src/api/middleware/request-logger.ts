import type { Context, Next } from "hono";

declare module "hono" {
	interface ContextVariableMap {
		requestId: string;
		timing: RequestTiming;
	}
}

/**
 * Request timing information
 */
export interface RequestTiming {
	startTime: number;
	endTime?: number;
	duration?: number;
}

/**
 * Generates a unique request ID
 */
function generateRequestId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 8);
	return `${timestamp}-${random}`;
}

/**
 * Formats bytes to human readable string
 */
function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Gets color for status code (for console output)
 */
function getStatusColor(status: number): string {
	if (status >= 500) return "\x1b[31m"; // Red
	if (status >= 400) return "\x1b[33m"; // Yellow
	if (status >= 300) return "\x1b[36m"; // Cyan
	if (status >= 200) return "\x1b[32m"; // Green
	return "\x1b[0m"; // Default
}

/**
 * Request logger middleware
 * Attaches request ID and logs request/response details
 */
export async function requestLogger(c: Context<{ Bindings: Env }>, next: Next) {
	const requestId = generateRequestId();
	const startTime = performance.now();
	
	// Attach request ID to context
	c.set("requestId", requestId);
	c.set("timing", { startTime });

	// Log request
	const method = c.req.method;
	const url = new URL(c.req.url).pathname;
	const userAgent = c.req.header("user-agent") || "-";
	
	console.log(`[Request ${requestId}] ${method} ${url} - User-Agent: ${userAgent}`);

	try {
		await next();
	} finally {
		const endTime = performance.now();
		const duration = Math.round(endTime - startTime);
		const status = c.res?.status || 500;
		
		// Update timing
		c.set("timing", { startTime, endTime, duration });

		// Determine log level based on status
		const logMethod = status >= 500 ? console.error : status >= 400 ? console.warn : console.log;
		
		// Log response
		logMethod(`[Response ${requestId}] ${method} ${url} ${status} - ${duration}ms`);
	}
}

/**
 * Simple request logger (less verbose)
 * Use in production for cleaner logs
 */
export async function simpleRequestLogger(c: Context<{ Bindings: Env }>, next: Next) {
	const startTime = performance.now();
	const method = c.req.method;
	const url = new URL(c.req.url).pathname;
	
	await next();
	
	const duration = Math.round(performance.now() - startTime);
	const status = c.res?.status || 500;
	
	console.log(`${method} ${url} ${status} ${duration}ms`);
}

/**
 * Gets request timing info from context
 */
export function getRequestTiming(c: Context): RequestTiming | undefined {
	return c.get("timing");
}

/**
 * Gets request ID from context
 */
export function getRequestId(c: Context): string | undefined {
	return c.get("requestId");
}
