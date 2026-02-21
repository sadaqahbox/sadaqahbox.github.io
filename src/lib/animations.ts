/**
 * Shared Animation Variants
 *
 * Centralized animation definitions for consistent motion across the application.
 * All variants are typed for use with framer-motion.
 */

import type { Variants } from "framer-motion";

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
