import { db } from '$lib/db';
import { exchangeRates } from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';

// Get exchange rate from base currency to target currency
export async function getExchangeRate(baseCurrency: string, targetCurrency: string): Promise<number> {
  // If currencies are the same, return 1
  if (baseCurrency === targetCurrency) {
    return 1;
  }

  // Try to get rate from database
  const rate = await db.select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.baseCurrency, baseCurrency),
        eq(exchangeRates.targetCurrency, targetCurrency)
      )
    )
    .get();

  if (rate) {
    return rate.rate;
  }

  // If not found, try to calculate via EUR as intermediary
  // This assumes we have rates from EUR to all currencies
  if (baseCurrency !== 'EUR') {
    const baseToEur = await db.select()
      .from(exchangeRates)
      .where(eq(exchangeRates.targetCurrency, baseCurrency))
      .get();
    
    const eurToTarget = await db.select()
      .from(exchangeRates)
      .where(eq(exchangeRates.targetCurrency, targetCurrency))
      .get();

    if (baseToEur && eurToTarget) {
      // Rate from base to target = (1 / baseToEur.rate) * eurToTarget.rate
      return (1 / baseToEur.rate) * eurToTarget.rate;
    }
  }

  // Default to 1 if conversion not possible
  return 1;
}

// Convert amount from one currency to another
export async function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): Promise<number> {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

// Normalize list of expenses to a target currency
export async function normalizeExpensesToCurrency(
  expenses: Array<{ amount: number; currency: string }>,
  targetCurrency: string
): Promise<Array<{ amount: number; currency: string }>> {
  const normalized: Array<{ amount: number; currency: string }> = [];
  
  for (const expense of expenses) {
    const convertedAmount = await convertCurrency(
      expense.amount, 
      expense.currency, 
      targetCurrency
    );
    normalized.push({
      amount: Math.round(convertedAmount), // Round to cents
      currency: targetCurrency,
    });
  }
  
  return normalized;
}