# Settlement Algorithm Specification

## Overview

Implement the core settlement calculation feature using the Fork-Fulkerson algorithm (or similar minimum transaction algorithm) to calculate who owes whom in a group expense scenario.

## Problem Statement

Currently, users can add expenses and track who paid for what, but there is no way to calculate the final settlement. The ultimate goal mentioned in the product mission is to "display the minimum number of transactions to settle up using the Fork Fulkerson algorithm."

## User Stories

1. **As a sheet creator**, I want to see a summary of who owes whom so I can settle debts efficiently.
2. **As a participant**, I want to know my exact balance (positive or negative) to understand what I owe or am owed.
3. **As a group**, we want to minimize the number of transactions required to settle all debts.

## Algorithm Selection

**Recommended**: Minimize Transactions Algorithm (simplified debt simplification)

While the mission mentions "Fork Fulkerson," for an MVP, a simpler and equally effective algorithm is:

1. Calculate net balance for each participant (total paid - total share)
2. Separate participants into creditors (positive balance) and debtors (negative balance)
3. Match debtors to creditors greedily to minimize transactions
4. Output list of transactions (who pays whom how much)

This achieves the same goal as max flow algorithms but is simpler to implement and understand.

## Data Flow

1. **Input**: List of expenses with paidBy and splitType
2. **Process**:
   - Calculate total paid by each participant
   - Calculate total share for each participant based on splitType
   - Compute net balance (paid - share)
   - Generate settlement transactions
3. **Output**: List of settlements (from → to → amount)

## Implementation Plan

### Step 1: Calculate Net Balances

For each participant:
- Sum amounts paid (where paidBy == participantId)
- Calculate share of each expense:
  - equal: amount / numParticipants
  - custom: pre-calculated share (requires custom split implementation)
- Net balance = total paid - total share

### Step 2: Generate Settlement Transactions

Algorithm:
1. Create list of creditors (positive balances) and debtors (negative balances)
2. While there are debtors:
   - Pick a debtor (most negative)
   - Pick a creditor (most positive)
   - Transfer min(|debtor|, creditor) from debtor to creditor
   - Update balances
   - Record transaction
   - Remove settled parties from lists

### Step 3: Display Results

UI should show:
- Individual balances for each participant
- List of transactions needed to settle
- Visual representation (optional)

## API/Action Design

### New Server Action: `calculateSettlement`

```typescript
export const actions: Actions = {
  calculateSettlement: async ({ params }) => {
    const { slug, nanoid } = params;
    
    // 1. Load sheet data
    // 2. Calculate balances
    // 3. Generate settlement transactions
    // 4. Return results
    
    return {
      success: true,
      settlement: {
        balances: Array<{ participantId: number, name: string, balance: number }>,
        transactions: Array<{ from: number, to: number, amount: number, fromName: string, toName: string }>
      }
    };
  }
}
```

### UI Integration

Add a "Settle Up" section to the sheet page that:
1. Displays current balances
2. Shows settlement transactions
3. Optionally marks debts as settled

## Testing Requirements

### Unit Tests
- Calculate net balances correctly
- Generate minimal transactions
- Handle edge cases (zero balances, equal balances)

### Integration Tests
- Load sheet data correctly
- Return proper settlement structure
- Handle missing data gracefully

## Edge Cases

1. **Zero balances**: Participants who paid exactly their share
2. **All settled**: No transactions needed
3. **Single participant**: No settlement needed
4. **Custom splits**: Ensure custom split amounts are included in calculations
5. **Large groups**: Algorithm should scale reasonably

## MVP Scope

**For MVP**:
- Calculate and display balances
- Generate settlement transactions
- Simple text/numeric display
- No visual graph representation

**Post-MVP**:
- Visual flow diagram
- Mark debts as settled
- Payment tracking
- Export settlement data

## Dependencies

1. **Custom Split Implementation**: Required for accurate custom split calculations
2. **Participant Data**: Already available in schema
3. **Expense Data**: Already available in schema

## Success Criteria

1. Settlement calculations match manual calculations for test cases
2. Algorithm produces minimal number of transactions
3. UI clearly displays who owes whom
4. Handles all edge cases gracefully
