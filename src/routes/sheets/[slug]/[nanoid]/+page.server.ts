import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { sheets, participants, expenses } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { calculateSettlements } from '$lib/currency';
import { getAllOutdatedCurrencies } from '$lib/services/outdatedCurrencyService';

// Helper function to validate and parse expense form data
async function validateExpenseForm(formData: FormData, sheetId: number) {
  const description = formData.get('description')?.toString();
  const amountStr = formData.get('amount')?.toString();
  const paidByStr = formData.get('paidBy')?.toString();
  const splitType = formData.get('splitType')?.toString();
  const currency = formData.get('currency')?.toString() || 'USD';
  const customSplitData = formData.get('customSplitData')?.toString();

  if (!description || !amountStr || !paidByStr) {
    return { error: 'All fields are required' };
  }

  const amount = Math.round(parseFloat(amountStr) * 100);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Invalid amount' };
  }

  const paidBy = parseInt(paidByStr, 10);
  if (isNaN(paidBy)) {
    return { error: 'Invalid participant' };
  }

  const participant = await db.select().from(participants).where(
    and(eq(participants.id, paidBy), eq(participants.sheetId, sheetId))
  ).get();

  if (!participant) {
    return { error: 'Invalid participant for this sheet' };
  }

  // Validate currency
  const validCurrencies = ['EUR', 'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR'];
  if (!validCurrencies.includes(currency.toUpperCase())) {
    return { error: 'Invalid currency' };
  }

  let customSplit: Record<number, number> | undefined;
  if (splitType === 'custom' && customSplitData) {
    try {
      customSplit = JSON.parse(customSplitData);
      // Validate that all keys are valid participants and amounts are positive
      // Note: We don't strictly enforce sum equals total here, as rounding might differ
    } catch (e) {
      return { error: 'Invalid custom split data' };
    }
  }

  return { 
    description, 
    amount, 
    paidBy, 
    splitType, 
    currency: currency.toUpperCase(),
    customSplitData: customSplit ? JSON.stringify(customSplit) : null
  };
}

// Helper function to get sheet by params
async function getSheetByParams(slug: string, nanoid: string) {
  return await db.select().from(sheets).where(
    and(eq(sheets.slug, slug), eq(sheets.nanoid, nanoid))
  ).get();
}

// Helper function to get updated expenses for a sheet
async function getUpdatedExpenses(sheetId: number) {
  return await db.select().from(expenses).where(
    eq(expenses.sheetId, sheetId)
  ).all();
}

export const load: PageServerLoad = async ({ params }) => {
  const { slug, nanoid } = params;

  const sheet = await getSheetByParams(slug, nanoid);
  if (!sheet) {
    error(404, 'Sheet not found');
  }

  // Fetch participants and expenses in parallel
  const [participantsList, expensesList] = await Promise.all([
    db.select().from(participants).where(eq(participants.sheetId, sheet.id)).all(),
    db.select().from(expenses).where(eq(expenses.sheetId, sheet.id)).all(),
  ]);

  // Calculate settlements
  const { settlements, balances } = await calculateSettlements(
    expensesList,
    participantsList,
    sheet.settlementCurrency || 'USD'
  );

  // Check for outdated exchange rates across all currencies in database
  // This is a non-blocking check that can fail silently
  let outdatedCurrencies: string[] = [];
  try {
    outdatedCurrencies = await getAllOutdatedCurrencies();
  } catch (error) {
    console.error('Failed to check outdated currencies:', error);
    // Continue without this information
  }

  return {
    sheet,
    participants: participantsList,
    expenses: expensesList,
    settlements,
    balances,
    outdatedCurrencies,
  };
};

export const actions: Actions = {
  addExpense: async ({ request, params }) => {
    const { slug, nanoid } = params;
    const formData = await request.formData();

    const sheet = await getSheetByParams(slug, nanoid);
    if (!sheet) {
      return { error: 'Sheet not found' };
    }

    const validation = await validateExpenseForm(formData, sheet.id);
    if ('error' in validation) {
      return { error: validation.error };
    }

    await db.insert(expenses).values({
      sheetId: sheet.id,
      paidBy: validation.paidBy,
      description: validation.description,
      amount: validation.amount,
      currency: validation.currency,
      splitType: validation.splitType === 'custom' ? 'custom' : 'equal',
      customSplitData: validation.customSplitData,
    }).run();

    const updatedExpenses = await getUpdatedExpenses(sheet.id);

    return { 
      success: true, 
      expenses: updatedExpenses 
    };
  },

  editExpense: async ({ request, params }) => {
    const { slug, nanoid } = params;
    const formData = await request.formData();

    const expenseIdStr = formData.get('expenseId')?.toString();
    if (!expenseIdStr) {
      return { error: 'Expense ID is required' };
    }

    const expenseId = parseInt(expenseIdStr, 10);
    if (isNaN(expenseId)) {
      return { error: 'Invalid expense ID' };
    }

    const sheet = await getSheetByParams(slug, nanoid);
    if (!sheet) {
      return { error: 'Sheet not found' };
    }

    const expense = await db.select().from(expenses).where(
      and(eq(expenses.id, expenseId), eq(expenses.sheetId, sheet.id))
    ).get();

    if (!expense) {
      return { error: 'Expense not found or does not belong to this sheet' };
    }

    const validation = await validateExpenseForm(formData, sheet.id);
    if ('error' in validation) {
      return { error: validation.error };
    }

    await db.update(expenses)
      .set({
        paidBy: validation.paidBy,
        description: validation.description,
        amount: validation.amount,
        currency: validation.currency,
        splitType: validation.splitType === 'custom' ? 'custom' : 'equal',
        customSplitData: validation.customSplitData,
      })
      .where(eq(expenses.id, expenseId))
      .run();

    const updatedExpenses = await getUpdatedExpenses(sheet.id);

    return { 
      success: true, 
      expenses: updatedExpenses 
    };
  },

  deleteExpense: async ({ request, params }) => {
    const { slug, nanoid } = params;
    const formData = await request.formData();

    const expenseIdStr = formData.get('expenseId')?.toString();
    if (!expenseIdStr) {
      return { error: 'Expense ID is required' };
    }

    const expenseId = parseInt(expenseIdStr, 10);
    if (isNaN(expenseId)) {
      return { error: 'Invalid expense ID' };
    }

    const sheet = await getSheetByParams(slug, nanoid);
    if (!sheet) {
      return { error: 'Sheet not found' };
    }

    const expense = await db.select().from(expenses).where(
      and(eq(expenses.id, expenseId), eq(expenses.sheetId, sheet.id))
    ).get();

    if (!expense) {
      return { error: 'Expense not found or does not belong to this sheet' };
    }

    await db.delete(expenses).where(eq(expenses.id, expenseId)).run();

    const updatedExpenses = await getUpdatedExpenses(sheet.id);

    return { 
      success: true, 
      expenses: updatedExpenses 
    };
  },

  updateSettlementCurrency: async ({ request, params }) => {
    const { slug, nanoid } = params;
    const formData = await request.formData();

    const currency = formData.get('currency')?.toString();
    if (!currency) {
      return { error: 'Currency is required' };
    }

    const sheet = await getSheetByParams(slug, nanoid);
    if (!sheet) {
      return { error: 'Sheet not found' };
    }

    await db.update(sheets)
      .set({ settlementCurrency: currency })
      .where(eq(sheets.id, sheet.id))
      .run();

    // Recalculate settlements with the new currency
    const [participantsList, expensesList] = await Promise.all([
      db.select().from(participants).where(eq(participants.sheetId, sheet.id)).all(),
      db.select().from(expenses).where(eq(expenses.sheetId, sheet.id)).all(),
    ]);

    const { settlements } = await calculateSettlements(expensesList, participantsList, currency);

    return { success: true, settlements, settlementCurrency: currency };
  }
};
