/**
 * Box List Empty State Component
 * 
 * Displayed when there are no boxes to show.
 */

import { motion } from "motion/react";
import { Package } from "lucide-react";

export function BoxListEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col items-center justify-center py-12 text-center px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3, type: "spring", stiffness: 200 }}
        className="bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full"
      >
        <Package className="text-muted-foreground size-6" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground text-sm font-medium"
      >
        No boxes yet
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-xs mt-1"
      >
        Create your first box to get started
      </motion.p>
    </motion.div>
  );
}
