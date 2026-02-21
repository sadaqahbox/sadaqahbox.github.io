/**
 * TanStack Query hooks exports
 *
 * All server state management hooks are exported from here.
 */

// Server URL Configuration
export { useServerUrl, getApiBaseUrl, getAuthBaseUrl, buildApiUrl } from "./useServerUrl";

// Boxes
export {
    useBoxes,
    useBox,
    useCreateBox,
    useDeleteBox,
    useUpdateBox,
    useEmptyBox,
    useSetDefaultBox,
    prefetchBox,
    prefetchBoxes,
} from "./useBoxes";

// Stats
export { useDashboardStats, useRefreshStats } from "./useStats";

// Sadaqahs
export {
    useCreateSadaqah,
    useDeleteSadaqah,
    useSadaqahs,
} from "./useSadaqahs";

// Collections
export { useCollections } from "./useCollections";

// Dashboard
export { useDashboard } from "./useDashboard";

// Currencies
export { useCurrencies, useCurrencyTypes } from "./useCurrencies";
