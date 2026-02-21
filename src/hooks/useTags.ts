/**
 * Tag-related TanStack Query hooks
 *
 * Provides server state management for tag operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tagsApi, boxesApi } from "@/api/client";
import { queryKeys } from "@/lib/query-client";
import type { Tag } from "@/types";

// ============== Queries ==============

/**
 * Hook to fetch all available tags
 * Uses TanStack Query for caching
 */
export function useTags() {
    return useQuery({
        queryKey: queryKeys.tags.list,
        queryFn: () => tagsApi.getAll(),
        staleTime: 10 * 60 * 1000, // 10 minutes - tags rarely change
    });
}

// ============== Mutations ==============

/**
 * Hook to add a tag to a box
 */
export function useAddTagToBox() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ boxId, tagId }: { boxId: string; tagId: string }) =>
            boxesApi.addTag(boxId, tagId),
        onSuccess: (_data, variables) => {
            // Invalidate specific box to refresh tags
            queryClient.invalidateQueries({
                queryKey: queryKeys.boxes.detail(variables.boxId),
            });
            // Also invalidate boxes list since tag display changes
            queryClient.invalidateQueries({ queryKey: queryKeys.boxes.lists });
        },
    });
}

/**
 * Hook to remove a tag from a box
 */
export function useRemoveTagFromBox() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ boxId, tagId }: { boxId: string; tagId: string }) =>
            boxesApi.removeTag(boxId, tagId),
        onSuccess: (_data, variables) => {
            // Invalidate specific box to refresh tags
            queryClient.invalidateQueries({
                queryKey: queryKeys.boxes.detail(variables.boxId),
            });
            // Also invalidate boxes list since tag display changes
            queryClient.invalidateQueries({ queryKey: queryKeys.boxes.lists });
        },
    });
}
