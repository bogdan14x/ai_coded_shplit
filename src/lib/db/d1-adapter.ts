import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema.ts';

// Create a D1 database adapter for Cloudflare Workers
export function createD1Adapter(DB: any) {
  return drizzle(DB, { schema });
}

// Export the schema for use in migrations
export { schema };