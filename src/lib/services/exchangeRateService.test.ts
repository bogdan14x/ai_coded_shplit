import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchAndStoreRates, isRateOutdated, getOutdatedCurrencies, fetchAndStoreRatesForMultipleBases } from './exchangeRateService';
import { db } from '$lib/db';
import { exchangeRates } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

// Mock the database
vi.mock('$lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn()
        }))
      }))
    })),
    transaction: vi.fn((callback) => callback({ insert: vi.fn() })),
  }
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('exchangeRateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAndStoreRates', () => {
    it('fetches rates from API and stores them', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          rates: { USD: 1.09, GBP: 0.85 }
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      await fetchAndStoreRates('EUR');

      expect(mockFetch).toHaveBeenCalledWith('https://api.frankfurter.dev/v1/latest?baseCurrency=EUR');
    });

    it('throws error on failed API response', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Internal Server Error'
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(fetchAndStoreRates('EUR')).rejects.toThrow('Failed to fetch rates: Internal Server Error');
    });

    it('throws error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchAndStoreRates('EUR')).rejects.toThrow('Network error');
    });
  });

  describe('isRateOutdated', () => {
    it('returns true if rate does not exist', async () => {
      // Mock empty result
      const mockGet = vi.fn().mockResolvedValue(undefined);
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: mockGet
          })
        })
      });

      const result = await isRateOutdated('USD');
      expect(result).toBe(true);
    });

    it('returns true if rate is older than 24h', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - (25 * 60 * 60); // 25 hours ago
      const mockGet = vi.fn().mockResolvedValue({ lastUpdated: oldTimestamp });
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: mockGet
          })
        })
      });

      const result = await isRateOutdated('USD');
      expect(result).toBe(true);
    });

    it('returns false if rate is recent', async () => {
      const recentTimestamp = Math.floor(Date.now() / 1000) - (1 * 60 * 60); // 1 hour ago
      const mockGet = vi.fn().mockResolvedValue({ lastUpdated: recentTimestamp });
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: mockGet
          })
        })
      });

      const result = await isRateOutdated('USD');
      expect(result).toBe(false);
    });
  });

  describe('getOutdatedCurrencies', () => {
    it('returns list of outdated currencies', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - (25 * 60 * 60);
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([
              { targetCurrency: 'USD' },
              { targetCurrency: 'GBP' }
            ])
          })
        })
      });
      
      // Mock the db.select function
      vi.spyOn(db, 'select').mockImplementation(mockSelect);

      const result = await getOutdatedCurrencies();
      expect(result).toContain('USD');
      expect(result).toContain('GBP');
    });

    it('returns empty array if no outdated currencies', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([])
          })
        })
      });
      
      vi.spyOn(db, 'select').mockImplementation(mockSelect);

      const result = await getOutdatedCurrencies();
      expect(result).toEqual([]);
    });
  });

  describe('fetchAndStoreRatesForMultipleBases', () => {
    it('fetches rates for multiple base currencies', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ rates: { USD: 1.09 } })
      };
      mockFetch.mockResolvedValue(mockResponse);

      await fetchAndStoreRatesForMultipleBases(['EUR', 'USD']);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith('https://api.frankfurter.dev/v1/latest?baseCurrency=EUR');
      expect(mockFetch).toHaveBeenCalledWith('https://api.frankfurter.dev/v1/latest?baseCurrency=USD');
    });

    it('continues fetching other bases if one fails', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rates: { EUR: 0.92 } })
        });

      await fetchAndStoreRatesForMultipleBases(['EUR', 'USD']);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
