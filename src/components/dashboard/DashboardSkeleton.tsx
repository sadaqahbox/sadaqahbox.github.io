import { motion } from "motion/react";
import { Header } from "@/components/layout";

export function DashboardSkeleton() {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                    >
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={`skeleton-${i}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="bg-muted h-28 rounded-lg" />
                            </motion.div>
                        ))}
                    </motion.div>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-muted h-[calc(100vh-300px)] rounded-lg"
                        />
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-muted h-[calc(100vh-300px)] rounded-lg lg:col-span-2"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
