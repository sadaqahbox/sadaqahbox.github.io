import { useState, useEffect, useCallback } from "react";
import { boxesApi, statsApi } from "@/api/client";
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
    error: Error | null;
    setSelectedBox: (box: Box | null) => void;
    setShowCreateForm: (show: boolean) => void;
    handleBoxCreated: (box: Box) => void;
    handleBoxDeleted: (boxId: string) => void;
    handleBoxUpdated: (updatedBox: Box) => void;
    refreshData: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [selectedBox, setSelectedBox] = useState<Box | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        totalBoxes: 0,
        totalSadaqahs: 0,
        totalValue: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchBoxes = useCallback(async () => {
        try {
            const boxes = await boxesApi.getAll();
            setBoxes(boxes);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to fetch boxes"));
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const stats = await statsApi.get();
            setStats(stats);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to fetch stats"));
        }
    }, []);

    const refreshData = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchBoxes(), fetchStats()]);
        setLoading(false);
    }, [fetchBoxes, fetchStats]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const handleBoxCreated = useCallback(
        (box: Box) => {
            setBoxes((prev) => [box, ...prev]);
            setShowCreateForm(false);
            fetchStats();
        },
        [fetchStats]
    );

    const handleBoxDeleted = useCallback(
        (boxId: string) => {
            setBoxes((prev) => prev.filter((b) => b.id !== boxId));
            if (selectedBox?.id === boxId) {
                setSelectedBox(null);
            }
            fetchStats();
        },
        [selectedBox, fetchStats]
    );

    const handleBoxUpdated = useCallback(
        (updatedBox: Box) => {
            setBoxes((prev) => prev.map((b) => (b.id === updatedBox.id ? updatedBox : b)));
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
        error,
        setSelectedBox,
        setShowCreateForm,
        handleBoxCreated,
        handleBoxDeleted,
        handleBoxUpdated,
        refreshData,
    };
}
