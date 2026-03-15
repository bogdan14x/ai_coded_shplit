import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle config for Cloudflare D1 database
 * This config is used for generating migrations for D1
 * For local development, use drizzle.config.sqlite.ts instead
 */
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  // Note: D1 doesn't use dbCredentials.url - migrations are applied via wrangler
  dbCredentials: {
    url: 'file:./db.sqlite', // Placeholder for migration generation
  },
});
