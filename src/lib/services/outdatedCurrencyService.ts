import {
  fetchAndStoreRates,
  fetchAndStoreRatesForMultipleBases,
  isRateOutdated,
  getOutdatedCurrencies,
} from './exchangeRateService';

/**
 * Get all currencies in the database that have outdated rates (>24h old)
 */
export async function getAllOutdatedCurrencies(): Promise<string[]> {
  try {
    return await getOutdatedCurrencies();
  } catch (error) {
    console.error('Failed to get outdated currencies:', error);
    return [];
  }
}

/**
 * Check if a specific currency has an outdated rate
 */
export async function isCurrencyOutdated(currency: string, baseCurrency: string = 'EUR'): Promise<boolean> {
  try {
    return await isRateOutdated(currency, baseCurrency);
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
  currency: string,
  baseCurrency: string = 'EUR'
): Promise<boolean> {
  try {
    await fetchAndStoreRates(baseCurrency);
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
export async function updateOutdatedRatesInBackground(): Promise<void> {
  try {
    const outdated = await getAllOutdatedCurrencies();
    if (outdated.length === 0) {
      console.log('No outdated currencies to update');
      return;
    }
    
    console.log(`Updating ${outdated.length} outdated currencies...`);
    
    // Update all common base currencies to ensure comprehensive coverage
    await fetchAndStoreRatesForMultipleBases(['EUR', 'USD', 'GBP']);
    
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
  currency: string,
  baseCurrency: string = 'EUR'
): Promise<boolean> {
  try {
    await fetchAndStoreRates(baseCurrency);
    return true;
  } catch (error) {
    console.error(`Background update failed for ${currency}:`, error);
    return false;
  }
}
