<script>
	import { resolve } from '$app/paths';
	import RadioButtonIcon from 'phosphor-svelte/lib/RadioButtonIcon';
	import BlobField from '$lib/landingPage/BlobField.svelte';
	import { landingBlobs } from '$lib/landingPage/blobSeeds.js';
	import { categories } from '$lib/project/project.js';

	let sinks = $state(0);
	let painted = $state(false);
	let pocketed = 0;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let paintTimer;

	/** @param {number} i */
	function onsink(i) {
		sinks += 1;
		pocketed |= 1 << i;
		if (pocketed !== (1 << landingBlobs.length) - 1) return;
		pocketed = 0;
		painted = true;
		clearTimeout(paintTimer);
		paintTimer = setTimeout(() => (painted = false), 3000);
	}
</script>

<svelte:head>
	<title>Gordon Tu — Design engineer</title>
	<meta
		name="description"
		content="Design + code: charts, maps, and creative coding by Gordon Tu, a design engineer."
	/>
</svelte:head>

<BlobField blobs={landingBlobs} {onsink} />

<div class="landing">
	<header class="masthead">
		<a class="brand" href={resolve('/')}>
			<span class="brand__name">Gordon Tu</span>
			<span class="brand__role">Design engineer</span>
		</a>
		<a class="about" href={resolve('/about')}>About</a>
	</header>

	<div class="hero">
		<h1
			class={{ painted }}
			style:--c0={landingBlobs[0].color}
			style:--c1={landingBlobs[1].color}
			style:--c2={landingBlobs[2].color}>Design + Code</h1
		>
		<nav aria-label="Sections">
			<ul>
				{#each categories as { label, slug } (slug)}
					<li><a href={resolve('/[category]', { category: slug })}>{label}</a></li>
				{/each}
				<li><a href={resolve('/blog')}>Blog</a></li>
			</ul>
		</nav>
	</div>

	<footer class="colophon">
		<p class="place">
			<RadioButtonIcon size={17} aria-hidden="true" />
			<span>37.77°N 122.42°W</span>
		</p>
		<p class="status"><span class="muted">Status:</span> Open to opportunities</p>
		<p class="contacts">
			<a href="mailto:gordontu2@gmail.com">Email</a>
			<span class="muted" aria-hidden="true">/</span>
			<a href="https://github.com/tututwo" target="_blank" rel="noreferrer">GitHub</a>
			<span class="muted" aria-hidden="true">/</span>
			<!-- Gordon: confirm this LinkedIn slug before deploying; it is unverified. -->
			<a href="https://www.linkedin.com/in/gordontu" target="_blank" rel="noreferrer">LinkedIn</a>
			<span class="version muted"
				>v1.0.0{#if sinks}<span aria-hidden="true"> · ×{sinks}</span>{/if}</span
			>
		</p>
	</footer>
</div>

<style>
	/* On html so the html/body backgrounds (overscroll) take the landing paper too. */
	:global(html:has(.landing)) {
		--paper: #f2edec;
		--ink: #000;
		--muted-ink: #5d5b60;
		--accent: #f4aa12;
		--wash-blush: transparent;
		--wash-sky: transparent;
		--wash-mint: transparent;
	}

	.landing {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-rows: auto 1fr auto;
		min-height: 100svh;
		padding: clamp(1.5rem, 4.7svh, 2.8rem) clamp(1.25rem, 4vw, 4.2rem)
			clamp(1.75rem, 5.65svh, 3.4rem);
		color: var(--ink);
		font-family: var(--font-sans);
		touch-action: pinch-zoom;
		text-transform: uppercase;
	}

	a {
		color: inherit;
		text-decoration: none;
	}

	a:focus-visible {
		/* Ink, not accent: the accent is 1.7:1 on this paper, far below the 3:1 a focus ring needs. */
		outline: 2px solid var(--ink);
		outline-offset: 6px;
	}

	p {
		margin: 0;
	}

	.muted {
		color: var(--muted-ink);
	}

	/* --- masthead --- */

	.masthead {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.5rem;
	}

	.brand {
		display: grid;
		gap: 0.6rem;
		/* The bar hangs outside the text column, as in the mock. */
		margin-left: -1.15rem;
		padding: 0.15rem 0 0.15rem 1.45rem;
		border-left: 2px solid var(--accent);
		line-height: 1;
	}

	.brand__name {
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.22em;
	}

	.brand__role {
		color: var(--muted-ink);
		font-size: 0.8rem;
		font-weight: 500;
		letter-spacing: 0.22em;
	}

	.about {
		margin-top: 0.35rem;
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-decoration: underline;
		text-decoration-color: var(--muted-ink);
		text-decoration-thickness: 1.5px;
		text-underline-offset: 0.55em;
	}

	.about:hover {
		text-decoration-color: var(--accent);
	}

	/* --- hero --- */

	.hero {
		display: grid;
		align-content: center;
		justify-items: center;
		gap: clamp(2rem, 6svh, 3.6rem);
		padding: 2rem 0;
		text-align: center;
	}

	h1 {
		margin: 0;
		background: linear-gradient(
			100deg,
			color-mix(in oklab, var(--c0), var(--ink) 32%),
			color-mix(in oklab, var(--c1), var(--ink) 32%),
			color-mix(in oklab, var(--c2), var(--ink) 32%)
		);
		-webkit-background-clip: text;
		background-clip: text;
		font-size: clamp(2.5rem, 8.6vw, 9rem);
		font-weight: 640;
		letter-spacing: -0.015em;
		line-height: 1;
		text-wrap: balance;
		transition: color 1s var(--ease-out);
	}

	h1.painted {
		color: transparent;
		transition-duration: 160ms;
	}

	nav ul {
		display: grid;
		gap: clamp(1.3rem, 4.4svh, 2.6rem);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	nav a {
		display: inline-block;
		padding: 0.15em 0.4em;
		font-size: clamp(1.05rem, 1.65vw, 1.75rem);
		font-weight: 500;
		letter-spacing: 0.1em;
		text-decoration: underline;
		text-decoration-color: transparent;
		text-decoration-thickness: 2px;
		text-underline-offset: 0.35em;
		transition: text-decoration-color 160ms var(--ease-out);
	}

	nav a:hover,
	nav a:focus-visible {
		text-decoration-color: var(--accent);
	}

	/* --- colophon --- */

	.colophon {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 1.5rem clamp(1rem, 2.4vw, 2.5rem);
		font-size: clamp(0.68rem, 0.86vw, 0.875rem);
		font-weight: 500;
		letter-spacing: 0.16em;
		line-height: 1.2;
	}

	.colophon .muted {
		color: #77747a;
		font-weight: 400;
	}

	.place,
	.status,
	.contacts {
		white-space: nowrap;
	}

	.place {
		display: inline-flex;
		align-items: center;
		gap: clamp(0.5rem, 0.67vw, 0.7rem);
		letter-spacing: 0.2em;
	}

	.place :global(svg) {
		width: clamp(0.68rem, 1.02vw, 1.0625rem);
		height: clamp(0.68rem, 1.02vw, 1.0625rem);
		color: #77747a;
	}

	.status {
		transform: translateX(calc(clamp(0.625rem, 0.96vw, 1rem) * -1));
		letter-spacing: 0.18em;
	}

	.contacts {
		display: inline-flex;
		align-items: center;
		justify-self: end;
		gap: clamp(1rem, 1.7vw, 1.75rem);
	}

	.contacts a:hover {
		color: var(--muted-ink);
	}

	.version {
		margin-left: clamp(0.75rem, 1.34vw, 1.4rem);
		font-weight: 400;
		text-transform: none;
	}

	/* Fluid type keeps the colophon on one line through tablet widths; stack only once it gets tight. */
	@media (max-width: 900px) {
		.colophon {
			grid-template-columns: 1fr;
			justify-items: start;
			gap: 0.9rem;
		}

		.status {
			transform: none;
		}

		.contacts {
			justify-self: start;
		}
	}

	@media (max-width: 720px) {
		.landing {
			padding: 1.25rem 1.25rem 1.5rem;
		}

		.hero {
			gap: 2rem;
		}

		.colophon {
			font-size: 0.72rem;
		}

		.contacts {
			flex-wrap: wrap;
			gap: 0.8rem;
			white-space: normal;
		}

		.version {
			margin-left: 0.4rem;
		}
	}

	@media (orientation: landscape) and (max-height: 600px) {
		.landing {
			padding: 0.75rem 1.25rem;
		}

		.hero {
			gap: 1rem;
			padding: 0.75rem 0;
		}

		nav ul {
			grid-template-columns: repeat(4, auto);
			gap: 1rem;
		}
	}
</style>
