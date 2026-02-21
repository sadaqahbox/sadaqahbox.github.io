/**
 * Rate Service
 *
 * Fetches currency rates and gold prices from multiple free APIs with fallback support.
 *
 * Flow:
 * 1. First, USD value is calculated for each currency
 * 2. Gold value is calculated on-the-fly using XAU's USD value
 * 3. Gold value per currency = currency USD value / XAU USD value per gram
 *
 * Uses multiple free APIs with fallback:
 * 1. ExchangeRate-API (free, no key) - Primary for fiat
 * 2. Frankfurter API (free, ECB rates) - Fallback for fiat
 * 3. Currency API (fawazahmed0) - Fallback for fiat/crypto
 * 4. CoinGecko API (free) - For cryptocurrencies
 * 5. GoldAPI.io - For gold prices (with API key)
 * 6. Metals.live - Fallback for gold/metals
 *
 * Rate Limiting:
 * - 1 hour cooldown per API endpoint
 * - Failed calls also update lastAttemptAt to prevent immediate retries
 * - Each API group (fiat, crypto, gold) is tracked separately
 */

import { eq } from "drizzle-orm";
import type { Database } from "../../db";
import { currencies } from "../../db/schema";
import { CurrencyEntity } from "../entities/currency";
import { ApiRateCallRepository, API_ENDPOINTS } from "../repositories/api-rate-call.repository";
import { logger } from "../shared/logger";

// Constants
const TROY_OUNCE_TO_GRAMS = 31.1034768;
const API_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour in milliseconds

// API Keys from environment
const GOLD_API_TOKEN = process.env.GOLD_API_TOKEN || "";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || "";

export interface RateResult {
	success: boolean;
	usdRates: Map<string, number>; // currency code -> USD value for 1 unit
	goldPriceUsd: number; // Gold price in USD per troy ounce
	errors: string[];
}

export interface CurrencyRate {
	code: string;
	usdValue: number; // USD value for 1 unit of this currency
}

/**
 * Calculate gold value from USD value using XAU's USD value
 * @param usdValue - USD value for 1 unit of currency
 * @param xauUsdValue - USD value for 1 gram of gold (XAU)
 * @returns Grams of gold for 1 unit of currency
 */
export function calculateGoldValue(usdValue: number, xauUsdValue: number): number {
	if (xauUsdValue <= 0) return 0;
	return usdValue / xauUsdValue;
}

/**
 * Calculate gold grams from currency amount using the currency's USD value and XAU USD value
 * @param amount - Amount in the currency
 * @param currencyUsdValue - USD value for 1 unit of the currency
 * @param xauUsdValue - USD value for 1 gram of gold (XAU)
 * @returns Grams of gold equivalent
 */
export function calculateGoldGrams(
	amount: number,
	currencyUsdValue: number | null,
	xauUsdValue: number | null
): number {
	if (!currencyUsdValue || currencyUsdValue <= 0 || !xauUsdValue || xauUsdValue <= 0) return 0;
	return (amount * currencyUsdValue) / xauUsdValue;
}

/**
 * Convert gold grams back to currency amount
 * @param goldGrams - Grams of gold
 * @param currencyUsdValue - USD value for 1 unit of the currency
 * @param xauUsdValue - USD value for 1 gram of gold (XAU)
 * @returns Amount in the currency
 */
export function convertGoldToCurrency(
	goldGrams: number,
	currencyUsdValue: number | null,
	xauUsdValue: number | null
): number {
	if (!currencyUsdValue || currencyUsdValue <= 0 || !xauUsdValue || xauUsdValue <= 0) return 0;
	return (goldGrams * xauUsdValue) / currencyUsdValue;
}

export class GoldRateService {
	private static instance: GoldRateService | null = null;
	private rateRepo: ApiRateCallRepository;

	constructor(private db: Database) {
		this.rateRepo = new ApiRateCallRepository(db);
	}

	static getInstance(db: Database): GoldRateService {
		if (!GoldRateService.instance) {
			GoldRateService.instance = new GoldRateService(db);
		}
		return GoldRateService.instance;
	}

	/**
	 * Check if rates need to be updated (older than 1 hour from any source)
	 * Returns true if ALL API endpoints are past cooldown and have failed recently
	 */
	async needsUpdate(): Promise<boolean> {
		const [fiatCanCall, cryptoCanCall, goldCanCall] = await Promise.all([
			this.rateRepo.canCall(API_ENDPOINTS.FIAT_RATES, API_COOLDOWN_MS),
			this.rateRepo.canCall(API_ENDPOINTS.CRYPTO_RATES, API_COOLDOWN_MS),
			this.rateRepo.canCall(API_ENDPOINTS.GOLD_PRICE, API_COOLDOWN_MS),
		]);

		// We need update if any endpoint can be called
		return fiatCanCall || cryptoCanCall || goldCanCall;
	}

	/**
	 * Check if specific currency needs rate fetch (no cached value AND API cooldown allows)
	 */
	async canFetchRateForCurrency(currencyCode: string): Promise<boolean> {
		const currencyEntity = new CurrencyEntity(this.db);
		const currency = await currencyEntity.getByCode(currencyCode);

		// If we already have a rate, no need to fetch
		if (currency?.usdValue != null) {
			return false;
		}

		// Check if any API endpoint can be called
		return this.needsUpdate();
	}

	/**
	 * Get XAU's USD value (USD value for 1 gram of gold)
	 * This is used to calculate gold values for all currencies
	 */
	async getXauUsdValue(): Promise<number | null> {
		const currencyEntity = new CurrencyEntity(this.db);
		const xau = await currencyEntity.getByCode("XAU");
		return xau?.usdValue ?? null;
	}

	/**
	 * Fetch all rates - USD values for currencies and gold price
	 * Implements per-API rate limiting - won't call APIs within cooldown period
	 */
	async fetchAllRates(): Promise<RateResult> {
		const errors: string[] = [];
		const usdRates = new Map<string, number>();
		let goldPriceUsd = 0;

		// Check which endpoints can be called
		const [fiatCanCall, cryptoCanCall, goldCanCall] = await Promise.all([
			this.rateRepo.canCall(API_ENDPOINTS.FIAT_RATES, API_COOLDOWN_MS),
			this.rateRepo.canCall(API_ENDPOINTS.CRYPTO_RATES, API_COOLDOWN_MS),
			this.rateRepo.canCall(API_ENDPOINTS.GOLD_PRICE, API_COOLDOWN_MS),
		]);

		// Fetch fiat rates if allowed
		if (fiatCanCall) {
			const fiatRates = await this.fetchFiatRatesWithFallback();
			if (fiatRates) {
				for (const [code, rate] of fiatRates) {
					usdRates.set(code, rate);
				}
			} else {
				errors.push("All fiat rate APIs failed");
			}
		} else {
			logger.info("Fiat rate API cooldown active, skipping");
			// Load cached fiat rates from database
			const currencyEntity = new CurrencyEntity(this.db);
			const allCurrencies = await currencyEntity.list();
			for (const currency of allCurrencies) {
				if (currency.usdValue != null) {
					usdRates.set(currency.code, currency.usdValue);
				}
			}
		}

		// Fetch crypto rates if allowed
		if (cryptoCanCall) {
			const cryptoRates = await this.fetchCryptoRates();
			if (cryptoRates) {
				for (const [code, rate] of cryptoRates) {
					usdRates.set(code, rate);
				}
			} else {
				errors.push("Crypto rate API failed");
			}
		} else {
			logger.info("Crypto rate API cooldown active, skipping");
		}

		// Fetch gold price if allowed
		if (goldCanCall) {
			goldPriceUsd = await this.fetchGoldPriceUsd();
			if (goldPriceUsd === 0) {
				errors.push("All gold price APIs failed");
			} else {
				// Set XAU USD value (per gram)
				usdRates.set("XAU", goldPriceUsd / TROY_OUNCE_TO_GRAMS);
			}
		} else {
			logger.info("Gold price API cooldown active, skipping");
			// Get XAU from cached rates
			const xauUsdValue = usdRates.get("XAU");
			if (xauUsdValue) {
				goldPriceUsd = xauUsdValue * TROY_OUNCE_TO_GRAMS;
			}
		}

		// Set USD rate for USD itself
		usdRates.set("USD", 1);

		const success = usdRates.size > 0;

		return {
			success,
			usdRates,
			goldPriceUsd,
			errors,
		};
	}

	/**
	 * Fetch fiat currency rates with fallback
	 * Returns USD value for 1 unit of each currency
	 * Records attempt before calling, updates on success/failure
	 */
	private async fetchFiatRatesWithFallback(): Promise<Map<string, number> | null> {
		const rates = new Map<string, number>();
		let success = false;

		// Record that we're attempting this endpoint
		await this.rateRepo.recordAttempt(API_ENDPOINTS.FIAT_RATES, false, false);

		// Try APIs in order
		const apis = [
			() => this.fetchFromExchangeRateAPI(),
			() => this.fetchFromFrankfurter(),
			() => this.fetchFromCurrencyAPI(),
		];

		for (const api of apis) {
			try {
				const apiRates = await api();
				if (apiRates && apiRates.size > 0) {
					for (const [code, rate] of apiRates) {
						rates.set(code, rate);
					}
					success = true;
					break; // Stop on first success
				}
			} catch (error) {
				logger.warn("Fiat API failed, trying next", {
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		// Record final result
		if (success) {
			await this.rateRepo.recordSuccess(API_ENDPOINTS.FIAT_RATES);
			logger.info("Fiat rates fetched successfully", { count: rates.size });
		} else {
			await this.rateRepo.recordFailure(API_ENDPOINTS.FIAT_RATES);
			logger.error("All fiat rate APIs failed");
		}

		return success ? rates : null;
	}

	/**
	 * ExchangeRate-API (free, no key required)
	 * https://open.er-api.com/v6/latest/USD
	 */
	private async fetchFromExchangeRateAPI(): Promise<Map<string, number> | null> {
		const response = await fetch("https://open.er-api.com/v6/latest/USD", {
			headers: {
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`ExchangeRate-API error: ${response.status}`);
		}

		const data = (await response.json()) as {
			rates?: Record<string, number>;
		};

		if (!data.rates) {
			throw new Error("ExchangeRate-API: No rates in response");
		}

		const rates = new Map<string, number>();
		// The API returns: 1 USD = X units of currency
		// We need: 1 unit of currency = X USD
		// So we invert: USD value = 1 / rate
		for (const [code, rate] of Object.entries(data.rates)) {
			if (rate > 0) {
				rates.set(code, 1 / rate);
			}
		}

		logger.info("ExchangeRate-API: fetched rates", { count: rates.size });
		return rates;
	}

	/**
	 * Frankfurter API (free, based on European Central Bank rates)
	 * https://api.frankfurter.app/latest
	 */
	private async fetchFromFrankfurter(): Promise<Map<string, number> | null> {
		const response = await fetch("https://api.frankfurter.app/latest?from=USD", {
			headers: {
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`Frankfurter error: ${response.status}`);
		}

		const data = (await response.json()) as {
			rates?: Record<string, number>;
		};

		if (!data.rates) {
			throw new Error("Frankfurter: No rates in response");
		}

		const rates = new Map<string, number>();
		// Same inversion as ExchangeRate-API
		for (const [code, rate] of Object.entries(data.rates)) {
			if (rate > 0) {
				rates.set(code, 1 / rate);
			}
		}

		logger.info("Frankfurter: fetched rates", { count: rates.size });
		return rates;
	}

	/**
	 * Currency API (fawazahmed0, free, no key)
	 * https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json
	 */
	private async fetchFromCurrencyAPI(): Promise<Map<string, number> | null> {
		const response = await fetch(
			"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
			{
				headers: {
					Accept: "application/json",
				},
			}
		);

		if (!response.ok) {
			throw new Error(`Currency API error: ${response.status}`);
		}

		const data = (await response.json()) as {
			usd?: Record<string, number>;
		};

		if (!data.usd) {
			throw new Error("Currency API: No rates in response");
		}

		const rates = new Map<string, number>();
		// This API returns: 1 USD = X units of currency
		// We need to invert
		for (const [code, rate] of Object.entries(data.usd)) {
			if (rate > 0) {
				// Convert lowercase codes to uppercase
				rates.set(code.toUpperCase(), 1 / rate);
			}
		}

		logger.info("Currency API: fetched rates", { count: rates.size });
		return rates;
	}

	/**
	 * Fetch cryptocurrency rates from CoinGecko (free tier)
	 * Returns USD value for 1 unit of each crypto
	 * Records attempt before calling
	 */
	private async fetchCryptoRates(): Promise<Map<string, number> | null> {
		// Record attempt
		await this.rateRepo.recordAttempt(API_ENDPOINTS.CRYPTO_RATES, false, false);

		const rates = new Map<string, number>();

		try {
			// CoinGecko free API - get prices for major cryptos
			const cryptoIds = [
				"bitcoin",
				"ethereum",
				"binancecoin",
				"ripple",
				"cardano",
				"solana",
				"polkadot",
				"dogecoin",
				"avalanche-2",
				"chainlink",
				"litecoin",
				"uniswap",
				"stellar",
				"tether",
				"usd-coin",
				"bitcoin-cash",
				"cronos",
				"dai",
				"hedera-hashgraph",
				"internet-computer",
				"kaspa",
				"leo-token",
				"near",
				"pepe",
				"shiba-inu",
				"sui",
				"the-open-network",
				"tron",
				"vechain",
				"aptos",
			];

			const url = COINGECKO_API_KEY
				? `https://pro-api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(",")}&vs_currencies=usd&x_cg_pro_api_key=${COINGECKO_API_KEY}`
				: `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(",")}&vs_currencies=usd`;

			const response = await fetch(url, {
				headers: {
					Accept: "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`CoinGecko error: ${response.status}`);
			}

			const data = (await response.json()) as Record<string, { usd?: number }>;

			// Map CoinGecko IDs to currency codes
			const idToCode: Record<string, string> = {
				bitcoin: "BTC",
				ethereum: "ETH",
				binancecoin: "BNB",
				ripple: "XRP",
				cardano: "ADA",
				solana: "SOL",
				polkadot: "DOT",
				dogecoin: "DOGE",
				"avalanche-2": "AVAX",
				chainlink: "LINK",
				litecoin: "LTC",
				uniswap: "UNI",
				stellar: "XLM",
				tether: "USDT",
				"usd-coin": "USDC",
				"bitcoin-cash": "BCH",
				cronos: "CRO",
				dai: "DAI",
				"hedera-hashgraph": "HBAR",
				"internet-computer": "ICP",
				kaspa: "KAS",
				"leo-token": "LEO",
				near: "NEAR",
				pepe: "PEPE",
				"shiba-inu": "SHIB",
				sui: "SUI",
				"the-open-network": "TON",
				tron: "TRX",
				vechain: "VET",
				aptos: "APT",
			};

			for (const [id, price] of Object.entries(data)) {
				const code = idToCode[id];
				if (code && price.usd) {
					rates.set(code, price.usd);
				}
			}

			logger.info("CoinGecko: fetched crypto rates", { count: rates.size });
			await this.rateRepo.recordSuccess(API_ENDPOINTS.CRYPTO_RATES);
		} catch (error) {
			logger.error(
				"CoinGecko failed",
				{},
				error instanceof Error ? error : new Error(String(error))
			);
			await this.rateRepo.recordFailure(API_ENDPOINTS.CRYPTO_RATES);
		}

		return rates.size > 0 ? rates : null;
	}

	/**
	 * Fetch gold price in USD per troy ounce
	 * Tries multiple APIs with fallback
	 * Records attempt before calling
	 */
	private async fetchGoldPriceUsd(): Promise<number> {
		// Record attempt
		await this.rateRepo.recordAttempt(API_ENDPOINTS.GOLD_PRICE, false, false);

		// Try GoldAPI first if we have a token
		if (GOLD_API_TOKEN) {
			try {
				const price = await this.fetchGoldPriceFromGoldAPI();
				if (price > 0) {
					await this.rateRepo.recordSuccess(API_ENDPOINTS.GOLD_PRICE);
					return price;
				}
			} catch (error) {
				logger.warn("GoldAPI failed, trying fallback", {
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		// Try metals.live
		try {
			const price = await this.fetchGoldPriceFromMetalsLive();
			if (price > 0) {
				await this.rateRepo.recordSuccess(API_ENDPOINTS.GOLD_PRICE);
				return price;
			}
		} catch (error) {
			logger.warn("Metals.live failed", {
				error: error instanceof Error ? error.message : String(error),
			});
		}

		// Try Gold Price API (free endpoint)
		try {
			const price = await this.fetchGoldPriceFromGoldPrice();
			if (price > 0) {
				await this.rateRepo.recordSuccess(API_ENDPOINTS.GOLD_PRICE);
				return price;
			}
		} catch (error) {
			logger.warn("Gold Price API failed", {
				error: error instanceof Error ? error.message : String(error),
			});
		}

		// All failed
		await this.rateRepo.recordFailure(API_ENDPOINTS.GOLD_PRICE);
		return 0;
	}

	/**
	 * GoldAPI.io - Primary source for gold prices
	 */
	private async fetchGoldPriceFromGoldAPI(): Promise<number> {
		const response = await fetch("https://www.goldapi.io/api/XAU/USD", {
			headers: {
				"x-access-token": GOLD_API_TOKEN,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`GoldAPI error: ${response.status}`);
		}

		const data = (await response.json()) as {
			price?: number;
			price_gram_24k?: number;
		};

		if (data.price) {
			logger.info("GoldAPI: fetched gold price", { price: data.price });
			return data.price;
		}

		throw new Error("GoldAPI: No price in response");
	}

	/**
	 * Metals.live - Free fallback for gold prices
	 */
	private async fetchGoldPriceFromMetalsLive(): Promise<number> {
		const response = await fetch("https://api.metals.live/v1/spot/gold", {
			headers: {
				"User-Agent": "SadaqahBox/1.0",
			},
		});

		if (!response.ok) {
			throw new Error(`Metals.live error: ${response.status}`);
		}

		const data = (await response.json()) as Array<{ price?: number }>;

		if (Array.isArray(data) && data[0]?.price) {
			logger.info("Metals.live: fetched gold price", { price: data[0].price });
			return data[0].price;
		}

		throw new Error("Metals.live: No price in response");
	}

	/**
	 * Gold Price API (free endpoint)
	 */
	private async fetchGoldPriceFromGoldPrice(): Promise<number> {
		const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
			headers: {
				"User-Agent": "SadaqahBox/1.0",
			},
		});

		if (!response.ok) {
			throw new Error(`Gold Price API error: ${response.status}`);
		}

		const data = (await response.json()) as {
			items?: Array<{ xauPrice?: number }>;
		};

		if (data.items?.[0]?.xauPrice) {
			logger.info("Gold Price API: fetched gold price", { price: data.items[0].xauPrice });
			return data.items[0].xauPrice;
		}

		throw new Error("Gold Price API: No price in response");
	}

	/**
	 * Update currency USD values in database
	 */
	async updateCurrencyValues(): Promise<{ updated: number; errors: string[] }> {
		const currencyEntity = new CurrencyEntity(this.db);
		const allCurrencies = await currencyEntity.list();

		// Fetch all rates
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
	 * Get USD value for a currency (from database)
	 */
	async getUsdValue(currencyId: string): Promise<number | null> {
		const currencyEntity = new CurrencyEntity(this.db);
		const currency = await currencyEntity.get(currencyId);
		return currency?.usdValue ?? null;
	}

	/**
	 * Force refresh rates (ignores TTL)
	 */
	async forceRefresh(): Promise<{ updated: number; errors: string[] }> {
		// Clear lastRateUpdate for all currencies to force API fetch
		const currencyEntity = new CurrencyEntity(this.db);
		const allCurrencies = await currencyEntity.list();

		for (const currency of allCurrencies) {
			await this.db
				.update(currencies)
				.set({ lastRateUpdate: null })
				.where(eq(currencies.id, currency.id));
		}

		// Clear API rate call tracking to allow immediate API calls
		await this.db.delete(apiRateCalls);

		// Fetch new rates
		return this.updateCurrencyValues();
	}
}

// Need to import this for forceRefresh
import { apiRateCalls } from "../../db/schema";

/**
 * Scheduled task to update rates hourly
 * Call this from a cron job or scheduled task
 */
export async function scheduleRateUpdate(db: Database): Promise<void> {
	const service = GoldRateService.getInstance(db);

	// Check TTL first
	if (!(await service.needsUpdate())) {
		logger.info("Rate cache is valid, skipping update");
		return;
	}

	const result = await service.updateCurrencyValues();
	logger.info(`Updated ${result.updated} currencies with rates`, { errors: result.errors });
}
