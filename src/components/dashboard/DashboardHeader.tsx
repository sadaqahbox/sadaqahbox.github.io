import { motion } from "motion/react";
import { Mosque01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { sidebarVariants } from "@/lib/animations";

interface DashboardHeaderProps {
    boxesCount: number;
    showCreateForm: boolean;
    onToggleCreateForm: () => void;
}

export function DashboardHeader({
    boxesCount,
    showCreateForm,
    onToggleCreateForm,
}: DashboardHeaderProps) {
    return (
        <motion.div variants={sidebarVariants} initial="hidden" animate="visible" className="h-full">
            <Card className="h-full overflow-hidden">
                <CardHeader className="pb-4">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <motion.div whileHover={{ rotate: 10 }} transition={{ duration: 0.2 }}>
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                        <CardDescription>
                            {boxesCount} {boxesCount === 1 ? "box" : "boxes"} total
                        </CardDescription>
                    </motion.div>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">{/* Content is rendered by parent */}</CardContent>
            </Card>
        </motion.div>
    );
}
