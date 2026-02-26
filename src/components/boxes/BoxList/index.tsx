/**
 * Box List Component (Refactored)
 * 
 * Main container for displaying a list of boxes.
 * Uses component composition pattern for better maintainability.
 * 
 * @module components/boxes/BoxList
 */

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { prefetchBox, useSetDefaultBox } from "@/hooks";
import { authClient } from "@/lib/auth/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Box } from "@/types";
import { BoxListItem } from "./BoxListItem";
import { BoxListEmpty } from "./BoxListEmpty";
import { DeleteDialog } from "./DeleteDialog";

interface BoxListProps {
  boxes: Box[];
  selectedBoxId?: string;
  onSelectBox: (box: Box) => void;
  onBoxDeleted: (boxId: string) => void;
}

export function BoxList({ boxes, selectedBoxId, onSelectBox, onBoxDeleted }: BoxListProps) {
  const queryClient = useQueryClient();
  const [deletingBox, setDeletingBox] = useState<Box | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  
  const { mutate: setDefaultBox } = useSetDefaultBox();
  const session = authClient.useSession();
  const defaultBoxId = session.data?.user?.defaultBoxId;

  const handleDelete = async (box: Box) => {
    onBoxDeleted(box.id);
    setDeletingBox(null);
  };

  const handleMouseEnter = (boxId: string) => {
    setHoveredBoxId(boxId);
    prefetchBox(queryClient, boxId);
  };

  const handleMouseLeave = () => {
    setHoveredBoxId(null);
  };

  const handleSetDefault = (boxId: string) => {
    setDefaultBox(boxId);
  };

  if (boxes.length === 0) {
    return <BoxListEmpty />;
  }

  return (
    <>
      <ScrollArea className="h-[calc(100vh-330px)]">
          <AnimatePresence mode="popLayout">
            {boxes.map((box, index) => (
              <BoxListItem
                key={box.id}
                box={box}
                index={index}
                isSelected={selectedBoxId === box.id}
                isHovered={hoveredBoxId === box.id}
                isDefault={defaultBoxId === box.id}
                onSelect={onSelectBox}
                onHover={handleMouseEnter}
                onHoverEnd={handleMouseLeave}
                onSetDefault={handleSetDefault}
                onDelete={setDeletingBox}
              />
            ))}
          </AnimatePresence>
      </ScrollArea>

      <DeleteDialog
        box={deletingBox}
        onConfirm={handleDelete}
        onCancel={() => setDeletingBox(null)}
      />
    </>
  );
}

// Re-export sub-components for direct use if needed
export { BoxListItem } from "./BoxListItem";
export { BoxListEmpty } from "./BoxListEmpty";
export { DeleteDialog } from "./DeleteDialog";
