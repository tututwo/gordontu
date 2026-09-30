<script>
	import { resolve } from '$app/paths';
	import { scrambleIn } from '$lib/landingPage/scramble.js';

	/** Who made the site, as a film's end credits have it. @type {[string, string[]][]} */
	const credits = [
		['Cast', ['Gordon']],
		['Director', ['Gordon']],
		['Producer', ['Gordon']],
		['Writer', ['Gordon']],
		['Photography & cinematography', ['Opus 5.5', 'Seedance 2.5', 'Image 2']],
		['Editor', ['Gordon', 'Image 2', 'Opus 5.5']],
		['Animation', ['GSAP', 'Seedance 2.5', 'Opus 5.5']]
	];

	/**
	 * A credit's names on one line, a dot between them. A narrow window wraps it after a dot, never
	 * inside a name ("Seedance / 2.5").
	 * @param {string[]} names
	 */
	const joined = (names) => names.map((name) => name.replaceAll(' ', ' ')).join(' · ');

	/** Whether the credits are in: until then (with script, and with motion) they wait, unseen. */
	let shown = $state(false);

	/**
	 * The credits come in as the landing does after its Intro: all at once as light look-alikes, then
	 * decoding in step (scramble.js), once the web font is in, as each word is held at its width. With
	 * reduced motion they are simply there.
	 * @param {HTMLElement} node
	 */
	function arrive(node) {
		/** @type {gsap.core.Timeline | null | undefined} */
		let scramble;
		let gone = false;
		document.fonts.ready.then(() => {
			if (gone) return;
			scramble = matchMedia('(prefers-reduced-motion: reduce)').matches ? null : scrambleIn([node]);
			shown = true;
		});
		return () => {
			gone = true;
			scramble?.kill();
		};
	}
</script>

<svelte:head>
	<title>Credits — Gordon Tu</title>
	<meta name="description" content="The credits: made by Gordon, with a small cast of very talented tools." />
</svelte:head>

<!-- A film's end credits in the landing's column: the avatar (the way home), each role an eyebrow over
     its names, and Gordon's sign-off under one short rule. -->
<section class={['credits', { shown }]} {@attach arrive}>
	<h1 class="sr-only">Credits</h1>
	<a href={resolve('/')} aria-label="Home"><img src="/landing/avatar.png" alt="" width="134" height="134" /></a>

	<dl>
		{#each credits as [role, names] (role)}
			<div>
				<dt class="text-eyebrow">{role}</dt>
				<dd class="text-heading-20">{joined(names)}</dd>
			</div>
		{/each}
	</dl>

	<hr />
	<p class="text-copy-13">Made by Gordon, with a small cast of very talented tools.</p>
</section>

<style>
	/* Centred, as credits are, with the landing's width and its air above. */
	.credits {
		display: grid;
		justify-items: center;
		max-width: 37.5rem;
		margin: 0 auto;
		padding: max(5rem, 12vh) 1.25rem 5rem;
		text-align: center;
		text-wrap: balance;
	}

	/* The avatar at the landing's size (4em of its 20px). */
	img {
		display: block;
		width: 5rem;
		height: auto;
	}

	a:active {
		opacity: 0.55;
	}

	dl {
		display: grid;
		gap: var(--spacing-32);
		margin-top: var(--spacing-40);
	}

	dt {
		color: var(--color-stone);
	}

	dd {
		margin-top: var(--spacing-8);
	}

	/* As wide as the avatar above, so the two close the credits like brackets. */
	hr {
		width: 5rem;
		margin: var(--spacing-40) 0 0;
		border: 0;
		border-top: 1px solid var(--color-hairline);
	}

	p {
		margin-top: var(--spacing-24);
		color: var(--color-stone);
	}

	.credits :global(.scrambled) {
		color: var(--color-ash);
	}

	/* Unseen until they scramble in, so a loaded page does not show them first; shown anyway if the
	   script never comes. */
	@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
		.credits:not(.shown) :is(dl, p) {
			opacity: 0;
			animation: credits-failsafe-shown 0s 5s forwards;
		}
	}

	@keyframes credits-failsafe-shown {
		to {
			opacity: 1;
		}
	}
</style>
