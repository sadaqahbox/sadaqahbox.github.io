/**
 * Structured Logger
 *
 * Provides structured logging with request correlation IDs,
 * log levels, and contextual information.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogContext {
    requestId?: string;
    userId?: string;
    [key: string]: unknown;
}

export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: LogContext;
    error?: Error;
    duration?: number;
}

/**
 * Log level priorities (lower number = higher priority)
 */
const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
};

/**
 * Get current log level from environment
 */
function getCurrentLogLevel(): LogLevel {
    const envLevel = typeof process !== "undefined" ? process.env.LOG_LEVEL : undefined;
    return (envLevel as LogLevel) || "info";
}

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
    const currentLevel = getCurrentLogLevel();
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [
        `[${entry.timestamp}]`,
        `[${entry.level.toUpperCase()}]`,
    ];

    if (entry.context?.requestId) {
        parts.push(`[${entry.context.requestId}]`);
    }

    parts.push(entry.message);

    if (entry.duration) {
        parts.push(`(${entry.duration}ms)`);
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
        const contextWithoutRequestId = { ...entry.context };
        delete contextWithoutRequestId.requestId;
        if (Object.keys(contextWithoutRequestId).length > 0) {
            parts.push(JSON.stringify(contextWithoutRequestId));
        }
    }

    if (entry.error) {
        parts.push(`\n${entry.error.stack || entry.error.message}`);
    }

    return parts.join(" ");
}

/**
 * Output log entry to appropriate destination
 */
function outputLog(entry: LogEntry): void {
    const formatted = formatLogEntry(entry);

    switch (entry.level) {
        case "debug":
            console.debug(formatted);
            break;
        case "info":
            console.info(formatted);
            break;
        case "warn":
            console.warn(formatted);
            break;
        case "error":
        case "fatal":
            console.error(formatted);
            break;
    }
}

/**
 * Create a structured log entry
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error, duration?: number): void {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        context,
        error,
        duration,
    };

    outputLog(entry);
}

/**
 * Logger interface
 */
export interface Logger {
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext, error?: Error): void;
    error(message: string, context?: LogContext, error?: Error): void;
    fatal(message: string, context?: LogContext, error?: Error): void;
    withContext(context: LogContext): Logger;
}

/**
 * Create a logger instance with optional context
 */
export function createLogger(initialContext?: LogContext): Logger {
    return {
        debug: (message, context) => log("debug", message, { ...initialContext, ...context }),
        info: (message, context) => log("info", message, { ...initialContext, ...context }),
        warn: (message, context, error) => log("warn", message, { ...initialContext, ...context }, error),
        error: (message, context, error) => log("error", message, { ...initialContext, ...context }, error),
        fatal: (message, context, error) => log("fatal", message, { ...initialContext, ...context }, error),
        withContext: (additionalContext) => createLogger({ ...initialContext, ...additionalContext }),
    };
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Create a request-scoped logger
 */
export function createRequestLogger(requestId: string, userId?: string): Logger {
    return createLogger({
        requestId,
        ...(userId && { userId }),
    });
}

/**
 * Log timing information for performance monitoring
 */
export function logTiming(operation: string, duration: number, context?: LogContext): void {
    log("debug", `${operation} completed`, context, undefined, duration);
}

/**
 * Log database query with timing
 */
export function logQuery(query: string, duration: number, context?: LogContext): void {
    log("debug", `Database query: ${query.substring(0, 100)}...`, context, undefined, duration);
}
