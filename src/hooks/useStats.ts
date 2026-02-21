/**
 * Stats-related TanStack Query hooks
 * 
 * Provides server state management for statistics with caching.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { statsApi } from "@/api/client";
import { queryKeys } from "@/lib/query-client";

/**
 * Dashboard stats type
 */
export interface DashboardStats {
    totalBoxes: number;
    totalSadaqahs: number;
    totalValue: number;
}

/**
 * Hook to fetch dashboard statistics
 * Cached for 5 minutes to reduce server load
 */
export function useDashboardStats() {
    return useQuery({
        queryKey: queryKeys.stats.dashboard,
        queryFn: async () => {
            const stats = await statsApi.get();
            return stats as DashboardStats;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Manually refresh all stats
 * Call this after mutations that affect stats
 */
export function useRefreshStats() {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    };
}
