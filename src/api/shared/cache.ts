/**
 * Simple in-memory cache with TTL support
 * Optimized for serverless environments
 */

export interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

export class Cache<T> {
	private cache = new Map<string, CacheEntry<T>>();

	constructor(private readonly defaultTtl: number = 60000) {}

	/**
	 * Gets a value from cache
	 */
	get(key: string): T | undefined {
		const entry = this.cache.get(key);
		if (!entry) return undefined;
		
		// Check if expired
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return undefined;
		}
		
		return entry.value;
	}

	/**
	 * Sets a value in cache with optional TTL
	 */
	set(key: string, value: T, ttl?: number): void {
		const expiresAt = Date.now() + (ttl ?? this.defaultTtl);
		this.cache.set(key, { value, expiresAt });
	}

	/**
	 * Deletes a key from cache
	 */
	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	/**
	 * Checks if a key exists in cache (and not expired)
	 */
	has(key: string): boolean {
		const entry = this.cache.get(key);
		if (!entry) return false;
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return false;
		}
		return true;
	}

	/**
	 * Clears all cached values
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Gets cache size (excluding expired entries)
	 */
	size(): number {
		this.cleanup();
		return this.cache.size;
	}

	/**
	 * Gets a value or computes it if not in cache
	 */
	async getOrSet(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
		const cached = this.get(key);
		if (cached !== undefined) {
			return cached;
		}
		
		const value = await factory();
		this.set(key, value, ttl);
		return value;
	}

	/**
	 * Removes expired entries
	 */
	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiresAt) {
				this.cache.delete(key);
			}
		}
	}
}

// ============== Global Cache Instances ==============

import { CACHE_TTL } from "../domain/constants";

export const currencyCache = new Cache<unknown>(CACHE_TTL.CURRENCY);
export const currencyTypeCache = new Cache<unknown>(CACHE_TTL.CURRENCY);
export const tagCache = new Cache<unknown>(CACHE_TTL.TAG);
