/**
 * TanStack Query hooks exports
 *
 * All server state management hooks are exported from here.
 */

// Boxes
export {
    useBoxes,
    useBox,
    useCreateBox,
    useDeleteBox,
    prefetchBox,
    prefetchBoxes,
} from "./useBoxes";

// Stats
export { useDashboardStats, useRefreshStats } from "./useStats";

// Sadaqahs
export { useCreateSadaqah } from "./useSadaqahs";
