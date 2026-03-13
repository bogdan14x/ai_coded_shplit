# Sheet Page UI Plan

## Overview

Build a mobile-first sheet page UI for shibasplit expense tracking app. This is a frontend-only feature with no backend integration for now.

## Tasks

### Task 1: Save Spec Documentation

Create `agent-os/specs/2026-03-11-1600-sheet-page-ui/` with:
- **plan.md** — This full plan
- **shape.md** — Shaping notes (scope, decisions, context from our conversation)
- **standards.md** — Relevant standards that apply to this work
- **references.md** — Pointers to reference implementations studied (none for now)
- **visuals/** — Mobile-first design layout guide

### Task 2: Setup SvelteKit project

1. Initialize SvelteKit project with Vite
2. Install and configure Tailwind CSS
3. Set up mobile-first responsive design foundation

### Task 3: Create mock data files

1. Define TypeScript interfaces for Sheet, Expense, Participant
2. Create mock data files with sample sheets, expenses, and participants

### Task 4: Create SvelteKit page structure

1. Create `src/routes/sheets/[slug]/+page.svelte` for the sheet page
2. Create `src/routes/sheets/[slug]/+page.ts` for data loading
3. Create reusable components:
   - `SheetHeader.svelte` — Title and description
   - `ExpenseList.svelte` — List of expenses
   - `SettleUpButton.svelte` — Settle Up button (disabled)
   - Use AvatarGroup component for participants display below title

### Task 5: Implement mobile-first responsive layout

1. Use Tailwind CSS for styling
2. Mobile-first approach (base styles for mobile, media queries for larger screens)
3. Follow the design layout guide from the screenshot

### Task 6: Add navigation

1. Create navigation between sheets and other pages
2. Add breadcrumbs or back navigation

### Task 7: Add error handling and loading states

1. Handle missing sheet data (404 page)
2. Add loading spinner while data loads

### Task 8: Review and refine

1. Test on different screen sizes
2. Ensure mobile-first design is working
3. Confirm Settle Up button is disabled/non-functional
