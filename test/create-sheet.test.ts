import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
  redirect: vi.fn((status, location) => {
    throw new Error(`Redirect ${status} to ${location}`);
  }),
}));

import { eq } from 'drizzle-orm';
import { db } from '../src/lib/db';
import { sheets } from '../src/lib/db/schema';
import { actions } from '../src/routes/+page.server';

// Track sheets created during tests for cleanup
const createdSheetSlugs: string[] = [];

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
      }
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
      }
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
      }
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
      }
    } as any;

    await expect(actions.default(event)).rejects.toThrow(/Redirect 303 to/);
    
    // Track for cleanup (uses sanitized slug)
    createdSheetSlugs.push('a'.repeat(300));
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
      }
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
      }
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
      }
    } as any;

    await expect(actions.default(event)).rejects.toThrow('Redirect 303 to /sheets/my-emoji-sheet/');

    const sheet = db.select().from(sheets).where(eq(sheets.slug, 'my-emoji-sheet')).get();

    expect(sheet).toBeDefined();
    expect(sheet?.name).toBe('My Emoji Sheet 🌍🍕');
    expect(sheet?.slug).toBe('my-emoji-sheet');
    
    // Track for cleanup
    createdSheetSlugs.push('my-emoji-sheet');
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
      }
    } as any;

    // Note: The slug keeps underscores as-is since they're allowed in URLs
    await expect(actions.default(event)).rejects.toThrow(/Redirect 303 to \/sheets\/my_trip-2025\//);

    const sheet = db.select().from(sheets).where(eq(sheets.slug, 'my_trip-2025')).get();

    expect(sheet).toBeDefined();
    expect(sheet?.name).toBe('My_Trip-2025');
    
    // Track for cleanup
    createdSheetSlugs.push('my_trip-2025');
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
      }
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
      }
    } as any;

    await expect(actions.default(event)).rejects.toThrow('Redirect 303 to /sheets/my-test-trip/');

    // Check if sheet was created in the database
    const sheet = db.select().from(sheets).where(eq(sheets.slug, 'my-test-trip')).get();

    expect(sheet).toBeDefined();
    expect(sheet?.name).toBe('My Test Trip');
    expect(sheet?.slug).toBe('my-test-trip');
    expect(sheet?.nanoid).toBeDefined();
    expect(sheet?.nanoid.length).toBeGreaterThan(0);
    
    // Track for cleanup
    createdSheetSlugs.push('my-test-trip');
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
      }
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
      }
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
      }
    } as any;

    await expect(actions.default(event1)).rejects.toThrow('Redirect 303 to /sheets/duplicate-test/');

    // Get all sheets with this slug before creating the second one
    const sheetsBefore = db.select().from(sheets).where(eq(sheets.slug, 'duplicate-test')).all();
    const id1 = sheetsBefore[0]?.id;

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
      }
    } as any;

    await expect(actions.default(event2)).rejects.toThrow('Redirect 303 to /sheets/duplicate-test/');

    // Get all sheets with this slug after creating the second one
    const sheetsAfter = db.select().from(sheets).where(eq(sheets.slug, 'duplicate-test')).all();
    const id2 = sheetsAfter[sheetsAfter.length - 1]?.id;

    // Should have 2 sheets with the same slug
    expect(sheetsAfter.length).toBeGreaterThanOrEqual(2);
    
    // Both sheets should have different IDs
    expect(id1).not.toBe(id2);
    
    // Both sheets should have the same slug
    expect(sheetsAfter[0]?.slug).toBe('duplicate-test');
    expect(sheetsAfter[1]?.slug).toBe('duplicate-test');
    
    // Track for cleanup
    createdSheetSlugs.push('duplicate-test');
  });

  afterAll(() => {
    // Clean up all sheets created during tests
    createdSheetSlugs.forEach(slug => {
      db.delete(sheets).where(eq(sheets.slug, slug)).run();
    });
  });
});
