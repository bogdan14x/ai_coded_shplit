# Cloudflare D1 Deployment Guide

This guide will help you wire up your D1 database and deploy ShibaSplit to Cloudflare.

## Prerequisites

1. Cloudflare account (✓ done)
2. Cloudflare API token with D1 permissions (✓ ready)

## Step 1: Set Environment Variable

Before creating the database, set your Cloudflare API token as an environment variable:

```bash
export CLOUDFLARE_API_TOKEN="your-api-token-here"
```

Or add it to your shell profile (`.zshrc`, `.bashrc`, etc.) for persistence:

```bash
echo 'export CLOUDFLARE_API_TOKEN="your-api-token-here"' >> ~/.zshrc
source ~/.zshrc
```

## Step 2: Create D1 Database

Run the create command:

```bash
wrangler d1 create shibasplit
```

**Expected Output:**
```
✅ Successfully created D1 database 'shibasplit'
{
  "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "name": "shibasplit",
  "version": "beta",
  "created_at": "2026-03-15T15:37:16.123Z"
}
```

**Important:** Copy the `uuid` - this is your database ID.

## Step 3: Configure wrangler.toml

Update `wrangler.toml` with your actual database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "shibasplit"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← Replace with your UUID
```

## Step 4: Generate Migrations

Generate the database schema migrations:

```bash
npm run db:generate
```

This creates SQL files in the `drizzle/` directory.

## Step 5: Apply Migrations Locally

Test the migrations locally first:

```bash
npm run d1:migrate
```

This applies migrations to your local D1 database.

## Step 6: Deploy to Cloudflare Pages

### Option A: Using Wrangler (Recommended)

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Create a Cloudflare Pages project:**
   ```bash
   wrangler pages project create shibasplit
   ```

3. **Upload the build output:**
   ```bash
   wrangler pages deploy ./build \
     --project-name=shibasplit \
     --branch=main
   ```

4. **Link D1 database to Pages:**
   ```bash
   wrangler pages link shibasplit --d1=DB --d1-database=shibasplit
   ```

### Option B: Using Cloudflare Dashboard

1. **Go to Cloudflare Dashboard** → Workers & Pages → Create Application
2. **Connect your Git repository** (GitHub, GitLab, etc.)
3. **Configure build settings:**
   - Build command: `npm run build`
   - Build output directory: `build`
4. **Add environment variables:**
   - `D1_DATABASE_ID` = your-database-uuid
5. **Add D1 binding:**
   - In project settings → Variables → Add binding
   - Binding name: `DB`
   - Database: `shibasplit`

## Step 7: Apply Migrations to Production

After deploying to Cloudflare Pages, apply migrations to the production database:

```bash
# Apply all migrations
wrangler d1 execute shibasplit --remote --file ./drizzle/0001_*.sql

# Or apply specific migration
wrangler d1 execute shibasplit --remote --file ./drizzle/0001_initial.sql
```

## Step 8: Seed Production Database (Optional)

If you want to seed your production database with initial data:

```bash
# Create a seed script for production
# Then run it against your production database
wrangler d1 execute shibasplit --remote --command "SELECT * FROM expenses LIMIT 1;"
```

## Complete Deployment Script

Here's a complete script to automate deployment:

```bash
#!/bin/bash

# Set your API token
export CLOUDFLARE_API_TOKEN="your-token-here"

echo "🚀 Starting Cloudflare D1 deployment..."

# Step 1: Create database (if not exists)
echo "Creating D1 database..."
wrangler d1 create shibasplit 2>/dev/null || echo "Database already exists"

# Step 2: Generate migrations
echo "Generating migrations..."
npm run db:generate

# Step 3: Apply migrations locally
echo "Applying migrations locally..."
npm run d1:migrate

# Step 4: Build application
echo "Building application..."
npm run build

# Step 5: Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
wrangler pages deploy ./build --project-name=shibasplit

# Step 6: Apply migrations to production
echo "Applying migrations to production..."
wrangler d1 execute shibasplit --remote --file ./drizzle/0001_*.sql

echo "✅ Deployment complete!"
```

## Verify Deployment

1. **Check database contents:**
   ```bash
   wrangler d1 execute shibasplit --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
   ```

2. **Test your application:**
   - Visit your Cloudflare Pages URL
   - Create a test expense
   - Verify data persists

## Troubleshooting

### Database not found
```bash
# List all your D1 databases
wrangler d1 list
```

### Migration errors
```bash
# Check migration files
ls -la drizzle/

# View specific migration
cat drizzle/0001_initial.sql
```

### Connection issues
```bash
# Test API token
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/accounts
```

## Useful Commands

```bash
# List all databases
wrangler d1 list

# View database info
wrangler d1 info shibasplit

# Execute SQL directly
wrangler d1 execute shibasplit --command "SELECT COUNT(*) FROM expenses;"

# Export database
wrangler d1 export shibasplit --output backup.sql

# Interactive shell
wrangler d1 shell shibasplit
```

## Next Steps

1. Monitor your application at your Cloudflare Pages URL
2. Set up custom domain if needed
3. Configure analytics and monitoring
4. Set up automated backups

## Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Commands](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Drizzle ORM with D1](https://orm.drizzle.team/docs/get-started-sqlite#d1)

Need help? Check the SETUP.md file for more detailed information.
