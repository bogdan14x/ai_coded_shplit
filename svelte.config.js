import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Cloudflare adapter configuration
		// See https://svelte.dev/docs/kit/adapter-cloudflare for more information
		adapter: adapter({
			// Default: "static" - Also available: "advanced"
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			},
			// Assets options
			assets: {
				fallback: null,
				version: Date.now().toString()
			},
			// Environment variables to pass to the worker
			envPrefix: 'CF_'
		}),
		// CSP (Content Security Policy) configuration
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'script-src': ['self']
			}
		}
	}
};

export default config;
