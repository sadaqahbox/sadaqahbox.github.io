/**
 * Shared List Item Component
 *
 * A reusable list item with consistent styling, hover effects, and animations.
 * Used across BoxList, CollectionHistory, and SadaqahList for design consistency.
 */

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";
import { cva, type VariantProps } from "class-variance-authority";

const listItemVariants = cva(
  "group relative flex items-start gap-3 rounded-lg px-3 py-3 cursor-pointer transition-colors",
  {
    variants: {
      variant: {
        default: "hover:bg-muted/50",
        selected: "bg-accent",
        subtle: "hover:bg-muted/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconContainerVariants = cva(
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-background ring-2 ring-transparent group-hover:ring-primary/50",
        selected: "bg-primary ring-2 ring-primary",
        highlight: "bg-white dark:bg-background ring-2 ring-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ListItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemVariants> {
  /**
   * Icon to display - can be a React node, "logo" for logo.svg, or "numbered" with index
   */
  icon?: React.ReactNode | "logo" | { type: "numbered"; index: number };
  /**
   * Primary text/title
   */
  title: React.ReactNode;
  /**
   * Secondary text/subtitle (optional)
   */
  subtitle?: React.ReactNode;
  /**
   * Additional content below subtitle (optional)
   */
  extra?: React.ReactNode;
  /**
   * Action element(s) on the right side
   */
  action?: React.ReactNode;
  /**
   * Whether to show hover animation (translate x)
   */
  hoverAnimation?: boolean;
  /**
   * Custom icon container className
   */
  iconClassName?: string;
  /**
   * Icon variant - overrides the main variant for icon styling
   */
  iconVariant?: "default" | "selected" | "highlight";
}

export function ListItem({
  className,
  variant,
  icon,
  title,
  subtitle,
  extra,
  action,
  hoverAnimation = true,
  iconClassName,
  iconVariant,
  onClick,
  ...props
}: ListItemProps) {
  const resolvedIconVariant = iconVariant || (variant === "selected" ? "selected" : "default");

  const renderIcon = () => {
    if (icon === "logo") {
      return (
        <Logo
          className={cn(
            "size-10 transition-all duration-200",
            resolvedIconVariant === "selected" && "brightness-0 invert"
          )}
        />
      );
    }

    if (typeof icon === "object" && icon !== null && "type" in icon && icon.type === "numbered") {
      return (
        <span className={cn(
          "text-sm font-bold transition-colors duration-200",
          resolvedIconVariant === "selected" ? "text-primary-foreground" : "text-primary"
        )}>
          #{icon.index}
        </span>
      );
    }

    return icon;
  };

  return (
    <motion.div
      className={cn(listItemVariants({ variant }), className)}
      onClick={onClick}
      whileHover={hoverAnimation && onClick ? { x: 4 } : undefined}
      transition={{ duration: 0.2 }}
      {...(props as any)}
    >
      {/* Icon Container */}
      {icon && (
        <div className={cn(iconContainerVariants({ variant: resolvedIconVariant }), iconClassName)}>
          {renderIcon()}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{title}</div>
            {subtitle && (
              <div className="text-muted-foreground text-xs truncate mt-0.5">
                {subtitle}
              </div>
            )}
          </div>

          {/* Action */}
          {action && (
            <div className="shrink-0 flex items-center">
              {action}
            </div>
          )}
        </div>

        {/* Extra content */}
        {extra && (
          <div className="mt-2">
            {extra}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * List Item Group Header Component
 *
 * Used for grouping items by date or category
 */
interface ListItemGroupHeaderProps {
  icon?: React.ReactNode;
  title: string;
  count?: number;
  className?: string;
}

export function ListItemGroupHeader({
  icon,
  title,
  count,
  className,
}: ListItemGroupHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2 py-2", className)}>
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
        {title}
      </span>
      {count !== undefined && (
        <span className="inline-flex items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
          {count}
        </span>
      )}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/**
 * Animated List Item for use with AnimatePresence
 */
interface AnimatedListItemProps extends ListItemProps {
  index?: number;
}

const animatedItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
  exit: { opacity: 0, x: 20 },
};

export function AnimatedListItem({
  index = 0,
  ...props
}: AnimatedListItemProps) {
  return (
    <motion.div
      variants={animatedItemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      layout
    >
      <ListItem {...props} />
    </motion.div>
  );
}
