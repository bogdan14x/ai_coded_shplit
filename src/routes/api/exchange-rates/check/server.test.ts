import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { isCurrencyOutdated } from '$lib/services/outdatedCurrencyService';

// Mock the service
vi.mock('$lib/services/outdatedCurrencyService', () => ({
  isCurrencyOutdated: vi.fn()
}));

describe('GET /api/exchange-rates/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns outdated: true for outdated currency', async () => {
    (isCurrencyOutdated as any).mockResolvedValue(true);

    const url = new URL('http://localhost/api/exchange-rates/check?currency=USD');
    const request = new Request(url);
    const response = await GET({ url } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.outdated).toBe(true);
  });

  it('returns outdated: false for fresh currency', async () => {
    (isCurrencyOutdated as any).mockResolvedValue(false);

    const url = new URL('http://localhost/api/exchange-rates/check?currency=EUR');
    const request = new Request(url);
    const response = await GET({ url } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.outdated).toBe(false);
  });

  it('returns 400 if currency parameter is missing', async () => {
    const url = new URL('http://localhost/api/exchange-rates/check');
    const response = await GET({ url } as any);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Currency parameter is required');
  });

  it('handles service errors gracefully', async () => {
    (isCurrencyOutdated as any).mockRejectedValue(new Error('Database error'));

    const url = new URL('http://localhost/api/exchange-rates/check?currency=USD');
    const response = await GET({ url } as any);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Failed to check currency status');
  });
});
