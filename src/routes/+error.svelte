<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} — Gordon Tu</title>
</svelte:head>

<!-- In the landing's column, so a wrong turn still looks like the site. -->
<section class="error">
	<p class="text-eyebrow">Error</p>
	<h1 class="text-heading-48">{page.status}</h1>
	<p class="text-copy-16">{page.error?.message ?? 'Something went wrong.'}</p>
	<a class="text-copy-16" href={resolve('/')}>← Back to the home page</a>
</section>

<style>
	.error {
		display: grid;
		justify-items: start;
		max-width: 37.5rem;
		margin: 0 auto;
		padding: max(5rem, 12vh) 1.25rem 5rem;
		color: var(--color-stone);
	}

	h1 {
		margin-top: var(--spacing-8);
		color: var(--color-obsidian);
	}

	h1 + p {
		margin-top: var(--spacing-12);
	}

	/* Padding grows the tap target to 44px without moving the text. */
	a {
		margin-top: var(--spacing-24);
		padding: 0.625rem 0;
		color: var(--color-obsidian);
		text-decoration: underline;
		text-decoration-color: var(--color-ash);
		text-decoration-thickness: 1px;
		text-underline-offset: 0.3em;
		transition: text-decoration-color 160ms var(--ease-out);
	}

	a:hover {
		text-decoration-color: currentColor;
	}

	a:active {
		opacity: 0.55;
	}
</style>
