import { error } from '@sveltejs/kit';
import { allProjects, categories, projects } from '$lib/project/project.js';

/** Each Postcard gallery with its Projects, gathered once. */
const galleries = [allProjects, ...categories].map((category) => ({
	category,
	projects: category === allProjects ? projects : projects.filter((p) => p.category === category.value)
}));

/** Every gallery, and every gallery with each of its postcards open. @type {import('./$types').EntryGenerator} */
export const entries = () =>
	galleries.flatMap(({ category, projects }) => [
		{ category: category.slug },
		...projects.map(({ slug }) => ({ category: category.slug, slug }))
	]);

/**
 * `/maps` is the Interactive maps gallery; `/maps/<slug>` is the same gallery with that postcard open.
 * @type {import('./$types').PageLoad}
 */
export function load({ params }) {
	const gallery = galleries.find(({ category }) => category.slug === params.category);
	if (!gallery) error(404, 'No such category');
	const opened = params.slug ? gallery.projects.find((p) => p.slug === params.slug) : null;
	if (opened === undefined) error(404, 'No such project');
	return { ...gallery, opened };
}
