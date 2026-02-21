import React from "react";
import { motion } from "motion/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/layout";
import { SignedIn, SignedOut, RedirectToSignIn } from "@daveyplate/better-auth-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { useDashboard } from "@/hooks";
import { containerVariants } from "@/lib/animations";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { BoxListSection } from "./BoxListSection";
import { BoxDetailSection } from "./BoxDetailSection";

// Inner component that uses the dashboard data - wrapped in React.memo
const DashboardContent = React.memo(function DashboardContent() {
    const {
        boxes,
        selectedBox,
        showCreateForm,
        isLoadingBoxes,
        isLoadingStats,
        error,
        setSelectedBox,
        setShowCreateForm,
        handleBoxCreated,
        handleBoxDeleted,
        handleBoxUpdated,
        createBox,
        isCreating,
    } = useDashboard();

    // Show skeleton only on first load when we have no data
    const showInitialLoading = isLoadingBoxes && boxes.length === 0;

    // Show skeleton during initial load
    if (showInitialLoading) {
        return <DashboardSkeleton />;
    }

    // Show error state only after loading is complete and we have an error
    if (error && !isLoadingBoxes && !isLoadingStats) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="mx-auto max-w-7xl"
                    >
                        <Alert variant="destructive">
                            <HugeiconsIcon icon={AlertCircleIcon} className="size-4" />
                            <AlertDescription>
                                Failed to load dashboard data. Please try refreshing the page.
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />

            <main className="flex-1 p-4 md:p-6 lg:p-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="mx-auto max-w-7xl space-y-6"
                >
                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Sidebar - Box List */}
                        <BoxListSection
                            boxes={boxes}
                            selectedBox={selectedBox}
                            showCreateForm={showCreateForm}
                            onSelectBox={setSelectedBox}
                            onToggleCreateForm={() => setShowCreateForm(!showCreateForm)}
                            onBoxCreated={handleBoxCreated}
                            onBoxDeleted={handleBoxDeleted}
                            onCancelCreate={() => setShowCreateForm(false)}
                            createBox={createBox}
                            isCreating={isCreating}
                        />

                        {/* Main Content - Box Detail */}
                        <BoxDetailSection
                            selectedBox={selectedBox}
                            onBoxUpdated={handleBoxUpdated}
                        />
                    </div>
                </motion.div>
            </main>
        </div>
    );
});

export function ProtectedDashboard() {
    return (
        <>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
            <SignedIn>
                <DashboardContent />
            </SignedIn>
        </>
    );
}

// Keep Dashboard export for backward compatibility
export { DashboardContent as Dashboard };
