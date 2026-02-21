/**
 * Delete Box Dialog Component
 * 
 * Confirmation dialog for deleting a box with animations.
 */

import { motion, AnimatePresence } from "motion/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Box } from "@/types";

interface DeleteDialogProps {
  box: Box | null;
  onConfirm: (box: Box) => void;
  onCancel: () => void;
}

export function DeleteDialog({ box, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <AnimatePresence>
      {box && (
        <AlertDialog open={!!box} onOpenChange={() => onCancel()}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <AlertDialogTitle>Delete Box?</AlertDialogTitle>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <AlertDialogDescription>
                    This will delete "{box?.name}" and all its sadaqahs. This action cannot be undone.
                  </AlertDialogDescription>
                </motion.div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => box && onConfirm(box)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </motion.div>
        </AlertDialog>
      )}
    </AnimatePresence>
  );
}
