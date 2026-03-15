import { db } from '$lib/db';
import { exchangeRates } from '$lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';

const BASE_CURRENCY = 'EUR';
const API_URL = 'https://api.frankfurter.dev/v1/latest';

export async function fetchAndStoreRates(baseCurrency: string = BASE_CURRENCY) {
    console.log(`Fetching rates for base: ${baseCurrency}`);
    const response = await fetch(`${API_URL}?baseCurrency=${baseCurrency}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.statusText}`);
    }
    
    const data = await response.json();
    const rates = data.rates; // { "USD": 1.09, "GBP": 0.85, ... }
    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    // Use a transaction for atomic updates
    await db.transaction(async (tx: any) => {
        for (const [target, rate] of Object.entries(rates)) {
            await tx.insert(exchangeRates)
                .values({
                    baseCurrency: baseCurrency,
                    targetCurrency: target,
                    rate: rate as number,
                    lastUpdated: timestamp
                })
                .onConflictDoUpdate({
                    target: [exchangeRates.baseCurrency, exchangeRates.targetCurrency],
                    set: {
                        rate: rate as number,
                        lastUpdated: timestamp
                    }
                });
        }
    });
    console.log('Rates updated successfully');
}

export async function isRateOutdated(targetCurrency: string, baseCurrency: string = BASE_CURRENCY): Promise<boolean> {
    const cutoffTime = Math.floor(Date.now() / 1000) - (24 * 60 * 60); // 24 hours ago in Unix timestamp
    
    const rate = await db.select()
        .from(exchangeRates)
        .where(
            and(
                eq(exchangeRates.baseCurrency, baseCurrency),
                eq(exchangeRates.targetCurrency, targetCurrency)
            )
        )
        .get();

    if (!rate) return true; // Rate doesn't exist
    return rate.lastUpdated < cutoffTime;
}

// Get all currencies with outdated rates (>24h old)
export async function getOutdatedCurrencies(): Promise<string[]> {
    const cutoffTime = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
    
    const results = await db
        .select({ targetCurrency: exchangeRates.targetCurrency })
        .from(exchangeRates)
        .where(lt(exchangeRates.lastUpdated, cutoffTime))
        .groupBy(exchangeRates.targetCurrency);
    
    return results.map((r: any) => r.targetCurrency);
}

// Fetch rates for multiple base currencies
export async function fetchAndStoreRatesForMultipleBases(
    baseCurrencies: string[] = ['EUR']
): Promise<void> {
    for (const base of baseCurrencies) {
        try {
            await fetchAndStoreRates(base);
        } catch (error) {
            console.error(`Failed to fetch rates for base ${base}:`, error);
            // Continue with other bases
        }
    }
}
