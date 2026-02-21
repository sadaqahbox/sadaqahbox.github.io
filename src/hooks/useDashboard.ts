/**
 * Dashboard hook using TanStack Query
 *
 * Replaces manual state management with server state management
 * for automatic caching, background refetching, and optimistic updates.
 */

import { useState, useCallback, useEffect } from "react";
import { useBoxes, useDashboardStats, useCreateBox, useDeleteBox } from "@/hooks";
import { authClient } from "@/lib/auth/client";
import type { Box } from "@/types";

export interface DashboardStats {
    totalBoxes: number;
    totalSadaqahs: number;
    totalValue: number;
}

export interface UseDashboardReturn {
    boxes: Box[];
    selectedBox: Box | null;
    showCreateForm: boolean;
    stats: DashboardStats;
    loading: boolean;
    isLoadingBoxes: boolean;
    isLoadingStats: boolean;
    error: Error | null;
    setSelectedBox: (box: Box | null) => void;
    setShowCreateForm: (show: boolean) => void;
    handleBoxCreated: (box: Box) => void;
    handleBoxDeleted: (boxId: string) => void;
    handleBoxUpdated: (updatedBox: Box) => void;
    refreshData: () => Promise<void>;
    isCreating: boolean;
    isDeleting: boolean;
    createBox: ReturnType<typeof useCreateBox>['mutate'];
}

// Stable default stats object to prevent re-renders
const DEFAULT_STATS = { totalBoxes: 0, totalSadaqahs: 0, totalValue: 0 };

export function useDashboard(): UseDashboardReturn {
    const [selectedBox, setSelectedBox] = useState<Box | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Get session for defaultBoxId (must be at top level)
    const session = authClient.useSession();

    // Server state queries
    const {
        data: boxes = [],
        isLoading: boxesLoading,
        error: boxesError,
        refetch: refetchBoxes,
    } = useBoxes();

    // Preselect default box when boxes load
    useEffect(() => {
        if (boxes.length > 0 && !selectedBox) {
            // Get defaultBoxId from session
            const defaultBoxId = session.data?.user?.defaultBoxId;
            
            if (defaultBoxId) {
                const defaultBox = boxes.find(b => b.id === defaultBoxId);
                if (defaultBox) {
                    setSelectedBox(defaultBox);
                    return;
                }
            }
            
            // Fallback to first box if no default set or default not found
            const firstBox = boxes[0];
            if (firstBox) {
                setSelectedBox(firstBox);
            }
        }
    }, [boxes, selectedBox, session.data?.user?.defaultBoxId]);

    const {
        data: stats = DEFAULT_STATS,
        isLoading: statsLoading,
        error: statsError,
        refetch: refetchStats,
    } = useDashboardStats();

    // Mutations
    const { mutate: createBox, isPending: isCreating } = useCreateBox();
    const { mutate: deleteBox, isPending: isDeleting } = useDeleteBox();

    const loading = boxesLoading || statsLoading;
    const error = boxesError || statsError;

    const refreshData = useCallback(async () => {
        await Promise.all([refetchBoxes(), refetchStats()]);
    }, [refetchBoxes, refetchStats]);

    const handleBoxCreated = useCallback(
        (box: Box) => {
            // TanStack Query handles cache updates automatically via onSuccess
            // Just close the form, no need to manually refetch
            setShowCreateForm(false);
        },
        []
    );

    const handleBoxDeleted = useCallback(
        (boxId: string) => {
            deleteBox(boxId, {
                onSuccess: () => {
                    if (selectedBox?.id === boxId) {
                        setSelectedBox(null);
                    }
                    // Stats will be automatically invalidated by the mutation
                },
            });
        },
        [deleteBox, selectedBox]
    );

    const handleBoxUpdated = useCallback(
        (updatedBox: Box) => {
            // TanStack Query handles cache updates automatically via optimistic updates
            if (selectedBox?.id === updatedBox.id) {
                setSelectedBox(updatedBox);
            }
        },
        [selectedBox]
    );

    return {
        boxes,
        selectedBox,
        showCreateForm,
        stats,
        loading,
        isLoadingBoxes: boxesLoading,
        isLoadingStats: statsLoading,
        error: error as Error | null,
        setSelectedBox,
        setShowCreateForm,
        handleBoxCreated,
        handleBoxDeleted,
        handleBoxUpdated,
        refreshData,
        isCreating,
        isDeleting,
        createBox,
    };
}
