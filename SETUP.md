# ShibaSplit - Cloudflare D1 Setup Guide

This guide explains how to set up and use Cloudflare D1 SQL database with the ShibaSplit application.

## Prerequisites

1. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI** - Install globally: `npm install -g wrangler`
3. **Cloudflare API Token** - Create with D1 permissions

## Quick Start

### 1. Login to Cloudflare

```bash
wrangler login
```

### 2. Create D1 Database

```bash
# Create a new D1 database
wrangler d1 create shibasplit

# Note: Save the database ID from the output
```

### 3. Configure Database ID

Update `wrangler.toml` with your actual database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "shibasplit"
database_id = "your-actual-database-id"  # Replace this!
```

### 4. Run Migrations

Generate and apply database schema:

```bash
# Generate migration SQL
npm run db:generate

# Apply migrations locally (for development)
npm run d1:migrate

# Apply to production
wrangler d1 execute shibasplit --file ./drizzle/0001_*.sql --remote
```

### 5. Seed Database (Optional)

```bash
npm run d1:seed
```

## Development Workflow

### Local Development

The application automatically uses local SQLite (`db.sqlite`) when running in development mode:

```bash
npm run dev
```

### Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Pages:**
   ```bash
   # Configure your Cloudflare Pages project to use the output directory
   # Set the build command to: npm run build
   # Set the output directory to: build
   ```

3. **Connect to D1 Database:**
   - In Cloudflare Dashboard, go to your Pages project
   - Add environment variable: `D1_DATABASE_ID` = your database ID
   - Add binding for D1 in the project settings

## Database Management

### Creating New Migrations

```bash
# After modifying schema in src/lib/db/schema.ts
npm run db:generate
```

### Applying Migrations

```bash
# Local development
npm run d1:migrate

# Production
wrangler d1 execute shibasplit --file ./drizzle/0001_*.sql --remote
```

### Checking Database Status

```bash
# View database info
wrangler d1 info shibasplit

# List tables
wrangler d1 execute shibasplit --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### Backup Database

```bash
# Export database to SQL file
wrangler d1 export shibasplit --output backup.sql
```

## Environment Variables

### Development (Local)

The application uses local SQLite automatically. No configuration needed.

### Production (Cloudflare)

Add these environment variables to your Cloudflare Pages project:

- `D1_DATABASE_ID` - Your D1 database ID
- `CF_PAGES` - Set to "1" to enable D1 mode

## Architecture Notes

### Database Adapter

The application uses a dual-mode database adapter:

1. **Local Development**: Uses `better-sqlite3` with local SQLite file
2. **Production**: Uses `drizzle-orm/d1` with Cloudflare D1

The adapter automatically detects the environment and chooses the appropriate database connection.

### Schema Management

All database schemas are defined in `src/lib/db/schema.ts`. Drizzle ORM automatically generates migrations from these schemas.

### Migrations

Migrations are stored in the `drizzle/` directory and can be:
- Applied locally using `wrangler d1 execute --local`
- Applied to production using `wrangler d1 execute --remote`

## Troubleshooting

### Database Connection Errors

- Ensure `wrangler.toml` has the correct database ID
- Check that your Cloudflare API token has D1 permissions
- Verify the database exists in your Cloudflare account

### Migration Errors

- Ensure schema changes are committed before generating migrations
- Check migration SQL files for syntax errors
- Use `--local` flag for testing migrations before production

### Performance Tips

- D1 is serverless - connection pooling is automatic
- Use transactions for complex operations
- Index frequently queried columns
- Keep queries simple and avoid N+1 problems

## Useful Commands

```bash
# View all available wrangler commands
wrangler d1 --help

# Execute SQL directly
wrangler d1 execute shibasplit --command "SELECT * FROM expenses;"

# Interactive SQL shell
wrangler d1 shell shibasplit
```

## Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/commands/)

## Notes

- D1 is currently in beta - some features may change
- Database size limits apply (currently 100MB per database)
- Free tier includes 5 million reads per day
- Writes are billed per 1,000 operations
