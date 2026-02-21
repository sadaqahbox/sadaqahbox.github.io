/**
 * Collection-related TanStack Query hooks
 *
 * Provides server state management for collection history.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { boxesApi } from "@/api/client";
import { queryKeys } from "@/lib/query-client";
import type { Collection } from "@/types";

// ============== Queries ==============

/**
 * Hook to fetch collection history for a specific box
 * Uses TanStack Query for caching and background updates
 */
export function useCollections(boxId: string | null) {
    return useQuery({
        queryKey: queryKeys.collections?.list(boxId || "") ?? ["collections", "list", boxId || ""],
        queryFn: async () => {
            if (!boxId) return [];
            return boxesApi.getCollections(boxId);
        },
        enabled: !!boxId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

// ============== Prefetching ==============

/**
 * Prefetch collection data for improved navigation UX
 */
export function prefetchCollections(queryClient: ReturnType<typeof useQueryClient>, boxId: string) {
    return queryClient.prefetchQuery({
        queryKey: queryKeys.collections?.list(boxId) ?? ["collections", "list", boxId],
        queryFn: () => boxesApi.getCollections(boxId),
        staleTime: 2 * 60 * 1000,
    });
}
