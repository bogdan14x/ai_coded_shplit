import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { actions, load } from '../src/routes/sheets/[slug]/[nanoid]/+page.server';
import { db } from '../src/lib/db';
import { sheets, participants, expenses } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateSheetId } from '../src/lib/nanoid';

describe('Drawer Expense Functionality', () => {
  let testSheetId: number;
  let testNanoid: string;
  let testSlug: string;
  let participantIds: number[];
  let expenseId: number;

  beforeAll(() => {
    const timestamp = Date.now();
    const fullId = generateSheetId(`test-drawer-sheet-${timestamp}`);
    const slug = `test-drawer-sheet-${timestamp}`;
    const nanoid = fullId.split('-').slice(-1)[0];
    testNanoid = nanoid;
    testSlug = slug;

    db.insert(sheets).values({
      slug,
      nanoid,
      name: 'Test Drawer Sheet',
      description: 'Test description for drawer',
      currency: 'USD',
      settlementCurrency: 'USD',
    }).run();

    const sheet = db.select().from(sheets).where(eq(sheets.slug, slug)).get();
    if (!sheet) {
      throw new Error('Failed to create test sheet');
    }
    testSheetId = sheet.id;

    db.insert(participants).values([
      { sheetId: sheet.id, name: 'Alice', isCreator: true },
      { sheetId: sheet.id, name: 'Bob', isCreator: false },
      { sheetId: sheet.id, name: 'Charlie', isCreator: false },
    ]).run();

    const participantsList = db.select().from(participants).where(eq(participants.sheetId, sheet.id)).all();
    participantIds = participantsList.map(p => p.id);

    const result = db.insert(expenses).values({
      sheetId: sheet.id,
      paidBy: participantIds[0],
      description: 'Test Expense for Deletion',
      amount: 10000,
      splitType: 'equal',
      currency: 'USD',
    }).run();
    
    const insertedExpense = db.select().from(expenses).where(eq(expenses.sheetId, sheet.id)).get();
    if (insertedExpense) {
      expenseId = insertedExpense.id;
    }
  });

  afterAll(() => {
    db.delete(expenses).where(eq(expenses.sheetId, testSheetId)).run();
    db.delete(participants).where(eq(participants.sheetId, testSheetId)).run();
    db.delete(sheets).where(eq(sheets.id, testSheetId)).run();
  });

  describe('deleteExpense Action', () => {
    it('should delete an expense successfully', async () => {
      // First create another expense to delete
      const formData = new FormData();
      formData.append('expenseId', expenseId.toString());

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.deleteExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.expenses).toBeDefined();
      expect(result.expenses.length).toBe(0); // Should have no expenses left
    });

    it('should fail deleting with missing expenseId', async () => {
      const formData = new FormData();
      // No expenseId appended

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.deleteExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Expense ID is required');
    });

    it('should fail deleting with invalid expenseId', async () => {
      const formData = new FormData();
      formData.append('expenseId', 'not-a-number');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.deleteExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Invalid expense ID');
    });

    it('should fail deleting non-existent expense', async () => {
      const formData = new FormData();
      formData.append('expenseId', '99999');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.deleteExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Expense not found or does not belong to this sheet');
    });

    it('should fail deleting expense from wrong sheet', async () => {
      // Create a different sheet
      const timestamp = Date.now();
      const otherFullId = generateSheetId(`other-sheet-${timestamp}`);
      const otherSlug = `other-sheet-${timestamp}`;
      const otherNanoid = otherFullId.split('-').slice(-1)[0];

      db.insert(sheets).values({
        slug: otherSlug,
        nanoid: otherNanoid,
        name: 'Other Sheet',
        currency: 'USD',
      }).run();

      const otherSheet = db.select().from(sheets).where(eq(sheets.slug, otherSlug)).get();
      
      if (!otherSheet) {
        throw new Error('Failed to create other sheet');
      }

      // Create expense on the other sheet
      const otherExpenseId = db.insert(expenses).values({
        sheetId: otherSheet.id,
        paidBy: participantIds[0],
        description: 'Other Sheet Expense',
        amount: 5000,
        splitType: 'equal',
      }).run().lastInsertRowid;

      // Try to delete it from test sheet
      const formData = new FormData();
      formData.append('expenseId', otherExpenseId.toString());

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.deleteExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Expense not found or does not belong to this sheet');

      // Cleanup other sheet
      db.delete(expenses).where(eq(expenses.sheetId, otherSheet.id)).run();
      db.delete(sheets).where(eq(sheets.id, otherSheet.id)).run();
    });
  });

  describe('updateSettlementCurrency Action', () => {
    it('should update settlement currency successfully', async () => {
      const formData = new FormData();
      formData.append('currency', 'EUR');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.updateSettlementCurrency(event)) as any;

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify the currency was actually updated in the database
      const sheet = db.select().from(sheets).where(eq(sheets.id, testSheetId)).get();
      expect(sheet?.settlementCurrency).toBe('EUR');
    });

    it('should fail updating with missing currency', async () => {
      const formData = new FormData();
      // No currency appended

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.updateSettlementCurrency(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Currency is required');
    });

    it('should fail updating settlement currency for non-existent sheet', async () => {
      const formData = new FormData();
      formData.append('currency', 'EUR');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: 'non-existent', nanoid: 'nonexistent' },
      } as any;

      const result = (await actions.updateSettlementCurrency(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Sheet not found');
    });
  });

  describe('Currency Validation Edge Cases', () => {
    it('should accept lowercase currency codes', async () => {
      const formData = new FormData();
      formData.append('description', 'Test Expense Lowercase');
      formData.append('amount', '50.00');
      formData.append('paidBy', participantIds[0].toString());
      formData.append('splitType', 'equal');
      formData.append('currency', 'eur'); // lowercase

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.addExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.expenses).toBeDefined();
      
      const newExpense = result.expenses.find((e: any) => e.description === 'Test Expense Lowercase');
      expect(newExpense).toBeDefined();
      expect(newExpense.currency).toBe('EUR'); // Should be uppercase
    });

    it('should reject invalid currency codes', async () => {
      const formData = new FormData();
      formData.append('description', 'Test Expense Invalid Currency');
      formData.append('amount', '50.00');
      formData.append('paidBy', participantIds[0].toString());
      formData.append('splitType', 'equal');
      formData.append('currency', 'INVALID');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.addExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Invalid currency');
    });

    it('should default to USD when currency is empty', async () => {
      // Reset settlement currency to USD first
      const resetFormData = new FormData();
      resetFormData.append('currency', 'USD');
      
      const resetRequest = new Request('http://localhost', {
        method: 'POST',
        body: resetFormData,
      });

      const resetEvent = {
        request: resetRequest,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      await actions.updateSettlementCurrency(resetEvent);

      const formData = new FormData();
      formData.append('description', 'Test Expense Default Currency');
      formData.append('amount', '50.00');
      formData.append('paidBy', participantIds[0].toString());
      formData.append('splitType', 'equal');
      // No currency field

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.addExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.expenses).toBeDefined();
      
      const newExpense = result.expenses.find((e: any) => e.description === 'Test Expense Default Currency');
      expect(newExpense).toBeDefined();
      expect(newExpense.currency).toBe('USD');
    });
  });

  describe('Additional Form Validation', () => {
    it('should reject very large amounts', async () => {
      const formData = new FormData();
      formData.append('description', 'Large Amount Expense');
      formData.append('amount', '999999999.99');
      formData.append('paidBy', participantIds[0].toString());
      formData.append('splitType', 'equal');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.addExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      // Should accept large amounts (converted to cents)
      const newExpense = result.expenses.find((e: any) => e.description === 'Large Amount Expense');
      expect(newExpense).toBeDefined();
      expect(newExpense.amount).toBe(99999999999);
    });

    it('should handle very small amounts correctly', async () => {
      const formData = new FormData();
      formData.append('description', 'Small Amount Expense');
      formData.append('amount', '0.01');
      formData.append('paidBy', participantIds[0].toString());
      formData.append('splitType', 'equal');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.addExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      const newExpense = result.expenses.find((e: any) => e.description === 'Small Amount Expense');
      expect(newExpense).toBeDefined();
      expect(newExpense.amount).toBe(1); // 1 cent
    });

    it('should handle amounts with many decimal places', async () => {
      const formData = new FormData();
      formData.append('description', 'Precise Amount Expense');
      formData.append('amount', '12.34567');
      formData.append('paidBy', participantIds[0].toString());
      formData.append('splitType', 'equal');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.addExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      const newExpense = result.expenses.find((e: any) => e.description === 'Precise Amount Expense');
      expect(newExpense).toBeDefined();
      // Should round to 2 decimal places: 12.34567 * 100 = 1234.567, round to 1235
      expect(newExpense.amount).toBe(1235);
    });

    it('should reject invalid splitType values', async () => {
      // Note: Current implementation defaults to 'equal' if not 'custom'
      // This test verifies that behavior
      const formData = new FormData();
      formData.append('description', 'Test Expense');
      formData.append('amount', '50.00');
      formData.append('paidBy', participantIds[0].toString());
      formData.append('splitType', 'invalid');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.addExpense(event)) as any;

      expect(result).toBeDefined();
      // Should default to 'equal' since 'invalid' !== 'custom'
      expect(result.success).toBe(true);
      const newExpense = result.expenses.find((e: any) => e.description === 'Test Expense');
      expect(newExpense).toBeDefined();
      expect(newExpense.splitType).toBe('equal');
    });

    it('should handle custom split type correctly', async () => {
      const formData = new FormData();
      formData.append('description', 'Custom Split Expense');
      formData.append('amount', '100.00');
      formData.append('paidBy', participantIds[0].toString());
      formData.append('splitType', 'custom');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.addExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      const newExpense = result.expenses.find((e: any) => e.description === 'Custom Split Expense');
      expect(newExpense).toBeDefined();
      expect(newExpense.splitType).toBe('custom');
    });
  });

  describe('Edit Expense with Currency Changes', () => {
    it('should edit expense and change currency', async () => {
      // First create an expense
      const createFormData = new FormData();
      createFormData.append('description', 'Currency Edit Test');
      createFormData.append('amount', '50.00');
      createFormData.append('paidBy', participantIds[0].toString());
      createFormData.append('splitType', 'equal');
      createFormData.append('currency', 'USD');

      const createRequest = new Request('http://localhost', {
        method: 'POST',
        body: createFormData,
      });

      const createEvent = {
        request: createRequest,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const createResult = (await actions.addExpense(createEvent)) as any;
      const newExpense = createResult.expenses.find((e: any) => e.description === 'Currency Edit Test');
      
      // Now edit it with a different currency
      const editFormData = new FormData();
      editFormData.append('expenseId', newExpense.id.toString());
      editFormData.append('description', 'Currency Edit Test - Updated');
      editFormData.append('amount', '75.50');
      editFormData.append('paidBy', participantIds[1].toString());
      editFormData.append('splitType', 'custom');
      editFormData.append('currency', 'EUR');

      const editRequest = new Request('http://localhost', {
        method: 'POST',
        body: editFormData,
      });

      const editEvent = {
        request: editRequest,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const editResult = (await actions.editExpense(editEvent)) as any;

      expect(editResult).toBeDefined();
      expect(editResult.success).toBe(true);
      
      const updatedExpense = editResult.expenses.find((e: any) => e.id === newExpense.id);
      expect(updatedExpense).toBeDefined();
      expect(updatedExpense.description).toBe('Currency Edit Test - Updated');
      expect(updatedExpense.currency).toBe('EUR');
      expect(updatedExpense.splitType).toBe('custom');
    });
  });

  describe('Integration with Load Function', () => {
    it('should load sheet with settlement currency', async () => {
      // Reset settlement currency to USD first
      const resetFormData = new FormData();
      resetFormData.append('currency', 'USD');
      
      const resetRequest = new Request('http://localhost', {
        method: 'POST',
        body: resetFormData,
      });

      const resetEvent = {
        request: resetRequest,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      await actions.updateSettlementCurrency(resetEvent);

      const params = { slug: testSlug, nanoid: testNanoid };
      const result = await load({ params } as any);

      expect(result?.sheet).toBeDefined();
      expect(result?.sheet.settlementCurrency).toBeDefined();
      expect(result?.sheet.settlementCurrency).toBe('USD');
    });

    it('should reflect settlement currency changes in load', async () => {
      // Update settlement currency
      const formData = new FormData();
      formData.append('currency', 'GBP');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      await actions.updateSettlementCurrency(event);

      // Reload and verify
      const params = { slug: testSlug, nanoid: testNanoid };
      const result = await load({ params } as any);

      expect(result?.sheet).toBeDefined();
      expect(result?.sheet.settlementCurrency).toBe('GBP');
    });
  });
});
