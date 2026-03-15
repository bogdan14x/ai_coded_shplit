import { execSync } from 'child_process';

const databaseName = process.env.D1_DATABASE_NAME || 'shibasplit';

console.log(`🚀 Initializing local database: ${databaseName}`);

try {
  // Run a harmless command to ensure the local DB file is created
  // This triggers Wrangler to create the local database file if it doesn't exist
  execSync(`npx wrangler d1 execute ${databaseName} --local --command "SELECT 1"`, { stdio: 'inherit' });
  console.log('✅ Local database initialized successfully!');
} catch (error) {
  console.error('❌ Failed to initialize local database:', error);
  process.exit(1);
}
