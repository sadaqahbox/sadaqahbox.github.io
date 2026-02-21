import { motion } from "motion/react";
import { PackageOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { emptyStateVariants, iconContainerVariants } from "@/lib/animations";

export function EmptyState() {
    return (
        <motion.div
            key="empty"
            variants={emptyStateVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        >
            <Card className="border-dashed h-full min-h-[400px]">
                <CardContent className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <motion.div
                        variants={iconContainerVariants}
                        initial="initial"
                        animate="animate"
                        className="bg-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                    >
                        <PackageOpen className="text-primary size-10" />
                    </motion.div>
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-semibold mb-2"
                    >
                        Select a box to view details
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-muted-foreground max-w-sm"
                    >
                        Choose a box from the sidebar to view its sadaqahs, collections, and manage
                        tags. Or create a new box to get started.
                    </motion.p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
