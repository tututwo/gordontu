import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

// A stage for filming the demo video's ending, not a page of the site: only the dev server has it.
export const prerender = false;

export function load() {
	if (!dev) error(404);
}
