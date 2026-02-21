/**
 * Virtualized Box List Component
 * 
 * Uses @tanstack/react-virtual for efficient rendering of large lists.
 * Only renders visible items, dramatically improving performance for 100+ boxes.
 */

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, MoreVertical, Package, Coins } from "lucide-react";
import { cn, formatHighPrecision } from "@/lib/utils";
import type { Box } from "@/types";

interface VirtualBoxListProps {
  boxes: Box[];
  selectedBoxId?: string;
  onSelectBox: (box: Box) => void;
  onBoxDeleted: (boxId: string) => void;
  /** Estimated height of each item in pixels (default: 90) */
  itemHeight?: number;
  /** Height of the scrollable container (default: calc(100vh - 380px)) */
  containerHeight?: string;
}

export function VirtualBoxList({
  boxes,
  selectedBoxId,
  onSelectBox,
  onBoxDeleted,
  containerHeight = "calc(100vh - 380px)",
}: VirtualBoxListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [deletingBox, setDeletingBox] = useState<Box | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);

  // Virtualizer setup with dynamic item sizes
  const virtualizer = useVirtualizer({
    count: boxes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => 72,
    overscan: 5, // Render 5 items above/below viewport for smooth scrolling
  });

  const virtualItems = virtualizer.getVirtualItems();

  const handleDelete = async (box: Box) => {
    onBoxDeleted(box.id);
    setDeletingBox(null);
  };

  if (boxes.length === 0) {
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

  return (
    <>
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualItem) => {
            const box = boxes[virtualItem.index]!;
            const isSelected = selectedBoxId === box.id;
            const isHovered = hoveredBoxId === box.id;

            return (
              <motion.div
                key={box.id}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: Math.min(virtualItem.index * 0.02, 0.3) }}
              >
                <div
                  className={cn(
                    "group relative flex items-start gap-3 rounded-lg p-3 mx-2 cursor-pointer transition-colors",
                    isSelected ? "bg-accent" : "hover:bg-muted/50"
                  )}
                  onClick={() => onSelectBox(box)}
                  onMouseEnter={() => setHoveredBoxId(box.id)}
                  onMouseLeave={() => setHoveredBoxId(null)}
                >
                  {/* Animated Icon */}
                  <motion.div
                    animate={{
                      scale: isSelected ? 1.05 : isHovered ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors ring-2",
                      isSelected
                        ? "bg-primary ring-primary"
                        : "bg-white dark:bg-background ring-transparent"
                    )}
                  >
                    <Logo
                      className={cn(
                        "size-10",
                        isSelected && "brightness-0 invert"
                      )}
                    />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            isSelected && "text-accent-foreground"
                          )}
                        >
                          {box.name}
                        </p>
                        {box.description && (
                          <p className="text-muted-foreground text-xs truncate mt-0.5">
                            {box.description}
                          </p>
                        )}
                      </div>

                      {/* Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7 shrink-0 -mr-1 transition-opacity duration-200",
                              isHovered || isSelected
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={4}>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingBox(box);
                            }}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Coins className="size-3" />
                        <span>{box.count}</span>
                      </div>
                      {box.totalValue > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="font-medium">
                            {box.currency?.symbol || "$"}
                            {formatHighPrecision(box.totalValue)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Separator className="mx-3 w-auto" />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deletingBox && (
          <AlertDialog
            open={!!deletingBox}
            onOpenChange={() => setDeletingBox(null)}
          >
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
                      This will delete "{deletingBox?.name}" and all its
                      sadaqahs. This action cannot be undone.
                    </AlertDialogDescription>
                  </motion.div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deletingBox && handleDelete(deletingBox)}
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
    </>
  );
}
