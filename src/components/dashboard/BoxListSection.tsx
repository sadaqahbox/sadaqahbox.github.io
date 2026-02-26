import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BoxList, CreateBox } from "@/components/boxes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { sidebarVariants, fadeInVariants } from "@/lib/animations";
import { MAX_BOXES_PER_USER } from "@/api/config/constants";
import type { Box } from "@/types";
import type { UseMutateFunction } from "@tanstack/react-query";

/** Type for the createBox mutation function */
type CreateBoxMutate = UseMutateFunction<
    Box,
    Error,
    { name: string; description?: string; currencyId?: string }
>;

export interface BoxListSectionProps {
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

export const BoxListSection = React.memo(function BoxListSection({
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
            <Card className="h-full overflow-hidden flex flex-col pb-0">
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
                            <Button
                                size="sm"
                                onClick={onToggleCreateForm}
                                className="gap-1"
                                disabled={boxes.length >= MAX_BOXES_PER_USER}
                                title={boxes.length >= MAX_BOXES_PER_USER ? `Maximum ${MAX_BOXES_PER_USER} boxes allowed` : undefined}
                            >
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
                            {boxes.length} / {MAX_BOXES_PER_USER} boxes
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
