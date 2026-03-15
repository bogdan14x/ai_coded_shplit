import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle config for local SQLite development
 * This config is used for local development with SQLite database
 * For D1 deployment, use wrangler commands directly
 */
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./db.sqlite',
  },
});
