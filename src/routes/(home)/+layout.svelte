<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import GithubLogoIcon from 'phosphor-svelte/lib/GithubLogoIcon';
	import LinkedinLogoIcon from 'phosphor-svelte/lib/LinkedinLogoIcon';
	import XLogoIcon from 'phosphor-svelte/lib/XLogoIcon';
	import Avatar from '$lib/landingPage/Avatar.svelte';
	import CategoryLink from '$lib/landingPage/CategoryLink.svelte';
	import { headlineFlow } from '$lib/landingPage/headlineFlow.js';
	import { categories } from '$lib/project/project.js';

	let { children } = $props();

	/** @param {string} slug */
	function category(slug) {
		const { label } = /** @type {(typeof categories)[number]} */ (
			categories.find((c) => c.slug === slug)
		);
		return { href: resolve('/[category]/[[slug]]', { category: slug }), label: label.toLowerCase() };
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

	const socials = /** @type {const} */ ([
		{ label: 'X', href: 'https://x.com/_tuyukun', Icon: XLogoIcon, weight: 'regular' },
		{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/gordon-tu/', Icon: LinkedinLogoIcon, weight: 'fill' },
		{ label: 'GitHub', href: 'https://github.com/tututwo', Icon: GithubLogoIcon, weight: 'fill' }
	]);

	// Each tab has its own URL; the home page opens on about. Matched by route, as the server resolves
	// hrefs relative to the page.
	const tabs = /** @type {const} */ ([
		['about', '/(home)/about'],
		['projects', '/(home)/projects'],
		['writing', '/(home)/writing'],
		['contact', '/(home)/contact']
	]);
	const current = $derived(page.route.id === '/(home)' ? '/(home)/about' : page.route.id);
</script>

<div class="landing">
	<div class="intro">
		<h1 class="text-heading-20" {@attach headlineFlow}>
			{#each headline as piece}{#if piece.space}{' '}{/if}{#if 'word' in piece}<span class="word"
						>{piece.word}</span
					>{:else if 'avatar' in piece}<Avatar />{:else}<CategoryLink {...category(piece.slug)} shape={piece.shape} />{/if}{/each}
		</h1>

		<ul class="socials">
			{#each socials as { label, href, Icon, weight } (href)}
				<li>
					<a {href} target="_blank" rel="noreferrer" aria-label={label}>
						<Icon size="0.9em" {weight} aria-hidden="true" />
					</a>
				</li>
			{/each}
		</ul>

		<hr />

		<!-- Only the panel below changes between tabs, so switching keeps the scroll and the focus. -->
		<nav class="text-copy-14" aria-label="Site" data-sveltekit-noscroll data-sveltekit-keepfocus>
			{#each tabs as [label, route] (route)}
				<a href={resolve(route)} aria-current={route === current ? 'page' : undefined}>{label}</a>
			{/each}
		</nav>

		<div class="panel text-copy-16">{@render children()}</div>
	</div>
</div>

<style>
	/*
	 * Proportions from docs/landing-page.png, scaled up so the bio reads at body size (16px, not the
	 * mockup's 12px). Every size below is in em of this one value, and it is in rem so a visitor's
	 * browser text size scales the whole page with it. Top-aligned, not centred: a tab of another
	 * height must not move the headline.
	 */
	/* Clipped, so the avatar's glasses, carried past the end of the page, do not make it longer. */
	.landing {
		min-height: 100svh;
		padding: max(4em, 12vh) 1em 4em;
		overflow: clip;
		font-size: 1.25rem;
	}

	/* ~75 characters of bio per line. */
	.intro {
		max-width: 30em;
		margin: 0 auto;
	}

	a {
		color: inherit;
		text-decoration: none;
		transition: color 160ms var(--ease-out);
	}

	/* Press feedback lands on pointer-down, not on the navigation that follows. */
	a:active {
		opacity: 0.55;
	}

	/*
	 * Geist's heading-20, but for its leading. Every line is the same height: the Category link icons
	 * overhang their lines instead of stretching them, so this line-height alone spaces the headline.
	 * It is loose because the icons (2.625em) overhang it: at 2 they clear each other and the text
	 * around them. On a phone two icons can start consecutive lines, one above the other, so lines
	 * there are a little further apart.
	 */
	h1 {
		line-height: 2;
	}

	@media (max-width: 30em) {
		h1 {
			line-height: 2.4;
		}
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

	.socials {
		display: flex;
		margin: 1.6em 0 0 -0.32em;
		padding: 0;
		list-style: none;
	}

	.socials a {
		display: grid;
		place-items: center;
		width: 1.5em;
		height: 1.5em;
		color: var(--color-slate);
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

	hr {
		margin: 1.2em 0 0;
		border: 0;
		border-top: 1px solid var(--color-hairline);
	}

	/* The tabs in Geist's copy-14, grey until pointed at; the open one in ink, underlined. */
	nav {
		display: flex;
		gap: 1.33rem;
		margin-top: 2.6rem;
		color: var(--color-stone);
	}

	/* Padding grows the tap target to 44px without moving the text. */
	nav a {
		margin: -0.75rem 0;
		padding: 0.75rem 0;
		text-underline-offset: 0.3em;
		text-decoration-thickness: 1px;
	}

	nav a[aria-current='page'] {
		color: var(--color-obsidian);
		text-decoration-line: underline;
	}

	.socials a:hover,
	nav a:hover {
		color: var(--color-obsidian);
	}

	/* The tabs' shared text, Geist's copy-16 in grey; each page styles its own blocks. */
	.panel {
		margin-top: 1.9em;
		color: var(--color-stone);
	}

	/*
	 * A phone fits the headline, the bio and the start of its scrambled last line in one screen (Gordon's
	 * iPhone 16 Pro mock-up): little air above the headline, the social links right under it, and the
	 * tabs right under them, without the rule. The tabs keep clear of the links' 44px targets.
	 */
	@media (max-width: 30em) {
		.landing {
			padding-top: 1.5em;
		}

		.socials {
			margin-top: 0.2em;
		}

		hr {
			display: none;
		}

		nav {
			margin-top: 0.625rem;
		}
	}
</style>
