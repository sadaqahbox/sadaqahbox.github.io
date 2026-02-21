import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with 5 decimal places for high precision (e.g., gold prices)
 * Removes trailing zeros after the 5 decimal places
 */
export function formatHighPrecision(value: number): string {
  return value.toFixed(5).replace(/\.?0+$/, "");
}

/**
 * Format a number with exactly 5 decimal places (never removes zeros)
 * Use when exact precision is required
 */
export function formatFixedPrecision(value: number): string {
  return value.toFixed(5);
}
