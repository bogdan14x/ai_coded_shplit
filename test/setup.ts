import { expect, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import { Miniflare } from 'miniflare';
import { readFileSync } from 'fs';
import { join } from 'path';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

export async function createTestDb() {
  const mf = new Miniflare({
    d1Databases: { DB: 'test-db' },
    script: 'addEventListener("fetch", (event) => event.respondWith(new Response("OK")));',
    modules: true,
    compatibilityDate: '2024-01-01',
  });
  
  const db = await mf.getD1Database('DB');
  
  // Apply migrations
  const migrationsPath = join(process.cwd(), 'drizzle');
  const migrationFiles = ['0000_green_titanium_man.sql', '0001_romantic_banshee.sql'];
  
  for (const file of migrationFiles) {
    const sql = readFileSync(join(migrationsPath, file), 'utf-8');
    await db.exec(sql);
  }
  
  return db;
}