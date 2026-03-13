import { db } from './index';
import { sheets, participants, expenses } from './schema';
import { eq } from 'drizzle-orm';
import { generateSheetId } from '../nanoid';

const sheetFullId = generateSheetId('trip-to-italy-2025');
const slug = 'trip-to-italy-2025';
const nanoid = sheetFullId.split('-').slice(-1)[0];

db.insert(sheets).values({
  slug: slug,
  nanoid: nanoid,
  name: 'Trip to Italy 2025',
  description: 'Expenses for our amazing trip to Italy',
  currency: 'USD',
}).run();

const sheet = db.select().from(sheets).where(eq(sheets.slug, slug)).get();

if (sheet) {
  db.insert(participants).values([
    { sheetId: sheet.id, name: 'Alice', isCreator: true },
    { sheetId: sheet.id, name: 'Bob', isCreator: false },
    { sheetId: sheet.id, name: 'Charlie', isCreator: false },
  ]).run();

  const participantsList = db.select().from(participants).where(eq(participants.sheetId, sheet.id)).all();

  db.insert(expenses).values([
    {
      sheetId: sheet.id,
      paidBy: participantsList[0].id,
      description: 'Hotel in Rome',
      amount: 50000,
      splitType: 'equal',
    },
    {
      sheetId: sheet.id,
      paidBy: participantsList[1].id,
      description: 'Train tickets',
      amount: 12000,
      splitType: 'equal',
    },
    {
      sheetId: sheet.id,
      paidBy: participantsList[2].id,
      description: 'Dinner at restaurant',
      amount: 8500,
      splitType: 'equal',
    },
  ]).run();
}

console.log('Database seeded successfully!');
