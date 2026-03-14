import { test, expect } from '@playwright/test';
import { nanoid } from 'nanoid';

// Helper to create a unique sheet name
const getUniqueSheetName = () => `Test Sheet ${nanoid(6)}`;

/**
 * Creates a new sheet and returns the sheet URL
 */
async function createSheet(page: any, sheetName: string): Promise<string> {
  await page.goto('/');
  await page.fill('input[name="sheetName"]', sheetName);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/sheets\/.*\/.*/);
  return page.url();
}

/**
 * Adds a participant via the join page
 */
async function addParticipantViaJoin(page: any, sheetUrl: string, name: string): Promise<void> {
  // Extract sheet ID from URL (format: /sheets/{slug}/{nanoid})
  const urlParts = sheetUrl.split('/');
  const nanoid = urlParts[urlParts.length - 1];
  
  if (!nanoid) throw new Error('Could not extract sheet ID from URL');
  
  // Navigate to join page
  await page.goto(`/join/${nanoid}`);
  await page.fill('input[name="displayName"]', name);
  await page.click('button:has-text("Join Sheet")');
  
  // Wait for redirect back to sheet
  await page.waitForURL(/\/sheets\/.*\/.*/);
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
}

/**
 * Adds an expense to the current sheet
 */
async function addExpense(page: any, description: string, amount: string, payerName: string): Promise<void> {
  // Wait for Add Expense button to be visible and enabled
  await expect(page.locator('button:has-text("Add Expense")')).toBeVisible();
  await page.click('button:has-text("Add Expense")');
  
  // Wait for form to appear (drawer)
  await expect(page.locator('input[name="description"]')).toBeVisible();
  
  await page.fill('input[name="description"]', description);
  await page.fill('input[name="amount"]', amount);
  
  // Select payer - wait for buttons to be visible
  await expect(page.locator(`button:has-text("${payerName}")`)).toBeVisible();
  await page.click(`button:has-text("${payerName}")`);
  
  await page.click('button:has-text("Save")');
  
  // Wait for drawer to close
  await page.waitForTimeout(2000); // Give time for animation and server response
  
  // Verify expense appears in the list
  await expect(page.locator(`text=${description}`)).toBeVisible({ timeout: 10000 });
}

/**
 * Opens the settlement modal
 */
async function openSettlementModal(page: any): Promise<void> {
  await page.click('button:has-text("Settle Up")');
  await expect(page.locator('role=dialog')).toBeVisible();
}

test.describe('Settlement Modal', () => {
  test('opens and displays correctly', async ({ page }) => {
    // Create a new sheet
    const sheetUrl = await createSheet(page, getUniqueSheetName());
    
    // Add participants via join page
    await addParticipantViaJoin(page, sheetUrl, 'Alice');
    await addParticipantViaJoin(page, sheetUrl, 'Bob');
    
    // Navigate back to sheet page
    await page.goto(sheetUrl);
    await page.waitForLoadState('networkidle');
    
    // Add an expense
    await addExpense(page, 'Dinner', '100', 'Alice');
    
    // Refresh the page to ensure settlements are calculated
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check if Settle Up button is visible and enabled
    const settleUpButton = page.locator('button:has-text("Settle Up")');
    await expect(settleUpButton).toBeVisible();
    await expect(settleUpButton).not.toBeDisabled({ timeout: 10000 });
    
    // Click "Settle Up" button
    await openSettlementModal(page);
    
    // Verify modal is visible with proper content
    await expect(page.locator('role=dialog')).toBeVisible();
    await expect(page.locator('h2:has-text("Settlements")')).toBeVisible();
    await expect(page.locator('#settlement-currency')).toBeVisible();
  });

  test('displays settlements list correctly', async ({ page }) => {
    const sheetUrl = await createSheet(page, getUniqueSheetName());
    
    // Add participants
    await addParticipantViaJoin(page, sheetUrl, 'Alice');
    await addParticipantViaJoin(page, sheetUrl, 'Bob');
    
    // Add expense where Alice pays $100 (Bob owes $50)
    await addExpense(page, 'Dinner', '100', 'Alice');
    
    // Refresh to ensure settlements are calculated
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Open settlement modal
    await openSettlementModal(page);
    
    // Verify settlement is shown (Bob owes Alice $50)
    await expect(page.locator('text=Bob')).toBeVisible();
    await expect(page.locator('text=Alice')).toBeVisible();
    await expect(page.locator('text=$50.00')).toBeVisible();
  });

  test('closes modal when clicking backdrop', async ({ page }) => {
    const sheetUrl = await createSheet(page, getUniqueSheetName());
    await addParticipantViaJoin(page, sheetUrl, 'Alice');
    await addExpense(page, 'Test', '50', 'Alice');
    
    // Refresh to ensure settlements are calculated
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await openSettlementModal(page);
    
    // Click on backdrop (dark overlay area)
    await page.locator('div.fixed.inset-0.z-50').click();
    
    // Modal should close
    await expect(page.locator('role=dialog')).not.toBeVisible();
  });

  test('closes modal when clicking X button', async ({ page }) => {
    const sheetUrl = await createSheet(page, getUniqueSheetName());
    await addParticipantViaJoin(page, sheetUrl, 'Alice');
    await addExpense(page, 'Test', '50', 'Alice');
    
    // Refresh to ensure settlements are calculated
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await openSettlementModal(page);
    
    // Click close button
    await page.click('button[aria-label="Close modal"]');
    
    // Modal should close
    await expect(page.locator('role=dialog')).not.toBeVisible();
  });

  test('changes settlement currency and recalculates', async ({ page }) => {
    const sheetUrl = await createSheet(page, getUniqueSheetName());
    
    // Add participants
    await addParticipantViaJoin(page, sheetUrl, 'Alice');
    await addParticipantViaJoin(page, sheetUrl, 'Bob');
    
    // Add expense in USD
    await addExpense(page, 'Dinner', '100', 'Alice');
    
    // Refresh to ensure settlements are calculated
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Open settlement modal
    await openSettlementModal(page);
    
    // Verify USD is selected by default
    const currencySelect = page.locator('#settlement-currency');
    await expect(currencySelect).toHaveValue('USD');
    
    // Change currency to EUR
    await currencySelect.selectOption('EUR');
    
    // Wait for calculation to complete
    await page.waitForTimeout(1000);
    
    // Verify the currency in the footer changed
    await expect(page.locator('text=Settlements calculated in EUR')).toBeVisible();
    
    // Verify settlement amounts are shown (EUR values)
    const settlementAmount = page.locator('text=€').first();
    await expect(settlementAmount).toBeVisible();
  });

  test('shows empty state when all settled', async ({ page }) => {
    const sheetUrl = await createSheet(page, getUniqueSheetName());
    
    // Add participant but no expenses
    await addParticipantViaJoin(page, sheetUrl, 'Alice');
    
    // Refresh to ensure data is loaded
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Open settlement modal
    await openSettlementModal(page);
    
    // Should show "All settled up!" message
    await expect(page.locator('text=All settled up!')).toBeVisible();
  });

  test('Settle Up button is disabled when no participants', async ({ page }) => {
    await createSheet(page, getUniqueSheetName());
    
    // Don't add any participants
    // The Settle Up button should be disabled
    const settleUpButton = page.locator('button:has-text("Settle Up")');
    await expect(settleUpButton).toBeDisabled();
  });

  test('shows settlement count badge', async ({ page }) => {
    const sheetUrl = await createSheet(page, getUniqueSheetName());
    
    // Add participants
    await addParticipantViaJoin(page, sheetUrl, 'Alice');
    await addParticipantViaJoin(page, sheetUrl, 'Bob');
    
    // Add expense
    await addExpense(page, 'Dinner', '100', 'Alice');
    
    // Refresh to ensure settlements are calculated
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verify badge shows count
    await expect(page.locator('button:has-text("Settle Up")')).toBeVisible();
    const badge = page.locator('button:has-text("Settle Up") span.ml-1');
    await expect(badge).toBeVisible();
  });

  test('modal has proper styling and layout', async ({ page }) => {
    const sheetUrl = await createSheet(page, getUniqueSheetName());
    await addParticipantViaJoin(page, sheetUrl, 'Alice');
    await addExpense(page, 'Test', '50', 'Alice');
    
    // Refresh to ensure settlements are calculated
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await openSettlementModal(page);
    
    // Verify modal has proper structure
    await expect(page.locator('role=dialog')).toBeVisible();
    await expect(page.locator('h2:has-text("Settlements")')).toBeVisible();
    await expect(page.locator('#settlement-currency')).toBeVisible();
  });
});