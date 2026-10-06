import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

// The Garden alone is a workbench for working on it, not a page of the site: the Garden is found by
// carrying the Glasses off the Landing, so the built site has no /garden.
export const prerender = false;

export function load() {
	if (!dev) error(404, 'Not found');
}
