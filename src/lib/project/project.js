/**
 * @typedef {Object} Project
 * @property {string} projectName
 * @property {string} [projectLink] - the Project's own web page; absent when the Project is its image
 * @property {string} projectImgSource - the image: an external URL, or its webp under `/projects-optimized/`
 * @property {string} [projectVideoSource] - a short muted 16:9 clip, served as is; the Project card plays it
 *   over the image while a mouse is on the card
 * @property {string[]} tools
 * @property {string} category - its category's `slug`
 * @property {string} date
 * @property {string} [client] - who it was made for, by name; absent means Personal
 * @property {boolean} [featured] - shown as a Project card on the landing's projects tab
 * @property {number} [pinned] - its place at the top of the projects tab (1 first); unpinned cards follow, newest first
 * @property {number} seed - deterministic seed derived from projectName; the Postcard gallery
 *   scatters and tilts the Project's postcard from it, so it lands in the same spot on every visit
 * @property {string} slug - URL segment of the Project's open postcard (`/<gallery>/<slug>`), from projectName; unique
 */

/**
 * Canonical Project categories — `slug` is stored on each Project and is the URL form (`/charts`);
 * `label` and `description` feed the landing's Category links, the gallery chrome and each category
 * page's meta.
 */
export const categories = [
	{
		label: 'Visual stories',
		slug: 'charts',
		description: 'Charts that turn complex systems into clear, memorable stories.'
	},
	{
		label: 'Interactive maps',
		slug: 'maps',
		description: 'Spatial stories shaped through data, terrain, and careful craft.'
	},
	{
		label: 'Web tools',
		slug: 'creative-code',
		description: 'Interactive experiments built with Svelte, Three.js, D3, and GLSL.'
	}
];

/**
 * The Postcard gallery of every Project (`/all`), shaped like a category so the gallery takes either.
 * No Project is stored with its slug.
 */
export const allProjects = {
	label: 'All projects',
	slug: 'all',
	description: 'Every map, story, and tool, on one table.'
};

/** @param {string} slug */
export function categoryLabel(slug) {
	return categories.find((category) => category.slug === slug)?.label ?? slug;
}

/** A Project's date as its postcard's back sets it (Mar 2024). @param {string} value ISO date */
export function formatDate(value) {
	return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

/** @type {Omit<Project, 'seed' | 'slug'>[]} */
const data = [
	{
		projectName: "Nadir San Francisco",
		projectLink: "https://fov-eosin.vercel.app/",
		projectImgSource: "/projects-optimized/Maps/nadir-sf/nadir-sf-cover.webp",
		projectVideoSource: "/projects-optimized/Maps/nadir-sf/nadir-sf-card.mp4",
		tools: ["Three.js", "React.js", "GLSL", "GSAP"],
		category: "maps",
		date: "2026-09-28",
		featured: true,
	},
	{
		projectName: "Black Hole",
		projectLink: "https://black-whole-omega.vercel.app/",
		projectImgSource: "/projects-optimized/CreativeCoding/black-hole/black-hole-cover.webp",
		tools: ["Three.js", "React.js"],
		category: "creative-code",
		date: "2026-09-28",
	},
	{
		projectName: "Voronoi Studies",
		projectLink: "https://voronoi-butterfly.vercel.app/",
		projectImgSource: "/projects-optimized/CreativeCoding/voronoi-studies/voronoi-studies-cover.webp",
		projectVideoSource: "/projects-optimized/CreativeCoding/voronoi-studies/voronoi-studies-card.mp4",
		tools: ["Three.js", "React.js", "GLSL"],
		category: "creative-code",
		date: "2026-09-28",
		featured: true,
	},
	{
		projectName: "Rain Relief",
		projectLink: "https://us-rain.vercel.app/",
		projectImgSource: "/projects-optimized/Maps/rain-relief/rain-relief-cover.webp",
		projectVideoSource: "/projects-optimized/Maps/rain-relief/rain-relief-card.mp4",
		tools: ["Three.js", "React.js", "GLSL", "Python"],
		category: "maps",
		date: "2026-09-27",
		featured: true,
	},
	{
		projectName: "Foldable Map",
		projectLink: "https://foldable-map-sigma.vercel.app/",
		projectImgSource: "/projects-optimized/Maps/foldable-map/foldable-map-cover.webp",
		projectVideoSource: "/projects-optimized/Maps/foldable-map/foldable-map-card.mp4",
		tools: ["Svelte", "Three.js", "GLSL", "GSAP"],
		category: "maps",
		date: "2026-09-26",
		featured: true,
		pinned: 3,
	},
	{
		projectName: "Average Color of America",
		projectImgSource: "/projects-optimized/Maps/us-color/us-color-cover.webp",
		projectVideoSource: "/projects-optimized/Maps/us-color/us-color-card.mp4",
		tools: ["Python", "NumPy", "GeoPandas"],
		category: "maps",
		date: "2026-09-24",
		featured: true,
	},
	{
		projectName: "Erhai Moon",
		projectLink: "https://erhai-diorama.vercel.app/?zhongqiu",
		projectImgSource: "/projects-optimized/Maps/erhai/erhai-zhongqiu-cover.webp",
		projectVideoSource: "/projects-optimized/Maps/erhai/erhai-zhongqiu-card.mp4",
		tools: ["Three.js", "React.js", "GLSL", "Blender"],
		category: "maps",
		date: "2026-09-25",
		featured: true,
	},
	{
		projectName: "Gas Is Everywhere in California. Fast Charging Isn't.",
		projectImgSource: "/projects-optimized/Maps/isochrone-charging-stations.webp",
		tools: ["QGIS"],
		category: "maps",
		date: "2026-09-04",
	},
	{
		projectName: "YPCCC Hazard Tool",
		projectLink: "https://ypccc-hazard-tool.vercel.app/?hazard=heat__perception_reality_gap&state=0&county=00000&exploreMode=0",
		projectImgSource: "/projects-optimized/Maps/ypccc-hazard-tool.webp",
		tools: ["React.js", "MapLibre", "D3", "deck.gl"],
		category: "maps",
		date: "2026-04-01",
		client: "Yale University",
		featured: true,
		pinned: 2,
	},
	// {
	// 	projectName: "Poyang Lake Entered the Dry Season 100 Days Earlier",
	// 	projectImgSource: "/projects-optimized/Maps/map_poyang.webp",
	// 	tools: ["QGIS"],
	// 	category: "maps",
	// 	date: "2022-09-01",
	// 	featured: true,
	// },
	{
		projectName: "Traveling Particles",
		projectLink: "https://traveling-particles.vercel.app/",
		projectImgSource: "/projects-optimized/CreativeCoding/three_us_road.webp",
		tools: ["Three", "D3"],
		category: "creative-code",
		date: "2024-11-01",
	},
	{
		projectName: "California Affordable Housing",
		projectLink: "https://ternercenter.berkeley.edu/affordability-for-whom.html",
		projectImgSource: "/projects-optimized/Charts/svelte_california_housing.webp",
		tools: ["Svelte", "D3"],
		category: "charts",
		date: "2023-11-01",
		client: "Terner Center for Housing Innovation, UC Berkeley",
		featured: true,
	},
	{
		projectName: "Presidential Margins, 1868–2020",
		projectLink: "https://vite-three-chi.vercel.app/",
		projectImgSource: "/projects-optimized/Charts/election-3d/election-3d-cover.webp",
		projectVideoSource: "/projects-optimized/Charts/election-3d/election-3d-card.mp4",
		tools: ["Three.js", "React.js", "GLSL", "D3"],
		category: "charts",
		date: "2026-09-25",
		featured: true,
		pinned: 1,
	},
	{
		projectName: "Number of Chinese Company Infrastructure in the US and Abroad.",
		projectLink: "https://twitter.com/tu_yukun/status/1646917464767225862/photo/1",
		projectImgSource: "https://pbs.twimg.com/media/FtcYkEzXoAAxtcw?format=png&name=medium",
		tools: ["Observable"],
		category: "charts",
		date: "2023-04-01",
	},
	{
		projectName: "Number of Middle Age Himalayan Climbers Is Increasing Over Time",
		projectLink: "https://observablehq.com/@tututwo/himalayan-ridge",
		projectImgSource: "/projects-optimized/Charts/d3_Himalayan.webp",
		tools: ["Observable"],
		category: "charts",
		date: "2022-01-01",
	},
	{
		projectName: "Covid Monitoring Dashboard - China",
		projectLink: "https://covid-dashboard-orcin.vercel.app/",
		projectImgSource: "/projects-optimized/Charts/svelte-covid-cn.webp",
		tools: ["Svelte", "D3", "R"],
		category: "charts",
		date: "2022-08-01",
		client: "World Bank",
	},
	{
		projectName: "How dry would each state be if Americans only consumed local state-produced beer?",
		projectLink: "https://twitter.com/_tuyukun/status/1281702418581827584",
		projectImgSource: "https://pbs.twimg.com/media/EcmEau_UMAAat7E?format=jpg&name=4096x4096",
		tools: ["R"],
		category: "charts",
		date: "2020-12-10",
	},
	{
		projectName: "How much money did award-winning shows earn before the award date?",
		projectLink: "https://twitter.com/_tuyukun/status/1297733577849765888/photo/1",
		projectImgSource: "https://pbs.twimg.com/media/EgJ5z45UMAA1-dD?format=png&name=medium",
		tools: ["R"],
		category: "charts",
		date: "2021-01-10",
	},
	{
		projectName: "CSS Doodle Chinese Pattern",
		projectLink: "https://codepen.io/collection/LPePxy",
		projectImgSource: "/projects-optimized/CreativeCoding/css-doodle-纹样.webp",
		tools: ["CSS"],
		category: "creative-code",
		date: "2021-12-02",
	},
	{
		projectName: "Rough Fried Eggs",
		projectLink: "https://observablehq.com/d/1d6edd39edb160e7?collection=@tututwo/three-js-creative-coding-practice",
		projectImgSource: "/projects-optimized/CreativeCoding/Observable_GR_circlePackingMerging.webp",
		tools: ["Observable"],
		category: "creative-code",
		date: "2021-02-09",
	},
	{
		projectName: "GLSL SDF Practice Collection",
		projectLink: "https://observablehq.com/collection/@tututwo/sdf",
		projectImgSource: "/projects-optimized/CreativeCoding/Observable_SDF.webp",
		tools: ["GLSL"],
		category: "creative-code",
		date: "2022-08-01",
	},
	{
		projectName: "Flow Field 2D",
		projectLink: "https://observablehq.com/d/73794013ffa23a9c?collection=@tututwo/three-js-creative-coding-practice",
		projectImgSource: "/projects-optimized/CreativeCoding/Observable-flowfield.webp",
		tools: ["Observable"],
		category: "creative-code",
		date: "2023-01-31",
	},
	{
		projectName: "Kois",
		projectLink: "https://observablehq.com/@tututwo/kois",
		projectImgSource: "/projects-optimized/CreativeCoding/Observable_kois.webp",
		tools: ["Canvas"],
		category: "creative-code",
		date: "2022-09-10",
	},
	{
		projectName: "Developing and undeveloped countries remain to be the agricultural countries, made in QGIS",
		projectLink: "https://datawrapper.dwcdn.net/VjDoq/5/",
		projectImgSource: "/projects-optimized/Maps/map_datawrapper_agriculture.webp",
		tools: ["Datawrapper"],
		category: "maps",
		date: "2020-12-10",
	},
	{
		projectName: "China Elevation",
		projectImgSource: "/projects-optimized/Maps/map_elevation_ridge.webp",
		tools: ["QGIS", "Adobe Illustrator"],
		category: "maps",
		date: "2020-10-17",
	},
	{
		projectName: "Most buildings in Manhattan were built before 1960s",
		projectImgSource: "/projects-optimized/Maps/map_Manhattan_cover.webp",
		tools: ["QGIS"],
		category: "maps",
		date: "2020-12-27",
	},
	{
		projectName: "Sichuan Basin Elevation",
		projectLink: "https://observablehq.com/d/299f845c1c4ba8fe",
		projectImgSource: "/projects-optimized/Maps/map_ridgelineSichuan.webp",
		tools: ["Observable"],
		category: "maps",
		date: "2022-01-27",
	},
	{
		projectName: "The elevation of Jiangxi Province",
		projectImgSource: "/projects-optimized/Maps/map_shuimomap_shuimo_cover.webp",
		tools: ["QGIS"],
		category: "maps",
		date: "2020-11-07",
	},
	{
		projectName: "Two Dragons of China",
		projectImgSource: "/projects-optimized/Maps/map_twodragons_cover.webp",
		tools: ["QGIS"],
		category: "maps",
		date: "2020-11-27",
	},
];

/** Deterministic seed for the postcard scatter. @param {string} value */
function hashName(value) {
	let result = 0;
	for (let index = 0; index < value.length; index += 1) {
		result = (result * 31 + value.charCodeAt(index)) >>> 0;
	}
	return result;
}

/** URL segment for a Project name: lower-case, runs of non-alphanumerics become one dash. @param {string} value */
export function slugify(value) {
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/** Every Project, newest first (ISO dates sort as strings), seeded for the postcard scatter, slugged for its URL. */
export const projects = data
	.map((project) => ({
		...project,
		seed: hashName(project.projectName),
		slug: slugify(project.projectName)
	}))
	.sort((a, b) => b.date.localeCompare(a.date));

if (new Set(projects.map((project) => project.slug)).size !== projects.length) {
	throw new Error('Duplicate project slug — rename the colliding projectName');
}
