/**
 * API Retry Logic with Exponential Backoff
 *
 * Implements retry logic for transient failures with exponential backoff
 * and configurable retry strategies.
 */

import { ApiError } from "./client";

export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate delay for next retry using exponential backoff with jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    const clampedDelay = Math.min(exponentialDelay, config.maxDelay);
    // Add jitter (±25%) to prevent thundering herd
    const jitter = clampedDelay * 0.25 * (Math.random() * 2 - 1);
    return clampedDelay + jitter;
}

/**
 * Check if error is retryable
 */
function isRetryable(error: unknown, config: RetryConfig): boolean {
    if (error instanceof ApiError && error.status) {
        return config.retryableStatuses.includes(error.status);
    }
    // Retry on network errors (no status)
    if (error instanceof TypeError && error.message.includes("fetch")) {
        return true;
    }
    return false;
}

/**
 * Sleep for given milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryContext {
    attempt: number;
    retryCount: number;
}

export type RetryableFunction<T> = (context: RetryContext) => Promise<T>;

/**
 * Execute a function with retry logic
 *
 * @example
 * ```typescript
 * const result = await withRetry(async ({ attempt }) => {
 *   return await fetchData();
 * });
 * ```
 */
export async function withRetry<T>(
    fn: RetryableFunction<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: unknown;

    for (let attempt = 1; attempt <= fullConfig.maxRetries + 1; attempt++) {
        try {
            return await fn({
                attempt,
                retryCount: attempt - 1,
            });
        } catch (error) {
            lastError = error;

            // Don't retry if we've exhausted retries or error isn't retryable
            if (attempt > fullConfig.maxRetries || !isRetryable(error, fullConfig)) {
                throw error;
            }

            const delay = calculateDelay(attempt, fullConfig);
            await sleep(delay);
        }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError;
}

/**
 * Create a fetch wrapper with retry logic
 *
 * @example
 * ```typescript
 * const response = await fetchWithRetry('/api/data', { method: 'GET' });
 * ```
 */
export async function fetchWithRetry(
    url: string,
    init?: RequestInit,
    config?: Partial<RetryConfig>
): Promise<Response> {
    return withRetry(
        async ({ attempt }) => {
            const response = await fetch(url, init);

            // Throw ApiError for non-ok responses to trigger retry
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as {
                    error?: string;
                };
                throw new ApiError(
                    errorData.error || `HTTP ${response.status}`,
                    response.status
                );
            }

            return response;
        },
        config
    );
}

/**
 * Decorator for making API methods retryable
 *
 * @example
 * ```typescript
 * class ApiClient {
 *   @retryable({ maxRetries: 5 })
 *   async fetchData() { ... }
 * }
 * ```
 */
export function retryable(config: Partial<RetryConfig> = {}) {
    return function <T extends (...args: unknown[]) => Promise<unknown>>(
        target: T,
        context: ClassMethodDecoratorContext
    ): T {
        return async function (this: ThisParameterType<T>, ...args: Parameters<T>): Promise<ReturnType<T>> {
            return withRetry(async () => target.apply(this, args), config) as ReturnType<T>;
        } as T;
    };
}
