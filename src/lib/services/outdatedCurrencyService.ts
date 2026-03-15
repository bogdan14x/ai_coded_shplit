import {
  fetchAndStoreRates,
  fetchAndStoreRatesForMultipleBases,
  isRateOutdated,
  getOutdatedCurrencies,
} from './exchangeRateService';
import { exchangeRates } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get all currencies in the database that have outdated rates (>24h old)
 */
export async function getAllOutdatedCurrencies(db: any): Promise<string[]> {
  try {
    return await getOutdatedCurrencies(db);
  } catch (error) {
    console.error('Failed to get outdated currencies:', error);
    return [];
  }
}

/**
 * Check if a specific currency has an outdated rate
 */
export async function isCurrencyOutdated(db: any, currency: string, baseCurrency: string = 'EUR'): Promise<boolean> {
  try {
    return await isRateOutdated(db, currency, baseCurrency);
  } catch (error) {
    console.error(`Failed to check if currency ${currency} is outdated:`, error);
    return false; // Assume not outdated if check fails
  }
}

/**
 * Update rates for a specific currency by fetching from API
 * Returns true if successful, false otherwise
 */
export async function updateCurrencyRates(
  db: any,
  currency: string,
  baseCurrency: string = 'EUR'
): Promise<boolean> {
  try {
    await fetchAndStoreRates(db, baseCurrency);
    return true;
  } catch (error) {
    console.error(`Failed to update rates for ${currency} (base: ${baseCurrency}):`, error);
    return false;
  }
}

/**
 * Background update all outdated currencies
 * This is designed to run without blocking the page load
 */
export async function updateOutdatedRatesInBackground(db: any): Promise<void> {
  try {
    const outdated = await getAllOutdatedCurrencies(db);
    
    // Check if database is empty (no rates at all)
    let isDbEmpty = false;
    if (outdated.length === 0) {
      try {
        const existingRate = await db.select()
          .from(exchangeRates)
          .where(eq(exchangeRates.targetCurrency, 'USD'))
          .get();
        isDbEmpty = !existingRate;
      } catch (e) {
        // If we can't check, assume not empty to avoid unnecessary fetches
        isDbEmpty = false;
      }
    }

    if (outdated.length === 0 && !isDbEmpty) {
      console.log('No outdated currencies to update');
      return;
    }
    
    const message = isDbEmpty ? 'Database empty, fetching initial rates...' : `Updating ${outdated.length} outdated currencies...`;
    console.log(message);
    
    // Update all common base currencies to ensure comprehensive coverage
    await fetchAndStoreRatesForMultipleBases(db, ['EUR', 'USD', 'GBP']);
    
    console.log('Background rate update completed');
  } catch (error) {
    console.error('Background rate update failed:', error);
    // Silently fail - will use stale rates
  }
}

/**
 * Update specific currency in the background
 * Returns a promise that resolves when update completes (or fails)
 */
export async function updateCurrencyInBackground(
  db: any,
  currency: string,
  baseCurrency: string = 'EUR'
): Promise<boolean> {
  try {
    await fetchAndStoreRates(db, baseCurrency);
    return true;
  } catch (error) {
    console.error(`Background update failed for ${currency}:`, error);
    return false;
  }
}
