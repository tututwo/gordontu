<script>
	import { base } from '$app/paths';
	import RoughSvg from './RoughSvg.svelte';

	/**
	 * @type {{
	 *   project: import('$lib/project/project.js').Project,
	 *   active?: boolean,
	 *   tabindex?: number,
	 *   onfocus?: (event: FocusEvent) => void,
	 *   shouldSuppressClick?: () => boolean
	 * }}
	 */
	let {
		project,
		active = false,
		tabindex = 0,
		onfocus = () => {},
		shouldSuppressClick = () => false
	} = $props();

	/** @type {Record<string, string>} */
	const categoryNames = {
		charts: 'Charts',
		maps: 'Maps',
		'code creatively': 'Creative code'
	};

	let rawHref = $derived(project.projectLink.trim());
	let projectHref = $derived(rawHref.startsWith('/') ? `${base}${rawHref}` : rawHref);
	let optimizedImage = $derived(toOptimizedImage(project.projectImgSource));
	let formattedDate = $derived(formatDate(project.date));
	let category = $derived(categoryNames[project.titleTag] ?? project.titleTag);
	let frameShapes = $derived(createFrameShapes(project.projectName));

	/** @param {string} source */
	function toOptimizedImage(source) {
		if (!source.startsWith('/projects/')) return source;
		return source.replace('/projects/', '/projects-optimized/').replace(/\.[^.]+$/, '.webp');
	}

	/** @param {string} value */
	function formatDate(value) {
		const date = new Date(`${value}T00:00:00`);
		return new Intl.DateTimeFormat('en', {
			month: '2-digit',
			year: '2-digit'
		}).format(date);
	}

	/** @param {string} value */
	function hash(value) {
		let result = 0;
		for (let index = 0; index < value.length; index += 1) {
			result = (result * 31 + value.charCodeAt(index)) >>> 0;
		}
		return (result % 2000000000) + 1;
	}

	/** @param {string} name */
	function createFrameShapes(name) {
		const seed = hash(name);
		return [
			{
				type: 'rectangle',
				x: 13,
				y: 13,
				width: 974,
				height: 894,
				options: { seed, roughness: 1.05, bowing: 0.75, strokeWidth: 1.65 }
			},
			{
				type: 'rectangle',
				x: 7,
				y: 19,
				width: 981,
				height: 883,
				options: {
					seed: seed + 17,
					roughness: 1.55,
					bowing: 1.1,
					strokeWidth: 0.72,
					stroke: '#696a62'
				}
			}
		];
	}

	/** @param {MouseEvent} event */
	function handleClick(event) {
		if (shouldSuppressClick()) event.preventDefault();
	}

	/** @param {Event} event */
	function handleImageError(event) {
		const image = /** @type {HTMLImageElement} */ (event.currentTarget);
		if (image.src.endsWith(project.projectImgSource)) return;
		image.src = project.projectImgSource;
	}
</script>

<a
	class={['project-card', { active }]}
	href={projectHref}
	target="_blank"
	rel="external noreferrer"
	{tabindex}
	aria-label={`${project.projectName} — open project in a new tab`}
	onclick={handleClick}
	onfocus={onfocus}
	ondragstart={(event) => event.preventDefault()}
>
	<RoughSvg class="card-frame" width={1000} height={920} shapes={frameShapes} />

	<div class="image-wrap">
		<img
			src={optimizedImage}
			alt={`${project.projectName} project preview`}
			width="960"
			height="720"
			loading={active ? 'eager' : 'lazy'}
			fetchpriority={active ? 'high' : 'auto'}
			onerror={handleImageError}
		/>
		<div class="image-wash" aria-hidden="true"></div>
	</div>

	<div class="caption">
		<div class="caption-copy">
			<strong>{project.projectName}</strong>
			<span>{category} · {project.tools.join(' / ')}</span>
		</div>
		<time datetime={project.date}>{formattedDate}</time>
	</div>
</a>

<style>
	.project-card {
		position: relative;
		display: flex;
		width: 100%;
		height: 100%;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.85rem 0.9rem 0.7rem;
		color: var(--ink, #30312d);
		text-decoration: none;
		background: color-mix(in srgb, var(--paper, #f8f4e9) 94%, white);
		filter: drop-shadow(0 18px 22px rgb(50 46 38 / 0.08));
		transition: filter 180ms ease;
		isolation: isolate;
	}

	.project-card:hover,
	.project-card:focus-visible,
	.project-card.active {
		filter: drop-shadow(0 22px 30px rgb(50 46 38 / 0.15));
	}

	.project-card:focus-visible {
		outline: 2px solid #2f312d;
		outline-offset: 7px;
	}

	.project-card :global(.card-frame) {
		position: absolute;
		z-index: 3;
		inset: -0.25rem;
		width: calc(100% + 0.5rem);
		height: calc(100% + 0.5rem);
		pointer-events: none;
	}

	.image-wrap {
		position: relative;
		min-height: 0;
		flex: 1;
		overflow: hidden;
		background: #dedbd1;
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: saturate(0.64) contrast(0.92) sepia(0.1);
		transition: filter 240ms ease, transform 420ms cubic-bezier(0.2, 0.75, 0.25, 1);
	}

	.project-card:hover img,
	.project-card:focus-visible img,
	.project-card.active img {
		filter: saturate(0.92) contrast(0.98) sepia(0.03);
		transform: scale(1.012);
	}

	.image-wash {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: rgb(255 251 238 / 0.1);
		mix-blend-mode: soft-light;
	}

	.caption {
		display: flex;
		min-height: 3.55rem;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.8rem;
		padding: 0.05rem 0.15rem 0;
		font-family: 'Shantell Sans Variable', 'Comic Sans MS', cursive;
	}

	.caption-copy {
		display: grid;
		min-width: 0;
		gap: 0.22rem;
	}

	strong {
		display: -webkit-box;
		overflow: hidden;
		font-size: clamp(0.86rem, 1.05vw, 1rem);
		font-weight: 520;
		line-height: 1.15;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.caption span {
		overflow: hidden;
		color: #67675f;
		font-family: 'Libre Franklin Variable', sans-serif;
		font-size: 0.62rem;
		font-weight: 430;
		letter-spacing: 0.015em;
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	time {
		flex: 0 0 auto;
		font-size: 0.8rem;
		font-variation-settings: 'INFM' 60;
	}

	@media (max-width: 720px) {
		.project-card {
			padding: 0.7rem 0.72rem 0.58rem;
		}

		.caption {
			min-height: 3.25rem;
		}

		strong {
			font-size: 0.82rem;
		}
	}
</style>
