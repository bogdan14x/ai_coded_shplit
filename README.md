# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.12.5 create --template minimal --types ts --install npm .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Database Migrations

This project uses Drizzle ORM with Cloudflare D1 for production and SQLite for local development.

### Local Development (SQLite)

```sh
# Generate migrations
npm run db:generate

# Push schema changes to local SQLite
npm run db:push

# Seed local database
npm run d1:seed
```

### Production (Cloudflare D1)

```sh
# Create D1 database (one-time setup)
npm run d1:create

# Generate and apply migrations to D1
npm run d1:migrate

# Seed D1 database
npm run d1:seed
```

### Migration Workflow

1. **Make schema changes** in `src/lib/db/schema.ts`
2. **Generate migrations**: `npm run db:generate` (SQLite) or `npm run db:d1:generate` (D1)
3. **Review migration files** in `drizzle/` directory
4. **Apply migrations**: 
   - Local: `npm run db:push` (SQLite) or `npm run d1:migrate` (D1 local)
   - Production: `npm run d1:migrate` (sets `D1_LOCAL=false`)

### Environment Variables

- `D1_DATABASE_NAME`: Database name (default: `shibasplit`)
- `D1_DATABASE_ID`: Database ID (default: `dev`)
- `D1_LOCAL`: Set to `false` for production D1 migrations (default: `true`)
