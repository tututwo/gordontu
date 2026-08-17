<script>
	import { base } from '$app/paths';
	import RoughSvg from './RoughSvg.svelte';
	import { WallMotion } from './wallMotion.svelte.js';
	import { categories, hashName } from '$lib/project/project.js';
	import {
		cardSeed,
		cardFrame,
		cardImageFrame,
		paperRadius,
		featureIcons,
		socialFrames,
		star
	} from './sketches.js';

	// Built once: RoughSvg redraws whenever `shapes` identity changes, so never rebuild per frame.
	const NUMERALS = ['I', 'II', 'III', 'IV', 'V'];
	const deck = categories.map((category, index) => {
		const seed = cardSeed(hashName(category.slug));
		return {
			...category,
			numeral: NUMERALS[index] ?? String(index + 1),
			tilt: ((seed % 13) - 6) * 0.6,
			frame: cardFrame(seed),
			imageFrame: cardImageFrame(seed),
			backFrame: cardFrame(seed + 31),
			radius: paperRadius(seed),
			glyph: featureIcons[/** @type {keyof typeof featureIcons} */ (category.icon)]
		};
	});
	const COUNT = deck.length;

	// Cards sit on a circular arch: one card = ARC_ANGLE along it, so the neighbours drop and
	// fan outward. The radius is chosen so a card at ±1 lands `step` px from the centre.
	const ARC_ANGLE = (14 * Math.PI) / 180;

	let stageWidth = $state(1200);
	let isMobile = $derived(stageWidth <= 720);
	let step = $derived(stageWidth * (isMobile ? 0.8 : 0.5));
	let radius = $derived(step / Math.sin(ARC_ANGLE));

	const motion = new WallMotion({
		step: () => step,
		isMobile: () => isMobile,
		count: () => COUNT,
		bounds: () => ({ min: 1 - COUNT, max: 0 })
	});

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
						href={`${base}/${card.item.slug}`}
						style:transform={`rotateY(${card.rotateY}deg)`}
						style:--paper-radius={card.item.radius}
						tabindex={card.isCenter ? 0 : -1}
						aria-hidden={card.isCenter ? undefined : 'true'}
						aria-label={`${card.item.label} — ${card.item.description}`}
						draggable="false"
						ondragstart={(event) => event.preventDefault()}
						onclick={(event) => handleCardClick(event, card)}
					>
						<div class="card__face card__face--front">
							<RoughSvg class="card-frame" width={1000} height={920} shapes={card.item.frame} />
							<span class="card__corner card__corner--top" aria-hidden="true">
								<RoughSvg class="corner-frame" width={52} height={52} shapes={socialFrames.linkedin} />
								{card.item.numeral}
							</span>
							<span class="card__corner card__corner--bottom" aria-hidden="true">
								<RoughSvg class="corner-frame" width={52} height={52} shapes={socialFrames.linkedin} />
								{card.item.numeral}
							</span>
							<RoughSvg class="card__spark" width={50} height={48} shapes={star} />
							<div class="image-wrap">
								<img
									src={card.item.image}
									alt=""
									width="500"
									height="700"
									draggable="false"
									loading={card.isCenter ? 'eager' : 'lazy'}
									fetchpriority={card.isCenter ? 'high' : 'auto'}
								/>
								<RoughSvg class="image-frame" width={960} height={720} shapes={card.item.imageFrame} />
							</div>
							<div class="card__label">
								<RoughSvg class="glyph" width={60} height={52} shapes={card.item.glyph} />
								<span>{card.item.label}</span>
							</div>
						</div>
						<div class="card__face card__face--back">
							<RoughSvg class="card-frame" width={1000} height={920} shapes={card.item.backFrame} />
							<span class="card__corner card__corner--top" aria-hidden="true">
								<RoughSvg class="corner-frame" width={52} height={52} shapes={socialFrames.github} />
								{card.item.numeral}
							</span>
							<span class="card__corner card__corner--bottom" aria-hidden="true">
								<RoughSvg class="corner-frame" width={52} height={52} shapes={socialFrames.github} />
								{card.item.numeral}
							</span>
							<img class="seal" src="/印章.svg" alt="" draggable="false" />
						</div>
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

	<div class="deck-caption">
		<span class="deck-counter">{activeIndex + 1} / {COUNT}</span>
		{#key active.slug}
			<div class="deck-copy">
				<h2>{active.label}</h2>
				<p>{active.description}</p>
				<a class="deck-discover" href={`${base}/${active.slug}`}>Discover</a>
			</div>
		{/key}
		<p class="deck-hint" aria-hidden="true">‹ drag to flip ›</p>
	</div>
</div>

<style>
	/* The deck owns the whole viewport: the stage takes the free height and the card is sized
	   from it, so it stays tall like a tarot card instead of scaling with width. */
	.deck {
		--card-w: min(calc(clamp(22rem, 62svh, 42rem) * 5 / 7), 78vw);
		position: relative;
		z-index: 10;
		display: grid;
		grid-template-rows: 1fr auto;
		min-height: 100svh;
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
		position: absolute;
		top: 50%;
		left: 50%;
		width: var(--card-w);
		aspect-ratio: 5 / 7;
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
		border-radius: var(--paper-radius, 1.5%);
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
		overflow: hidden;
		border-radius: inherit;
		background:
			linear-gradient(135deg, rgb(255 255 255 / 0.28), transparent 36%),
			var(--paper-elevated);
		box-shadow: var(--shadow-material);
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
	}

	.card__face--front {
		display: grid;
		grid-template-rows: 1fr auto;
		gap: 0.5rem;
		padding: 0.75rem 0.8rem 0.6rem;
	}

	.card__face--back {
		display: grid;
		place-items: center;
		background:
			repeating-linear-gradient(45deg, var(--hairline) 0 1px, transparent 1px 10px),
			repeating-linear-gradient(-45deg, var(--hairline) 0 1px, transparent 1px 10px),
			var(--paper-elevated);
		transform: rotateY(180deg);
	}

	.card__face--back .seal {
		width: 40%;
		padding: 1.1rem;
		border-radius: 50%;
		background: var(--paper-elevated);
		box-shadow: 0 0 0 1px var(--hairline);
	}

	.card :global(.card-frame) {
		position: absolute;
		z-index: 3;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	/* Tarot corners: numeral in a rough badge, top-right upright and bottom-left inverted. */
	.card__corner {
		--sketch-ink: var(--sketch-line);

		position: absolute;
		z-index: 4;
		display: grid;
		width: 1.7rem;
		height: 1.7rem;
		place-items: center;
		color: var(--ink);
		font-family: var(--font-display);
		font-size: 0.78rem;
		font-style: italic;
		font-weight: 500;
		line-height: 1;
	}

	.card__corner--top {
		top: 0.55rem;
		right: 0.55rem;
	}

	.card__corner--bottom {
		bottom: 0.55rem;
		left: 0.55rem;
		transform: rotate(180deg);
	}

	.card__corner :global(.corner-frame) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.card :global(.card__spark) {
		--sketch-ink: var(--accent-sun);

		position: absolute;
		z-index: 4;
		top: 0.35rem;
		left: 50%;
		width: 1.75rem;
		height: 1.7rem;
		transform: translateX(-50%) rotate(8deg);
		pointer-events: none;
	}

	.card__face--back .card__corner {
		--sketch-ink: var(--sketch-line-soft);

		color: var(--muted-ink);
	}

	.card img {
		display: block;
		pointer-events: none;
		-webkit-user-drag: none;
	}

	.image-wrap {
		position: relative;
		min-height: 0;
		overflow: hidden;
		border-radius: var(--paper-radius, 1.5%);
	}

	.image-wrap img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.image-wrap :global(.image-frame) {
		--sketch-ink: var(--sketch-line);

		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.card__label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: 1.9rem; /* clear of the inverted bottom-left numeral */
		font-family: var(--font-hand);
		font-size: 0.8rem;
		font-variation-settings: 'INFM' 60;
		font-weight: 520;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.card__label :global(.glyph) {
		--sketch-ink: var(--accent);

		width: 1.9rem;
		height: 1.65rem;
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
		translate: 0 -50%;
		transition: transform var(--press-out-duration) var(--ease-out);
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
	}

	.deck-arrow:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.deck-caption {
		display: grid;
		justify-items: center;
		padding: 0.5rem 1.25rem 1.25rem;
		text-align: center;
	}

	.deck-counter {
		color: var(--muted-ink);
		font-family: var(--font-hand);
		font-size: 0.66rem;
		font-variation-settings: 'INFM' 70;
		letter-spacing: 0.22em;
	}

	.deck-copy {
		display: grid;
		justify-items: center;
		opacity: 1;
		transition: opacity 240ms var(--ease-out);
	}

	@starting-style {
		.deck-copy {
			opacity: 0;
		}
	}

	.deck-copy h2 {
		margin: 0.6rem 0 0;
		font-family: var(--font-ui);
		font-size: 0.98rem;
		font-weight: 560;
		letter-spacing: 0.24em;
		line-height: 1.1;
		text-transform: uppercase;
	}

	.deck-copy p {
		max-width: 30rem;
		min-height: 1.5em;
		margin: 0.6rem 0 0;
		color: var(--muted-ink);
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 420;
		line-height: 1.5;
	}

	.deck-hint {
		margin: 1.1rem 0 0;
		color: var(--muted-ink);
		font-family: var(--font-hand);
		font-size: 0.7rem;
		font-variation-settings: 'INFM' 70;
		letter-spacing: 0.06em;
		opacity: 0.75;
	}

	.deck-discover {
		margin-top: 0.95rem;
		padding-bottom: 0.2rem;
		color: var(--ink);
		border-bottom: 1px solid currentColor;
		font-size: 0.66rem;
		font-weight: 560;
		letter-spacing: 0.22em;
		text-decoration: none;
		text-transform: uppercase;
	}

	.deck-discover:hover,
	.deck-discover:focus-visible {
		color: var(--accent);
		outline: none;
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

			transform: translateY(-1px) scale(1.035);
		}
	}

	@media (max-width: 720px) {
		.deck {
			--card-w: min(calc(clamp(17rem, 52svh, 28rem) * 5 / 7), 76vw);
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
			translate: none;
		}

		.deck-arrow--prev {
			grid-column: 2;
		}

		.deck-arrow--next {
			grid-column: 3;
		}

		.deck-caption {
			padding-top: 0.5rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.deck,
		.deck-copy,
		.deck-arrow {
			transition: none;
		}

		.card__inner {
			will-change: auto;
		}
	}
</style>
