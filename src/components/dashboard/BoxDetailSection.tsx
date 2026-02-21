import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { BoxDetail } from "@/components/boxes";
import { mainContentVariants } from "@/lib/animations";
import { EmptyState } from "./EmptyState";
import type { Box } from "@/types";

export interface BoxDetailSectionProps {
    selectedBox: Box | null;
    onBoxUpdated: (box: Box) => void;
}

export const BoxDetailSection = React.memo(function BoxDetailSection({
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
