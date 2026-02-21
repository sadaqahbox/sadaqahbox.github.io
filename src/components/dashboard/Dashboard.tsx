import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/layout";
import { BoxList, BoxDetail, CreateBox } from "@/components/boxes";
import { SignedIn, SignedOut, RedirectToSignIn } from "@daveyplate/better-auth-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";
import { useDashboard } from "@/hooks";
import { containerVariants, mainContentVariants, sidebarVariants, fadeInVariants } from "@/lib/animations";
import { EmptyState } from "./EmptyState";
import { DashboardSkeleton } from "./DashboardSkeleton";
import type { Box } from "@/types";
import type { UseMutateFunction } from "@tanstack/react-query";

/** Type for the createBox mutation function */
type CreateBoxMutate = UseMutateFunction<
    Box,
    Error,
    { name: string; description?: string; currencyId?: string }
>;

// Inner component that uses the dashboard data - wrapped in React.memo
const DashboardContent = React.memo(function DashboardContent() {
    const {
        boxes,
        selectedBox,
        showCreateForm,
        isLoadingBoxes,
        isLoadingStats,
        error,
        stats,
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

interface BoxListSectionProps {
    boxes: Box[];
    selectedBox: Box | null;
    showCreateForm: boolean;
    onSelectBox: (box: Box | null) => void;
    onToggleCreateForm: () => void;
    onBoxCreated: (box: Box) => void;
    onBoxDeleted: (id: string) => void;
    onCancelCreate: () => void;
    createBox: CreateBoxMutate;
    isCreating: boolean;
}

const BoxListSection = React.memo(function BoxListSection({
    boxes,
    selectedBox,
    showCreateForm,
    onSelectBox,
    onToggleCreateForm,
    onBoxCreated,
    onBoxDeleted,
    onCancelCreate,
    createBox,
    isCreating,
}: BoxListSectionProps) {
    return (
        <motion.div
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-4 xl:col-span-3"
        >
            <Card className="h-full overflow-hidden flex flex-col">
                <CardHeader className="pb-4 shrink-0">
                    <motion.div
                        variants={fadeInVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">Your Boxes</CardTitle>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                        >
                            <Button size="sm" onClick={onToggleCreateForm} className="gap-1">
                                <HugeiconsIcon icon={Add01Icon} className="size-4" />
                                New
                            </Button>
                        </motion.div>
                    </motion.div>
                    <motion.div
                        variants={fadeInVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.4 }}
                    >
                        <CardDescription>
                            {boxes.length} {boxes.length === 1 ? "box" : "boxes"} total
                        </CardDescription>
                    </motion.div>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                    <AnimatePresence mode="wait">
                        {showCreateForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="p-4 border-b"
                            >
                                <CreateBox
                                    onCreated={onBoxCreated}
                                    onCancel={onCancelCreate}
                                    createBox={createBox}
                                    isCreating={isCreating}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <BoxList
                        boxes={boxes}
                        selectedBoxId={selectedBox?.id}
                        onSelectBox={onSelectBox}
                        onBoxDeleted={onBoxDeleted}
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
});

interface BoxDetailSectionProps {
    selectedBox: Box | null;
    onBoxUpdated: (box: Box) => void;
}

const BoxDetailSection = React.memo(function BoxDetailSection({
    selectedBox,
    onBoxUpdated,
}: BoxDetailSectionProps) {
    return (
        <motion.div
            variants={mainContentVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-8 xl:col-span-9"
        >
            <AnimatePresence mode="wait">
                {selectedBox ? (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <BoxDetail box={selectedBox} onBoxUpdated={onBoxUpdated} />
                    </motion.div>
                ) : (
                    <EmptyState key="empty" />
                )}
            </AnimatePresence>
        </motion.div>
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