import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Get the database ID from environment or use default
const databaseId = process.env.D1_DATABASE_ID || 'dev';
const databaseName = process.env.D1_DATABASE_NAME || 'shibasplit';

console.log(`🚀 Migrating database: ${databaseName} (${databaseId})`);

try {
  // Generate migration SQL
  console.log('📝 Generating migration SQL...');
  execSync('npx drizzle-kit generate --config drizzle.config.d1.ts', { stdio: 'inherit' });
  
  console.log('✅ Migration files generated successfully!');
  
  // For D1 deployment, you would run:
  // wrangler d1 execute shibasplit --local --file ./drizzle/0001_...sql
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
