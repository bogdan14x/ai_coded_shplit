import { createSQLiteDB } from './index';
import { sheets, participants, expenses } from './schema';
import { eq } from 'drizzle-orm';
import { generateSheetId } from '../nanoid';

// Use local SQLite for seeding
const db = createSQLiteDB();

// Generate a unique sheet ID
const sheetFullId = generateSheetId('test-sheet-500-expenses');
const slug = 'test-sheet-500-expenses';
const nanoid = sheetFullId.split('-').slice(-1)[0];

// Delete existing sheet if it exists
const existingSheet = db.select().from(sheets).where(eq(sheets.slug, slug)).get();
if (existingSheet) {
  // Delete expenses first (foreign key constraint)
  db.delete(expenses).where(eq(expenses.sheetId, existingSheet.id)).run();
  // Delete participants
  db.delete(participants).where(eq(participants.sheetId, existingSheet.id)).run();
  // Delete sheet
  db.delete(sheets).where(eq(sheets.id, existingSheet.id)).run();
}

// Create the sheet
db.insert(sheets).values({
  slug: slug,
  nanoid: nanoid,
  name: 'Test Sheet with 500 Expenses',
  description: 'A test sheet for performance testing with 500 expenses',
  currency: 'USD',
  settlementCurrency: 'USD',
}).run();

const sheet = db.select().from(sheets).where(eq(sheets.slug, slug)).get();

if (sheet) {
  // Create 3 participants
  db.insert(participants).values([
    { sheetId: sheet.id, name: 'Alex', isCreator: true },
    { sheetId: sheet.id, name: 'Jones', isCreator: false },
    { sheetId: sheet.id, name: 'Steve', isCreator: false },
  ]).run();

  const participantsList = db.select().from(participants).where(eq(participants.sheetId, sheet.id)).all();

  // Expense descriptions for variety
  const expenseDescriptions = [
    'Coffee', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks',
    'Hotel', 'Hostel', 'Apartment', 'Transport', 'Taxi', 'Bus', 'Train', 'Flight',
    'Museum', 'Tour', 'Activity', 'Souvenir', 'Gift', 'Shopping',
    'Groceries', 'Laundry', 'Phone', 'Internet', 'ATM Fee', 'Bank Fee',
    'Spa', 'Gym', 'Parking', 'Gas', 'Car Rental', 'Bike Rental',
    'Theater', 'Concert', 'Movie', 'Game', 'Sports', 'Fitness',
    'Book', 'Magazine', 'Newspaper', 'App', 'Software', 'Subscription',
    'Insurance', 'Medical', 'Pharmacy', 'Dentist', 'Doctor', 'Hospital',
  ];

  // Generate 500 expenses
  const expensesToInsert: typeof expenses.$inferInsert[] = [];
  
  for (let i = 0; i < 500; i++) {
    const participantIndex = Math.floor(Math.random() * participantsList.length);
    const description = expenseDescriptions[Math.floor(Math.random() * expenseDescriptions.length)];
    const amount = Math.floor(Math.random() * 50000) + 500; // $5.00 to $500.00
    const splitType = Math.random() > 0.8 ? 'custom' : 'equal'; // 20% custom splits
    
    let customSplitData: string | null = null;
    if (splitType === 'custom') {
      // Create custom split data
      const customSplit: Record<number, number> = {};
      let remaining = amount;
      participantsList.forEach((p: any, idx: number) => {
        if (idx === participantsList.length - 1) {
          customSplit[p.id] = remaining;
        } else {
          const splitAmount = Math.floor(Math.random() * (remaining / 2));
          customSplit[p.id] = splitAmount;
          remaining -= splitAmount;
        }
      });
      customSplitData = JSON.stringify(customSplit);
    }

    expensesToInsert.push({
      sheetId: sheet.id,
      paidBy: participantsList[participantIndex].id,
      description: `${description} #${i + 1}`,
      amount: amount,
      currency: 'USD',
      splitType: splitType,
      customSplitData: customSplitData,
    });
  }

  // Insert expenses in batches to avoid overwhelming the database
  const batchSize = 100;
  for (let i = 0; i < expensesToInsert.length; i += batchSize) {
    const batch = expensesToInsert.slice(i, i + batchSize);
    db.insert(expenses).values(batch).run();
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(expensesToInsert.length / batchSize)}`);
  }
}

console.log('Database seeded successfully with 500 expenses!');
console.log(`Sheet URL: http://localhost:5173/sheets/${slug}/${nanoid}`);