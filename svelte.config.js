import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Its own config, so it writes its Worker where worker.js imports it, not over worker.js.
		adapter: adapter({ config: 'wrangler.sveltekit.jsonc' }),
		// Root-relative asset links: a page's `./_app/…` stylesheet links would point under /maps/ once
		// the app moves to /maps/<slug>, where the Peel's snapdom looks them up (and got a 404).
		paths: { relative: false }
	}
};

export default config;
