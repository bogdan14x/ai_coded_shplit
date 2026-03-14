import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import { updateOutdatedRatesInBackground } from '$lib/services/outdatedCurrencyService';

// Mock the service
vi.mock('$lib/services/outdatedCurrencyService', () => ({
  updateOutdatedRatesInBackground: vi.fn()
}));

describe('POST /api/exchange-rates/update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initiates background update and returns success', async () => {
    (updateOutdatedRatesInBackground as any).mockResolvedValue(undefined);

    const request = new Request('http://localhost/api/exchange-rates/update', {
      method: 'POST'
    });
    const response = await POST({ request } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('Background update initiated');
    
    // Verify the background update was called (async)
    expect(updateOutdatedRatesInBackground).toHaveBeenCalled();
  });

  it('handles errors gracefully', async () => {
    (updateOutdatedRatesInBackground as any).mockRejectedValue(new Error('API Error'));

    const request = new Request('http://localhost/api/exchange-rates/update', {
      method: 'POST'
    });
    const response = await POST({ request } as any);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Failed to initiate background update');
  });
});
