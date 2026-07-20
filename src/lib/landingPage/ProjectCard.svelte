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
	let imageFrameShapes = $derived(createImageFrameShapes(project.projectName));
	let paperRadius = $derived(createPaperRadius(project.projectName));
	let imageLoaded = $state(false);

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
		const topLeft = 8 + (seed % 8);
		const topRight = 8 + ((seed >>> 3) % 9);
		const bottomRight = 8 + ((seed >>> 7) % 8);
		const bottomLeft = 7 + ((seed >>> 11) % 10);
		return [
			{
				type: 'polygon',
				points: [
					[topLeft, 15],
					[991 - topRight, 9 + (seed % 4)],
					[990 - bottomRight, 909 - (seed % 5)],
					[bottomLeft, 911 - ((seed >>> 4) % 5)]
				],
				options: { seed, roughness: 1.05, bowing: 0.75, strokeWidth: 1.65 }
			},
			{
				type: 'polygon',
				points: [
					[8 + ((seed >>> 6) % 5), 21],
					[988 - ((seed >>> 9) % 6), 14],
					[985, 901 - ((seed >>> 12) % 5)],
					[12, 903]
				],
				options: {
					seed: seed + 17,
					roughness: 1.55,
					bowing: 1.1,
					strokeWidth: 0.72,
					stroke: 'var(--sketch-line, rgb(29 29 31 / 0.68))'
				}
			}
		];
	}

	/** @param {string} name */
	function createImageFrameShapes(name) {
		const seed = hash(name) + 701;
		return [
			{
				type: 'polygon',
				points: [
					[7 + (seed % 4), 8 + ((seed >>> 2) % 3)],
					[953 - ((seed >>> 5) % 5), 6 + ((seed >>> 8) % 4)],
					[954 - ((seed >>> 11) % 4), 713 - ((seed >>> 14) % 4)],
					[6 + ((seed >>> 17) % 5), 712 - ((seed >>> 20) % 3)]
				],
				options: { seed, roughness: 1.15, bowing: 0.7, strokeWidth: 1.85 }
			},
			{
				type: 'polygon',
				points: [
					[10, 11],
					[949, 9 + ((seed >>> 7) % 3)],
					[951, 709],
					[9 + ((seed >>> 13) % 3), 708]
				],
				options: {
					seed: seed + 23,
					roughness: 1.6,
					bowing: 0.95,
					strokeWidth: 0.7,
					stroke: 'var(--sketch-line-soft, rgb(41 41 35 / 0.38))'
				}
			}
		];
	}

	/** @param {string} name */
	function createPaperRadius(name) {
		const seed = hash(name);
		/** @param {number} shift */
		const corner = (shift) => `${1.2 + ((seed >>> shift) % 11) / 10}%`;
		return `${corner(0)} ${corner(4)} ${corner(8)} ${corner(12)} / ${corner(2)} ${corner(6)} ${corner(10)} ${corner(14)}`;
	}

	/** @param {MouseEvent} event */
	function handleClick(event) {
		if (shouldSuppressClick()) event.preventDefault();
	}

	/** @param {Event} event */
	function handleImageError(event) {
		const image = /** @type {HTMLImageElement} */ (event.currentTarget);
		imageLoaded = false;
		if (image.src.endsWith(project.projectImgSource)) return;
		image.src = project.projectImgSource;
	}

	function handleImageLoad() {
		imageLoaded = true;
	}
</script>

<a
	class={['project-card', { active }]}
	href={projectHref}
	target="_blank"
	rel="external noreferrer"
	{tabindex}
	aria-label={`${project.projectName} — open project in a new tab`}
	style:--paper-radius={paperRadius}
	onclick={handleClick}
	onfocus={onfocus}
	ondragstart={(event) => event.preventDefault()}
>
	<RoughSvg class="card-frame" width={1000} height={920} shapes={frameShapes} />

	<div class="image-wrap">
		<img
			class={['project-image', { loaded: imageLoaded }]}
			src={optimizedImage}
			alt={`${project.projectName} project preview`}
			width="960"
			height="720"
			loading={active ? 'eager' : 'lazy'}
			fetchpriority={active ? 'high' : 'auto'}
			onload={handleImageLoad}
			onerror={handleImageError}
		/>
		<div class="image-wash" aria-hidden="true"></div>
		<RoughSvg class="image-frame" width={960} height={720} shapes={imageFrameShapes} />
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
		color: var(--ink, #1d1d1f);
		text-decoration: none;
		border-radius: var(--paper-radius, 1.5%);
		background:
			linear-gradient(135deg, rgb(255 255 255 / 0.28), transparent 36%),
			var(--paper-elevated, #fffaf0);
		box-shadow: var(--shadow-material, 0 11px 30px rgb(87 65 38 / 0.065));
		isolation: isolate;
	}

	.project-card::before {
		position: absolute;
		z-index: -1;
		inset: 0;
		border-radius: inherit;
		background: var(--paper-elevated, #fffaf0);
		box-shadow: 0 24px 36px var(--shadow-soft, rgb(0 0 0 / 0.1));
		content: '';
		opacity: 0;
		pointer-events: none;
		transition: opacity 180ms ease;
	}

	.project-card:focus-visible {
		outline: 2px solid var(--accent, #0071e3);
		outline-offset: 7px;
	}

	.project-card.active::before {
		opacity: 0.22;
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
		border-radius: var(--paper-radius, 1.5%);
		background: color-mix(
			in srgb,
			var(--muted-ink, #6e6e73) 16%,
			var(--paper-elevated, #fbfbfd)
		);
	}

	.project-image {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: saturate(1.06) contrast(0.99);
		opacity: 0;
		transform: scale(1);
		transition: opacity 180ms ease;
	}

	.project-image.loaded {
		opacity: 1;
	}

	.image-wash {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: var(--paper-elevated, #fbfbfd);
		mix-blend-mode: soft-light;
		opacity: 0.18;
		transition: opacity 180ms ease;
	}

	.image-wrap :global(.image-frame) {
		position: absolute;
		z-index: 2;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0.82;
		pointer-events: none;
		mix-blend-mode: multiply;
	}

	.caption {
		display: flex;
		min-height: 3.55rem;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.8rem;
		padding: 0.05rem 0.15rem 0;
		font-family: var(--font-hand, 'Shantell Sans Variable', 'Comic Sans MS', cursive);
	}

	.caption-copy {
		display: grid;
		min-width: 0;
		gap: 0.22rem;
	}

	strong {
		display: -webkit-box;
		overflow: hidden;
		font-size: clamp(0.9rem, 1.05vw, 1.04rem);
		font-weight: 520;
		line-height: 1.15;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.caption span {
		overflow: hidden;
		color: var(--muted-ink, #6e6e73);
		font-family: var(--font-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif);
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

	@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
		.project-image {
			transition:
				opacity 180ms ease,
				transform 180ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
		}

		.project-card:hover .project-image {
			transform: scale(1.012);
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.project-card {
			transform: scale(1);
			transition: transform var(--press-out-duration, 160ms)
				var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
		}

		.project-card:active:not(:focus-visible) {
			transform: scale(0.992);
			transition-duration: var(--press-in-duration, 100ms);
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.project-card:hover::before {
			opacity: 1;
		}

		.project-card:hover .image-wash {
			opacity: 0.04;
		}
	}

	@media (hover: none), (pointer: coarse) {
		.project-image {
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.project-card::before,
		.project-image,
		.image-wash {
			transition: opacity 200ms ease;
		}

		.project-image {
			transform: none;
		}
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
