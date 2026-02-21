import type { z } from "zod";
import { withRetry } from "./retry";

const API_BASE = "/api";

export class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

/**
 * Type guard for ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError ||
        (typeof error === "object" &&
            error !== null &&
            "name" in error &&
            error.name === "ApiError" &&
            "message" in error);
}

/**
 * Type guard for network errors
 */
export function isNetworkError(error: unknown): error is TypeError {
    return error instanceof TypeError &&
        (error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("Failed to fetch"));
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown, defaultMessage = "An unexpected error occurred"): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return defaultMessage;
}

async function request<T extends z.ZodType>(
    endpoint: string,
    schema: T,
    options?: RequestInit,
    _errorMessage?: string
): Promise<z.infer<T>> {
    // Use retry logic for all requests
    const response = await withRetry(
        async () => {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                credentials: "include",
                ...options,
                headers: {
                    ...options?.headers,
                },
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: "Unknown error" })) as {
                    error?: string;
                };
                throw new ApiError(
                    errorData.error || `HTTP ${res.status}`,
                    res.status
                );
            }

            return res;
        },
        {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
        }
    );

    const data = await response.json();
    return schema.parse(data);
}

function createRequestInit(method: string, body?: unknown): RequestInit {
    const init: RequestInit = { method };
    if (body !== undefined) {
        init.headers = { "Content-Type": "application/json" };
        init.body = JSON.stringify(body);
    }
    return init;
}

export const api = {
    get: <T extends z.ZodType>(endpoint: string, schema: T) =>
        request(endpoint, schema, undefined, `Failed to fetch ${endpoint}`),

    post: <T extends z.ZodType>(endpoint: string, schema: T, body?: unknown) =>
        request(endpoint, schema, createRequestInit("POST", body), `Failed to post to ${endpoint}`),

    put: <T extends z.ZodType>(endpoint: string, schema: T, body?: unknown) =>
        request(endpoint, schema, createRequestInit("PUT", body), `Failed to update ${endpoint}`),

    patch: <T extends z.ZodType>(endpoint: string, schema: T, body?: unknown) =>
        request(endpoint, schema, createRequestInit("PATCH", body), `Failed to patch ${endpoint}`),

    del: <T extends z.ZodType>(endpoint: string, schema: T) =>
        request(endpoint, schema, { method: "DELETE" }, `Failed to delete ${endpoint}`),
};

/**
 * Type-safe wrapper for API responses
 */
export function createApiResponse<T>(data: T, success = true, message?: string) {
    return {
        success,
        data,
        message,
        timestamp: new Date().toISOString(),
    };
}
