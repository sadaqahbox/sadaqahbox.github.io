/**
 * Currency Rate Attempt Repository
 *
 * Handles database operations for tracking per-currency rate fetch attempts.
 * This enables granular rate limiting - each currency is tracked independently.
 */

import { eq, inArray, and, lte, sql } from "drizzle-orm";
import type { Database } from "../../db";
import { currencyRateAttempts, type NewCurrencyRateAttempt, type CurrencyRateAttempt } from "../../db/schema";
import { generateId } from "../shared/id-generator";
import { ID_PREFIXES } from "../domain/constants";

export interface CurrencyAttemptResult {
  code: string;
  found: boolean;
  usdValue?: number;
  sourceApi?: string;
}

export class CurrencyRateAttemptRepository {
  constructor(private db: Database) {}

  /**
   * Get attempt record for a specific currency
   */
  async getByCode(code: string): Promise<CurrencyRateAttempt | null> {
    const results = await this.db
      .select()
      .from(currencyRateAttempts)
      .where(eq(currencyRateAttempts.currencyCode, code.toUpperCase()))
      .limit(1);
    return results[0] ?? null;
  }

  /**
   * Get multiple attempt records by codes
   */
  async getByCodes(codes: string[]): Promise<Map<string, CurrencyRateAttempt>> {
    if (codes.length === 0) return new Map();
    
    const upperCodes = codes.map(c => c.toUpperCase());
    const results = await this.db
      .select()
      .from(currencyRateAttempts)
      .where(inArray(currencyRateAttempts.currencyCode, upperCodes));
    
    const map = new Map<string, CurrencyRateAttempt>();
    for (const result of results) {
      map.set(result.currencyCode, result);
    }
    return map;
  }

  /**
   * Check if we should attempt to fetch a currency rate
   * Returns true if:
   * - No previous attempt exists
   * - Previous attempt was > cooldownMs ago AND (not found OR previously failed)
   * Returns false if:
   * - Rate was found and is still within cooldown
   * - Attempt was made within cooldown period (even if failed)
   */
  async shouldAttempt(code: string, cooldownMs: number): Promise<boolean> {
    const record = await this.getByCode(code);
    if (!record) return true; // Never attempted

    const now = Date.now();
    const lastAttempt = record.lastAttemptAt.getTime();
    const elapsed = now - lastAttempt;

    // If within cooldown, don't attempt
    if (elapsed < cooldownMs) {
      return false;
    }

    // Past cooldown - allow retry whether it was found or not
    return true;
  }

  /**
   * Get currencies that need rate fetching (not attempted or past cooldown)
   */
  async getCodesNeedingAttempt(codes: string[], cooldownMs: number): Promise<string[]> {
    if (codes.length === 0) return [];
    
    const upperCodes = codes.map(c => c.toUpperCase());
    const existing = await this.getByCodes(upperCodes);
    
    const now = Date.now();
    const needingAttempt: string[] = [];

    for (const code of upperCodes) {
      const record = existing.get(code);
      
      if (!record) {
        // Never attempted
        needingAttempt.push(code);
      } else {
        const lastAttempt = record.lastAttemptAt.getTime();
        const elapsed = now - lastAttempt;
        
        if (elapsed >= cooldownMs) {
          // Past cooldown - allow retry
          needingAttempt.push(code);
        }
      }
    }

    return needingAttempt;
  }

  /**
   * Record a successful rate fetch
   */
  async recordSuccess(code: string, usdValue: number, sourceApi: string): Promise<void> {
    const now = new Date();
    const upperCode = code.toUpperCase();
    const existing = await this.getByCode(upperCode);

    if (existing) {
      await this.db
        .update(currencyRateAttempts)
        .set({
          lastAttemptAt: now,
          lastSuccessAt: now,
          usdValue,
          sourceApi,
          found: true,
          attemptCount: existing.attemptCount + 1,
        })
        .where(eq(currencyRateAttempts.id, existing.id));
    } else {
      const newRecord: NewCurrencyRateAttempt = {
        id: generateId(ID_PREFIXES.RATE_CACHE),
        currencyCode: upperCode,
        lastAttemptAt: now,
        lastSuccessAt: now,
        usdValue,
        sourceApi,
        found: true,
        attemptCount: 1,
      };
      await this.db.insert(currencyRateAttempts).values(newRecord);
    }
  }

  /**
   * Record a failed/not-found rate fetch
   * This prevents immediate retry of the same currency
   */
  async recordNotFound(code: string): Promise<void> {
    const now = new Date();
    const upperCode = code.toUpperCase();
    const existing = await this.getByCode(upperCode);

    if (existing) {
      await this.db
        .update(currencyRateAttempts)
        .set({
          lastAttemptAt: now,
          found: false,
          attemptCount: existing.attemptCount + 1,
        })
        .where(eq(currencyRateAttempts.id, existing.id));
    } else {
      const newRecord: NewCurrencyRateAttempt = {
        id: generateId(ID_PREFIXES.RATE_CACHE),
        currencyCode: upperCode,
        lastAttemptAt: now,
        lastSuccessAt: null,
        usdValue: null,
        sourceApi: null,
        found: false,
        attemptCount: 1,
      };
      await this.db.insert(currencyRateAttempts).values(newRecord);
    }
  }

  /**
   * Record multiple successful rate fetches in batch
   */
  async recordBatchSuccess(results: CurrencyAttemptResult[]): Promise<void> {
    const now = new Date();
    
    for (const result of results) {
      if (result.found && result.usdValue !== undefined) {
        await this.recordSuccess(result.code, result.usdValue, result.sourceApi || "unknown");
      } else {
        await this.recordNotFound(result.code);
      }
    }
  }

  /**
   * Get cached USD value for a currency if available and not expired
   */
  async getCachedValue(code: string, maxAgeMs: number): Promise<number | null> {
    const record = await this.getByCode(code);
    if (!record || !record.found || !record.usdValue) {
      return null;
    }

    const now = Date.now();
    const lastSuccess = record.lastSuccessAt?.getTime();
    
    if (!lastSuccess) return null;
    
    const age = now - lastSuccess;
    if (age > maxAgeMs) {
      return null; // Cache expired
    }

    return record.usdValue;
  }

  /**
   * Get all cached values that are still valid
   */
  async getAllCachedValues(maxAgeMs: number): Promise<Map<string, number>> {
    const cutoffTimestamp = Date.now() - maxAgeMs;
    
    // Get all successful attempts and filter by timestamp in memory
    // SQLite timestamp comparisons can be tricky with Date objects
    const results = await this.db
      .select()
      .from(currencyRateAttempts)
      .where(eq(currencyRateAttempts.found, true));

    const map = new Map<string, number>();
    for (const result of results) {
      if (result.usdValue !== null && result.lastSuccessAt) {
        const successTime = new Date(result.lastSuccessAt).getTime();
        if (successTime > cutoffTimestamp) {
          map.set(result.currencyCode, result.usdValue);
        }
      }
    }
    return map;
  }

  /**
   * Clear old records (cleanup)
   */
  async deleteOlderThan(cutoffDate: Date): Promise<void> {
    await this.db
      .delete(currencyRateAttempts)
      .where(lte(currencyRateAttempts.lastAttemptAt, cutoffDate));
  }

  /**
   * Clear all attempts for a currency (force retry)
   */
  async clearForCurrency(code: string): Promise<void> {
    await this.db
      .delete(currencyRateAttempts)
      .where(eq(currencyRateAttempts.currencyCode, code.toUpperCase()));
  }

  /**
   * Get stats about rate attempts
   */
  async getStats(): Promise<{
    total: number;
    found: number;
    notFound: number;
    withCachedValue: number;
  }> {
    const all = await this.db.select().from(currencyRateAttempts);
    
    return {
      total: all.length,
      found: all.filter(r => r.found).length,
      notFound: all.filter(r => !r.found).length,
      withCachedValue: all.filter(r => r.usdValue !== null).length,
    };
  }
}
