/**
 * TanStack Query Client Configuration
 * 
 * Provides centralized query client with optimized defaults for the application.
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Default stale time for queries (5 minutes)
 * Data is considered fresh for this duration to reduce unnecessary refetches
 */
export const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * Default cache time for inactive queries (10 minutes)
 * Inactive queries are kept in cache for this duration
 */
export const DEFAULT_GC_TIME = 10 * 60 * 1000;

/**
 * Global query client instance
 * Shared across the application for consistent caching behavior
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data stays fresh for 5 minutes
            staleTime: DEFAULT_STALE_TIME,
            // Inactive data is garbage collected after 10 minutes
            gcTime: DEFAULT_GC_TIME,
            // Retry failed requests 3 times with exponential backoff
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Don't refetch on window focus (reduces API calls)
            refetchOnWindowFocus: false,
            // Don't refetch on reconnect to prevent storm of requests
            refetchOnReconnect: false,
            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
        },
        mutations: {
            // Retry mutations only once (idempotent operations)
            retry: 1,
            retryDelay: 1000,
        },
    },
});

/**
 * Query keys for consistent cache management
 * Use these instead of string literals for type safety
 */
export const queryKeys = {
    // Boxes
    boxes: {
        all: ["boxes"] as const,
        lists: ["boxes", "list"] as const,
        list: (filters: { userId?: string; sortBy?: string; sortOrder?: string } = {}) =>
            ["boxes", "list", filters] as const,
        details: ["boxes", "detail"] as const,
        detail: (id: string) => ["boxes", "detail", id] as const,
    },
    // Stats
    stats: {
        all: ["stats"] as const,
        dashboard: ["stats", "dashboard"] as const,
        box: (id: string) => ["stats", "box", id] as const,
    },
    // Sadaqahs
    sadaqahs: {
        all: ["sadaqahs"] as const,
        lists: ["sadaqahs", "list"] as const,
        list: (boxId: string) => ["sadaqahs", "list", boxId] as const,
        details: ["sadaqahs", "detail"] as const,
        detail: (id: string) => ["sadaqahs", "detail", id] as const,
    },
    // Collections
    collections: {
        all: ["collections"] as const,
        lists: ["collections", "list"] as const,
        list: (boxId: string) => ["collections", "list", boxId] as const,
    },
    // Tags
    tags: {
        all: ["tags"] as const,
        list: ["tags", "list"] as const,
    },
    // Currencies
    currencies: {
        all: ["currencies"] as const,
        list: ["currencies", "list"] as const,
    },
} as const;

/**
 * Invalidate multiple query keys at once
 * Useful after mutations that affect multiple data types
 */
export function invalidateQueries(keys: (readonly unknown[])[]) {
    keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
    });
}

/**
 * Prefetch data for improved UX
 * Call this before navigating to a page that needs the data
 */
export async function prefetchQuery<T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>
) {
    await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: DEFAULT_STALE_TIME,
    });
}
