/**
 * Exchange Rate Service
 *
 * Fetches currency rates and gold prices from multiple free APIs with fallback support.
 * Implements granular per-currency rate limiting.
 *
 * API Sources:
 * - Fiat Currencies:
 *   1. Fawaz Ahmed Currency API (comprehensive, free) - Primary
 *   2. ExchangeRate-API (free, no key)
 *   3. Frankfurter API (ECB rates)
 *   4. CurrencyAPI.net (free tier)
 *   5. exchangerate.host (free)
 * - Cryptocurrencies:
 *   1. CoinGecko API (free tier)
 *   2. CryptoCompare (free tier)
 * - Gold Prices:
 *   1. GoldAPI.io (if API key available)
 *   2. Metals.live (free)
 *   3. Gold Price API (free)
 *
 * Rate Limiting Strategy:
 * - Per-currency tracking with 1-hour cooldown
 * - Failed lookups are recorded to prevent immediate retry
 * - APIs are tried sequentially until currency is found
 * - All returned currencies from successful API calls are cached
 */

import { eq } from "drizzle-orm";
import type { Database } from "../../db";
import { currencies } from "../../db/schema";
import { CurrencyEntity } from "../entities/currency";
import { CurrencyRateAttemptRepository } from "../repositories/currency-rate-attempt.repository";
import { logger } from "../shared/logger";

// Constants
const TROY_OUNCE_TO_GRAMS = 31.1034768;
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours for cached values

// API Keys from environment
const GOLD_API_TOKEN = process.env.GOLD_API_TOKEN || "";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || "";
const CRYPTOCOMPARE_API_KEY = process.env.CRYPTOCOMPARE_API_KEY || "";

export interface RateResult {
  success: boolean;
  usdRates: Map<string, number>;
  goldPriceUsd: number;
  errors: string[];
  fromCache: string[]; // currencies served from cache
  newlyFetched: string[]; // currencies newly fetched
  notFound: string[]; // currencies not found by any API
}

export interface CurrencyRate {
  code: string;
  usdValue: number;
  source: string;
}

// API response types
interface ApiResponse {
  rates: Map<string, number>;
  source: string;
}

export function calculateGoldValue(usdValue: number, xauUsdValue: number): number {
  if (xauUsdValue <= 0) return 0;
  return usdValue / xauUsdValue;
}

export function calculateGoldGrams(
  amount: number,
  currencyUsdValue: number | null,
  xauUsdValue: number | null
): number {
  if (!currencyUsdValue || currencyUsdValue <= 0 || !xauUsdValue || xauUsdValue <= 0) return 0;
  return (amount * currencyUsdValue) / xauUsdValue;
}

export function convertGoldToCurrency(
  goldGrams: number,
  currencyUsdValue: number | null,
  xauUsdValue: number | null
): number {
  if (!currencyUsdValue || currencyUsdValue <= 0 || !xauUsdValue || xauUsdValue <= 0) return 0;
  return (goldGrams * xauUsdValue) / currencyUsdValue;
}

export class ExchangeRateService {
  private static instance: ExchangeRateService | null = null;
  private attemptRepo: CurrencyRateAttemptRepository;

  constructor(private db: Database) {
    this.attemptRepo = new CurrencyRateAttemptRepository(db);
  }

  static getInstance(db: Database): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService(db);
    }
    return ExchangeRateService.instance;
  }

  /**
   * Check if a specific currency can be fetched (not in cooldown)
   */
  async canFetchRateForCurrency(currencyCode: string): Promise<boolean> {
    const currencyEntity = new CurrencyEntity(this.db);
    const currency = await currencyEntity.getByCode(currencyCode);

    // If we have a rate in the database, no need to fetch
    if (currency?.usdValue != null) {
      return false;
    }

    // Check if we should attempt (not in cooldown)
    return this.attemptRepo.shouldAttempt(currencyCode, COOLDOWN_MS);
  }

  /**
   * Get rates for specific currencies
   * This is the main method for fetching rates with granular tracking
   */
  async fetchRatesForCurrencies(currencyCodes: string[]): Promise<RateResult> {
    const errors: string[] = [];
    const usdRates = new Map<string, number>();
    const fromCache: string[] = [];
    const newlyFetched: string[] = [];
    const notFound: string[] = [];

    // Normalize codes
    const codes = currencyCodes.map(c => c.toUpperCase()).filter((v, i, a) => a.indexOf(v) === i);

    // Step 1: Check for cached values first
    const cachedRates = await this.attemptRepo.getAllCachedValues(MAX_CACHE_AGE_MS);
    const remainingCodes: string[] = [];

    for (const code of codes) {
      if (code === "USD") {
        usdRates.set(code, 1);
        fromCache.push(code);
        continue;
      }

      const cached = cachedRates.get(code);
      if (cached !== undefined) {
        usdRates.set(code, cached);
        fromCache.push(code);
        logger.debug(`Using cached rate for ${code}: ${cached}`);
      } else {
        remainingCodes.push(code);
      }
    }

    if (remainingCodes.length === 0) {
      return {
        success: true,
        usdRates,
        goldPriceUsd: 0,
        errors,
        fromCache,
        newlyFetched: [],
        notFound: [],
      };
    }

    // Step 2: Check which currencies need API calls (not in cooldown)
    const codesNeedingAttempt = await this.attemptRepo.getCodesNeedingAttempt(remainingCodes, COOLDOWN_MS);
    const inCooldown = remainingCodes.filter(c => !codesNeedingAttempt.includes(c));

    // Mark in-cooldown currencies as not found (for now)
    for (const code of inCooldown) {
      notFound.push(code);
      logger.debug(`Currency ${code} in cooldown, skipping API call`);
    }

    if (codesNeedingAttempt.length === 0) {
      return {
        success: usdRates.size > 0,
        usdRates,
        goldPriceUsd: 0,
        errors: [...errors, "All currencies in cooldown"],
        fromCache,
        newlyFetched: [],
        notFound,
      };
    }

    // Step 3: Try APIs for currencies that need fetching
    const apiResults = await this.tryApisForCurrencies(codesNeedingAttempt);

    // Process API results
    for (const [code, rate] of apiResults.rates) {
      usdRates.set(code, rate);
      if (codesNeedingAttempt.includes(code)) {
        newlyFetched.push(code);
      }
    }

    // Mark currencies that weren't found
    for (const code of codesNeedingAttempt) {
      if (!apiResults.rates.has(code)) {
        notFound.push(code);
        // Record that we tried but didn't find this currency
        await this.attemptRepo.recordNotFound(code);
      }
    }

    return {
      success: usdRates.size > 0,
      usdRates,
      goldPriceUsd: 0,
      errors: apiResults.errors.length > 0 ? apiResults.errors : errors,
      fromCache,
      newlyFetched,
      notFound,
    };
  }

  /**
   * Try multiple APIs to fetch rates for given currencies
   * Returns all successfully fetched rates (including those not specifically requested)
   */
  private async tryApisForCurrencies(codes: string[]): Promise<{ rates: Map<string, number>; errors: string[] }> {
    const allRates = new Map<string, number>();
    const errors: string[] = [];
    const foundCodes = new Set<string>();

    // Define API fetchers in priority order
    const apiFetchers = [
      { name: "fawazahmed0", fetch: () => this.fetchFromFawazAhmed0() },
      { name: "exchangerate-api", fetch: () => this.fetchFromExchangeRateAPI() },
      { name: "frankfurter", fetch: () => this.fetchFromFrankfurter() },
      { name: "exchangerate-host", fetch: () => this.fetchFromExchangerateHost() },
      { name: "cryptocompare", fetch: () => this.fetchFromCryptoCompare() },
      { name: "coingecko", fetch: () => this.fetchFromCoinGecko() },
    ];

    for (const api of apiFetchers) {
      // Skip if we've found all requested codes
      if (codes.every(c => foundCodes.has(c))) {
        break;
      }

      try {
        logger.info(`Trying API: ${api.name}`);
        const response = await api.fetch();

        if (response && response.rates.size > 0) {
          logger.info(`${api.name} returned ${response.rates.size} rates`);

          // Save all returned rates (not just requested ones)
          const savePromises: Promise<void>[] = [];

          for (const [code, rate] of response.rates) {
            // Store in our results
            if (!allRates.has(code)) {
              allRates.set(code, rate);
            }

            // Mark if this was a requested code
            if (codes.includes(code)) {
              foundCodes.add(code);
            }

            // Record successful fetch for this currency (in attempt tracking)
            savePromises.push(
              this.attemptRepo.recordSuccess(code, rate, api.name)
            );
          }

          // Wait for all attempt records to complete
          await Promise.all(savePromises);

          // Also update the currencies table with the fetched rates
          await this.updateCurrencyRates(response.rates);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`${api.name} failed: ${errorMsg}`);
        errors.push(`${api.name}: ${errorMsg}`);
      }
    }

    return { rates: allRates, errors };
  }

  /**
   * Fetch all rates (backward compatibility)
   */
  async fetchAllRates(): Promise<RateResult> {
    // Get all currencies from database
    const currencyEntity = new CurrencyEntity(this.db);
    const allCurrencies = await currencyEntity.list();
    const codes = allCurrencies.map(c => c.code);

    return this.fetchRatesForCurrencies(codes);
  }

  /**
   * Fawaz Ahmed Currency API - Most comprehensive free API
   * https://github.com/fawazahmed0/exchange-api
   */
  private async fetchFromFawazAhmed0(): Promise<ApiResponse> {
    const response = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
      {
        headers: { Accept: "application/json" },
        // Add timeout
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json() as {
      date?: string;
      usd?: Record<string, number>;
    };

    if (!data.usd) {
      throw new Error("No rates in response");
    }

    const rates = new Map<string, number>();
    for (const [code, rate] of Object.entries(data.usd)) {
      if (rate > 0) {
        // This API returns: 1 USD = X units of currency
        // We need: 1 unit of currency = X USD
        rates.set(code.toUpperCase(), 1 / rate);
      }
    }

    logger.info(`Fawaz Ahmed API: fetched ${rates.size} rates`);
    return { rates, source: "fawazahmed0" };
  }

  /**
   * ExchangeRate-API (free, no key required)
   */
  private async fetchFromExchangeRateAPI(): Promise<ApiResponse> {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json() as {
      rates?: Record<string, number>;
    };

    if (!data.rates) {
      throw new Error("No rates in response");
    }

    const rates = new Map<string, number>();
    for (const [code, rate] of Object.entries(data.rates)) {
      if (rate > 0) {
        rates.set(code, 1 / rate);
      }
    }

    logger.info(`ExchangeRate-API: fetched ${rates.size} rates`);
    return { rates, source: "exchangerate-api" };
  }

  /**
   * Frankfurter API (ECB rates)
   */
  private async fetchFromFrankfurter(): Promise<ApiResponse> {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json() as {
      rates?: Record<string, number>;
    };

    if (!data.rates) {
      throw new Error("No rates in response");
    }

    const rates = new Map<string, number>();
    for (const [code, rate] of Object.entries(data.rates)) {
      if (rate > 0) {
        rates.set(code, 1 / rate);
      }
    }

    logger.info(`Frankfurter API: fetched ${rates.size} rates`);
    return { rates, source: "frankfurter" };
  }

  /**
   * exchangerate.host (free tier)
   */
  private async fetchFromExchangerateHost(): Promise<ApiResponse> {
    const response = await fetch("https://api.exchangerate.host/latest?base=USD", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json() as {
      rates?: Record<string, number>;
    };

    if (!data.rates) {
      throw new Error("No rates in response");
    }

    const rates = new Map<string, number>();
    for (const [code, rate] of Object.entries(data.rates)) {
      if (rate > 0) {
        rates.set(code, 1 / rate);
      }
    }

    logger.info(`exchangerate.host: fetched ${rates.size} rates`);
    return { rates, source: "exchangerate-host" };
  }

  /**
   * CryptoCompare API (free tier)
   */
  private async fetchFromCryptoCompare(): Promise<ApiResponse> {
    const cryptoCodes = [
      "BTC", "ETH", "BNB", "XRP", "ADA", "SOL", "DOT", "DOGE",
      "AVAX", "LINK", "LTC", "UNI", "XLM", "USDT", "USDC", "BCH",
      "CRO", "DAI", "HBAR", "ICP", "KAS", "LEO", "NEAR", "PEPE",
      "SHIB", "SUI", "TON", "TRX", "VET", "APT", "MATIC", "ATOM",
      "FIL", "ETC", "ALGO", "ARB", "OP", "IMX", "GRT", "STX",
    ];

    const fsym = "USD";
    const tsyms = cryptoCodes.join(",");
    const apiKeyParam = CRYPTOCOMPARE_API_KEY ? `&api_key=${CRYPTOCOMPARE_API_KEY}` : "";

    const response = await fetch(
      `https://min-api.cryptocompare.com/data/price?fsym=${fsym}&tsyms=${tsyms}${apiKeyParam}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json() as Record<string, number> & { Response?: string; Message?: string };

    if (data.Response === "Error") {
      throw new Error(data.Message ?? "API error");
    }

    const rates = new Map<string, number>();
    for (const [code, rate] of Object.entries(data)) {
      if (typeof rate === "number" && rate > 0) {
        // CryptoCompare returns: 1 USD = X crypto
        // We need: 1 crypto = X USD
        rates.set(code.toUpperCase(), 1 / rate);
      }
    }

    logger.info(`CryptoCompare: fetched ${rates.size} crypto rates`);
    return { rates, source: "cryptocompare" };
  }

  /**
   * CoinGecko API
   */
  private async fetchFromCoinGecko(): Promise<ApiResponse> {
    const cryptoIds = [
      "bitcoin", "ethereum", "binancecoin", "ripple", "cardano", "solana",
      "polkadot", "dogecoin", "avalanche-2", "chainlink", "litecoin",
      "uniswap", "stellar", "tether", "usd-coin", "bitcoin-cash", "cronos",
      "dai", "hedera-hashgraph", "internet-computer", "kaspa", "leo-token",
      "near", "pepe", "shiba-inu", "sui", "the-open-network", "tron",
      "vechain", "aptos", "polygon", "cosmos", "filecoin", "ethereum-classic",
      "algorand", "arbitrum", "optimism", "immutable-x", "the-graph", "stacks",
    ];

    const url = COINGECKO_API_KEY
      ? `https://pro-api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(",")}&vs_currencies=usd&x_cg_pro_api_key=${COINGECKO_API_KEY}`
      : `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(",")}&vs_currencies=usd`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json() as Record<string, { usd?: number }>;

    const idToCode: Record<string, string> = {
      bitcoin: "BTC", ethereum: "ETH", binancecoin: "BNB", ripple: "XRP",
      cardano: "ADA", solana: "SOL", polkadot: "DOT", dogecoin: "DOGE",
      "avalanche-2": "AVAX", chainlink: "LINK", litecoin: "LTC", uniswap: "UNI",
      stellar: "XLM", tether: "USDT", "usd-coin": "USDC", "bitcoin-cash": "BCH",
      cronos: "CRO", dai: "DAI", "hedera-hashgraph": "HBAR", "internet-computer": "ICP",
      kaspa: "KAS", "leo-token": "LEO", near: "NEAR", pepe: "PEPE",
      "shiba-inu": "SHIB", sui: "SUI", "the-open-network": "TON", tron: "TRX",
      vechain: "VET", aptos: "APT", polygon: "MATIC", cosmos: "ATOM",
      filecoin: "FIL", "ethereum-classic": "ETC", algorand: "ALGO", arbitrum: "ARB",
      optimism: "OP", "immutable-x": "IMX", "the-graph": "GRT", stacks: "STX",
    };

    const rates = new Map<string, number>();
    for (const [id, price] of Object.entries(data)) {
      const code = idToCode[id];
      if (code && price.usd) {
        rates.set(code, price.usd);
      }
    }

    logger.info(`CoinGecko: fetched ${rates.size} crypto rates`);
    return { rates, source: "coingecko" };
  }

  /**
   * Fetch gold price in USD per troy ounce
   */
  async fetchGoldPriceUsd(): Promise<number> {
    // Try APIs in order
    const goldApis = [
      { name: "goldapi", fetch: () => this.fetchGoldFromGoldAPI() },
      { name: "metals.live", fetch: () => this.fetchGoldFromMetalsLive() },
      { name: "goldprice.org", fetch: () => this.fetchGoldFromGoldPrice() },
    ];

    for (const api of goldApis) {
      try {
        const price = await api.fetch();
        if (price > 0) {
          logger.info(`Gold price from ${api.name}: $${price}`);
          return price;
        }
      } catch (error) {
        logger.warn(`${api.name} failed for gold price`);
      }
    }

    return 0;
  }

  private async fetchGoldFromGoldAPI(): Promise<number> {
    if (!GOLD_API_TOKEN) {
      throw new Error("No API token");
    }

    const response = await fetch("https://www.goldapi.io/api/XAU/USD", {
      headers: {
        "x-access-token": GOLD_API_TOKEN,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json() as { price?: number };

    if (!data.price) {
      throw new Error("No price in response");
    }

    return data.price;
  }

  private async fetchGoldFromMetalsLive(): Promise<number> {
    const response = await fetch("https://api.metals.live/v1/spot/gold", {
      headers: { "User-Agent": "SadaqahBox/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json() as Array<{ price?: number }>;

    if (!Array.isArray(data) || !data[0]?.price) {
      throw new Error("Invalid response format");
    }

    return data[0].price;
  }

  private async fetchGoldFromGoldPrice(): Promise<number> {
    const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
      headers: { "User-Agent": "SadaqahBox/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json() as {
      items?: Array<{ xauPrice?: number }>;
    };

    if (!data.items?.[0]?.xauPrice) {
      throw new Error("No price in response");
    }

    return data.items[0].xauPrice;
  }

  /**
   * Update currency USD values in database
   */
  async updateCurrencyValues(): Promise<{ updated: number; errors: string[] }> {
    const currencyEntity = new CurrencyEntity(this.db);
    const allCurrencies = await currencyEntity.list();

    const result = await this.fetchAllRates();
    const updates: Array<{ id: string; usdValue: number }> = [];

    for (const currency of allCurrencies) {
      const usdValue = result.usdRates.get(currency.code);

      if (usdValue !== undefined) {
        updates.push({ id: currency.id, usdValue });
      }
    }

    // Batch update database
    if (updates.length > 0) {
      const now = new Date();
      for (const update of updates) {
        await this.db
          .update(currencies)
          .set({
            usdValue: update.usdValue,
            lastRateUpdate: now,
          })
          .where(eq(currencies.id, update.id));
      }
    }

    return {
      updated: updates.length,
      errors: result.errors,
    };
  }

  /**
   * Update specific currency rates in the database
   * Called when APIs return rates to ensure currencies table is updated
   */
  private async updateCurrencyRates(rates: Map<string, number>): Promise<void> {
    const currencyEntity = new CurrencyEntity(this.db);
    const now = new Date();

    for (const [code, usdValue] of rates) {
      try {
        const currency = await currencyEntity.getByCode(code);
        if (currency) {
          await this.db
            .update(currencies)
            .set({
              usdValue,
              lastRateUpdate: now,
            })
            .where(eq(currencies.id, currency.id));
          logger.debug(`Updated ${code} rate in currencies table: ${usdValue}`);
        }
      } catch (error) {
        logger.warn(`Failed to update ${code} in currencies table`, { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  /**
   * Get USD value for a currency (from database or cache)
   */
  async getUsdValue(currencyId: string): Promise<number | null> {
    const currencyEntity = new CurrencyEntity(this.db);
    const currency = await currencyEntity.get(currencyId);
    return currency?.usdValue ?? null;
  }

  /**
   * Get USD value by currency code with fallback to API
   */
  async getUsdValueByCode(currencyCode: string): Promise<number | null> {
    const currencyEntity = new CurrencyEntity(this.db);
    const currency = await currencyEntity.getByCode(currencyCode);

    // Return from database if available
    if (currency?.usdValue != null) {
      return currency.usdValue;
    }

    // Try to fetch
    const result = await this.fetchRatesForCurrencies([currencyCode]);
    return result.usdRates.get(currencyCode) ?? null;
  }

  /**
   * Force refresh rates (clears all tracking)
   */
  async forceRefresh(): Promise<{ updated: number; errors: string[] }> {
    // Clear all attempt records
    await this.attemptRepo.deleteOlderThan(new Date());

    // Clear database rates
    const currencyEntity = new CurrencyEntity(this.db);
    const allCurrencies = await currencyEntity.list();

    for (const currency of allCurrencies) {
      await this.db
        .update(currencies)
        .set({ lastRateUpdate: null })
        .where(eq(currencies.id, currency.id));
    }

    return this.updateCurrencyValues();
  }

  /**
   * Get rate attempt statistics
   */
  async getStats(): Promise<{
    total: number;
    found: number;
    notFound: number;
    withCachedValue: number;
  }> {
    return this.attemptRepo.getStats();
  }
}

/**
 * Scheduled task to update rates hourly
 */
export async function scheduleRateUpdate(db: Database): Promise<void> {
  const service = ExchangeRateService.getInstance(db);
  const result = await service.updateCurrencyValues();
  logger.info(`Updated ${result.updated} currencies with rates`, { errors: result.errors });
}
