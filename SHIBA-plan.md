Here is the complete, corrected, and LLM-optimized implementation plan in a single Markdown file. You can save this as `IMPLEMENTATION_PLAN.md`.

```markdown
# shibasplit - Comprehensive Implementation Plan

## Executive Summary

shibasplit is an expense-splitting web application built with **Astro 5**, **React 19**, **Tailwind CSS**, and **Cloudflare D1 (SQLite)**. The core value proposition is privacy-first sharing via unguessable URLs (slug + nanoid) without requiring authentication for basic usage.

---

## 1. Implementation Requirements

### 1.1 Tech Stack

| Component       | Technology                           | Notes                                     |
| --------------- | ------------------------------------ | ----------------------------------------- |
| Framework       | Astro 5.x (SSR)                      | Server-side rendering with Islands        |
| UI              | React 19 + shadcn/ui + Tailwind CSS  | Dark theme, flat design                   |
| Routing         | Astro File-based Routing             | `/src/pages/[slug].astro`                 |
| Database        | Cloudflare D1 (SQLite) + Drizzle ORM | Edge-native, integer-based money handling |
| Auth            | Better Auth + Magic Link             | TypeScript-native, SQLite compatible      |
| Deployment      | Cloudflare Pages                     | `@astrojs/cloudflare` adapter             |
| Package Manager | Bun                                  | Fast installation, monorepo support       |

### 1.2 Project Structure
```

/Users/bogdan14x/Projects/shibasplit/
├── src/
│ ├── components/
│ │ ├── ui/ # shadcn/ui components
│ │ ├── forms/ # Expense/Participant forms
│ │ └── sheets/ # Sheet-specific components
│ ├── layouts/
│ │ ├── Layout.astro # Root layout (dark theme)
│ │ └── AuthLayout.astro # For dashboard/profile
│ ├── pages/
│ │ ├── index.astro # Home/landing
│ │ ├── login.astro # Magic link flow
│ │ ├── dashboard.astro # User's sheets
│ │ └── [...slug].astro # Sheet page (core feature)
│ ├── db/
│ │ ├── schema.ts # Drizzle schema (SQLite)
│ │ ├── migrations/ # Migration files
│ │ └── queries.ts # Repository pattern
│ ├── lib/
│ │ ├── auth.ts # Better Auth configuration
│ │ ├── settlements.ts # Greedy settlement algorithm
│ │ ├── nanoid.ts # URL-safe ID generation
│ │ └── validators/ # Zod schemas
│ └── env.d.ts # Cloudflare bindings types
├── migrations/
│ └── meta/ # Drizzle migrations metadata
├── wrangler.toml # Cloudflare config (D1 bindings)
├── astro.config.mjs
├── tailwind.config.mjs
└── drizzle.config.ts

````

### 1.3 Database Schema (Drizzle + SQLite)

> **Note:** We use `sqliteTable` and `integer` for all primary keys and monetary values. Money is stored in **cents** to avoid floating-point errors inherent in SQLite's `REAL` type.

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Users table (managed by Better Auth)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID
  email: text('email').unique().notNull(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  name: text('name'),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
});

// Sessions table (required by Better Auth)
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

// Sheets table
export const sheets = sqliteTable('sheets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull(), // "trip-to-italy-2025"
  nanoid: text('nanoid').notNull(), // "V1StGXR8_Z5jdHi6B"
  name: text('name').notNull(),
  currency: text('currency', { length: 3 }).default('USD'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
});

// Participants
export const participants = sqliteTable('participants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sheetId: integer('sheet_id')
    .references(() => sheets.id)
    .notNull(),
  userId: text('user_id').references(() => users.id), // null = anonymous
  name: text('name').notNull(),
  email: text('email'), // for linking
  isCreator: integer('is_creator', { mode: 'boolean' }).default(false),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).defaultNow(),
  leftAt: integer('left_at', { mode: 'timestamp' }), // soft delete
});

// Expenses
export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sheetId: integer('sheet_id')
    .references(() => sheets.id)
    .notNull(),
  paidBy: integer('paid_by')
    .references(() => participants.id)
    .notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(), // Stored as CENTS (e.g., $10.00 -> 1000)
  splitType: text('split_type', { enum: ['equal', 'custom'] }).default('equal'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
});

// Expense splits (for custom splits)
export const expenseSplits = sqliteTable('expense_splits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  expenseId: integer('expense_id')
    .references(() => expenses.id)
    .notNull(),
  participantId: integer('participant_id')
    .references(() => participants.id)
    .notNull(),
  amount: integer('amount').notNull(), // Cents
});

// Settlements (payments between participants)
export const settlements = sqliteTable('settlements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sheetId: integer('sheet_id')
    .references(() => sheets.id)
    .notNull(),
  fromParticipantId: integer('from_participant_id')
    .references(() => participants.id)
    .notNull(),
  toParticipantId: integer('to_participant_id')
    .references(() => participants.id)
    .notNull(),
  amount: integer('amount').notNull(), // Cents
  isOptimized: integer('is_optimized', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});
````

### 1.4 Configuration Files

#### `drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});
```

#### `wrangler.toml`

```toml
name = "shibasplit"
compatibility_date = "2024-09-23"
pages_build_output_dir = "./dist"

[[d1_databases]]
binding = "DB"
database_name = "shibasplit-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

#### `src/env.d.ts`

```typescript
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface CloudflareEnv {
  DB: import('@cloudflare/workers-types').D1Database;
}

declare namespace App {
  interface Locals extends CloudflareEnv {
    user: import('better-auth/types').User | null;
    session: import('better-auth/types').Session | null;
  }
}
```

---

## 2. Core Features Implementation

### 2.1 URL Structure (Slug + Nanoid)

```typescript
// src/lib/nanoid.ts
import { nanoid } from 'nanoid';

export function generateSheetId(slug: string): string {
  const randomPart = nanoid(12); // 12 chars
  return `${slug}-${randomPart}`; // "trip-to-italy-2025-V1StGXR8_Z5j"
}

export function parseSheetId(fullId: string): { slug: string; nanoid: string } {
  const lastDashIndex = fullId.lastIndexOf('-');
  return {
    slug: fullId.slice(0, lastDashIndex),
    nanoid: fullId.slice(lastDashIndex + 1),
  };
}
```

### 2.2 Balance Calculations (Handling Cents)

```typescript
// src/lib/calculations.ts
import type { Expense, Participant } from '../db/schema';

export function calculateBalances(
  expenses: Expense[],
  participants: Participant[]
): Map<number, number> {
  const balances = new Map<number, number>();

  // Initialize all participants to 0 balance
  participants.forEach((p) => balances.set(p.id, 0));

  expenses.forEach((expense) => {
    const paidBy = expense.paidBy;
    const amount = expense.amount; // Already in cents

    // Add to payer
    balances.set(paidBy, (balances.get(paidBy) || 0) + amount);

    // Deduct from each participant based on split
    if (expense.splitType === 'equal') {
      const activeParticipants = participants.filter((p) => !p.leftAt);
      const share = Math.floor(amount / activeParticipants.length); // Simple integer division

      activeParticipants.forEach((p) => {
        balances.set(p.id, (balances.get(p.id) || 0) - share);
      });
    } else {
      // Custom split logic would go here (fetching from expenseSplits table)
    }
  });

  return balances;
}
```

### 2.3 Settlement Algorithm (Greedy)

> **Note:** This uses a Greedy algorithm, which is optimal for minimizing the number of transactions in standard debt graphs.

```typescript
// src/lib/settlements.ts

export interface Transaction {
  from: number; // Participant ID
  to: number; // Participant ID
  amount: number; // Cents
}

export function calculateOptimalSettlements(balances: Map<number, number>): Transaction[] {
  const debtors: Array<[number, number]> = []; // [id, amount owed]
  const creditors: Array<[number, number]> = []; // [id, amount to receive]

  balances.forEach((balance, id) => {
    if (balance < 0)
      debtors.push([id, -balance]); // Convert to positive magnitude
    else if (balance > 0) creditors.push([id, balance]);
  });

  // Sort by largest amounts first (optional optimization for fewer txns)
  debtors.sort((a, b) => b[1] - a[1]);
  creditors.sort((a, b) => b[1] - a[1]);

  const transactions: Transaction[] = [];
  let i = 0,
    j = 0;

  while (i < debtors.length && j < creditors.length) {
    const [debtorId, debt] = debtors[i];
    const [creditorId, credit] = creditors[j];

    const amount = Math.min(debt, credit);

    transactions.push({
      from: debtorId,
      to: creditorId,
      amount: amount,
    });

    debtors[i][1] -= amount;
    creditors[j][1] -= amount;

    if (debtors[i][1] === 0) i++;
    if (creditors[j][1] === 0) j++;
  }

  return transactions;
}
```

### 2.4 Authentication (Better Auth)

```typescript
// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { db } from '../db'; // Your Drizzle instance

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite', // Essential for D1
  }),
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }, ctx) => {
        // TODO: Integrate Resend/SendGrid
        console.log(`Magic link for ${email}: ${url}`);
      },
    }),
  ],
  cookie: {
    secure: true,
    sameSite: 'strict',
  },
});

// Astro Middleware to inject session
export async function getSession(request: Request) {
  return auth.api.getSession({
    headers: request.headers,
  });
}
```

---

## 3. Edge Cases & Mitigations

### 3.1 Data Consistency

| Edge Case               | Mitigation                                                                                               |
| :---------------------- | :------------------------------------------------------------------------------------------------------- |
| **Money Rounding**      | All money stored as INTEGER (cents). Remainders absorbed by largest share or ignored (1 cent tolerance). |
| **Concurrent Edits**    | Use `updatedAt` timestamp check (Optimistic Locking) in update queries.                                  |
| **Participant Removal** | Soft delete (`leftAt`). They remain in history but cannot accrue new debts.                              |

### 3.2 Security

| Threat              | Mitigation                                                                                     |
| :------------------ | :--------------------------------------------------------------------------------------------- |
| **URL Enumeration** | 12-char nanoid provides ~71 bits of entropy. Brute force is infeasible.                        |
| **XSS**             | Astro auto-escapes. React escapes. No `dangerouslySetInnerHTML`.                               |
| **CSRF**            | Better Auth handles state tokens for magic links. Astro actions have built-in CSRF protection. |

---

## 4. Architecture Decisions

### 4.1 Why SQLite (D1) over Postgres?

1.  **Latency:** D1 runs on the edge (Cloudflare Workers), eliminating database round-trip latency compared to hosted Postgres.
2.  **Cost:** D1 has a generous free tier suitable for expense splitting (low write volume).
3.  **Architecture:** SQLite is perfectly suited for the "per-sheet" data isolation pattern where queries are simple and localized.

### 4.2 Server-Side Rendering (SSR)

- **Why:** Privacy and SEO. Sheets are private, so content cannot be statically generated. SSR allows checking permissions before rendering the page.
- **Strategy:** Use Astro SSR for initial load. Hydrate React components only where interaction is needed (adding expenses, viewing summaries).

---

## 5. Implementation Phases

### Phase 1: Foundation

- Initialize Astro project with Cloudflare adapter.
- Setup `wrangler.toml` and D1 database.
- Define Schema (`src/db/schema.ts`) and push migrations.

### Phase 2: Core Sheet Logic

- Implement Slug+Nanoid generation.
- Build "Create Sheet" and "View Sheet" pages.
- Implement Expense CRUD (storing cents).

### Phase 3: Logic & Math

- Implement `calculateBalances`.
- Implement `calculateOptimalSettlements`.
- Build the UI for the "Simplification" view.

### Phase 4: Auth & Polish

- Setup Better Auth with Magic Link.
- Create Dashboard (list user's sheets).
- Add "Email URL backup" feature.

---

## REMEMBER THESE

We are building an expense splitting app using **Astro 5** and **Cloudflare D1 (SQLite)**.

**Constraints:**

1.  **Database:** Use `drizzle-orm` with `sqliteTable` helper. Never use `pgTable`.
2.  **Money:** Always use `integer` type for money columns representing **cents**. Do not use `decimal` or `real`.
3.  **Bindings:** Access the database via `Astro.locals.runtime.env.DB` (Cloudflare D1 binding).
4.  **Math:** Write balance calculation logic handling integer math (rounding cents).

Generate the `src/db/schema.ts` file based on these rules first.
