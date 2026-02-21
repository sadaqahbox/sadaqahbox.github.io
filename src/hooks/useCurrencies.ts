/**
 * Currency-related TanStack Query hooks
 *
 * Provides server state management for currency operations with caching.
 */

import { useQuery } from "@tanstack/react-query";
import { currenciesApi, currencyTypesApi } from "@/api/client";
import { queryKeys } from "@/lib/query-client";

/**
 * Hook to fetch all currencies
 * Automatically caches and refetches data
 */
export function useCurrencies() {
    return useQuery({
        queryKey: queryKeys.currencies.list,
        queryFn: () => currenciesApi.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to fetch all currency types
 * Used for grouping currencies by type
 */
export function useCurrencyTypes() {
    return useQuery({
        queryKey: queryKeys.currencyTypes.list,
        queryFn: () => currencyTypesApi.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
