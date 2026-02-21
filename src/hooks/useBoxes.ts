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
 * Hook to update a box
 * Optimistically updates the cache for better UX
 */
export function useUpdateBox() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Box> }) =>
            boxesApi.update(id, data),
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.boxes.detail(id) });
            await queryClient.cancelQueries({ queryKey: queryKeys.boxes.lists });

            // Snapshot previous values
            const previousBox = queryClient.getQueryData<Box>(queryKeys.boxes.detail(id));
            const previousBoxes = queryClient.getQueryData<Box[]>(queryKeys.boxes.lists);

            // Optimistically update box detail
            if (previousBox) {
                queryClient.setQueryData(queryKeys.boxes.detail(id), {
                    ...previousBox,
                    ...data,
                });
            }

            // Optimistically update in list
            if (previousBoxes) {
                queryClient.setQueryData(
                    queryKeys.boxes.lists,
                    previousBoxes.map((b) => (b.id === id ? { ...b, ...data } : b))
                );
            }

            return { previousBox, previousBoxes, id };
        },
        onError: (_err, _variables, context) => {
            // Rollback on error
            if (context?.previousBox) {
                queryClient.setQueryData(queryKeys.boxes.detail(context.id), context.previousBox);
            }
            if (context?.previousBoxes) {
                queryClient.setQueryData(queryKeys.boxes.lists, context.previousBoxes);
            }
        },
        onSettled: (_data, _error, variables) => {
            // Always refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.boxes.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.boxes.lists });
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

/**
 * Hook to empty a box (collect all sadaqahs)
 */
export function useEmptyBox() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (boxId: string) => boxesApi.empty(boxId),
        onSuccess: (_data, boxId) => {
            // Invalidate sadaqahs list (all collected)
            queryClient.invalidateQueries({ queryKey: queryKeys.sadaqahs.list(boxId) });
            // Invalidate collections list (new collection added)
            queryClient.invalidateQueries({ queryKey: queryKeys.collections?.list(boxId) ?? ["collections", "list", boxId] });
            // Invalidate box detail (counts changed)
            queryClient.invalidateQueries({ queryKey: queryKeys.boxes.detail(boxId) });
            // Invalidate boxes list (counts changed)
            queryClient.invalidateQueries({ queryKey: queryKeys.boxes.lists });
            // Invalidate stats
            queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
        },
    });
}

// ============== Prefetching ==============

import type { QueryClient } from "@tanstack/react-query";

/**
 * Prefetch box data for improved navigation UX
 * Call this when hovering over a box link
 */
export function prefetchBox(queryClient: QueryClient, id: string) {
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
