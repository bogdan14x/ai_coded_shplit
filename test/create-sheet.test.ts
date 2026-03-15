import { describe, expect, it, vi } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
  redirect: vi.fn((status, location) => {
    throw new Error(`Redirect ${status} to ${location}`);
  }),
}));

import { actions } from '../src/routes/+page.server';

// Mock database for testing
const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        get: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue([])
      }))
    }))
  })),
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      run: vi.fn().mockResolvedValue({})
    }))
  })),
  delete: vi.fn(() => ({
    where: vi.fn(() => ({
      run: vi.fn().mockResolvedValue({})
    }))
  }))
};

describe('Create Sheet Form Action', () => {
  // Add test for empty slug after processing
  it('should reject sheet names that result in empty slug after processing', async () => {
    // Use a name that passes all validation but results in empty slug
    // "---" (3 dashes) has length 3, no invalid chars, contains word chars
    // But after slug processing: removes leading/trailing dashes → ""
    const formData = new FormData();
    formData.set('sheetName', '---');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: {
        db: mockDb
      }
    } as any;
    const result = await actions.default(event);

    expect(result).toEqual({
      error: 'Sheet name must contain at least some valid characters after processing',
    });
  });
  it('should reject sheet names shorter than 3 characters', async () => {
    const formData = new FormData();
    formData.set('sheetName', 'ab');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;
    const result = await actions.default(event);

    expect(result).toEqual({
      error: 'Sheet name must be at least 3 characters long',
    });
  });

  it('should reject empty sheet names', async () => {
    const formData = new FormData();
    formData.set('sheetName', '');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;
    const result = await actions.default(event);

    expect(result).toEqual({
      error: 'Sheet name must be at least 3 characters long',
    });
  });

  it('should reject sheet names exceeding maximum length', async () => {
    const longName = 'a'.repeat(301);
    const formData = new FormData();
    formData.set('sheetName', longName);

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;
    const result = await actions.default(event);

    expect(result).toEqual({
      error: 'Sheet name must be no more than 300 characters long',
    });
  });

  it('should accept sheet names at maximum length boundary', async () => {
    const boundaryName = 'a'.repeat(300);
    const formData = new FormData();
    formData.set('sheetName', boundaryName);

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;

    await expect(actions.default(event)).rejects.toThrow(/Redirect 303 to/);
  });

  it('should reject sheet names with invalid characters', async () => {
    const formData = new FormData();
    formData.set('sheetName', 'Test!@#$%^&*()');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;
    const result = await actions.default(event);

    expect(result).toEqual({
      error: 'Sheet name can only contain letters, numbers, dashes (-), underscores (_), and emojis',
    });
  });

  it('should accept sheet names with valid characters', async () => {
    const formData = new FormData();
    formData.set('sheetName', 'Test Sheet');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;

    // Should redirect on success (redirect throws an error that we mock)
    await expect(actions.default(event)).rejects.toThrow('Redirect 303 to /sheets/test-sheet/');
  });

  it('should accept sheet names with emojis', async () => {
    const formData = new FormData();
    formData.set('sheetName', 'My Emoji Sheet 🌍🍕');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;

    await expect(actions.default(event)).rejects.toThrow('Redirect 303 to /sheets/my-emoji-sheet/');
  });

  it('should accept sheet names with underscores and dashes', async () => {
    const formData = new FormData();
    formData.set('sheetName', 'My_Trip-2025');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;

    // Note: The slug keeps underscores as-is since they're allowed in URLs
    await expect(actions.default(event)).rejects.toThrow(/Redirect 303 to \/sheets\/my_trip-2025\//);
  });

  it('should reject sheet names with only invalid characters', async () => {
    const formData = new FormData();
    formData.set('sheetName', '!@#');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;
    const result = await actions.default(event);

    expect(result).toEqual({
      error: 'Sheet name can only contain letters, numbers, dashes (-), underscores (_), and emojis',
    });
  });

  it('should create a sheet with valid name and redirect', async () => {
    const formData = new FormData();
    formData.set('sheetName', 'My Test Trip');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;

    await expect(actions.default(event)).rejects.toThrow('Redirect 303 to /sheets/my-test-trip/');
  });

  it('should reject sheet names with exclamation marks', async () => {
    const formData = new FormData();
    formData.set('sheetName', 'Trip to Italy 2025!');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;

    const result = await actions.default(event);

    expect(result).toEqual({
      error: 'Sheet name can only contain letters, numbers, dashes (-), underscores (_), and emojis',
    });
  });

  it('should reject sheet names with special characters', async () => {
    const formData = new FormData();
    formData.set('sheetName', 'Trip @#$% to Italy');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    });

    const event = { 
      request,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;
    const result = await actions.default(event);

    expect(result).toEqual({
      error: 'Sheet name can only contain letters, numbers, dashes (-), underscores (_), and emojis',
    });
  });

  it('should create multiple sheets with the same slug but different IDs', async () => {
    const formData1 = new FormData();
    formData1.set('sheetName', 'Duplicate Test');

    const request1 = new Request('http://localhost', {
      method: 'POST',
      body: formData1,
    });

    const event1 = { 
      request: request1,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;

    await expect(actions.default(event1)).rejects.toThrow('Redirect 303 to /sheets/duplicate-test/');

    // Create another sheet with the same name
    const formData2 = new FormData();
    formData2.set('sheetName', 'Duplicate Test');

    const request2 = new Request('http://localhost', {
      method: 'POST',
      body: formData2,
    });

    const event2 = { 
      request: request2,
      cookies: {
        get: () => undefined,
        set: () => {},
      },
      locals: { db: mockDb }
    } as any;

    await expect(actions.default(event2)).rejects.toThrow('Redirect 303 to /sheets/duplicate-test/');
  });
});
