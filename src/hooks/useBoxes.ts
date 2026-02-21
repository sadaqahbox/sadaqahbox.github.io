/**
 * Box-related TanStack Query hooks
 *
 * Provides server state management for box operations with caching,
 * optimistic updates, and automatic background refetching.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boxesApi } from "@/api/client";
import { queryKeys, queryClient } from "@/lib/query-client";
import type { Box, CreateBoxBody } from "@/api/client";

// ============== Queries ==============

// Stable empty options object to prevent query key changes on re-renders
const DEFAULT_BOXES_OPTIONS = {};

/**
 * Hook to fetch all boxes for the current user
 * Automatically caches and refetches data
 */
export function useBoxes(options: { sortBy?: string; sortOrder?: string } = DEFAULT_BOXES_OPTIONS) {
    return useQuery({
        queryKey: queryKeys.boxes.list(options),
        queryFn: () => boxesApi.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to fetch a single box by ID
 * Uses cached data if available
 */
export function useBox(id: string | null) {
    return useQuery({
        queryKey: queryKeys.boxes.detail(id || ""),
        queryFn: () => (id ? boxesApi.getById(id) : Promise.resolve(null)),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

// ============== Mutations ==============

/**
 * Hook to create a new box
 * Automatically invalidates the boxes list cache
 */
export function useCreateBox() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateBoxBody) => boxesApi.create(data),
        onSuccess: (newBox) => {
            // Invalidate boxes list
            queryClient.invalidateQueries({ queryKey: queryKeys.boxes.lists });
            // Also invalidate stats since counts changed
            queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
            // Add the new box to the cache
            queryClient.setQueryData(queryKeys.boxes.detail(newBox.id), newBox);
        },
    });
}

/**
 * Hook to delete a box
 * Optimistically removes from UI before server confirmation
 */
export function useDeleteBox() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => boxesApi.delete(id),
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.boxes.lists });

            // Snapshot previous list
            const previousBoxes = queryClient.getQueryData<Box[]>(queryKeys.boxes.lists);

            // Optimistically remove
            if (previousBoxes) {
                queryClient.setQueryData(
                    queryKeys.boxes.lists,
                    previousBoxes.filter((b) => b.id !== id)
                );
            }

            return { previousBoxes };
        },
        onError: (err, id, context) => {
            // Rollback on error
            if (context?.previousBoxes) {
                queryClient.setQueryData(queryKeys.boxes.lists, context.previousBoxes);
            }
        },
        onSettled: () => {
            // Always refetch boxes and stats
            queryClient.invalidateQueries({ queryKey: queryKeys.boxes.lists });
            queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
        },
    });
}

// ============== Prefetching ==============

/**
 * Prefetch box data for improved navigation UX
 * Call this when hovering over a box link
 */
export function prefetchBox(id: string) {
    return queryClient.prefetchQuery({
        queryKey: queryKeys.boxes.detail(id),
        queryFn: () => boxesApi.getById(id),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Prefetch all boxes
 * Call this on dashboard load
 */
export function prefetchBoxes() {
    return queryClient.prefetchQuery({
        queryKey: queryKeys.boxes.lists,
        queryFn: () => boxesApi.getAll(),
        staleTime: 5 * 60 * 1000,
    });
}
