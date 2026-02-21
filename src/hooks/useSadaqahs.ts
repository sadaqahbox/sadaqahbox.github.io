/**
 * Sadaqah-related TanStack Query hooks
 * 
 * Provides server state management for sadaqah operations.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sadaqahsApi, boxesApi } from "@/api/client";
import { queryKeys } from "@/lib/query-client";

/**
 * Input for creating a sadaqah
 */
export interface CreateSadaqahInput {
    boxId: string;
    value: number;
    currencyId?: string;
    notes?: string;
}

/**
 * Hook to create a new sadaqah
 * Uses boxesApi.addSadaqah since that's the endpoint
 */
export function useCreateSadaqah() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSadaqahInput) =>
            boxesApi.addSadaqah(data.boxId, {
                value: data.value,
                currencyCode: data.currencyId,
            }),
        onSuccess: (_, variables) => {
            // Invalidate sadaqahs list for the box
            queryClient.invalidateQueries({
                queryKey: queryKeys.sadaqahs.list(variables.boxId),
            });
            // Invalidate dashboard stats
            queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard });
            // Invalidate boxes list (counts changed)
            queryClient.invalidateQueries({ queryKey: queryKeys.boxes.lists });
        },
    });
}
