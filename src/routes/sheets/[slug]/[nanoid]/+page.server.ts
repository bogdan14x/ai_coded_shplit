import { calculateSettlements } from "$lib/currency";
import { expenses, participants, sheets } from "$lib/db/schema";
import { getAllOutdatedCurrencies } from "$lib/services/outdatedCurrencyService";
import { error } from "@sveltejs/kit";
import { and, eq, desc } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

// Helper function to validate and parse expense form data
	async function validateExpenseForm(formData: FormData, sheetId: number, db: any) {
		const paidByStr = formData.get('paidBy')?.toString();
		const description = formData.get('description')?.toString();
		const amountStr = formData.get('amount')?.toString();
		const currency = formData.get('currency')?.toString() || 'USD';
		const splitType = formData.get('splitType')?.toString() || 'equal';
		const customSplitData = formData.get('customSplitData')?.toString();

		if (!paidByStr) {
			return { error: 'Paid by is required' };
		}

		const paidBy = parseInt(paidByStr, 10);
		if (isNaN(paidBy)) {
			return { error: 'Invalid paid by ID' };
		}

		if (!description || description.trim().length < 1) {
			return { error: 'Description is required' };
		}

		if (!amountStr) {
			return { error: 'Amount is required' };
		}

		const amount = parseInt(amountStr, 10);
		if (isNaN(amount) || amount <= 0) {
			return { error: 'Invalid amount' };
		}

		return {
			paidBy,
			description: description.trim(),
			amount,
			currency,
			splitType,
			customSplitData: splitType === 'custom' ? customSplitData : null,
		};
	}

// Helper function to get sheet by params
async function getSheetByParams(db: any, slug: string, nanoid: string) {
	return await db
		.select()
		.from(sheets)
		.where(and(eq(sheets.slug, slug), eq(sheets.nanoid, nanoid)))
		.get();
}

// Helper function to get updated expenses for a sheet
async function getUpdatedExpenses(db: any, sheetId: number) {
	return await db
		.select()
		.from(expenses)
		.where(eq(expenses.sheetId, sheetId))
		.orderBy(desc(expenses.createdAt))
		.all();
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { slug, nanoid } = params;
	const db = locals.db;

	const sheet = await getSheetByParams(db, slug, nanoid);
	if (!sheet) {
		error(404, "Sheet not found");
	}

	// Fetch participants and expenses in parallel
	const [participantsList, expensesList] = await Promise.all([
		db
			.select()
			.from(participants)
			.where(eq(participants.sheetId, sheet.id))
			.all(),
		db
			.select()
			.from(expenses)
			.where(eq(expenses.sheetId, sheet.id))
			.orderBy(desc(expenses.createdAt))
			.all(),
	]);

	// Calculate settlements
	const { settlements, balances } = await calculateSettlements(
		expensesList,
		participantsList,
		sheet.settlementCurrency || "USD",
		db
	);

	// Check for outdated exchange rates across all currencies in database
	// This is a non-blocking check that can fail silently
	let outdatedCurrencies: string[] = [];
	try {
		outdatedCurrencies = await getAllOutdatedCurrencies(db);
	} catch (error) {
		console.error("Failed to check outdated currencies:", error);
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
	addExpense: async ({ request, params, locals }) => {
		const { slug, nanoid } = params;
		const formData = await request.formData();
		const db = locals.db;

		const sheet = await getSheetByParams(db, slug, nanoid);
		if (!sheet) {
			return { error: "Sheet not found" };
		}

		const validation = await validateExpenseForm(formData, sheet.id, db);
		if ("error" in validation) {
			return { error: validation.error };
		}

		await db
			.insert(expenses)
			.values({
				sheetId: sheet.id,
				paidBy: validation.paidBy,
				description: validation.description,
				amount: validation.amount,
				currency: validation.currency,
				splitType:
					validation.splitType === "custom" ? "custom" : "equal",
				customSplitData: validation.customSplitData,
			})
			.run();

		const updatedExpenses = await getUpdatedExpenses(db, sheet.id);

		return {
			success: true,
			expenses: updatedExpenses,
		};
	},

	editExpense: async ({ request, params, locals }) => {
		const { slug, nanoid } = params;
		const formData = await request.formData();
		const db = locals.db;

		const expenseIdStr = formData.get("expenseId")?.toString();
		if (!expenseIdStr) {
			return { error: "Expense ID is required" };
		}

		const expenseId = parseInt(expenseIdStr, 10);
		if (isNaN(expenseId)) {
			return { error: "Invalid expense ID" };
		}

		const sheet = await getSheetByParams(db, slug, nanoid);
		if (!sheet) {
			return { error: "Sheet not found" };
		}

		const expense = await db
			.select()
			.from(expenses)
			.where(
				and(eq(expenses.id, expenseId), eq(expenses.sheetId, sheet.id)),
			)
			.get();

		if (!expense) {
			return {
				error: "Expense not found or does not belong to this sheet",
			};
		}

		const validation = await validateExpenseForm(formData, sheet.id, db);
		if ("error" in validation) {
			return { error: validation.error };
		}

		await db
			.update(expenses)
			.set({
				paidBy: validation.paidBy,
				description: validation.description,
				amount: validation.amount,
				currency: validation.currency,
				splitType:
					validation.splitType === "custom" ? "custom" : "equal",
				customSplitData: validation.customSplitData,
			})
			.where(eq(expenses.id, expenseId))
			.run();

		const updatedExpenses = await getUpdatedExpenses(db, sheet.id);

		return {
			success: true,
			expenses: updatedExpenses,
		};
	},

	deleteExpense: async ({ request, params, locals }) => {
		const { slug, nanoid } = params;
		const formData = await request.formData();
		const db = locals.db;

		const expenseIdStr = formData.get("expenseId")?.toString();
		if (!expenseIdStr) {
			return { error: "Expense ID is required" };
		}

		const expenseId = parseInt(expenseIdStr, 10);
		if (isNaN(expenseId)) {
			return { error: "Invalid expense ID" };
		}

		const sheet = await getSheetByParams(db, slug, nanoid);
		if (!sheet) {
			return { error: "Sheet not found" };
		}

		const expense = await db
			.select()
			.from(expenses)
			.where(
				and(eq(expenses.id, expenseId), eq(expenses.sheetId, sheet.id)),
			)
			.get();

		if (!expense) {
			return {
				error: "Expense not found or does not belong to this sheet",
			};
		}

		await db.delete(expenses).where(eq(expenses.id, expenseId)).run();

		const updatedExpenses = await getUpdatedExpenses(db, sheet.id);

		return {
			success: true,
			expenses: updatedExpenses,
		};
	},

	updateSettlementCurrency: async ({ request, params, locals }) => {
		const { slug, nanoid } = params;
		const formData = await request.formData();
		const db = locals.db;

		const currency = formData.get("currency")?.toString();
		if (!currency) {
			return { error: "Currency is required" };
		}

		const sheet = await getSheetByParams(db, slug, nanoid);
		if (!sheet) {
			return { error: "Sheet not found" };
		}

		await db
			.update(sheets)
			.set({ settlementCurrency: currency })
			.where(eq(sheets.id, sheet.id))
			.run();

		// Recalculate settlements with the new currency
		const [participantsList, expensesList] = await Promise.all([
			db
				.select()
				.from(participants)
				.where(eq(participants.sheetId, sheet.id))
				.all(),
			db
				.select()
				.from(expenses)
				.where(eq(expenses.sheetId, sheet.id))
				.all(),
		]);

		const { settlements } = await calculateSettlements(
			expensesList,
			participantsList,
			currency,
			db
		);

		return { success: true, settlements, settlementCurrency: currency };
	},
};
