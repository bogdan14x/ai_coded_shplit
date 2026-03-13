import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { actions } from '../src/routes/sheets/[slug]/[nanoid]/+page.server';
import { db } from '../src/lib/db';
import { sheets, participants, expenses } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateSheetId } from '../src/lib/nanoid';

describe('Sheet Page Actions', () => {
  let testSheetId: number;
  let testNanoid: string;
  let testSlug: string;
  let participantIds: number[];
  let expenseId: number;

  beforeAll(() => {
    const timestamp = Date.now();
    const fullId = generateSheetId(`test-actions-sheet-${timestamp}`);
    const slug = `test-actions-sheet-${timestamp}`;
    const nanoid = fullId.split('-').slice(-1)[0];
    testNanoid = nanoid;
    testSlug = slug;

    db.insert(sheets).values({
      slug,
      nanoid,
      name: 'Test Actions Sheet',
      description: 'Test description for actions',
      currency: 'USD',
    }).run();

    const sheet = db.select().from(sheets).where(eq(sheets.slug, slug)).get();
    if (!sheet) {
      throw new Error('Failed to create test sheet');
    }
    testSheetId = sheet.id;

    db.insert(participants).values([
      { sheetId: sheet.id, name: 'Alice', isCreator: true },
      { sheetId: sheet.id, name: 'Bob', isCreator: false },
    ]).run();

    const participantsList = db.select().from(participants).where(eq(participants.sheetId, sheet.id)).all();
    participantIds = participantsList.map(p => p.id);

    const result = db.insert(expenses).values({
      sheetId: sheet.id,
      paidBy: participantIds[0],
      description: 'Original Expense Description',
      amount: 10000,
      splitType: 'equal',
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

  describe('addExpense', () => {
    it('should add a new expense successfully', async () => {
      const formData = new FormData();
      formData.append('description', 'New Test Expense');
      formData.append('amount', '50.00');
      formData.append('paidBy', participantIds[1].toString());
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
      expect(result.expenses).toBeDefined();
      expect(result.expenses.some((e: any) => e.description === 'New Test Expense')).toBe(true);
    });

    it('should fail with missing fields', async () => {
      const formData = new FormData();
      formData.append('description', 'Incomplete Expense');

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
      expect(result.error).toBe('All fields are required');
    });

    it('should fail with zero amount', async () => {
      const formData = new FormData();
      formData.append('description', 'Zero Amount Expense');
      formData.append('amount', '0');
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
      expect(result.error).toBe('Invalid amount');
    });

    it('should fail with negative amount', async () => {
      const formData = new FormData();
      formData.append('description', 'Negative Amount Expense');
      formData.append('amount', '-10');
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
      expect(result.error).toBe('Invalid amount');
    });

    it('should fail with non-numeric amount', async () => {
      const formData = new FormData();
      formData.append('description', 'Invalid Amount Expense');
      formData.append('amount', 'abc');
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
      expect(result.error).toBe('Invalid amount');
    });
  });

  describe('editExpense', () => {
    it('should edit an existing expense successfully', async () => {
      const formData = new FormData();
      formData.append('expenseId', expenseId.toString());
      formData.append('description', 'Updated Expense Description');
      formData.append('amount', '75.50');
      formData.append('paidBy', participantIds[1].toString());
      formData.append('splitType', 'custom');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.editExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.expenses).toBeDefined();
      
      const updatedExpense = result.expenses.find((e: any) => e.id === expenseId);
      expect(updatedExpense).toBeDefined();
      expect(updatedExpense.description).toBe('Updated Expense Description');
      expect(updatedExpense.amount).toBe(7550);
      expect(updatedExpense.paidBy).toBe(participantIds[1]);
      expect(updatedExpense.splitType).toBe('custom');
    });

    it('should fail editing non-existent expense', async () => {
      const formData = new FormData();
      formData.append('expenseId', '99999');
      formData.append('description', 'Updated Description');
      formData.append('amount', '100.00');
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

      const result = (await actions.editExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Expense not found or does not belong to this sheet');
    });

    it('should fail editing with invalid participant', async () => {
      const formData = new FormData();
      formData.append('expenseId', expenseId.toString());
      formData.append('description', 'Updated Description');
      formData.append('amount', '100.00');
      formData.append('paidBy', '99999');
      formData.append('splitType', 'equal');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const event = {
        request,
        params: { slug: testSlug, nanoid: testNanoid },
      } as any;

      const result = (await actions.editExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Invalid participant for this sheet');
    });

    it('should fail with missing expenseId', async () => {
      const formData = new FormData();
      formData.append('description', 'Updated Description');
      formData.append('amount', '100.00');
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

      const result = (await actions.editExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Expense ID is required');
    });

    it('should fail editing with zero amount', async () => {
      const formData = new FormData();
      formData.append('expenseId', expenseId.toString());
      formData.append('description', 'Zero Amount Expense');
      formData.append('amount', '0');
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

      const result = (await actions.editExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Invalid amount');
    });

    it('should fail editing with negative amount', async () => {
      const formData = new FormData();
      formData.append('expenseId', expenseId.toString());
      formData.append('description', 'Negative Amount Expense');
      formData.append('amount', '-10');
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

      const result = (await actions.editExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Invalid amount');
    });

    it('should fail editing with non-numeric amount', async () => {
      const formData = new FormData();
      formData.append('expenseId', expenseId.toString());
      formData.append('description', 'Invalid Amount Expense');
      formData.append('amount', 'abc');
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

      const result = (await actions.editExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Invalid amount');
    });

    it('should fail editing with non-numeric expenseId', async () => {
      const formData = new FormData();
      formData.append('expenseId', 'not-a-number');
      formData.append('description', 'Updated Description');
      formData.append('amount', '100.00');
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

      const result = (await actions.editExpense(event)) as any;

      expect(result).toBeDefined();
      expect(result.error).toBe('Invalid expense ID');
    });
  });
});
