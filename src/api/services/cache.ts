/**
 * Simple in-memory cache service with TTL support
 * Optimized for Cloudflare Workers environment
 */

export interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

export interface CacheOptions {
	ttl: number; // Time to live in milliseconds
}

/**
 * Simple TTL cache implementation
 */
export class Cache<T> {
	private cache = new Map<string, CacheEntry<T>>();
	private readonly defaultTtl: number;

	constructor(defaultTtl: number = 60000) {
		// 1 minute default
		this.defaultTtl = defaultTtl;
	}

	/**
	 * Gets a value from cache
	 */
	get(key: string): T | undefined {
		const entry = this.cache.get(key);
		
		if (!entry) {
			return undefined;
		}
		
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

// Global cache instances for different entity types
export const currencyCache = new Cache<any>(5 * 60 * 1000); // 5 minutes
export const tagCache = new Cache<any>(5 * 60 * 1000); // 5 minutes
