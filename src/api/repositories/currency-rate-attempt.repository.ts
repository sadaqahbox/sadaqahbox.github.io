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

// D1 has a limit on query parameters, so we batch large IN clauses
const BATCH_SIZE = 50;

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
   * Batches queries to avoid D1 parameter limits
   */
  async getByCodes(codes: string[]): Promise<Map<string, CurrencyRateAttempt>> {
    if (codes.length === 0) return new Map();
    
    const upperCodes = [...new Set(codes.map(c => c.toUpperCase()))];
    const map = new Map<string, CurrencyRateAttempt>();
    
    // Batch queries to avoid D1 parameter limit
    for (let i = 0; i < upperCodes.length; i += BATCH_SIZE) {
      const batch = upperCodes.slice(i, i + BATCH_SIZE);
      const results = await this.db
        .select()
        .from(currencyRateAttempts)
        .where(inArray(currencyRateAttempts.currencyCode, batch));
      
      for (const result of results) {
        map.set(result.currencyCode, result);
      }
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
   * Record multiple successful rate fetches in batch (optimized)
   * Uses SQLite UPSERT for atomicity
   */
  async recordBatchSuccess(results: CurrencyAttemptResult[]): Promise<void> {
    if (results.length === 0) return;
    
    const now = new Date();
    
    // Get existing records in one query
    const codes = results.map(r => r.code.toUpperCase());
    const existing = await this.getByCodes(codes);
    
    // Separate into updates and inserts
    const toInsert: NewCurrencyRateAttempt[] = [];

    for (const result of results) {
      const upperCode = result.code.toUpperCase();
      const existingRecord = existing.get(upperCode);

      if (result.found && result.usdValue !== undefined) {
        if (existingRecord) {
          // Update existing record
          await this.db
            .update(currencyRateAttempts)
            .set({
              lastAttemptAt: now,
              lastSuccessAt: now,
              usdValue: result.usdValue,
              sourceApi: result.sourceApi || "unknown",
              found: true,
              attemptCount: existingRecord.attemptCount + 1,
            })
            .where(eq(currencyRateAttempts.id, existingRecord.id));
        } else {
          // Insert new record
          toInsert.push({
            id: generateId(ID_PREFIXES.RATE_CACHE),
            currencyCode: upperCode,
            lastAttemptAt: now,
            lastSuccessAt: now,
            usdValue: result.usdValue,
            sourceApi: result.sourceApi || "unknown",
            found: true,
            attemptCount: 1,
          });
        }
      }
    }

    // Batch insert new records
    if (toInsert.length > 0) {
      await this.db.insert(currencyRateAttempts).values(toInsert);
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
   * Record multiple not-found in batch
   */
  async recordBatchNotFound(codes: string[]): Promise<void> {
    if (codes.length === 0) return;
    
    const now = new Date();
    const upperCodes = codes.map(c => c.toUpperCase());
    
    // Get existing records
    const existing = await this.getByCodes(upperCodes);
    
    const toInsert: NewCurrencyRateAttempt[] = [];

    for (const code of upperCodes) {
      const existingRecord = existing.get(code);
      if (existingRecord) {
        // Update existing record
        await this.db
          .update(currencyRateAttempts)
          .set({
            lastAttemptAt: now,
            found: false,
            attemptCount: existingRecord.attemptCount + 1,
          })
          .where(eq(currencyRateAttempts.id, existingRecord.id));
      } else {
        // Insert new record
        toInsert.push({
          id: generateId(ID_PREFIXES.RATE_CACHE),
          currencyCode: code,
          lastAttemptAt: now,
          lastSuccessAt: null,
          usdValue: null,
          sourceApi: null,
          found: false,
          attemptCount: 1,
        });
      }
    }

    // Batch insert new records
    if (toInsert.length > 0) {
      await this.db.insert(currencyRateAttempts).values(toInsert);
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
   * Get all cached values that are still valid (optimized with single query)
   */
  async getAllCachedValues(maxAgeMs: number): Promise<Map<string, number>> {
    const cutoffTimestamp = Date.now() - maxAgeMs;
    const cutoffDate = new Date(cutoffTimestamp);
    
    // Use a single query with a WHERE clause to filter by found=true and timestamp
    const results = await this.db
      .select()
      .from(currencyRateAttempts)
      .where(
        and(
          eq(currencyRateAttempts.found, true),
          sql`${currencyRateAttempts.lastSuccessAt} > ${cutoffDate.getTime()}`
        )
      );

    const map = new Map<string, number>();
    for (const result of results) {
      if (result.usdValue !== null) {
        map.set(result.currencyCode, result.usdValue);
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
   * Clear all attempts for multiple currencies
   * Batches queries to avoid D1 parameter limits
   */
  async clearForCurrencies(codes: string[]): Promise<void> {
    if (codes.length === 0) return;
    
    const upperCodes = [...new Set(codes.map(c => c.toUpperCase()))];
    
    // Batch deletes to avoid D1 parameter limit
    for (let i = 0; i < upperCodes.length; i += BATCH_SIZE) {
      const batch = upperCodes.slice(i, i + BATCH_SIZE);
      await this.db
        .delete(currencyRateAttempts)
        .where(inArray(currencyRateAttempts.currencyCode, batch));
    }
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