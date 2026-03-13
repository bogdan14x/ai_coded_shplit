import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const sheets = sqliteTable('sheets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull(),
  nanoid: text('nanoid').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  currency: text('currency', { length: 3 }).default('USD'),
  createdBy: text('created_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
});

export const participants = sqliteTable('participants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sheetId: integer('sheet_id')
    .references(() => sheets.id)
    .notNull(),
  userId: text('user_id'),
  name: text('name').notNull(),
  email: text('email'),
  isCreator: integer('is_creator', { mode: 'boolean' }).notNull().default(false),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().defaultNow(),
  leftAt: integer('left_at', { mode: 'timestamp' }),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sheetId: integer('sheet_id')
    .references(() => sheets.id)
    .notNull(),
  paidBy: integer('paid_by')
    .references(() => participants.id)
    .notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  splitType: text('split_type', { enum: ['equal', 'custom'] }).notNull().default('equal'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

export type Sheet = typeof sheets.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
