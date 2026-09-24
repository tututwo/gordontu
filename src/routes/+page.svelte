<script>
	import { resolve } from '$app/paths';
	import GithubLogoIcon from 'phosphor-svelte/lib/GithubLogoIcon';
	import LinkedinLogoIcon from 'phosphor-svelte/lib/LinkedinLogoIcon';
	import XLogoIcon from 'phosphor-svelte/lib/XLogoIcon';
	import CategoryLink from '$lib/landingPage/CategoryLink.svelte';
	import { bioRevision } from '$lib/landingPage/bioRevision.js';
	import { headlineFlow } from '$lib/landingPage/headlineFlow.js';
	import { categories } from '$lib/project/project.js';

	/** @param {string} slug */
	function category(slug) {
		const { label } = /** @type {(typeof categories)[number]} */ (
			categories.find((c) => c.slug === slug)
		);
		return { href: resolve('/[category]', { category: slug }), label: label.toLowerCase() };
	}

	/**
	 * The headline, one piece per word, so each can glide on its own when a Category link's icon grows
	 * and the sentence makes room for it (see headlineFlow.js). `space` is the space before a piece.
	 * @typedef {import('$lib/landingPage/icons/index.js').Shape} Shape
	 * @typedef {{ word: string, space: boolean } | { avatar: true, space: boolean } | { slug: string, shape: Shape, space: boolean }} Piece
	 */
	/** @param {string} text @param {boolean} [space] @returns {Piece[]} */
	const words = (text, space = true) => text.split(' ').map((word, i) => ({ word, space: space || i > 0 }));
	/** @type {Piece[]} */
	const headline = [
		...words('I’m Gordon.', false),
		{ avatar: true, space: true },
		...words('I make your data easier to understand and use through'),
		{ slug: 'maps', shape: 'map', space: true },
		{ word: ',', space: false },
		{ slug: 'charts', shape: 'book', space: true },
		{ word: ',', space: false },
		...words('and'),
		{ slug: 'creative-code', shape: 'tools', space: true },
		...words('designed and built with taste and AI.')
	];

	const sentence = 'I use AI across my toolkit to design and build interactive 2D&3D experiences.';
	const typed = [...sentence];

	const socials = /** @type {const} */ ([
		{ label: 'X', href: 'https://x.com/_tuyukun', Icon: XLogoIcon, weight: 'regular' },
		{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/gordon-tu/', Icon: LinkedinLogoIcon, weight: 'fill' },
		{ label: 'GitHub', href: 'https://github.com/tututwo', Icon: GithubLogoIcon, weight: 'fill' }
	]);
</script>

<svelte:head>
	<title>Gordon Tu — Design engineer</title>
	<meta
		name="description"
		content="I’m Gordon. I make your data easier to understand and use through interactive maps, visual stories, and web tools designed and built with taste and AI."
	/>
</svelte:head>

<div class="landing">
	<div class="intro">
		<h1 {@attach headlineFlow}>
			{#each headline as piece}{#if piece.space}{' '}{/if}{#if 'word' in piece}<span class="word"
						>{piece.word}</span
					>{:else if 'avatar' in piece}<img
						class="avatar"
						src="/landing/avatar.png"
						alt=""
						width="134"
						height="134"
					/>{:else}<CategoryLink {...category(piece.slug)} shape={piece.shape} />{/if}{/each}
		</h1>

		<p class="bio" {@attach bioRevision}>
			I’m a design engineer based in the Bay Area. I’ve worked on design systems and AI workflows at
			<img class="logo" src="/landing/visa.png" alt="" width="32" height="32" /> VISA and turned
			complex research into visualization tools for
			<img class="logo" src="/landing/yale.png" alt="" width="32" height="32" /> Yale and
			<img class="logo" src="/landing/berkeley.png" alt="" width="32" height="32" /> UC Berkeley.
			<del>I&nbsp;use d3.js, three.js+GLSL/TSL, React&amp;Svelte, QGIS, Blender etc..</del>
			<!-- Read once as a sentence; the per-letter copy is only for the typing. -->
			<ins
				><span class="sr-only">{sentence}</span><span aria-hidden="true"
					>{#each typed as char}<span class="char">{char}</span>{/each}</span
				></ins
			>
			<svg class="scratch" aria-hidden="true"></svg>
		</p>

		<ul class="socials">
			{#each socials as { label, href, Icon, weight } (href)}
				<li>
					<a {href} target="_blank" rel="noreferrer" aria-label={label}>
						<Icon size="0.9em" {weight} aria-hidden="true" />
					</a>
				</li>
			{/each}
		</ul>

		<nav aria-label="Site">
			<a href={resolve('/about')}>about</a>
			<!-- ponytail: no destination yet; becomes a link once a projects page exists. -->
			<span class="soon" title="Coming soon">projects</span>
			<a href={resolve('/blog')}>writing</a>
		</nav>
	</div>
</div>

<style>
	/* On html so the html/body backgrounds (overscroll) turn white too, and the paper grain goes. */
	:global(html:has(.landing)) {
		--paper: #fff;
		--wash-blush: transparent;
		--wash-sky: transparent;
		--wash-mint: transparent;
	}

	:global(html:has(.landing) .paper-texture) {
		display: none;
	}

	/*
	 * Proportions from docs/landing-page.png, scaled up so the bio reads at body size (16px, not the
	 * mockup's 12px). Every size below is in em of this one value, and it is in rem so a visitor's
	 * browser text size scales the whole page with it.
	 */
	.landing {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
		min-height: 100svh;
		padding: 4em 1em;
		color: #000;
		font-family: var(--font-sans);
		font-size: 1.25rem;
	}

	/* ~75 characters of bio per line. */
	.intro {
		width: 100%;
		max-width: 30em;
	}

	a {
		color: inherit;
		text-decoration: none;
	}

	a:focus-visible {
		outline: 2px solid #000;
		outline-offset: 2px;
	}

	/* Press feedback lands on pointer-down, not on the navigation that follows. */
	a:active {
		opacity: 0.55;
	}

	/* Leading stays loose because the Category link frames and the avatar sit inline in these lines. */
	h1 {
		margin: 0;
		font-size: 1em;
		font-weight: 600;
		letter-spacing: -0.015em;
		line-height: 1.8;
	}

	/* Inline-block so each word can be moved on its own; it wraps exactly as plain text would. */
	.word {
		display: inline-block;
	}

	/* Where a lit card splits a word, the letters after the cut are an aria-hidden copy placed in the
	   headline (see headlineFlow.js). It draws them as generated content, so the sentence reads once. */
	h1:global([data-flow]) {
		position: relative;
	}

	h1 :global([data-twin])::before {
		content: attr(data-twin);
	}

	.avatar {
		width: 4em;
		height: auto;
		vertical-align: 0.15em;
	}

	.bio {
		position: relative;
		margin: 1.6em 0 0;
		color: #707070;
		font-size: 0.8em;
		line-height: 1.8;
	}

	.logo {
		width: 1.333em;
		height: 1.333em;
		vertical-align: -0.3em;
	}

	del {
		padding: 0.125em 0.1em;
		border-radius: 0.17em;
		background: #ececec;
		text-decoration: none;
		-webkit-box-decoration-break: clone;
		box-decoration-break: clone;
	}

	ins {
		text-decoration: none;
	}

	.char {
		position: relative;
	}

	.char:global(.caret)::after {
		position: absolute;
		top: 0.05em;
		bottom: -0.1em;
		left: 100%;
		width: 1px;
		content: '';
		background: currentColor;
		animation: blink 1s steps(1) infinite;
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

	.scratch {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	.scratch :global(path) {
		fill: none;
		stroke: #000;
		stroke-width: 1;
		stroke-dasharray: 1;
	}

	/*
	 * The Bio revision's start state, held only while the script that plays it can run. If that
	 * script never arrives, a zero-length animation shows the finished revision after 5 s; the
	 * script marks the paragraph `revising` on arrival and takes over.
	 */
	@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
		del {
			background-color: rgb(236 236 236 / 0);
			animation: bio-failsafe-del 0s 5s forwards;
		}

		.char {
			opacity: 0;
			animation: bio-failsafe-char 0s 5s forwards;
		}

		.bio:global(.revising) :is(del, .char) {
			animation: none;
		}
	}

	@keyframes bio-failsafe-del {
		to {
			background-color: #ececec;
			text-decoration-line: line-through;
		}
	}

	@keyframes bio-failsafe-char {
		to {
			opacity: 1;
		}
	}

	/* No script, no drawn scratch: fall back to a plain strikethrough. */
	@media (scripting: none) {
		del {
			text-decoration: line-through;
		}
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	.socials {
		display: flex;
		margin: 1.275em 0 0 -0.32em;
		padding: 0;
		list-style: none;
	}

	.socials a {
		display: grid;
		place-items: center;
		width: 1.5em;
		height: 1.5em;
		color: #838383;
		transition: color 160ms var(--ease-out);
	}

	/* Fingers get 44px targets (Apple's minimum); the icons keep their size and spread a little. */
	@media (pointer: coarse) {
		.socials {
			margin-left: -0.68em;
		}

		.socials a {
			width: 2.2em;
			height: 2.2em;
		}
	}

	.socials a:hover {
		color: #000;
	}

	/* #767676 is the lightest grey that still reads at 4.5:1 on white; the mockup's #9a9a9a did not. */
	nav {
		display: flex;
		gap: 1.33em;
		margin-top: 2.2em;
		color: #767676;
		font-size: 0.8em;
		line-height: 1.5;
	}

	/* Padding grows the tap target to 44px without moving the text. */
	nav a {
		margin: -0.625em 0;
		padding: 0.625em 0;
		transition: color 160ms var(--ease-out);
	}

	/* Not a link yet, so it must not look like one. */
	.soon {
		color: #bdbdbd;
		cursor: default;
	}

	nav a:hover {
		color: #000;
	}
</style>
