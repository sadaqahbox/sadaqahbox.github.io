/**
 * Shared Animation Variants
 *
 * Centralized animation definitions for consistent motion across the application.
 * All variants are typed for use with framer-motion.
 *
 * Accessibility: Respects prefers-reduced-motion for users who prefer minimal animation.
 */

import type { Variants } from "framer-motion";

/**
 * Check if user prefers reduced motion
 * Returns true if the user has requested reduced motion via system settings
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Get animation transition with reduced motion support
 * If user prefers reduced motion, returns a minimal/instant transition
 */
export const getAccessibleTransition = (duration: number = 0.3) => {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return { duration };
};

/**
 * Easing curve used across the app for consistent motion feel
 */
export const defaultEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

/**
 * Container variant with staggered children animation
 */
export const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

/**
 * Item variant for fade up animation
 */
export const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: defaultEase,
        },
    },
};

/**
 * Sidebar variant for slide in from left
 */
export const sidebarVariants: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5,
            ease: defaultEase,
        },
    },
};

/**
 * Main content variant for slide in from right
 */
export const mainContentVariants: Variants = {
    hidden: { opacity: 0, x: 30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5,
            delay: 0.1,
            ease: defaultEase,
        },
    },
};

/**
 * Empty state variant with scale animation
 */
export const emptyStateVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: defaultEase,
        },
    },
};

/**
 * Icon container variant with subtle pulse animation
 */
export const iconContainerVariants: Variants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.1, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

/**
 * Card variant for hover effects
 */
export const cardHoverVariants: Variants = {
    rest: { scale: 1 },
    hover: {
        scale: 1.02,
        transition: {
            duration: 0.2,
            ease: defaultEase,
        },
    },
};

/**
 * Fade in variant for simple opacity transition
 */
export const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.3,
            ease: defaultEase,
        },
    },
};

/**
 * Slide up variant for modal/dialog animations
 */
export const slideUpVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: defaultEase,
        },
    },
    exit: {
        opacity: 0,
        y: 50,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Stagger container with configurable stagger delay
 */
export function createStaggerContainer(staggerDelay: number = 0.1): Variants {
    return {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: staggerDelay,
                delayChildren: 0.1,
            },
        },
    };
}

/**
 * Scale variant for pop-in effects
 */
export const scaleVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: defaultEase,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * List item variant for staggered list animations
 */
export const listItemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.3,
            ease: defaultEase,
        },
    }),
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

/**
 * Icon variant for hover/selected states
 */
export const iconVariants: Variants = {
    initial: { scale: 1 },
    hover: { scale: 1.1, transition: { duration: 0.2 } },
    selected: { scale: 1.05, transition: { duration: 0.2 } },
};

/**
 * Content variant for hover opacity
 */
export const contentVariants: Variants = {
    initial: { opacity: 0.8 },
    hover: { opacity: 1, transition: { duration: 0.2 } },
};

/**
 * Tag variant for staggered tag appearance
 */
export const tagVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
};
