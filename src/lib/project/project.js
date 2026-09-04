/**
 * @typedef {Object} Project
 * @property {string} projectName
 * @property {string} projectLink
 * @property {string} projectImgSource
 * @property {string[]} tools
 * @property {string} category
 * @property {string} date
 * @property {number} seed - deterministic sketch seed derived from projectName; the postcard
 *   back's rough.js drawing is seeded from it so a Project reads as one object
 * @property {string} slug - URL segment of the Project page (`/<category>/<slug>`), from projectName; unique
 */

/**
 * Canonical Project categories — `value` is stored on each Project (never rename it),
 * `slug` is the URL form (`/charts`); `label` and `description` feed the Landing nav, the
 * gallery chrome and each category page's meta.
 */
export const categories = [
	{
		value: 'charts',
		label: 'Charts',
		slug: 'charts',
		description: 'Charts that turn complex systems into clear, memorable stories.'
	},
	{
		value: 'maps',
		label: 'Maps',
		slug: 'maps',
		description: 'Spatial stories shaped through data, terrain, and careful craft.'
	},
	{
		value: 'code creatively',
		label: 'Creative coding',
		slug: 'creative-code',
		description: 'Interactive experiments built with Svelte, Three.js, D3, and GLSL.'
	}
];

/** @param {string} value */
export function categoryLabel(value) {
	return categories.find((category) => category.value === value)?.label ?? value;
}

/** @type {Omit<Project, 'seed' | 'slug'>[]} */
const data = [
	{
		projectName: "Gas Is Everywhere in California. Fast Charging Isn't.",
		projectLink: "/projects/Maps/isochrone-charging-stations.png",
		projectImgSource: "/projects/Maps/isochrone-charging-stations.png",
		tools: ["QGIS"],
		category: "maps",
		date: "2026-09-04",
	},
	{
		projectName: "Traveling Particles",
		projectLink: "https://traveling-particles.vercel.app/",
		projectImgSource: "/projects/CreativeCoding/three_us_road.png",
		tools: ["Three", "D3"],
		category: "code creatively",
		date: "2024-11-01",
	},
	{
		projectName: "California Affordable Housing",
		projectLink: "https://ternercenter.berkeley.edu/affordability-for-whom.html",
		projectImgSource: "/projects/Charts/svelte_california_housing.png",
		tools: ["Svelte", "D3"],
		category: "charts",
		date: "2023-11-01",
	},
	{
		projectName: "Election Map - 3D Visualization with Three.js and GLSL",
		projectLink: "https://vite-three-five.vercel.app/",
		projectImgSource: "/projects/Charts/three_election.png",
		tools: ["Three.js", "React.js"],
		category: "charts",
		date: "2023-11-01",
	},
	{
		projectName: "Brain Pulse Animation - Recreate Blue Yard Studio's Brain Pulse Animation",
		projectLink: "https://brain-impulse.vercel.app/",
		projectImgSource: "/projects/CreativeCoding/R3f-Brain.png",
		tools: ["Three.js", "React.js"],
		category: "code creatively",
		date: "2023-11-01",
	},
	{
		projectName: "Global Earthquakes - 3D Visualization with Three.js and Observable",
		projectLink: "https://earthquake-landingpage.vercel.app/",
		projectImgSource: "/projects/CreativeCoding/Earthquake.png",
		tools: ["Three.js", "Svelte.js"],
		category: "code creatively",
		date: "2023-03-01",
	},
	{
		projectName: "Stitching Heart, Blooming Flowers",
		projectLink: "https://beating-heart-phi.vercel.app/",
		projectImgSource: "/projects/CreativeCoding/R3f-Heart.png",
		tools: ["Three.js", "React.js"],
		category: "code creatively",
		date: "2023-02-01",
	},
	{
		projectName: "Spike Planet",
		projectLink: "https://spikey-planet.vercel.app/",
		projectImgSource: "/projects/CreativeCoding/R3f-spikey.png",
		tools: ["Three.js", "React.js"],
		category: "code creatively",
		date: "2023-03-01",
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
		projectImgSource: "/projects/Charts/d3_Himalayan.png",
		tools: ["Observable"],
		category: "charts",
		date: "2022-01-01",
	},
	{
		projectName: "Recreate: Why teachers are walking out of the classroom",
		projectLink: "https://teacher-svelte.netlify.app/",
		projectImgSource: "/projects/Charts/svelte_teacherSalary.png",
		tools: ["Svelte", "D3"],
		category: "charts",
		date: "2021-07-01",
	},
	{
		projectName: "Covid Monitoring Dashboard - China",
		projectLink: "https://www.chinacovidmonitor.org/",
		projectImgSource: "/projects/Charts/svelte-covid-cn.png",
		tools: ["Svelte", "D3", "R"],
		category: "charts",
		date: "2022-08-01",
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
		projectImgSource: "/projects/CreativeCoding/css-doodle-纹样.png",
		tools: ["CSS"],
		category: "code creatively",
		date: "2021-12-02",
	},
	{
		projectName: "Rotating 3D Cubes",
		projectLink: "https://observablehq.com/@tututwo/three-js-animated-cubes?collection=@tututwo/three-js-creative-coding-practice",
		projectImgSource: "/projects/CreativeCoding/Observable_GR_animateCubes.png",
		tools: ["Observable"],
		category: "code creatively",
		date: "2021-01-02",
	},
	{
		projectName: "Sunset Blob",
		projectLink: "https://observablehq.com/@tututwo/the-annual-ring-v2?collection=@tututwo/three-js-creative-coding-practice",
		projectImgSource: "/projects/CreativeCoding/Observable_GR_blobRing.png",
		tools: ["Observable"],
		category: "code creatively",
		date: "2021-01-09",
	},
	{
		projectName: "Rough Fried Eggs",
		projectLink: "https://observablehq.com/d/1d6edd39edb160e7?collection=@tututwo/three-js-creative-coding-practice",
		projectImgSource: "/projects/CreativeCoding/Observable_GR_circlePackingMerging.png",
		tools: ["Observable"],
		category: "code creatively",
		date: "2021-02-09",
	},
	{
		projectName: "Lili Pads",
		projectLink: "https://observablehq.com/d/86bf42953f2582bd?collection=@tututwo/three-js-creative-coding-practice",
		projectImgSource: "/projects/CreativeCoding/Observable_GR_lotusLeave.png",
		tools: ["Observable"],
		category: "code creatively",
		date: "2021-01-19",
	},
	{
		projectName: "Rough Squares",
		projectLink: "https://observablehq.com/@tututwo/rough-canvas-squares",
		projectImgSource: "/projects/CreativeCoding/Observable_GR_roughSquare.png",
		tools: ["Observable"],
		category: "code creatively",
		date: "2021-01-01",
	},
	{
		projectName: "GLSL SDF Practice Collection",
		projectLink: "https://observablehq.com/collection/@tututwo/sdf",
		projectImgSource: "/projects/CreativeCoding/Observable_SDF.png",
		tools: ["GLSL"],
		category: "code creatively",
		date: "2022-08-01",
	},
	{
		projectName: "Star Candy Ball",
		projectLink: "https://observablehq.com/d/027525671baa52b4",
		projectImgSource: "/projects/CreativeCoding/Observable-Star.png",
		tools: ["Observable"],
		category: "code creatively",
		date: "2022-12-01",
	},
	{
		projectName: "Flow Field 2D",
		projectLink: "https://observablehq.com/d/73794013ffa23a9c?collection=@tututwo/three-js-creative-coding-practice",
		projectImgSource: "/projects/CreativeCoding/Observable-flowfield.png",
		tools: ["Observable"],
		category: "code creatively",
		date: "2023-01-31",
	},
	{
		projectName: "Unfold a Chinese Lattern",
		projectLink: "https://observablehq.com/@tututwo/chinese-lantern",
		projectImgSource: "/projects/CreativeCoding/Observable_lattern.png",
		tools: ["Observable"],
		category: "code creatively",
		date: "2021-07-01",
	},
	{
		projectName: "Canvas Lightning",
		projectLink: "https://observablehq.com/@tututwo/lightning",
		projectImgSource: "/projects/CreativeCoding/Observable_lightning.png",
		tools: ["GLSL"],
		category: "code creatively",
		date: "2021-10-01",
	},
	{
		projectName: "Kois",
		projectLink: "https://observablehq.com/@tututwo/kois",
		projectImgSource: "/projects/CreativeCoding/Observable_kois.png",
		tools: ["Canvas"],
		category: "code creatively",
		date: "2022-09-10",
	},
	{
		projectName: "Developing and undeveloped countries remain to be the agricultural countries, made in QGIS",
		projectLink: "https://datawrapper.dwcdn.net/VjDoq/5/",
		projectImgSource: "/projects/Maps/map_datawrapper_agriculture.png",
		tools: ["Datawrapper"],
		category: "maps",
		date: "2020-12-10",
	},
	{
		projectName: "China Elevation",
		projectLink: "/projects/Maps/map_elevation_ridge.png",
		projectImgSource: "/projects/Maps/map_elevation_ridge.png",
		tools: ["QGIS", "Adobe Illustrator"],
		category: "maps",
		date: "2020-10-17",
	},
	{
		projectName: "Most buildings in Manhattan were built before 1960s",
		projectLink: "/projects/Maps/map_Manhattan.png",
		projectImgSource: "/projects/Maps/map_Manhattan_cover.png",
		tools: ["QGIS"],
		category: "maps",
		date: "2020-12-27",
	},
	{
		projectName: "Sichuan Basin Elevation",
		projectLink: "https://observablehq.com/d/299f845c1c4ba8fe",
		projectImgSource: "/projects/Maps/map_ridgelineSichuan.png",
		tools: ["Observable"],
		category: "maps",
		date: "2022-01-27",
	},
	{
		projectName: "The elevation of Jiangxi Province",
		projectLink: "/projects/Maps/map_shuimomap_shuimo.png",
		projectImgSource: "/projects/Maps/map_shuimomap_shuimo_cover.png",
		tools: ["QGIS"],
		category: "maps",
		date: "2020-11-07",
	},
	{
		projectName: "Two Dragons of China",
		projectLink: "/projects/Maps/map_twodragons.png",
		projectImgSource: "/projects/Maps/map_twodragons_cover.png",
		tools: ["QGIS"],
		category: "maps",
		date: "2020-11-27",
	},
];

/** Deterministic seed for the sketch renderers. @param {string} value */
export function hashName(value) {
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

/** `/projects/x.png` → `/projects-optimized/x.webp`; other sources pass through. @param {string} source */
export function toOptimizedImage(source) {
	if (!source.startsWith('/projects/')) return source;
	return source.replace('/projects/', '/projects-optimized/').replace(/\.[^.]+$/, '.webp');
}

/** Every Project, newest first, seeded for the sketch renderers, slugged for its page. */
export const projects = data
	.map((project) => ({
		...project,
		seed: hashName(project.projectName),
		slug: slugify(project.projectName)
	}))
	.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

if (new Set(projects.map((project) => project.slug)).size !== projects.length) {
	throw new Error('Duplicate project slug — rename the colliding projectName');
}
