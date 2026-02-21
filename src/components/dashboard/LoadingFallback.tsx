import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";

export function LoadingFallback() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-h-screen items-center justify-center"
        >
            <Card>
                <CardContent className="flex flex-col items-center gap-4 p-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent" />
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-muted-foreground text-sm"
                    >
                        Loading...
                    </motion.p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
