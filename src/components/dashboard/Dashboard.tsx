import { AnimatePresence, motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout";
import { Stats } from "@/components/stats";
import { BoxList, BoxDetail, CreateBox } from "@/components/boxes";
import { SignedIn, SignedOut, RedirectToSignIn, AuthLoading } from "@daveyplate/better-auth-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mosque01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { useDashboard } from "@/components/hooks/useDashboard";
import { containerVariants, itemVariants, mainContentVariants } from "@/lib/animations";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { LoadingFallback } from "./LoadingFallback";
import { EmptyState } from "./EmptyState";
import type { Box } from "@/types";

export function Dashboard() {
    const {
        boxes,
        selectedBox,
        showCreateForm,
        stats,
        loading,
        setSelectedBox,
        setShowCreateForm,
        handleBoxCreated,
        handleBoxDeleted,
        handleBoxUpdated,
    } = useDashboard();

    if (loading) {
        return <DashboardSkeleton />;
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
                    {/* Stats Section */}
                    <motion.div variants={itemVariants}>
                        <Stats stats={stats} />
                    </motion.div>

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
}

interface BoxListSectionProps {
    boxes: Box[];
    selectedBox: Box | null;
    showCreateForm: boolean;
    onSelectBox: (box: Box) => void;
    onToggleCreateForm: () => void;
    onBoxCreated: (box: Box) => void;
    onBoxDeleted: (id: string) => void;
    onCancelCreate: () => void;
}

function BoxListSection({
    boxes,
    selectedBox,
    showCreateForm,
    onSelectBox,
    onToggleCreateForm,
    onBoxCreated,
    onBoxDeleted,
    onCancelCreate,
}: BoxListSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="lg:col-span-4 xl:col-span-3"
        >
            <Card className="h-full overflow-hidden">
                <CardHeader className="pb-4">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <motion.div
                                whileHover={{ rotate: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <HugeiconsIcon icon={Mosque01Icon} className="text-primary size-5" />
                            </motion.div>
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
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
                                <CreateBox onCreated={onBoxCreated} onCancel={onCancelCreate} />
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
}

interface BoxDetailSectionProps {
    selectedBox: Box | null;
    onBoxUpdated: (box: Box) => void;
}

function BoxDetailSection({ selectedBox, onBoxUpdated }: BoxDetailSectionProps) {
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
                    <EmptyState />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function ProtectedDashboard() {
    return (
        <>
            <AuthLoading>
                <LoadingFallback />
            </AuthLoading>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
            <SignedIn>
                <Dashboard />
            </SignedIn>
        </>
    );
}
