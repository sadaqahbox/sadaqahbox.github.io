import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { HugeiconsIcon } from "@hugeicons/react";
import { Mosque01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { prefetchBox } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { Box } from "@/types";

interface BoxListProps {
  boxes: Box[];
  selectedBoxId?: string;
  onSelectBox: (box: Box) => void;
  onBoxDeleted: (boxId: string) => void;
}

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

const iconVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.1, transition: { duration: 0.2 } },
  selected: { scale: 1.05, transition: { duration: 0.2 } },
};

const contentVariants = {
  initial: { opacity: 0.8 },
  hover: { opacity: 1, transition: { duration: 0.2 } },
};

export function BoxList({ boxes, selectedBoxId, onSelectBox, onBoxDeleted }: BoxListProps) {
  const queryClient = useQueryClient();
  const [deletingBox, setDeletingBox] = useState<Box | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);

  const handleDelete = async (box: Box) => {
    // Let the parent handle deletion via TanStack Query mutation
    onBoxDeleted(box.id);
    setDeletingBox(null);
  };

  const handleMouseEnter = (boxId: string) => {
    setHoveredBoxId(boxId);
    // Prefetch box details on hover for instant navigation
    prefetchBox(queryClient, boxId);
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
      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="px-2">
          <AnimatePresence mode="popLayout">
            {boxes.map((box, index) => (
              <motion.div
                key={box.id}
                custom={index}
                variants={listItemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <motion.div
                  className={cn(
                    "group relative flex items-start gap-3 rounded-lg p-3 cursor-pointer transition-colors",
                    selectedBoxId === box.id
                      ? "bg-accent"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => onSelectBox(box)}
                  onMouseEnter={() => handleMouseEnter(box.id)}
                  onMouseLeave={() => setHoveredBoxId(null)}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Animated Icon */}
                  <motion.div
                    variants={iconVariants}
                    initial="initial"
                    animate={selectedBoxId === box.id ? "selected" : hoveredBoxId === box.id ? "hover" : "initial"}
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                      selectedBoxId === box.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted group-hover:bg-background"
                    )}
                  >
                    <HugeiconsIcon icon={Mosque01Icon} className="size-5" />
                  </motion.div>

                  {/* Content */}
                  <motion.div
                    variants={contentVariants}
                    initial="initial"
                    whileHover="hover"
                    className="flex-1 min-w-0 pt-0.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <motion.p
                          layout="position"
                          className={cn(
                            "text-sm font-medium truncate",
                            selectedBoxId === box.id && "text-accent-foreground"
                          )}
                        >
                          {box.name}
                        </motion.p>
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
                              hoveredBoxId === box.id || selectedBoxId === box.id
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
                    <motion.div
                      layout="position"
                      className="flex items-center gap-3 mt-2"
                    >
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Coins className="size-3" />
                        <span>{box.count}</span>
                      </div>
                      {box.totalValue > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="font-medium">
                            {box.currency?.symbol || "$"}{box.totalValue.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </motion.div>

                    {/* Tags */}
                    <AnimatePresence>
                      {box.tags && box.tags.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-wrap gap-1 mt-2"
                        >
                          {box.tags.slice(0, 3).map((tag, tagIndex) => (
                            <motion.div
                              key={tag.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: tagIndex * 0.05 }}
                            >
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-4"
                                style={{
                                  backgroundColor: tag.color ? `${tag.color}20` : undefined,
                                  color: tag.color || undefined,
                                  borderColor: tag.color || undefined,
                                }}
                              >
                                {tag.name}
                              </Badge>
                            </motion.div>
                          ))}
                          {box.tags.length > 3 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              +{box.tags.length - 3}
                            </Badge>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
                {index < boxes.length - 1 && <Separator className="mx-3 w-auto" />}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog with Animation */}
      <AnimatePresence>
        {deletingBox && (
          <AlertDialog open={!!deletingBox} onOpenChange={() => setDeletingBox(null)}>
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
                      This will delete "{deletingBox?.name}" and all its sadaqahs. This action cannot be undone.
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
