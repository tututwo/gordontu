/**
 * @typedef {Object} Project
 * @property {string} projectName
 * @property {string} [projectLink] - the Project's own web page; absent when the Project is its image
 * @property {string} projectImgSource - the image: an external URL, or its webp under `/projects-optimized/`
 * @property {string} [projectVideoSource] - a short muted 16:9 clip, served as is; the Project card plays it
 *   over the image while a mouse is on the card
 * @property {string} [message] - its Message: what its postcard's back says, in one to three sentences,
 *   on what it is and what a visitor can do with it; absent until written
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
 * Canonical Project categories — `slug` is stored on each Project and is the URL form (`/data-visualization`);
 * `label` and `description` feed the landing's Category links, the gallery chrome and each category
 * page's meta.
 */
export const categories = [
	{
		label: 'Data visualization',
		slug: 'data-visualization',
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
		projectName: "City Atlas",
		message: "San Francisco drawn as an illustrated 3D city from open data on its buildings, streets, shoreline and terrain. Pan and zoom, jump between neighborhoods, or curl a district into a small planet.",
		projectLink: "https://gordontu.com/maps/city-atlas/live/",
		projectImgSource: "/projects-optimized/Maps/city-atlas/city-atlas-cover.webp",
		projectVideoSource: "/projects-optimized/Maps/city-atlas/city-atlas-card.mp4",
		tools: ["Three.js", "React.js", "GLSL", "GSAP"],
		category: "maps",
		date: "2026-09-28",
		featured: true,
	},
	{
		projectName: "Black Hole",
		message: "A study of Maxime Heckel's black hole, itself after Melissa Rodriguez's artwork: 200 animated dashed curves ringing an event horizon. Drag to orbit, zoom, pause, or turn the rings from color to white.",
		projectLink: "https://gordontu.com/creative-code/black-hole/live/",
		projectImgSource: "/projects-optimized/CreativeCoding/black-hole/black-hole-cover.webp",
		tools: ["Three.js", "React.js"],
		category: "creative-code",
		date: "2026-09-28",
	},
	{
		projectName: "Voronoi Studies",
		message: "Voronoi mosaics rebuilt every frame, grown from a study of a butterfly animation: butterflies of blue-and-white porcelain, and cherry blossom the wind takes cell by cell. Scrub, record a loop, or tune it.",
		projectLink: "https://gordontu.com/creative-code/voronoi-studies/live/",
		projectImgSource: "/projects-optimized/CreativeCoding/voronoi-studies/voronoi-studies-cover.webp",
		projectVideoSource: "/projects-optimized/CreativeCoding/voronoi-studies/voronoi-studies-card.mp4",
		tools: ["Three.js", "React.js", "GLSL"],
		category: "creative-code",
		date: "2026-09-28",
		featured: true,
	},
	{
		projectName: "Rain Relief",
		message: "After the New York Times' 2021 map: every 30-year stretch of U.S. rainfall since 1901, wetter ground rising and drier ground sinking against the 20th-century average. Scrub the years, pull the jelly land, or hover a place.",
		projectLink: "https://gordontu.com/maps/rain-relief/live/",
		projectImgSource: "/projects-optimized/Maps/rain-relief/rain-relief-cover.webp",
		projectVideoSource: "/projects-optimized/Maps/rain-relief/rain-relief-card.mp4",
		tools: ["Three.js", "React.js", "GLSL", "Python"],
		category: "maps",
		date: "2026-09-27",
		featured: true,
	},
	{
		projectName: "Foldable Map",
		message: "A paper map of Golden Gate Park that folds inside a foldable phone, on akashtdev's iPhone Duo model. Pull the phone open to unfold it, fly to the park's highlights, tilt the ground, or restyle the map.",
		projectLink: "https://gordontu.com/maps/foldable-map/live/",
		projectImgSource: "/projects-optimized/Maps/foldable-map/foldable-map-cover.webp",
		projectVideoSource: "/projects-optimized/Maps/foldable-map/foldable-map-card.mp4",
		tools: ["Svelte", "Three.js", "GLSL", "GSAP"],
		category: "maps",
		date: "2026-09-26",
		featured: true,
		pinned: 3,
	},
	{
		projectName: "Average Color of California",
		message: "Every California county subdivision filled with the mean color of its land in NASA satellite imagery, a frame per day for a year. Snow comes and goes on the Sierra; green hills turn tan by summer.",
		projectImgSource: "/projects-optimized/Maps/ca-color/ca-color-cover.webp",
		projectVideoSource: "/projects-optimized/Maps/ca-color/ca-color-card.mp4",
		tools: ["Python", "NumPy", "GeoPandas"],
		category: "maps",
		date: "2026-09-24",
		featured: true,
	},
	{
		projectName: "Erhai Moon",
		message: "A Mid-Autumn card with a window onto Erhai Lake in Dali, cut from real terrain: koi, a white moon in the sky, a gold one in the water. Tilt your phone or move the mouse to look in; click the lake to stir the koi.",
		projectLink: "https://gordontu.com/maps/erhai-moon/live/",
		projectImgSource: "/projects-optimized/Maps/erhai/erhai-zhongqiu-cover.webp",
		projectVideoSource: "/projects-optimized/Maps/erhai/erhai-zhongqiu-card.mp4",
		tools: ["Three.js", "React.js", "GLSL", "Blender"],
		category: "maps",
		date: "2026-09-25",
		featured: true,
	},
	{
		projectName: "Gas Is Everywhere in California. Fast Charging Isn't.",
		message: "California, shaded by what lies within a 15-minute drive: a gas station, a DC fast charger, or both. Of the area within 15 minutes of gas, 30% has no fast charger that close; the reverse is 0.7%.",
		projectImgSource: "/projects-optimized/Maps/isochrone-charging-stations.webp",
		tools: ["QGIS"],
		category: "maps",
		date: "2026-09-04",
	},
	{
		projectName: "YPCCC Hazard Tool",
		message: "The CDC's Heat and Health Index set against how worried residents are about extreme heat, county by county, to find where the gap is widest. Pick a state, lasso counties on the scatterplot, download the data.",
		projectLink: "https://ypccc-hazard-tool.vercel.app/?hazard=heat__perception_reality_gap&state=0&county=00000&exploreMode=0",
		projectImgSource: "/projects-optimized/Maps/ypccc-hazard-tool.webp",
		tools: ["React.js", "MapLibre", "D3", "deck.gl"],
		category: "maps",
		date: "2026-04-01",
		client: "Yale University",
		featured: true,
		pinned: 2,
	},
	{
		projectName: "Interstate Traffic",
		message: "Average daily traffic in 2024 on every mainline Interstate in the lower 48, drawn over 3D terrain as glowing roads that widen and brighten with traffic, comets running both ways. Fly around, or hover a road for its count.",
		projectLink: "https://gordontu.com/maps/interstate-traffic/live/",
		projectImgSource: "/projects-optimized/Maps/interstate-traffic/interstate-traffic-cover.webp",
		tools: ["Three.js", "React.js", "GLSL"],
		category: "maps",
		date: "2026-10-01",
	},
	{
		projectName: "California Affordable Housing",
		message: "A county-by-county tool for a measure of whether California is affordable to the people who might live there, not only those who do. Pick a county, rent or own, and compare groups by age, education and race.",
		projectLink: "https://ternercenter.berkeley.edu/affordability-for-whom.html",
		projectImgSource: "/projects-optimized/Charts/svelte_california_housing.webp",
		tools: ["Svelte", "D3"],
		category: "data-visualization",
		date: "2023-11-01",
		client: "Terner Center for Housing Innovation, UC Berkeley",
		featured: true,
	},
	{
		projectName: "Presidential Margins, 1868–2020",
		message: "Each county's Democratic–Republican margin in 39 presidential elections since 1868, raised so wider gaps stand taller. Play or scrub the years to watch counties flip; drag to pan and orbit.",
		projectLink: "https://gordontu.com/data-visualization/presidential-margins-1868-2020/live/",
		projectImgSource: "/projects-optimized/Charts/election-3d/election-3d-cover.webp",
		projectVideoSource: "/projects-optimized/Charts/election-3d/election-3d-card.mp4",
		tools: ["Three.js", "React.js", "GLSL", "D3"],
		category: "data-visualization",
		date: "2026-09-25",
		featured: true,
		pinned: 1,
	},
	{
		projectName: "Number of Chinese Company Infrastructure in the US and Abroad.",
		message: "Overlapping bars count Chinese companies' infrastructure abroad by type, with the U.S. count inside each bar. In the U.S., none build 5G, terrestrial cable or satellite calibration infrastructure.",
		projectLink: "https://twitter.com/tu_yukun/status/1646917464767225862/photo/1",
		projectImgSource: "https://pbs.twimg.com/media/FtcYkEzXoAAxtcw?format=png&name=medium",
		tools: ["Observable"],
		category: "data-visualization",
		date: "2023-04-01",
	},
	{
		projectName: "Number of Middle Age Himalayan Climbers Is Increasing Over Time",
		message: "A ridgeline chart of Mount Everest climbers by age, one ridge per year from 1985 to 2019, from the Himalayan Database. Climbers aged 40 to 60 grow in number, reaching a record 285 in 2019.",
		projectLink: "https://observablehq.com/@tututwo/himalayan-ridge",
		projectImgSource: "/projects-optimized/Charts/d3_Himalayan.webp",
		tools: ["Observable"],
		category: "data-visualization",
		date: "2022-01-01",
	},
	{
		projectName: "Covid Monitoring Dashboard - China",
		message: "Zero-COVID China in 2022: vaccination, international flights and quarantine, daily cases by province, and containment rules in ten major cities. Play the date slider and click a province for details.",
		projectLink: "https://covid-dashboard-orcin.vercel.app/",
		projectImgSource: "/projects-optimized/Charts/svelte-covid-cn.webp",
		tools: ["Svelte", "D3", "R"],
		category: "data-visualization",
		date: "2022-08-01",
		client: "World Bank",
	},
	{
		projectName: "How dry would each state be if Americans only consumed local state-produced beer?",
		message: "A tile map of beer glasses comparing each state's 2018 beer production with what its adults drink. Only a third of states brew enough, though the U.S. as a whole brews over 30% more than it drinks.",
		projectLink: "https://twitter.com/_tuyukun/status/1281702418581827584",
		projectImgSource: "https://pbs.twimg.com/media/EcmEau_UMAAat7E?format=jpg&name=4096x4096",
		tools: ["R"],
		category: "data-visualization",
		date: "2020-12-10",
	},
	{
		projectName: "How much money did award-winning shows earn before the award date?",
		message: "Red spikes rank Tony-winning Best Musicals from 1986 to 2019 by what each grossed on Broadway before its award. Hamilton towers over the rest at nearly $76 million.",
		projectLink: "https://twitter.com/_tuyukun/status/1297733577849765888/photo/1",
		projectImgSource: "https://pbs.twimg.com/media/EgJ5z45UMAA1-dD?format=png&name=medium",
		tools: ["R"],
		category: "data-visualization",
		date: "2021-01-10",
	},
	{
		projectName: "CSS Doodle Chinese Pattern",
		message: "A set of CodePen sketches that redraw traditional Chinese patterns in CSS: plum blossom, interlocking squares, checkerboard and fish scales, each white on deep red.",
		projectLink: "https://codepen.io/collection/LPePxy",
		projectImgSource: "/projects-optimized/CreativeCoding/css-doodle-纹样.webp",
		tools: ["CSS"],
		category: "creative-code",
		date: "2021-12-02",
	},
	{
		projectName: "Rough Fried Eggs",
		message: "A hand-drawn circle-packing study: packed circles merge into white blobs with thick outlines, and a random few, cross-hatched in yellow, sit in their own whites like fried eggs.",
		projectLink: "https://observablehq.com/d/1d6edd39edb160e7?collection=@tututwo/three-js-creative-coding-practice",
		projectImgSource: "/projects-optimized/CreativeCoding/Observable_GR_circlePackingMerging.webp",
		tools: ["Observable"],
		category: "creative-code",
		date: "2021-02-09",
	},
	{
		projectName: "GLSL SDF Practice Collection",
		message: "Four shader studies that paint a spinning cube's faces with coordinate-based patterns: a Mondrian grid, a blue-green checkerboard, a patchwork grid and framed edges. Drag to orbit each cube.",
		projectLink: "https://observablehq.com/collection/@tututwo/sdf",
		projectImgSource: "/projects-optimized/CreativeCoding/Observable_SDF.webp",
		tools: ["GLSL"],
		category: "creative-code",
		date: "2022-08-01",
	},
	{
		projectName: "Flow Field 2D",
		message: "Thousands of particles follow a noise-driven field of angles, leaving glowing trails. Sliders set the particle count, speed, noise scale, grid size and palette.",
		projectLink: "https://observablehq.com/d/73794013ffa23a9c?collection=@tututwo/three-js-creative-coding-practice",
		projectImgSource: "/projects-optimized/CreativeCoding/Observable-flowfield.webp",
		tools: ["Observable"],
		category: "creative-code",
		date: "2023-01-31",
	},
	{
		projectName: "Kois",
		message: "A flocking simulation of koi, drawn as soft tapering blobs that align, gather and keep apart as they swim. Sliders set the koi count, speed, steering force, perception radius and palette.",
		projectLink: "https://observablehq.com/@tututwo/kois",
		projectImgSource: "/projects-optimized/CreativeCoding/Observable_kois.webp",
		tools: ["Canvas"],
		category: "creative-code",
		date: "2022-09-10",
	},
	{
		projectName: "Developing and undeveloped countries remain to be the agricultural countries, made in QGIS",
		message: "A world cartogram of squares, one per country and sized by population, shaded by the share of land used for agriculture, from Our World in Data. Hover a square for its exact share, or zoom in.",
		projectLink: "https://datawrapper.dwcdn.net/VjDoq/5/",
		projectImgSource: "/projects-optimized/Maps/map_datawrapper_agriculture.webp",
		tools: ["Datawrapper"],
		category: "maps",
		date: "2020-12-10",
	},
	{
		projectName: "China Elevation",
		message: "China's terrain drawn as stacked ridgelines, white on black. The ranges and plateaus rise in dense, jagged lines, while the basins and eastern plains lie flat and gray.",
		projectImgSource: "/projects-optimized/Maps/map_elevation_ridge.webp",
		tools: ["QGIS", "Adobe Illustrator"],
		category: "maps",
		date: "2020-10-17",
	},
	{
		projectName: "Most buildings in Manhattan were built before 1960s",
		message: "Manhattan's buildings colored by the year they were built, from deep red before 1800 to dark blue after 2005. The warm, pre-1960 shades fill most of the island.",
		projectImgSource: "/projects-optimized/Maps/map_Manhattan_cover.webp",
		tools: ["QGIS"],
		category: "maps",
		date: "2020-12-27",
	},
	{
		projectName: "Sichuan Basin Elevation",
		message: "A ridgeline map of Sichuan's elevation: hundreds of stacked lines spike over the western mountains and settle flat across the basin floor. Adjust the line count, overlap, colors and thresholds.",
		projectLink: "https://observablehq.com/d/299f845c1c4ba8fe",
		projectImgSource: "/projects-optimized/Maps/map_ridgelineSichuan.webp",
		tools: ["Observable"],
		category: "maps",
		date: "2022-01-27",
	},
	{
		projectName: "The elevation of Jiangxi Province",
		message: "Jiangxi's terrain as a Chinese ink-wash painting: gray peaks rise out of white mist under a flock of birds, beside two lines of verse in calligraphy.",
		projectImgSource: "/projects-optimized/Maps/map_shuimomap_shuimo_cover.webp",
		tools: ["QGIS"],
		category: "maps",
		date: "2020-11-07",
	},
	{
		projectName: "Two Dragons of China",
		message: "The two dragons are the Yangtze and Yellow rivers, drawn with their tributaries on black: the Yellow River's network in warm yellows, the Yangtze's in blue, its main stem swelling toward the sea.",
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
