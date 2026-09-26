import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		// Root-relative asset links: a page's `./_app/…` stylesheet links would point under /maps/ once
		// the app moves to /maps/<slug>, where the Peel's snapdom looks them up (and got a 404).
		paths: { relative: false }
	}
};

export default config;
