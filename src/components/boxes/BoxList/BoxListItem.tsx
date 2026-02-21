/**
 * Box List Item Component
 * 
 * Individual item in the box list with animations and interactions.
 */

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coins, MoreVertical, Star, Trash2 } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mosque01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { listItemVariants, iconVariants, contentVariants, tagVariants } from "@/lib/animations";
import type { Box } from "@/types";

interface BoxListItemProps {
  box: Box;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  isDefault: boolean;
  onSelect: (box: Box) => void;
  onHover: (boxId: string) => void;
  onHoverEnd: () => void;
  onSetDefault: (boxId: string) => void;
  onDelete: (box: Box) => void;
}

export function BoxListItem({
  box,
  index,
  isSelected,
  isHovered,
  isDefault,
  onSelect,
  onHover,
  onHoverEnd,
  onSetDefault,
  onDelete,
}: BoxListItemProps) {
  return (
    <motion.div
      custom={index}
      variants={listItemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <motion.div
        className={cn(
          "group relative flex items-start gap-3 rounded-lg mx-2 my-1 px-3 py-3 cursor-pointer transition-colors",
          isSelected ? "bg-accent" : "hover:bg-muted/50"
        )}
        onClick={() => onSelect(box)}
        onMouseEnter={() => onHover(box.id)}
        onMouseLeave={onHoverEnd}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        {/* Animated Icon */}
        <motion.div
          variants={iconVariants}
          initial="initial"
          animate={isSelected ? "selected" : isHovered ? "hover" : "initial"}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ring-2",
            isSelected
              ? "bg-primary text-primary-foreground ring-primary"
              : isDefault
                ? "bg-muted group-hover:bg-background ring-primary"
                : "bg-muted group-hover:bg-background ring-transparent"
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
                  isSelected && "text-accent-foreground"
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
                    isHovered || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                {!isDefault && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetDefault(box.id);
                    }}
                  >
                    <Star className="size-4 mr-2" />
                    Make default
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(box);
                  }}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats Row */}
          <motion.div layout="position" className="flex items-center gap-3 mt-2">
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
          {box.tags && box.tags.length > 0 && <BoxListItemTags tags={box.tags} />}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Tags component for box list item
 */
function BoxListItemTags({ tags }: { tags: Box["tags"] }) {
  if (!tags || tags.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-wrap gap-1 mt-2"
    >
      {tags.slice(0, 3).map((tag, tagIndex) => (
        <motion.div
          key={tag.id}
          variants={tagVariants}
          initial="hidden"
          animate="visible"
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
      {tags.length > 3 && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
          +{tags.length - 3}
        </Badge>
      )}
    </motion.div>
  );
}
