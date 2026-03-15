import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.ts';

// Database adapter that works with both Cloudflare D1 and local SQLite
// For Cloudflare Pages, the DB binding is provided via the environment
// For local development, we use a SQLite file

// Export schema and types
export { schema };
export * from './schema';

// Export factory for Cloudflare D1 (used in hooks.server.ts)
export function createD1DB(DB: any) {
  return drizzleD1(DB, { schema });
}

// Export factory for local SQLite (used in tests and local dev)
export function createSQLiteDB() {
  const sqlite = new Database('db.sqlite');
  return drizzleSQLite(sqlite, { schema });
}

// Create a default database instance for backward compatibility
// This will be D1 in Cloudflare, SQLite locally
let dbInstance: any;

// Only create instance in Node.js environment (not in Cloudflare Workers)
if (typeof process !== 'undefined' && process.env) {
  // Check if we're in Cloudflare Pages
  if (process.env.CF_PAGES || process.env.CLOUDFLARE_ENV) {
    // In Cloudflare, db will be provided via hooks
    dbInstance = null;
  } else {
    // Local development
    dbInstance = createSQLiteDB();
  }
}

export const db = dbInstance;
