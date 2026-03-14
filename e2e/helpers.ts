import { Page, expect } from '@playwright/test';
import { nanoid } from 'nanoid';

/**
 * Creates a new sheet and returns the page URL
 */
export async function createSheet(page: Page, sheetName?: string): Promise<string> {
  await page.goto('/');
  
  const name = sheetName || `Test Sheet ${nanoid(6)}`;
  await page.fill('input[name="sheetName"]', name);
  await page.click('button[type="submit"]');
  
  // Wait for sheet page to load
  await page.waitForURL(/\/sheets\/.*\/.*/);
  
  return page.url();
}

/**
 * Adds a participant to the current sheet
 */
export async function addParticipant(page: Page, name: string): Promise<void> {
  await page.fill('input[placeholder="Participant name"]', name);
  await page.click('button:has-text("Add")');
  // Wait for participant to be added
  await expect(page.locator(`text=${name}`)).toBeVisible();
}

/**
 * Adds an expense to the current sheet
 */
export async function addExpense(
  page: Page, 
  description: string, 
  amount: string, 
  payerName: string
): Promise<void> {
  await page.click('button:has-text("Add Expense")');
  await page.fill('input[name="description"]', description);
  await page.fill('input[name="amount"]', amount);
  
  // Select payer
  await page.click(`button:has-text("${payerName}")`);
  
  await page.click('button:has-text("Save")');
  
  // Wait for expense to be added
  await expect(page.locator(`text=${description}`)).toBeVisible();
}

/**
 * Opens the settlement modal
 */
export async function openSettlementModal(page: Page): Promise<void> {
  await page.click('button:has-text("Settle Up")');
  await expect(page.locator('role=dialog')).toBeVisible();
}

/**
 * Closes the settlement modal
 */
export async function closeSettlementModal(page: Page): Promise<void> {
  await page.click('button[aria-label="Close modal"]');
  await expect(page.locator('role=dialog')).not.toBeVisible();
}

/**
 * Changes the settlement currency in the modal
 */
export async function changeSettlementCurrency(page: Page, currency: string): Promise<void> {
  await page.locator('#settlement-currency').selectOption(currency);
  // Wait for calculation to complete
  await page.waitForTimeout(500);
}