import { exchangeRates } from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';
import type { Expense, Participant } from '$lib/db/schema';

// Get exchange rate from base currency to target currency
export async function getExchangeRate(baseCurrency: string, targetCurrency: string, db?: any): Promise<number> {
  // If currencies are the same, return 1
  if (baseCurrency === targetCurrency) {
    return 1;
  }

  // Try to get rate from database (if db is provided)
  if (db) {
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
  }

  // If not found, try to calculate via EUR as intermediary
  // This assumes we have rates from EUR to all currencies
  if (db && baseCurrency !== 'EUR') {
    // Fetch rate from EUR to baseCurrency (e.g., EUR->USD)
    const eurToBase = await db.select()
      .from(exchangeRates)
      .where(eq(exchangeRates.targetCurrency, baseCurrency))
      .get();
    
    if (eurToBase) {
      // If converting TO EUR (e.g., USD->EUR)
      if (targetCurrency === 'EUR') {
        // USD->EUR = 1 / (EUR->USD)
        return 1 / eurToBase.rate;
      }
      
      // If converting between two non-EUR currencies (e.g., USD->RON)
      // We need EUR->RON rate
      const eurToTarget = await db.select()
        .from(exchangeRates)
        .where(eq(exchangeRates.targetCurrency, targetCurrency))
        .get();

      if (eurToTarget) {
        // USD->RON = (1 / EUR->USD) * EUR->RON
        return (1 / eurToBase.rate) * eurToTarget.rate;
      }
    }
  }

  // Default to 1 if conversion not possible
  return 1;
}

// Convert amount from one currency to another
export async function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string,
  db: any
): Promise<number> {
  const rate = await getExchangeRate(fromCurrency, toCurrency, db);
  return amount * rate;
}

// Normalize list of expenses to a target currency
export async function normalizeExpensesToCurrency(
  expenses: Array<{ amount: number; currency: string }>,
  targetCurrency: string,
  db: any
): Promise<Array<{ amount: number; currency: string }>> {
  const normalized: Array<{ amount: number; currency: string }> = [];
  
  for (const expense of expenses) {
    const convertedAmount = await convertCurrency(
      expense.amount, 
      expense.currency, 
      targetCurrency,
      db
    );
    normalized.push({
      amount: Math.round(convertedAmount), // Round to cents
      currency: targetCurrency,
    });
  }
  
  return normalized;
}

// Calculate settlements between participants
// Returns settlements (who pays whom) and final balances
export async function calculateSettlements(
  expenses: Expense[],
  participants: Participant[],
  settlementCurrency: string,
  db?: any
): Promise<{
  settlements: Array<{ from: string; to: string; amount: number }>;
  balances: Record<number, number>;
}> {
  const balances: Record<number, number> = {};
  
  // Initialize balances to 0
  participants.forEach(p => {
    balances[p.id] = 0;
  });

  // Calculate balances in settlement currency
  for (const expense of expenses) {
    const expenseCurrency = expense.currency || 'USD';
    const paidAmount = await convertCurrency(
      expense.amount,
      expenseCurrency,
      settlementCurrency,
      db
    );
    
    // Add to paidBy's balance (they paid, so they are owed money)
    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + Math.round(paidAmount);
    
    // Calculate shares
    if (expense.splitType === 'custom' && expense.customSplitData) {
      try {
        const customSplit = JSON.parse(expense.customSplitData) as Record<number, number>;
        for (const [participantIdStr, amountInCents] of Object.entries(customSplit)) {
          const participantId = parseInt(participantIdStr, 10);
          // amountInCents is in the expense's original currency, convert to settlement currency
          const shareAmount = await convertCurrency(
            amountInCents,
            expenseCurrency,
            settlementCurrency,
            db
          );
          balances[participantId] = (balances[participantId] || 0) - Math.round(shareAmount);
        }
      } catch (e) {
        console.error('Failed to parse custom split data', e);
        // Fallback to equal split if parsing fails
        const sharePerPerson = Math.round(paidAmount / participants.length);
        participants.forEach(p => {
          balances[p.id] = (balances[p.id] || 0) - sharePerPerson;
        });
      }
    } else {
      // Equal split
      const sharePerPerson = Math.round(paidAmount / participants.length);
      participants.forEach(p => {
        balances[p.id] = (balances[p.id] || 0) - sharePerPerson;
      });
    }
  }

  // Min-Max algorithm for settlement calculation
  const debtors: Array<{ id: number; amount: number }> = [];
  const creditors: Array<{ id: number; amount: number }> = [];
  
  Object.entries(balances).forEach(([idStr, balance]) => {
    const id = parseInt(idStr, 10);
    if (balance < 0) {
      debtors.push({ id, amount: -balance }); // Convert to positive for easier processing
    } else if (balance > 0) {
      creditors.push({ id, amount: balance });
    }
  });

  // Sort for deterministic results
  debtors.sort((a, b) => a.amount - b.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Array<{ from: string; to: string; amount: number }> = [];
  
  let i = 0;
  let j = 0;
  
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const amount = Math.min(debtor.amount, creditor.amount);
    
    if (amount > 0) {
      const fromParticipant = participants.find(p => p.id === debtor.id);
      const toParticipant = participants.find(p => p.id === creditor.id);
      const fromName = fromParticipant ? fromParticipant.name : 'Unknown';
      const toName = toParticipant ? toParticipant.name : 'Unknown';
      
      settlements.push({
        from: fromName,
        to: toName,
        amount: Math.round(amount)
      });
    }
    
    debtor.amount -= amount;
    creditor.amount -= amount;
    
    if (debtor.amount < 0.01) i++; // Use small epsilon for floating point comparison
    if (creditor.amount < 0.01) j++;
  }

  return { settlements, balances };
}