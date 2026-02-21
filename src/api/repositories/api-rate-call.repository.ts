/**
 * API Rate Call Repository
 *
 * Handles database operations for tracking API call attempts.
 * Used to enforce rate limiting across API endpoints.
 */

import { eq, and, lte } from "drizzle-orm";
import type { Database } from "../../db";
import { apiRateCalls, type NewApiRateCall, type ApiRateCall } from "../../db/schema";
import { generateId } from "../shared/id-generator";
import { ID_PREFIXES } from "../domain/constants";

// API endpoint identifiers
export const API_ENDPOINTS = {
  FIAT_RATES: "fiat_rates",
  CRYPTO_RATES: "crypto_rates",
  GOLD_PRICE: "gold_price",
} as const;

export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];

export class ApiRateCallRepository {
  constructor(private db: Database) {}

  /**
   * Get the last attempt for an endpoint
   */
  async getByEndpoint(endpoint: string): Promise<ApiRateCall | null> {
    const results = await this.db
      .select()
      .from(apiRateCalls)
      .where(eq(apiRateCalls.endpoint, endpoint))
      .limit(1);
    return results[0] ?? null;
  }

  /**
   * Check if an endpoint can be called (based on cooldown period)
   * @param endpoint - The API endpoint to check
   * @param cooldownMs - Minimum time since last attempt (in milliseconds)
   * @returns true if the endpoint can be called, false otherwise
   */
  async canCall(endpoint: string, cooldownMs: number): Promise<boolean> {
    const record = await this.getByEndpoint(endpoint);
    if (!record) return true; // Never called before

    const now = Date.now();
    const lastAttempt = record.lastAttemptAt.getTime();
    return now - lastAttempt >= cooldownMs;
  }

  /**
   * Record an API attempt (successful or not)
   * @param endpoint - The API endpoint
   * @param success - Whether the call succeeded
   * @param errorCount - Cumulative error count (incremented on failure)
   */
  async recordAttempt(
    endpoint: string,
    success: boolean,
    incrementError: boolean = false
  ): Promise<void> {
    const now = new Date();
    const existing = await this.getByEndpoint(endpoint);

    if (existing) {
      // Update existing record
      await this.db
        .update(apiRateCalls)
        .set({
          lastAttemptAt: now,
          lastSuccessAt: success ? now : existing.lastSuccessAt,
          errorCount: incrementError ? existing.errorCount + 1 : success ? 0 : existing.errorCount,
        })
        .where(eq(apiRateCalls.id, existing.id));
    } else {
      // Create new record
      const newRecord: NewApiRateCall = {
        id: generateId(ID_PREFIXES.RATE_CACHE),
        endpoint,
        lastAttemptAt: now,
        lastSuccessAt: success ? now : null,
        errorCount: incrementError ? 1 : 0,
      };
      await this.db.insert(apiRateCalls).values(newRecord);
    }
  }

  /**
   * Record a successful API call
   */
  async recordSuccess(endpoint: string): Promise<void> {
    await this.recordAttempt(endpoint, true, false);
  }

  /**
   * Record a failed API call
   */
  async recordFailure(endpoint: string): Promise<void> {
    await this.recordAttempt(endpoint, false, true);
  }

  /**
   * Get time until next allowed call (in milliseconds)
   * @returns 0 if can call now, positive number if must wait
   */
  async getTimeUntilNextCall(endpoint: string, cooldownMs: number): Promise<number> {
    const record = await this.getByEndpoint(endpoint);
    if (!record) return 0;

    const now = Date.now();
    const lastAttempt = record.lastAttemptAt.getTime();
    const elapsed = now - lastAttempt;
    return Math.max(0, cooldownMs - elapsed);
  }

  /**
   * Delete old records (cleanup)
   */
  async deleteOlderThan(cutoffDate: Date): Promise<number> {
    const result = await this.db
      .delete(apiRateCalls)
      .where(lte(apiRateCalls.lastAttemptAt, cutoffDate));
    // D1Result doesn't have changes property, return 0 as we can't track
    return 0;
  }
}
