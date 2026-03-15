import { execSync } from 'child_process';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// Get the database ID from environment or use default
const databaseId = process.env.D1_DATABASE_ID || 'dev';
const databaseName = process.env.D1_DATABASE_NAME || 'shibasplit';
const isLocal = process.env.D1_LOCAL !== 'false'; // Default to local, set D1_LOCAL=false for production

console.log(`🚀 Migrating database: ${databaseName} (${databaseId})`);
console.log(`📍 Mode: ${isLocal ? 'local (SQLite)' : 'production (D1)'}`);

try {
  // Generate migration SQL first
  console.log('📝 Generating migration SQL...');
  // Use SQLite config for migration generation (D1 uses SQLite format)
  execSync('npx drizzle-kit generate --config drizzle.config.sqlite.ts', { stdio: 'inherit' });
  
  console.log('✅ Migration files generated successfully!');
  
  // Get all migration files from drizzle directory
  const drizzleDir = './drizzle';
  const files = readdirSync(drizzleDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure files are sorted alphabetically (0000, 0001, etc.)
  
  if (files.length === 0) {
    console.log('ℹ️  No migration files found to apply');
    process.exit(0);
  }
  
  console.log(`📄 Found ${files.length} migration file(s):`);
  files.forEach(file => {
    console.log(`   - ${file}`);
  });
  
  // Apply migrations sequentially
  console.log('\n🔄 Applying migrations sequentially...');
  
  for (const file of files) {
    const filePath = join(drizzleDir, file);
    console.log(`   Applying: ${file}`);
    
    if (isLocal) {
      // Local SQLite migration
      execSync(`npx wrangler d1 execute ${databaseName} --local --file ${filePath}`, { stdio: 'inherit' });
    } else {
      // Production D1 migration
      execSync(`npx wrangler d1 execute ${databaseName} --file ${filePath}`, { stdio: 'inherit' });
    }
    
    console.log(`   ✅ Applied: ${file}`);
  }
  
  console.log('\n✅ All migrations applied successfully!');
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
