import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import * as schema from './schema.ts';

// Database adapter that works with Cloudflare D1 (both production and local)
// For Cloudflare Pages, the DB binding is provided via the environment
// For local development, run `wrangler dev` which provides D1 bindings

// Export schema and types
export { schema };
export * from './schema';

// Export factory for Cloudflare D1 (used in hooks.server.ts)
export function createD1DB(DB: any) {
  return drizzleD1(DB, { schema });
}
