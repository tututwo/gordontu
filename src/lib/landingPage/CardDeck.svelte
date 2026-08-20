<script>
	import { resolve } from '$app/paths';
	import RoughSvg from './RoughSvg.svelte';
	import { WallMotion } from './wallMotion.svelte.js';
	import { categories, hashName } from '$lib/project/project.js';
	import { cardSeed, cardFrame, socialFrames } from './sketches.js';

	const cardDesigns = [
		{
			label: 'Charts',
			copy: 'Turning data into clarity through elegant visuals.',
			image: '/projects-optimized/Charts/svelte_teacherSalary.webp'
		},
		{
			label: 'Maps',
			copy: 'Spatial stories shaped through data, terrain, and careful craft.',
			image: '/projects-optimized/Maps/map_shuimomap_shuimo_cover.webp'
		},
		{
			label: 'Creative coding',
			copy: 'Experiments in code that move, react, and surprise.',
			image: '/projects-optimized/CreativeCoding/R3f-Heart.webp'
		}
	];

	// Built once: RoughSvg redraws whenever `shapes` identity changes, so never rebuild per frame.
	const deck = categories.map((category, index) => {
		const seed = cardSeed(hashName(category.slug));
		const design = cardDesigns[index];
		return {
			...category,
			...design,
			numeral: String(index + 1).padStart(2, '0'),
			tilt: ((seed % 13) - 6) * 0.6,
			frame: cardFrame(seed),
			backFrame: cardFrame(seed),
			radius: `${4 + (seed % 8) / 10}%`
		};
	});
	const COUNT = deck.length;

	// Cards sit on a circular arch: one card = ARC_ANGLE along it, so the neighbours drop and
	// fan outward. The radius is chosen so a card at ±1 lands `step` px from the centre.
	const ARC_ANGLE = (9 * Math.PI) / 180;

	let stageWidth = $state(1200);
	let isMobile = $derived(stageWidth <= 720);
	let step = $derived(stageWidth * (isMobile ? 0.8 : 0.5));
	// Keep WallMotion's drag distance intact; only tighten the desktop fan to match the artwork.
	let fanStep = $derived(stageWidth * (isMobile ? 0.8 : 0.265));
	let radius = $derived(fanStep / Math.sin(ARC_ANGLE));

	const motion = new WallMotion({
		step: () => step,
		isMobile: () => isMobile,
		count: () => COUNT,
		bounds: () => ({ min: 1 - COUNT, max: 0 })
	});
	motion.focusCard(Math.floor(COUNT / 2));

	let activeIndex = $derived(clamp(Math.round(-motion.offset), 0, COUNT - 1));
	let active = $derived(deck[activeIndex]);

	let cards = $derived.by(() => {
		const offset = motion.offset;
		return deck.map((item, index) => {
			// 0 = front-facing centre, ±0.5 = edge-on, ±1 = back-facing neighbour.
			const relative = index + offset;
			const theta = relative * ARC_ANGLE;
			return {
				item,
				relative,
				isCenter: index === activeIndex,
				x: radius * Math.sin(theta),
				y: radius * (1 - Math.cos(theta)),
				rotate: (theta * 180) / Math.PI + item.tilt,
				rotateY: -180 * relative,
				zIndex: 10 - Math.round(Math.abs(relative) * 4)
			};
		});
	});

	/** @param {MouseEvent} event @param {(typeof cards)[number]} card */
	function handleCardClick(event, card) {
		// The stage's capture-phase listener already cancelled post-drag clicks.
		if (event.defaultPrevented) return;
		// The centre card is a plain link; modified clicks keep their browser meaning.
		if (card.isCenter || event.button !== 0 || event.metaKey || event.ctrlKey) return;
		event.preventDefault();
		motion.moveBy(-Math.round(card.relative));
	}

	/** @param {number} value @param {number} minimum @param {number} maximum */
	function clamp(value, minimum, maximum) {
		return Math.min(Math.max(value, minimum), maximum);
	}
</script>

<div class="deck">
	<div class="deck-viewport">
		<div
			class={['deck-stage', { moving: motion.isMoving, dragging: motion.isDragging }]}
			role="region"
			aria-roledescription="carousel"
			aria-label="Portfolio categories"
			aria-describedby="deck-instructions"
			tabindex="-1"
			bind:clientWidth={stageWidth}
			{@attach motion.attach}
		>
			<p id="deck-instructions" class="sr-only">
				Drag or flick horizontally, or use the left and right arrow keys, to flip between categories.
			</p>

			{#each cards as card (card.item.slug)}
				<div
					class="card"
					style:transform={`translate(-50%, -50%) translate(${card.x}px, ${card.y}px) rotate(${card.rotate}deg)`}
					style:z-index={card.zIndex}
				>
					<a
						class="card__inner"
						href={resolve('/[category]', { category: card.item.slug })}
						style:transform={`rotateY(${card.rotateY}deg)`}
						style:--paper-radius={card.item.radius}
						tabindex={card.isCenter ? 0 : -1}
						aria-hidden={card.isCenter ? undefined : 'true'}
						aria-label={`${card.item.label} — ${card.item.description}`}
						draggable="false"
						ondragstart={(event) => event.preventDefault()}
						onclick={(event) => handleCardClick(event, card)}
					>
						<RoughSvg
							class="card__sheet"
							width={1000}
							height={920}
							shapes={card.item.backFrame}
						/>
						<div class="card__face card__face--front">
							<RoughSvg class="card-frame" width={1000} height={920} shapes={card.item.frame} />
							<div class="card__design" aria-hidden="true">
								<div class="card__meta">
									<span class="card__number">{card.item.numeral}<i></i></span>
									<span class="card__diamond"></span>
								</div>
								<div class="card__title">{card.item.label}</div>
								<div class="image-wrap">
									<img
										class={`card__art card__art--${card.item.slug}`}
										src={card.item.image}
										alt=""
										width="500"
										height="700"
										draggable="false"
										loading={card.isCenter ? 'eager' : 'lazy'}
										fetchpriority={card.isCenter ? 'high' : 'auto'}
									/>
								</div>
								<p class="card__description">{card.item.copy}</p>
								<span class="card__dash"></span>
							</div>
						</div>
						<div class="card__face card__face--back">
							<RoughSvg class="card-frame" width={1000} height={920} shapes={card.item.backFrame} />
							<div class="card__design" aria-hidden="true">
								<div class="card__meta">
									<span class="card__number">{card.item.numeral}<i></i></span>
									<span class="card__diamond"></span>
								</div>
								<div class="card__title">{card.item.label}</div>
								<div class="image-wrap">
									<img
										class={`card__art card__art--${card.item.slug}`}
										src={card.item.image}
										alt=""
										width="500"
										height="700"
										draggable="false"
										loading="lazy"
									/>
								</div>
								<p class="card__description">{card.item.copy}</p>
								<span class="card__dash"></span>
							</div>
						</div>
						<span class="card__edge card__edge--left" aria-hidden="true"></span>
						<span class="card__edge card__edge--right" aria-hidden="true"></span>
					</a>
				</div>
			{/each}

			<p class="sr-only" aria-live="polite" aria-atomic="true">
				{#if !motion.isMoving}{active.label}, {activeIndex + 1} of {COUNT}{/if}
			</p>
		</div>

		<!-- Siblings of the stage, not descendants: a pointerdown inside the attach node is a
		     grab, and a click while coasting would be swallowed. -->
		<button
			class="deck-arrow deck-arrow--prev"
			type="button"
			aria-label="Previous category"
			disabled={activeIndex === 0}
			onclick={() => motion.moveBy(1)}
		>
			<RoughSvg class="ring" width={52} height={52} shapes={socialFrames.github} />
			<span aria-hidden="true">‹</span>
		</button>
		<button
			class="deck-arrow deck-arrow--next"
			type="button"
			aria-label="Next category"
			disabled={activeIndex === COUNT - 1}
			onclick={() => motion.moveBy(-1)}
		>
			<RoughSvg class="ring" width={52} height={52} shapes={socialFrames.linkedin} />
			<span aria-hidden="true">›</span>
		</button>
	</div>

</div>

<style>
	/* The motion system owns the geometry; the landing page only changes the card material. */
	.deck {
		--card-w: min(calc(clamp(22rem, 58svh, 38rem) * 39 / 50), 78vw);
		position: relative;
		z-index: 10;
		display: grid;
		grid-template-rows: minmax(0, 1fr);
		min-height: 100svh;
		overflow: clip;
		opacity: 1;
		transition: opacity 180ms var(--ease-out);
	}

	@starting-style {
		.deck {
			opacity: 0;
		}
	}

	/* Grid so the mobile arrows can drop into a row beneath the stage; on desktop they are
	   absolutely positioned and take no cell. */
	.deck-viewport {
		position: relative;
		display: grid;
		grid-template-columns: 1fr auto auto 1fr;
		grid-template-rows: minmax(0, 1fr);
		min-height: 0;
	}

	.deck-stage {
		position: relative;
		grid-column: 1 / -1;
		min-height: 20rem;
		cursor: grab;
		outline: none;
		touch-action: pan-y;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	}

	.deck-stage.dragging {
		cursor: grabbing;
	}

	.deck-stage:focus-visible::after {
		position: absolute;
		z-index: 150;
		right: 1.4rem;
		bottom: 0.2rem;
		padding: 0.32rem 0.55rem;
		border: 1px solid var(--hairline);
		border-radius: 48% 52% 45% 55%;
		box-shadow: 0 0.35rem 1rem var(--shadow-soft);
		color: var(--ink);
		background: var(--surface);
		content: '←  drag, flick, or use arrow keys  →';
		font-family: var(--font-hand);
		font-size: 0.72rem;
		transform: rotate(-0.6deg);
	}

	/* Flat track + per-card perspective. Each .card is a plain positioned element (so z-index
	   works); only .card__inner opens a 3D context. A shared preserve-3d chain would depth-sort
	   and plane-split overlapping cards mid-drag instead of honouring z-index. */
	.card {
		--card-paper: #fff;
		--card-thickness: clamp(0.3rem, calc(var(--card-w) * 0.016), 0.58rem);
		--accent: #c4923a;
		--ink: #232326;
		--muted-ink: #666563;
		--sketch-line: rgb(35 35 38 / 0.74);
		--sketch-line-soft: rgb(35 35 38 / 0.34);

		position: absolute;
		top: 48.8%;
		left: 50%;
		width: var(--card-w);
		aspect-ratio: 39 / 50;
		perspective: 1100px;
	}

	/* No overflow / opacity / filter / isolation / mix-blend here — they flatten preserve-3d. */
	.card__inner {
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
		color: var(--ink);
		text-decoration: none;
		border-radius: var(--paper-radius, 4%);
		transform-style: preserve-3d;
		-webkit-tap-highlight-color: transparent;
	}

	.deck-stage.moving .card__inner {
		will-change: transform;
	}

	.card__inner:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 7px;
	}

	.card__face {
		position: absolute;
		inset: 0;
		overflow: visible;
		border-radius: inherit;
		border: 1px solid rgb(35 35 38 / 0.58);
		background: var(--card-paper);
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
	}

	.card__face--front {
		transform: translateZ(calc(var(--card-thickness) / 2));
	}

	.card__face--back {
		transform: rotateY(180deg) translateZ(calc(var(--card-thickness) / 2));
	}

	.card :global(.card__sheet) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		border-radius: inherit;
		background: var(--card-paper);
		box-shadow:
			0.2rem 0.25rem 0 -1px rgb(35 35 38 / 0.16),
			0.42rem 0.5rem 0 -2px rgb(35 35 38 / 0.12);
		transform: translate3d(0.28rem, 0.36rem, 0);
		pointer-events: none;
	}

	.card__edge {
		position: absolute;
		top: 0.22rem;
		width: var(--card-thickness);
		height: calc(100% - 0.44rem);
		border-inline: 1px solid var(--sketch-line);
		border-radius: 2px;
		background:
			repeating-linear-gradient(-45deg, rgb(35 35 38 / 0.34) 0 1px, transparent 1px 3.5px),
			var(--card-paper);
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		pointer-events: none;
	}

	.card__edge--left {
		left: 0;
		transform: translateZ(calc(var(--card-thickness) / -2)) rotateY(-90deg);
		transform-origin: left center;
	}

	.card__edge--right {
		right: 0;
		transform: translateZ(calc(var(--card-thickness) / -2)) rotateY(90deg);
		transform-origin: right center;
	}

	.card :global(.card-frame) {
		position: absolute;
		z-index: 3;
		inset: -0.08rem;
		width: calc(100% + 0.16rem);
		height: calc(100% + 0.16rem);
		overflow: hidden;
		border-radius: inherit;
		pointer-events: none;
	}

	.card img {
		display: block;
		pointer-events: none;
		-webkit-user-drag: none;
	}

	.card__design {
		position: relative;
		display: grid;
		width: 100%;
		height: 100%;
		grid-template-rows: auto auto minmax(0, 1fr) auto;
		padding: clamp(1.2rem, calc(var(--card-w) * 0.075), 2rem);
	}

	.card__meta {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.card__number {
		display: grid;
		justify-items: start;
		gap: 0.42rem;
		font-family: var(--font-ui);
		font-size: clamp(0.62rem, calc(var(--card-w) * 0.029), 0.78rem);
		font-weight: 510;
		letter-spacing: 0.15em;
		line-height: 1;
	}

	.card__number i,
	.card__dash {
		display: block;
		width: clamp(0.9rem, calc(var(--card-w) * 0.045), 1.15rem);
		height: 2px;
		background: var(--accent);
		transform: rotate(-1.5deg);
	}

	.card__diamond {
		width: clamp(0.58rem, calc(var(--card-w) * 0.039), 1rem);
		aspect-ratio: 1;
		margin: 0.05rem 0.12rem 0 0;
		background: var(--accent);
		transform: rotate(45deg);
	}

	.card__title {
		margin-top: clamp(1.6rem, calc(var(--card-w) * 0.09), 2.45rem);
		font-family: var(--font-ui);
		font-size: clamp(0.64rem, calc(var(--card-w) * 0.033), 0.88rem);
		font-weight: 530;
		letter-spacing: 0.35em;
		line-height: 1.2;
		text-align: center;
		text-transform: uppercase;
	}

	.image-wrap {
		position: relative;
		min-height: 0;
		margin: clamp(0.9rem, calc(var(--card-w) * 0.055), 1.5rem) -0.25rem 0.55rem;
		overflow: hidden;
	}

	.image-wrap .card__art {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: grayscale(1) contrast(0.82) brightness(1.12);
		mix-blend-mode: multiply;
		opacity: 0.68;
	}

	.image-wrap .card__art--charts {
		object-position: 50% 68%;
		transform: scale(1.06);
	}

	.image-wrap .card__art--maps {
		object-position: 50% 78%;
		transform: scale(1.16);
	}

	.image-wrap .card__art--creative-code {
		object-fit: contain;
		filter: grayscale(1) contrast(1.1) brightness(0.98);
		opacity: 0.56;
		transform: scale(1.08);
	}

	.card__description {
		width: min(100%, 14.5rem);
		min-height: 4.5em;
		margin: 0;
		padding: clamp(0.72rem, calc(var(--card-w) * 0.035), 0.95rem) 0.45rem 0;
		border-top: 1px solid rgb(35 35 38 / 0.24);
		color: var(--muted-ink);
		font-family: var(--font-hand);
		font-size: clamp(0.62rem, calc(var(--card-w) * 0.028), 0.76rem);
		font-variation-settings: 'INFM' 45;
		font-weight: 430;
		letter-spacing: 0.025em;
		line-height: 1.55;
	}

	.card__dash {
		position: absolute;
		bottom: clamp(1rem, calc(var(--card-w) * 0.055), 1.4rem);
		left: clamp(1.2rem, calc(var(--card-w) * 0.075), 2rem);
	}

	.deck-arrow {
		--sketch-ink: var(--sketch-line);

		position: absolute;
		z-index: 20;
		top: 50%;
		display: grid;
		width: 2rem;
		height: 2rem;
		padding: 0;
		place-items: center;
		color: var(--ink);
		border: 0;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
		opacity: 0;
		translate: 0 -50%;
		transition:
			opacity var(--press-out-duration) var(--ease-out),
			transform var(--press-out-duration) var(--ease-out);
		-webkit-tap-highlight-color: transparent;
	}

	/* Small and close: just outside the centre card, well before the neighbours. */
	.deck-arrow--prev {
		left: calc(50% - var(--card-w) / 2 - 4.5rem);
	}

	.deck-arrow--next {
		right: calc(50% - var(--card-w) / 2 - 4.5rem);
	}

	.deck-arrow :global(.ring) {
		position: absolute;
		inset: -0.15rem;
		width: calc(100% + 0.3rem);
		height: calc(100% + 0.3rem);
		pointer-events: none;
	}

	.deck-arrow span {
		position: relative;
		font-family: var(--font-display);
		font-size: 1.05rem;
		line-height: 1;
	}

	.deck-arrow:active:not(:focus-visible) {
		transform: scale(0.94);
		transition-duration: var(--press-in-duration);
	}

	.deck-arrow:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
		opacity: 1;
	}

	.deck-arrow:disabled {
		opacity: 0;
		cursor: default;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (hover: hover) and (pointer: fine) {
		.deck-arrow:hover:not(:disabled) {
			--sketch-ink: var(--accent);

			opacity: 1;
			transform: translateY(-1px) scale(1.035);
		}
	}

	@media (max-width: 720px) {
		.deck {
			--card-w: min(calc(clamp(21rem, 55svh, 32rem) * 39 / 50), 82vw);
			min-height: max(40rem, 100svh);
		}

		/* Arrows drop out of the stage into a centred pair beneath it. */
		.deck-viewport {
			grid-template-rows: minmax(0, 1fr) auto;
			row-gap: 0.75rem;
			column-gap: 1.5rem;
		}

		.deck-arrow {
			position: relative;
			top: auto;
			right: auto;
			left: auto;
			opacity: 0.7;
			translate: none;
		}

		.deck-arrow--prev {
			grid-column: 2;
		}

		.deck-arrow--next {
			grid-column: 3;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.deck,
		.deck-arrow {
			transition: none;
		}

		.card__inner {
			will-change: auto;
		}
	}
</style>
