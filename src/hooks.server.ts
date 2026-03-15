import type { Handle } from '@sveltejs/kit';
import { createD1DB, createSQLiteDB } from '$lib/db';

// Cloudflare D1 database binding for SvelteKit
// This provides the D1 database to all server-side requests
export const handle: Handle = async ({ event, resolve }) => {
	// Get the D1 database binding from Cloudflare environment
	// In Cloudflare Pages, this is available via the DB binding
	const DB = event.platform?.env?.DB;

	if (DB) {
		// Create Drizzle ORM instance with D1
		event.locals.db = createD1DB(DB);
	} else {
		// Fallback to local SQLite for development
		event.locals.db = createSQLiteDB();
	}

	return resolve(event);
};

// Extend the RequestEvent type to include our db property
declare global {
	namespace App {
		interface Locals {
			db: any;
		}
		interface Platform {
			env?: {
				DB?: any; // D1Database type
			};
		}
	}
}

export {};
