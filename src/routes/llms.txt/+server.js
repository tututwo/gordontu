import { categories, projects } from '$lib/project/project.js';
import { SITE, person } from '$lib/seo.js';

// For AI assistants (llmstxt.org): who Gordon is and every Project, in one short Markdown file.
export const prerender = true;

export function GET() {
	const sections = categories.flatMap(({ label, slug, description }) => [
		'',
		`## ${label}`,
		'',
		description,
		'',
		...projects
			.filter((p) => p.category === slug)
			.map((p) => {
				const made = [p.date.slice(0, 4), p.client && `for ${p.client}`, p.tools.join(', ')].filter(Boolean);
				return `- [${p.projectName}](${SITE}/${slug}/${p.slug}) (${made.join('; ')}): ${p.message}`;
			})
	]);
	const text = [
		`# ${person.name}`,
		'',
		`> ${person.description}`,
		'',
		'Gordon is a design engineer and cartographer based in the Bay Area. He has worked on design systems and AI workflows at Visa, and turned complex research into visualization tools for Yale and UC Berkeley. He designs and builds interactive 2D and 3D experiences with D3.js, Three.js with GLSL/TSL, React, Svelte, QGIS and Blender, with Claude Code and Codex across his toolkit.',
		'',
		`- Website: ${SITE}`,
		`- Contact: ${SITE}/contact`,
		...person.sameAs.map((url) => `- ${new URL(url).hostname.replace('www.', '')}: ${url}`),
		...sections,
		''
	].join('\n');
	return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
