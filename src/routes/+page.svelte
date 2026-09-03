<script>
	import { resolve } from '$app/paths';
	import RadioButtonIcon from 'phosphor-svelte/lib/RadioButtonIcon';
	import BlobField from '$lib/landingPage/BlobField.svelte';
	import { landingBlobs } from '$lib/landingPage/blobSeeds.js';
	import { categories } from '$lib/project/project.js';
</script>

<svelte:head>
	<title>Gordon Tu — Design engineer</title>
	<meta
		name="description"
		content="Design + code: charts, maps, and creative coding by Gordon Tu, a design engineer."
	/>
</svelte:head>

<BlobField blobs={landingBlobs} />

<div class="landing">
	<header class="masthead">
		<a class="brand" href={resolve('/')}>
			<span class="brand__name">Gordon Tu</span>
			<span class="brand__role">Design engineer</span>
		</a>
		<a class="about" href={resolve('/about')}>About</a>
	</header>

	<div class="hero">
		<h1>Design + Code</h1>
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
			<RadioButtonIcon size={15} aria-hidden="true" />
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
			<span class="version muted">v1.0.0</span>
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
		padding: clamp(1.5rem, 4.7svh, 2.8rem) clamp(1.25rem, 4vw, 4.2rem) clamp(1.75rem, 6.2svh, 3.75rem);
		color: var(--ink);
		font-family: var(--font-sans);
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
		font-size: clamp(2.5rem, 8.6vw, 9rem);
		font-weight: 640;
		letter-spacing: -0.015em;
		line-height: 1;
		text-wrap: balance;
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
		gap: 1.5rem 2.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		letter-spacing: 0.16em;
		line-height: 1.2;
	}

	.place,
	.status,
	.contacts {
		white-space: nowrap;
	}

	.place {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
	}

	.place :global(svg) {
		color: var(--muted-ink);
	}

	.contacts {
		display: inline-flex;
		align-items: center;
		justify-self: end;
		gap: 1.85rem;
	}

	.contacts a:hover {
		color: var(--muted-ink);
	}

	.version {
		margin-left: 1.4rem;
		font-weight: 400;
		text-transform: none;
	}

	/* The three colophon groups only share one line from about 1000px up; below that, stack them. */
	@media (max-width: 1000px) {
		.colophon {
			grid-template-columns: 1fr;
			justify-items: start;
			gap: 0.9rem;
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
</style>
