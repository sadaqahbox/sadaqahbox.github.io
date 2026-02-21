/**
 * Sadaqah-related TanStack Query hooks
 *
 * Provides server state management for sadaqah operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sadaqahsApi, boxesApi } from "@/api/client";
import { queryKeys } from "@/lib/query-client";
import type { Sadaqah, Box } from "@/types";

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
 * Input for deleting a sadaqah
 */
export interface DeleteSadaqahInput {
    boxId: string;
    sadaqahId: string;
}

/**
 * Result of creating a sadaqah
 */
export interface CreateSadaqahResult {
    success: boolean;
    sadaqahs: Sadaqah[];
    box: Box;
    message: string;
}

/**
 * Result of deleting a sadaqah
 */
export interface DeleteSadaqahResult {
    success: boolean;
    deleted: boolean;
    updatedBox?: Box;
}

// ============== Queries ==============

/**
 * Hook to fetch sadaqahs for a specific box
 * Uses TanStack Query for caching and background updates
 */
export function useSadaqahs(boxId: string | null) {
    return useQuery({
        queryKey: queryKeys.sadaqahs.list(boxId || ""),
        queryFn: async () => {
            if (!boxId) return [];
            return boxesApi.getSadaqahs(boxId);
        },
        enabled: !!boxId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

// ============== Mutations ==============

/**
 * Hook to create a new sadaqah
 * Uses boxesApi.addSadaqah since that's the endpoint
 * Includes optimistic updates for better UX
 */
export function useCreateSadaqah() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSadaqahInput) =>
            boxesApi.addSadaqah(data.boxId, {
                value: data.value,
                currencyId: data.currencyId,
            }),
        onMutate: async (data) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: queryKeys.sadaqahs.list(data.boxId),
            });

            // Snapshot previous value
            const previousSadaqahs = queryClient.getQueryData<Sadaqah[]>(
                queryKeys.sadaqahs.list(data.boxId)
            );

            // Optimistically add a pending sadaqah
            const optimisticSadaqah: Sadaqah = {
                id: `temp-${Date.now()}`,
                boxId: data.boxId,
                value: data.value,
                currencyId: data.currencyId || "default",
                createdAt: new Date().toISOString(),
            };

            if (previousSadaqahs) {
                queryClient.setQueryData(
                    queryKeys.sadaqahs.list(data.boxId),
                    [optimisticSadaqah, ...previousSadaqahs]
                );
            }

            return { previousSadaqahs, boxId: data.boxId };
        },
        onError: (_err, _variables, context) => {
            // Rollback on error
            if (context?.previousSadaqahs) {
                queryClient.setQueryData(
                    queryKeys.sadaqahs.list(context.boxId),
                    context.previousSadaqahs
                );
            }
        },
        onSettled: (_data, _error, variables) => {
            // Always refetch after error or success
            queryClient.invalidateQueries({
                queryKey: queryKeys.sadaqahs.list(variables.boxId),
            });
            // Invalidate dashboard stats
            queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard });
            // Invalidate boxes list (counts changed)
            queryClient.invalidateQueries({ queryKey: queryKeys.boxes.lists });
            // Invalidate specific box
            queryClient.invalidateQueries({
                queryKey: queryKeys.boxes.detail(variables.boxId),
            });
        },
    });
}

/**
 * Hook to delete a sadaqah
 * Includes optimistic updates for better UX
 */
export function useDeleteSadaqah() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: DeleteSadaqahInput) =>
            sadaqahsApi.delete(data.boxId, data.sadaqahId),
        onMutate: async (data) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: queryKeys.sadaqahs.list(data.boxId),
            });

            // Snapshot previous value
            const previousSadaqahs = queryClient.getQueryData<Sadaqah[]>(
                queryKeys.sadaqahs.list(data.boxId)
            );

            // Optimistically remove the sadaqah
            if (previousSadaqahs) {
                queryClient.setQueryData(
                    queryKeys.sadaqahs.list(data.boxId),
                    previousSadaqahs.filter((s) => s.id !== data.sadaqahId)
                );
            }

            return { previousSadaqahs, boxId: data.boxId };
        },
        onError: (_err, _variables, context) => {
            // Rollback on error
            if (context?.previousSadaqahs) {
                queryClient.setQueryData(
                    queryKeys.sadaqahs.list(context.boxId),
                    context.previousSadaqahs
                );
            }
        },
        onSettled: (_data, _error, variables) => {
            // Always refetch after error or success
            queryClient.invalidateQueries({
                queryKey: queryKeys.sadaqahs.list(variables.boxId),
            });
            // Invalidate dashboard stats
            queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard });
            // Invalidate boxes list (counts changed)
            queryClient.invalidateQueries({ queryKey: queryKeys.boxes.lists });
            // Invalidate specific box
            queryClient.invalidateQueries({
                queryKey: queryKeys.boxes.detail(variables.boxId),
            });
        },
    });
}
