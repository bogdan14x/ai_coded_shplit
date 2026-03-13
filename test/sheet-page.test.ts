import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { load } from '../src/routes/sheets/[slug]/[nanoid]/+page.server';
import { db } from '../src/lib/db';
import { sheets, participants, expenses } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateSheetId } from '../src/lib/nanoid';

describe('Sheet Page Data Loading', () => {
  let testSheetId: number;
  let testNanoid: string;
  let testSlug: string;

  beforeAll(() => {
    const timestamp = Date.now();
    const fullId = generateSheetId(`test-sheet-${timestamp}`);
    const slug = `test-sheet-${timestamp}`;
    const nanoid = fullId.split('-').slice(-1)[0];
    testNanoid = nanoid;
    testSlug = slug;

    db.insert(sheets).values({
      slug,
      nanoid,
      name: 'Test Sheet',
      description: 'Test description',
      currency: 'USD',
    }).run();

    const sheet = db.select().from(sheets).where(eq(sheets.slug, slug)).get();
    if (!sheet) {
      throw new Error('Failed to create test sheet');
    }
    testSheetId = sheet.id;

    db.insert(participants).values([
      { sheetId: sheet.id, name: 'Test User 1', isCreator: true },
      { sheetId: sheet.id, name: 'Test User 2', isCreator: false },
    ]).run();

    const participantsList = db.select().from(participants).where(eq(participants.sheetId, sheet.id)).all();

    db.insert(expenses).values([
      {
        sheetId: sheet.id,
        paidBy: participantsList[0].id,
        description: 'Test Expense 1',
        amount: 10000,
        splitType: 'equal',
      },
      {
        sheetId: sheet.id,
        paidBy: participantsList[1].id,
        description: 'Test Expense 2',
        amount: 20000,
        splitType: 'equal',
      },
    ]).run();
  });

  afterAll(() => {
    db.delete(expenses).where(eq(expenses.sheetId, testSheetId)).run();
    db.delete(participants).where(eq(participants.sheetId, testSheetId)).run();
    db.delete(sheets).where(eq(sheets.id, testSheetId)).run();
  });

  it('should load sheet data by slug and nanoid', async () => {
    const params = { slug: testSlug, nanoid: testNanoid };
    const result = await load({ params } as any);

    expect(result?.sheet).toBeDefined();
    expect(result?.sheet.name).toBe('Test Sheet');
    expect(result?.sheet.slug).toBe(testSlug);
    expect(result?.sheet.nanoid).toBe(testNanoid);
  });

  it('should load participants for the sheet', async () => {
    const params = { slug: testSlug, nanoid: testNanoid };
    const result = await load({ params } as any);

    expect(result?.participants).toBeDefined();
    expect(result?.participants.length).toBeGreaterThanOrEqual(2);
    expect(result?.participants.some((p: any) => p.name === 'Test User 1')).toBe(true);
    expect(result?.participants.some((p: any) => p.name === 'Test User 2')).toBe(true);
  });

  it('should load expenses for the sheet', async () => {
    const params = { slug: testSlug, nanoid: testNanoid };
    const result = await load({ params } as any);

    expect(result?.expenses).toBeDefined();
    expect(result?.expenses.length).toBeGreaterThanOrEqual(2);
    expect(result?.expenses.some((e: any) => e.description === 'Test Expense 1')).toBe(true);
    expect(result?.expenses.some((e: any) => e.description === 'Test Expense 2')).toBe(true);
  });

  it('should return 404 for non-existent sheet', async () => {
    const params = { slug: 'non-existent', nanoid: 'nonexistent' };
    
    try {
      await load({ params } as any);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect(error).toBeDefined();
      if (error && typeof error === 'object' && 'status' in error) {
        expect((error as { status: number }).status).toBe(404);
      }
    }
  });
});

describe('Sheet Page Data Loading - Empty Sheet', () => {
  let testSheetId: number;
  let testNanoid: string;
  let testSlug: string;

  beforeAll(() => {
    const timestamp = Date.now();
    const fullId = generateSheetId(`test-empty-sheet-${timestamp}`);
    const slug = `test-empty-sheet-${timestamp}`;
    const nanoid = fullId.split('-').slice(-1)[0];
    testNanoid = nanoid;
    testSlug = slug;

    db.insert(sheets).values({
      slug,
      nanoid,
      name: 'Empty Test Sheet',
      description: 'Test description',
      currency: 'USD',
    }).run();

    const sheet = db.select().from(sheets).where(eq(sheets.slug, slug)).get();
    if (!sheet) {
      throw new Error('Failed to create test sheet');
    }
    testSheetId = sheet.id;
    // No participants or expenses added
  });

  afterAll(() => {
    db.delete(expenses).where(eq(expenses.sheetId, testSheetId)).run();
    db.delete(participants).where(eq(participants.sheetId, testSheetId)).run();
    db.delete(sheets).where(eq(sheets.id, testSheetId)).run();
  });

  it('should load sheet with empty participants and expenses arrays', async () => {
    const params = { slug: testSlug, nanoid: testNanoid };
    const result = await load({ params } as any);

    expect(result?.sheet).toBeDefined();
    expect(result?.sheet.name).toBe('Empty Test Sheet');
    expect(result?.participants).toBeDefined();
    expect(result?.participants.length).toBe(0);
    expect(result?.expenses).toBeDefined();
    expect(result?.expenses.length).toBe(0);
  });
});
