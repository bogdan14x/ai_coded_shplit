# Custom Split Implementation Specification

## Overview

Complete the custom split functionality for expenses where participants contribute different amounts. Currently, the schema supports `splitType: 'custom'` but there is no UI or logic to handle custom splits.

## Problem Statement

Users need flexibility to split expenses unevenly (e.g., someone orders expensive dish, others share cheaper items). The current implementation only supports "equal" splits, limiting real-world usage.

## User Stories

1. **As a user**, I want to specify exact amounts each participant should pay for an expense
2. **As a user**, I want to mix equal and custom splits for different expenses
3. **As a user**, I want to see custom split breakdown in the expense list

## Current State Analysis

### Schema Support
```typescript
// src/lib/db/schema.ts
splitType: text('split_type', { enum: ['equal', 'custom'] }).notNull().default('equal')
```

### Missing Components
1. **UI**: No way to input custom amounts per participant
2. **Validation**: No logic to validate custom splits sum to total amount
3. **Display**: No indication in expense list that custom split was used
4. **Settlement**: Custom splits not handled in settlement calculation (when implemented)

## Implementation Plan

### Step 1: Database Schema Update

**Current schema is sufficient** - no changes needed. The `splitType` field already supports 'custom'.

**Consider adding**: `customSplitDetails` JSON field for storing per-participant amounts (optional for MVP).

### Step 2: Add Expense Action Update

Update `addExpense` and `editExpense` actions to handle custom splits:

```typescript
// When splitType === 'custom', expect customSplitDetails in form data
const customSplitDetails = formData.get('customSplitDetails'); // JSON string
// Validate: sum of custom amounts == total amount
```

### Step 3: Custom Split UI

Add UI components for custom split input:

#### Option A: Inline Per-Participant Inputs
```
Expense: Dinner
Amount: $100.00
Split Type: Custom

Participant breakdown:
- Alice: $40.00
- Bob: $30.00
- Charlie: $30.00
[Total: $100.00] ✓
```

#### Option B: Percentage-based Custom Split
```
Expense: Dinner
Amount: $100.00
Split Type: Custom

Participant breakdown:
- Alice: 40% ($40.00)
- Bob: 30% ($30.00)
- Charlie: 30% ($30.00)
[Total: 100%] ✓
```

### Step 4: Validation Logic

1. **Amount Validation**: Custom amounts must sum to total expense amount
2. **Participant Validation**: All participants must be included in split
3. **Non-negative**: All custom amounts must be >= 0

### Step 5: Display in Expense List

Show custom split details in expense list:

```
Dinner - $100.00
Paid by: Alice
Split: Custom (Alice: $40, Bob: $30, Charlie: $30)
```

## API Design

### Form Data for Custom Splits

When `splitType === 'custom'`:

```typescript
formData.append('splitType', 'custom');
formData.append('customSplitDetails', JSON.stringify([
  { participantId: 1, amount: 4000 }, // in cents
  { participantId: 2, amount: 3000 },
  { participantId: 3, amount: 3000 }
]));
```

### Expense Interface Update

```typescript
interface Expense {
  // ... existing fields
  splitType: 'equal' | 'custom';
  customSplitDetails?: Array<{
    participantId: number;
    amount: number; // in cents
  }>;
}
```

## UI Components

### CustomSplitInput.svelte

Component for entering custom split amounts:

```svelte
<script lang="ts">
  export let participants: Participant[];
  export let totalAmount: number;
  export let customSplits: Record<number, number>; // participantId -> amount
  
  // Validation computed property
  $: isValid = Object.values(customSplits).reduce((a, b) => a + b, 0) === totalAmount;
</script>

<div class="custom-split-input">
  {#each participants as participant}
    <div class="participant-row">
      <label>{participant.name}</label>
      <input type="number" bind:value={customSplits[participant.id]} min="0" step="0.01" />
    </div>
  {/each}
  <div class="validation">
    Total: ${formatAmount(Object.values(customSplits).reduce((a, b) => a + b, 0))}
    {#if isValid}
      <span class="valid">✓</span>
    {:else}
      <span class="invalid">✗ Must equal ${formatAmount(totalAmount)}</span>
    {/if}
  </div>
</div>
```

### ExpenseDisplay.svelte Update

Show custom split details:

```svelte
{#if expense.splitType === 'custom'}
  <div class="custom-split-details">
    <span>Split: Custom</span>
    <ul>
      {#each customSplits as split}
        <li>{split.participantName}: ${formatAmount(split.amount)}</li>
      {/each}
    </ul>
  </div>
{/if}
```

## Testing Requirements

### Unit Tests
1. **Validation**: Custom splits must sum to total amount
2. **Edge Cases**: Zero amounts, all equal amounts, one participant pays all
3. **Format**: Custom split details stored/retrieved correctly

### Integration Tests
1. **Add Expense**: Custom split expense added successfully
2. **Edit Expense**: Custom split expense edited successfully
3. **Display**: Custom split shown correctly in expense list
4. **Settlement**: Custom splits handled in settlement calculation

## Edge Cases

1. **Zero amounts**: Some participants pay $0
2. **One payer**: One participant pays entire amount
3. **Uneven distribution**: Very different amounts
4. **Decimal precision**: Amounts in cents, handle rounding
5. **Participant changes**: What if participants added/removed after custom split?

## MVP Scope

**For MVP**:
- Basic custom split input UI
- Validation that amounts sum to total
- Display custom split details in expense list
- Store custom split details in database

**Post-MVP**:
- Percentage-based input
- Split templates (e.g., "50/50", "evenly among 3")
- Visual split visualization
- Adjust splits automatically when participants change

## Dependencies

1. **Participant Data**: Already available
2. **Expense Actions**: Existing addExpense/editExpense need updates
3. **Settlement Algorithm**: Will need to handle custom splits (when implemented)

## Success Criteria

1. Users can enter custom amounts for each participant
2. Validation ensures amounts sum to total expense amount
3. Custom split details are stored and retrieved correctly
4. Custom splits display clearly in expense list
5. Settlement calculation (when implemented) handles custom splits correctly
