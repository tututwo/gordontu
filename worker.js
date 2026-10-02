// The deployed Worker: SvelteKit's, plus byte ranges for the project videos. Workers static assets
// answer a Range request with the whole file, and Safari won't play a <video> without a 206, so
// wrangler.jsonc sends *.mp4 requests here before the assets.
import sveltekit from './.svelte-kit/cloudflare/_worker.js';
import { partial } from './src/lib/server/range.js';

export default {
	/**
	 * @param {Request} request
	 * @param {{ ASSETS: { fetch: typeof fetch } }} env
	 * @param {ExecutionContext} ctx
	 */
	async fetch(request, env, ctx) {
		const range = request.headers.get('Range');
		if (range) {
			// ponytail: reads the whole file per range; fine for card-sized videos (≤ 3 MB), stream a slice if they grow.
			const asset = await env.ASSETS.fetch(request.url);
			if (asset.ok) return partial(await asset.arrayBuffer(), range, asset.headers);
		}
		return sveltekit.fetch(request, env, ctx);
	}
};
