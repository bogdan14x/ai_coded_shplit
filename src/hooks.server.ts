import type { Handle } from '@sveltejs/kit';
import { createD1DB } from '$lib/db';

// Cloudflare D1 database binding for SvelteKit
// This provides the D1 database to all server-side requests
export const handle: Handle = async ({ event, resolve }) => {
	// Get the D1 database binding from Cloudflare environment
	// In Cloudflare Pages, this is available via the DB binding
	// For local development, run `wrangler dev` which provides D1 bindings
	const DB = event.platform?.env?.DB;

	if (DB) {
		// Create Drizzle ORM instance with D1
		event.locals.db = createD1DB(DB);
	} else {
		// No D1 binding available - this is an error in the local development setup
		// The user should run `wrangler dev` instead of `vite dev`
		console.warn('Warning: No D1 database binding found. Please run `wrangler dev` for local development.');
		event.locals.db = null;
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
