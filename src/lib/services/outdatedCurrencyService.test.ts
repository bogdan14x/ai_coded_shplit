import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAllOutdatedCurrencies,
  isCurrencyOutdated,
  updateCurrencyRates,
  updateOutdatedRatesInBackground,
  updateCurrencyInBackground
} from './outdatedCurrencyService';

// Mock the exchangeRateService
vi.mock('./exchangeRateService', () => ({
  fetchAndStoreRates: vi.fn(),
  fetchAndStoreRatesForMultipleBases: vi.fn(),
  isRateOutdated: vi.fn(),
  getOutdatedCurrencies: vi.fn()
}));

import {
  fetchAndStoreRates,
  fetchAndStoreRatesForMultipleBases,
  isRateOutdated,
  getOutdatedCurrencies
} from './exchangeRateService';

describe('outdatedCurrencyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllOutdatedCurrencies', () => {
    it('returns list of outdated currencies', async () => {
      (getOutdatedCurrencies as any).mockResolvedValue(['USD', 'GBP']);

      const result = await getAllOutdatedCurrencies();
      expect(result).toEqual(['USD', 'GBP']);
    });

    it('returns empty array on error', async () => {
      (getOutdatedCurrencies as any).mockRejectedValue(new Error('DB Error'));

      const result = await getAllOutdatedCurrencies();
      expect(result).toEqual([]);
    });
  });

  describe('isCurrencyOutdated', () => {
    it('returns true for outdated currency', async () => {
      (isRateOutdated as any).mockResolvedValue(true);

      const result = await isCurrencyOutdated('USD');
      expect(result).toBe(true);
    });

    it('returns false for fresh currency', async () => {
      (isRateOutdated as any).mockResolvedValue(false);

      const result = await isCurrencyOutdated('USD');
      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      (isRateOutdated as any).mockRejectedValue(new Error('DB Error'));

      const result = await isCurrencyOutdated('USD');
      expect(result).toBe(false);
    });
  });

  describe('updateCurrencyRates', () => {
    it('returns true on successful update', async () => {
      (fetchAndStoreRates as any).mockResolvedValue(undefined);

      const result = await updateCurrencyRates('USD');
      expect(result).toBe(true);
      expect(fetchAndStoreRates).toHaveBeenCalledWith('USD');
    });

    it('returns false on error', async () => {
      (fetchAndStoreRates as any).mockRejectedValue(new Error('API Error'));

      const result = await updateCurrencyRates('USD');
      expect(result).toBe(false);
    });

    it('uses EUR as default base currency', async () => {
      (fetchAndStoreRates as any).mockResolvedValue(undefined);

      await updateCurrencyRates('USD');
      expect(fetchAndStoreRates).toHaveBeenCalledWith('USD');
    });
  });

  describe('updateOutdatedRatesInBackground', () => {
    it('updates all outdated currencies', async () => {
      (getOutdatedCurrencies as any).mockResolvedValue(['USD', 'GBP']);
      (fetchAndStoreRatesForMultipleBases as any).mockResolvedValue(undefined);

      await updateOutdatedRatesInBackground();

      expect(getOutdatedCurrencies).toHaveBeenCalled();
      expect(fetchAndStoreRatesForMultipleBases).toHaveBeenCalledWith(['EUR', 'USD', 'GBP']);
    });

    it('does nothing if no outdated currencies', async () => {
      (getOutdatedCurrencies as any).mockResolvedValue([]);

      await updateOutdatedRatesInBackground();

      expect(getOutdatedCurrencies).toHaveBeenCalled();
      expect(fetchAndStoreRatesForMultipleBases).not.toHaveBeenCalled();
    });

    it('handles errors gracefully', async () => {
      (getOutdatedCurrencies as any).mockRejectedValue(new Error('DB Error'));

      // Should not throw
      await expect(updateOutdatedRatesInBackground()).resolves.not.toThrow();
    });
  });

  describe('updateCurrencyInBackground', () => {
    it('returns true on successful update', async () => {
      (fetchAndStoreRates as any).mockResolvedValue(undefined);

      const result = await updateCurrencyInBackground('USD');
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      (fetchAndStoreRates as any).mockRejectedValue(new Error('API Error'));

      const result = await updateCurrencyInBackground('USD');
      expect(result).toBe(false);
    });
  });
});
