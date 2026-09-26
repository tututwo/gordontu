// Run with `node src/lib/peel.check.js`: going into a gallery, or along the rail, peels the page on;
// coming out, or back along the rail, peels it back; the landing's tabs and a gallery's own postcards
// change the page without a peel.
import { direction } from './peel.js';

/** @param {unknown} condition @param {string} message */
function assert(condition, message) {
	if (!condition) throw new Error(message);
}

/** @param {string} id @param {Record<string, string>} [params] */
const at = (id, params = {}) => /** @type {import('@sveltejs/kit').NavigationTarget} */ ({ route: { id }, params });
const landing = at('/(home)');
const projects = at('/(home)/projects');
const maps = at('/[category]/[[slug]]', { category: 'maps' });
const moon = at('/[category]/[[slug]]', { category: 'maps', slug: 'erhai-moon' });
const all = at('/[category]/[[slug]]', { category: 'all' });

assert(direction(landing, projects) === 0, "the landing's tabs don't peel");
assert(direction(maps, moon) === 0 && direction(moon, maps) === 0, "opening and closing a postcard doesn't peel");
assert(direction(landing, maps) === 1 && direction(projects, moon) === 1, 'into a gallery peels on');
assert(direction(maps, landing) === -1, 'out of a gallery peels back');
assert(direction(all, maps) === 1 && direction(maps, all) === -1, 'along the rail peels on, back along it back');

console.log('peel: ok');
