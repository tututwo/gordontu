<script>
	import { EMAIL } from '$lib/contact.js';

	/** From the bio (VISA) and the Projects' Clients (project.js). */
	const workedWith = ['VISA', 'Yale University', 'UC Berkeley', 'World Bank'];

	/** Where the last send got to. @type {'' | 'sending' | 'sent' | 'invalid' | 'failed'} */
	let status = $state('');
	/** The server's reason, when it turned the message away. */
	let reason = $state('');
	/** The address a sent message will be answered at. */
	let sentTo = $state('');
	/** The message as written, kept to copy if it could not be sent. */
	let draft = $state('');
	/** Which copy button last worked, for its "Copied". @type {'' | 'email' | 'draft'} */
	let copied = $state('');
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let copiedTimer;

	/**
	 * Sends the message from the page, to /api/contact, which emails it to Gordon with Reply-To set to
	 * the visitor. Without script the form falls back to opening their email app (its mailto action).
	 * @param {SubmitEvent & { currentTarget: HTMLFormElement }} event
	 */
	async function send(event) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		// Spaces alone pass `required`, but make an empty message.
		const body = /** @type {HTMLTextAreaElement} */ (form.elements.namedItem('body'));
		if (!String(data.get('body') ?? '').trim()) {
			body.setCustomValidity('Write a message first.');
			body.reportValidity();
			return;
		}
		draft = String(data.get('body')).trim();
		status = 'sending';
		try {
			const response = await fetch('/api/contact', { method: 'POST', body: data });
			const result = await response.json().catch(() => ({}));
			if (response.status === 400) {
				status = 'invalid';
				reason = result.error ?? 'Check the form and try again.';
				return;
			}
			if (!response.ok) throw new Error(result.error);
			status = 'sent';
			sentTo = String(data.get('email')).trim();
			form.reset();
			window.posthog.capture?.('contact_form_submitted');
		} catch {
			status = 'failed';
			window.posthog.capture?.('contact_form_failed');
		}
	}

	/** @param {string} text @param {'email' | 'draft'} which */
	async function copy(text, which) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			return;
		}
		window.posthog.capture?.(which === 'email' ? 'email_copied' : 'message_copied');
		copied = which;
		clearTimeout(copiedTimer);
		copiedTimer = setTimeout(() => (copied = ''), 1600);
	}
</script>

<svelte:head>
	<title>Contact — Gordon Tu</title>
	<meta
		name="description"
		content="Get in touch with Gordon Tu about interactive maps, visual stories, and web tools."
	/>
</svelte:head>

<div class="contact">
	<p>
		Have data that should be easier to understand? Whether you have a project in mind, want to work
		together, or just have a question, I’d love to hear from you. I design and build interactive
		maps, visual stories, and web tools, from the first sketch to the finished page.
	</p>

	<p class="direct">
		Email me at <span class="email">{EMAIL}</span>
		<button class="copy text-copy-14" type="button" onclick={() => copy(EMAIL, 'email')}>
			{copied === 'email' ? 'Copied' : 'Copy'}
		</button>
		<span class="sr-only" aria-live="polite">{copied === 'email' ? 'Email address copied' : ''}</span>
		<br />or write below, and I’ll get back to you soon.
	</p>

	<form
		class="form"
		action="mailto:{EMAIL}"
		method="get"
		aria-label="Write to Gordon"
		onsubmit={send}
	>
		<label>
			<span class="text-eyebrow">Your email</span>
			<input name="email" type="email" autocomplete="email" required placeholder="So I can write back" />
		</label>
		<label>
			<span class="text-eyebrow">Subject <span class="optional">Optional</span></span>
			<input name="subject" placeholder="What would you like to talk about?" />
		</label>
		<label>
			<span class="text-eyebrow">Message</span>
			<textarea
				name="body"
				rows="6"
				required
				oninput={(event) => event.currentTarget.setCustomValidity('')}
				placeholder="What are you working on? It helps to hear what data you have, who it is for, whether it should be static or interactive, and any budget or deadline."
			></textarea>
		</label>
		<!-- A trap for bots, which fill in every field: hidden from people and screen readers. -->
		<div class="trap" aria-hidden="true">
			<input name="website" tabindex="-1" autocomplete="off" />
		</div>
		<div class="send">
			<button class="submit text-copy-14" type="submit" disabled={status === 'sending'}>
				{status === 'sending' ? 'Sending…' : 'Send message'}
			</button>
		</div>
	</form>

	<div class="status" role="status">
		{#if status === 'sent'}
			<p class="text-copy-14">
				<span class="check" aria-hidden="true">✓</span> Sent. I’ll write back to {sentTo}.
			</p>
		{:else if status === 'invalid'}
			<p class="text-copy-14">{reason}</p>
		{:else if status === 'failed'}
			<p class="text-copy-14">It didn’t send, sorry. Copy your message and email it to {EMAIL}.</p>
			<button class="copy text-copy-14" type="button" onclick={() => copy(draft, 'draft')}>
				{copied === 'draft' ? 'Copied' : 'Copy message'}
			</button>
		{/if}
	</div>

	<section class="worked-with" aria-labelledby="worked-with">
		<h2 id="worked-with" class="text-eyebrow">Worked with</h2>
		<ul>
			{#each workedWith as name (name)}
				<li class="text-heading-16">{name}</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.contact {
		display: grid;
	}

	p + p {
		margin-top: 1em;
	}

	/* The address is plain words, in ink; the Copy button beside it is the thing to press. */
	.email {
		color: var(--color-obsidian);
		text-decoration: none;
	}

	/*
	 * A plain button: a hairline box, square like everything here, sitting in the line. Wide enough for
	 * "Copied" so the box does not jump, and its target grown to 44px tall without moving the line.
	 */
	.copy {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 5em;
		height: 1.375rem;
		margin-left: var(--spacing-4);
		padding: 0 var(--spacing-8);
		border: 1px solid var(--color-hairline);
		border-radius: 0;
		background: var(--color-pure-white);
		color: var(--color-stone);
		cursor: pointer;
		transition:
			color 160ms var(--ease-out),
			border-color 160ms var(--ease-out);
	}

	/* From the padding box, which is 20px tall inside the border: 12px more above and below makes 44. */
	.copy::after {
		position: absolute;
		inset: -0.75rem 0;
		content: '';
	}

	/* Only where there is a real hover: on a phone a tapped button would keep it. */
	@media (hover: hover) {
		.copy:hover {
			border-color: var(--color-ash);
			color: var(--color-obsidian);
		}
	}

	.copy:focus-visible {
		outline: 2px solid var(--color-carbon);
		outline-offset: 2px;
	}

	.form {
		display: grid;
		gap: var(--spacing-20);
		margin-top: var(--spacing-40);
	}

	label {
		display: grid;
		gap: var(--spacing-8);
		min-width: 0;
	}

	.optional {
		margin-left: var(--spacing-4);
		color: var(--color-slate);
	}

	/* White fields edged by a hairline, square like everything else here, in the page's own type
	   (16px, so a phone does not zoom in on them). */
	input,
	textarea {
		width: 100%;
		margin: 0;
		padding: var(--spacing-12);
		border: 1px solid var(--color-hairline);
		border-radius: 0;
		background: var(--color-pure-white);
		color: var(--color-obsidian);
		transition: border-color 160ms var(--ease-out);
	}

	@media (hover: hover) {
		input:hover,
		textarea:hover {
			border-color: var(--color-ash);
		}
	}

	textarea {
		min-height: 9rem;
		resize: vertical;
	}

	::placeholder {
		color: var(--color-slate);
		opacity: 1;
	}

	/* Off the page rather than display: none, which some bots know to skip. */
	.trap {
		position: absolute;
		left: -9999px;
	}

	.send {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-12) var(--spacing-16);
		margin-top: var(--spacing-4);
	}

	/* Vercel's primary action: ink with white words, the one filled thing on the page. */
	.submit {
		padding: var(--spacing-12) var(--spacing-20);
		border: 0;
		background: var(--color-obsidian);
		color: var(--color-pure-white);
		cursor: pointer;
		transition: background 160ms var(--ease-out);
	}

	@media (hover: hover) {
		.submit:hover {
			background: var(--color-charcoal);
		}
	}

	.copy:active,
	.submit:active {
		opacity: 0.55;
	}

	.submit:disabled {
		cursor: progress;
		opacity: 0.55;
	}

	.status:not(:empty) {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-4) var(--spacing-8);
		margin-top: var(--spacing-24);
		padding-top: var(--spacing-16);
		border-top: 1px solid var(--color-hairline);
		color: var(--color-charcoal);
	}

	.status .copy {
		margin-left: 0;
	}

	/* Vercel keeps its one colour for confirmations, with the tick as its non-colour cue. */
	.check {
		color: var(--color-terminal-green);
	}

	.worked-with {
		margin-top: var(--spacing-40);
		padding-top: var(--spacing-24);
		border-top: 1px solid var(--color-hairline);
	}

	.worked-with ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-8) var(--spacing-24);
		margin-top: var(--spacing-12);
		padding: 0;
		list-style: none;
		color: var(--color-charcoal);
	}
</style>
