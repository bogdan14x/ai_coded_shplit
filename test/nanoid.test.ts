import { describe, it, expect } from 'vitest';
import { generateSheetId, validateNanoid } from '../src/lib/nanoid';

describe('Nanoid Generation', () => {
  it('should generate nanoids with minimum 10 characters', () => {
    for (let i = 0; i < 20; i++) {
      const fullId = generateSheetId('test-slug');
      const nanoid = fullId.split('-').slice(-1)[0];
      expect(nanoid.length).toBeGreaterThanOrEqual(10);
      expect(nanoid.length).toBe(10); // Should be exactly 10 since we specified MIN_NANOID_LENGTH
    }
  });

  it('should not include hyphens in generated nanoids', () => {
    for (let i = 0; i < 20; i++) {
      const fullId = generateSheetId('test-slug');
      const nanoid = fullId.split('-').slice(-1)[0];
      expect(nanoid).not.toContain('-');
    }
  });

  it('should generate unique nanoids', () => {
    const nanoids = new Set();
    for (let i = 0; i < 20; i++) {
      const fullId = generateSheetId('test-slug');
      const nanoid = fullId.split('-').slice(-1)[0];
      expect(nanoids.has(nanoid)).toBe(false);
      nanoids.add(nanoid);
    }
  });

  it('should validate nanoids correctly', () => {
    expect(validateNanoid('1234567890')).toBe(true); // Exactly 10 chars, no hyphens
    expect(validateNanoid('12345678901')).toBe(true); // 11 chars, no hyphens
    expect(validateNanoid('123456789')).toBe(false); // 9 chars
    expect(validateNanoid('123-567890')).toBe(false); // Contains hyphen
    expect(validateNanoid('')).toBe(false); // Empty string
  });

  it('should include slug in the full ID', () => {
    const fullId = generateSheetId('my-test-slug');
    expect(fullId).toMatch(/^my-test-slug-/);
  });
});
