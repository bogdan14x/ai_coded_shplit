import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import * as schema from './schema.ts';

// Detect if we're in a Cloudflare Worker environment
let db: any;

if (typeof process !== 'undefined' && process.env?.CF_PAGES) {
  // Cloudflare Pages environment - will be handled by the worker
  // This is a fallback that will be replaced at runtime
  db = null;
} else {
  // Local development with SQLite
  const sqlite = new Database('db.sqlite');
  db = drizzle(sqlite, { schema });
}

export { db };
export * from './schema';

// Export factory for Cloudflare D1
export function createD1DB(DB: any) {
  return drizzleD1(DB, { schema });
}
