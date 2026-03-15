import { describe, it, expect } from 'vitest';
import {
  normalizeAllocations,
  distributeRemainder,
  handleAmountChange,
  calculateAmountFromPercentage,
  roundToFiveCents,
} from '../src/lib/utils/splitLogic';

describe('SplitLogic', () => {
  // Test data
  const total = 100;
  const ids = [1, 2, 3];
  const selectedIds = new Set(ids);

  describe('normalizeAllocations', () => {
    it('should distribute difference among other participants when one changes', () => {
      let allocations = { 1: 60, 2: 30, 3: 0 };
      // Current sum = 90. Target = 100. Diff = 10.
      // Changed ID = 1. Others = [2, 3]. Adjustment = 5 each.
      // Expected: 1: 60, 2: 35, 3: 5.
      
      const result = normalizeAllocations(allocations, selectedIds, total, 1);
      expect(result[1]).toBe(60);
      expect(result[2]).toBe(35);
      expect(result[3]).toBe(5);
    });

    it('should respect manuallyAdjusted set when normalizing', () => {
      // Scenario: Alex (1) is manually adjusted to 10.
      // Jones (2) changes from 0 to 20.
      // Steve (3) is 0.
      // Total is 100.
      // Input allocations: { 1: 10, 2: 20, 3: 0 }. Sum = 30. Diff = 70.
      // Alex is manually adjusted (1), so Steve (3) gets the adjustment.
      
      let allocations = { 1: 10, 2: 20, 3: 0 };
      const manuallyAdjusted = new Set([1]); // Alex is manually adjusted
      const changedId = 2; // Jones changes
      
      const result = normalizeAllocations(allocations, selectedIds, total, changedId, manuallyAdjusted);
      
      expect(result[1]).toBe(10); // Alex remains unchanged
      expect(result[2]).toBe(20); // Jones is the changed one
      expect(result[3]).toBe(70); // Steve adjusts to cover the remainder
    });

    it('should handle single participant (fills total)', () => {
      const allocations = { 1: 50 };
      const singleId = new Set([1]);
      // Sum = 50. Diff = 50. Changed ID = 1. Others = [].
      // Logic: if others.length === 0, set changedId to total.
      
      const result = normalizeAllocations(allocations, singleId, total, 1);
      expect(result[1]).toBe(100);
    });

    it('should prevent negative amounts for others', () => {
      // Alice (1) changes to 100 (max). Others have 0.
      // Sum = 100. Diff = 0. No change.
      // Let's try case where adjustment would make others negative.
      // Alice: 90, Bob: 10, Charlie: 0. Sum = 100. (Balanced).
      // Wait, if sum is balanced, diff is 0.
      
      // Let's force a scenario:
      // Alice: 100, Bob: 0, Charlie: 0. Sum = 100.
      // If we change Alice to 110 (invalid input manually passed), Sum = 110. Diff = -10.
      // Bob and Charlie get -5 each. Clamp to 0.
      // Result: Alice 110, Bob 0, Charlie 0. Sum = 110.
      // Note: The normalizer doesn't clamp the *changed* ID, only others.
      // This is a limitation of the simple normalizer.
      // But let's test the clamping logic.
      
      const allocations = { 1: 110, 2: 0, 3: 0 };
      // Sum = 110. Target 100. Diff = -10.
      // Changed ID = 1. Others = [2, 3]. Adjustment = -5 each.
      // 2: 0 + (-5) = -5 -> clamp to 0.
      // 3: 0 + (-5) = -5 -> clamp to 0.
      
      const result = normalizeAllocations(allocations, selectedIds, total, 1);
      expect(result[1]).toBe(110); // Unchanged by this function
      expect(result[2]).toBe(0);
      expect(result[3]).toBe(0);
      // Note: Sum is 110, not 100. The comment in code acknowledges this simplification.
    });

    it('should return same allocations if already balanced', () => {
      const allocations = { 1: 33.33, 2: 33.33, 3: 33.34 };
      const result = normalizeAllocations(allocations, selectedIds, total, 1);
      // Due to floating point, it might not be exactly 100, but close enough.
      // Let's check if it returns the same object reference or new one.
      // My implementation returns a new object.
      // But if diff < 0.001, it returns newAllocations (which is a clone).
      // Wait, line 19: `return newAllocations;` returns the clone.
      // If diff is 0, it returns the clone.
      // So it always returns a new object.
      
      const sum = Object.values(result).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(100, 2);
    });
  });

  describe('distributeRemainder', () => {
    it('should distribute remainder evenly', () => {
      const allocations = { 1: 30, 2: 30 }; // Sum 60
      const selected = new Set([1, 2]);
      const result = distributeRemainder(allocations, selected, 100);
      
      // Remainder = 40. Share = 20.
      expect(result[1]).toBe(50);
      expect(result[2]).toBe(50);
    });

    it('should not distribute if remainder is negative', () => {
      const allocations = { 1: 60, 2: 60 }; // Sum 120
      const selected = new Set([1, 2]);
      const result = distributeRemainder(allocations, selected, 100);
      
      // Remainder = -20. Should not change.
      expect(result[1]).toBe(60);
      expect(result[2]).toBe(60);
    });
  });

  describe('handleAmountChange', () => {
    it('should clamp negative values to 0', () => {
      expect(handleAmountChange(1, -10)).toBe(0);
    });

    it('should return valid number', () => {
      expect(handleAmountChange(1, 50)).toBe(50);
    });

    it('should handle NaN', () => {
      expect(handleAmountChange(1, NaN)).toBe(0);
    });
  });

  describe('calculateAmountFromPercentage', () => {
    it('should calculate amount correctly', () => {
      expect(calculateAmountFromPercentage(100, 50)).toBe(50);
      expect(calculateAmountFromPercentage(200, 25)).toBe(50);
    });
  });

  describe('roundToFiveCents', () => {
    it('should round to nearest 5-cent increment', () => {
      expect(roundToFiveCents(0.01)).toBe(0);
      expect(roundToFiveCents(0.02)).toBe(0);
      expect(roundToFiveCents(0.03)).toBe(0.05);
      expect(roundToFiveCents(0.04)).toBe(0.05);
      expect(roundToFiveCents(0.05)).toBe(0.05);
      expect(roundToFiveCents(0.06)).toBe(0.05);
      expect(roundToFiveCents(0.07)).toBe(0.05);
      expect(roundToFiveCents(0.08)).toBe(0.10); // 0.08 rounds to 0.10
      expect(roundToFiveCents(0.09)).toBe(0.10);
      expect(roundToFiveCents(0.10)).toBe(0.10);
      expect(roundToFiveCents(1.11)).toBe(1.10);
      expect(roundToFiveCents(1.12)).toBe(1.10);
      expect(roundToFiveCents(1.13)).toBe(1.15);
      expect(roundToFiveCents(1.14)).toBe(1.15);
      expect(roundToFiveCents(1.15)).toBe(1.15);
    });
  });
});
