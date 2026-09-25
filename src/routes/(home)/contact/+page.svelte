<script>
	/** Where every message goes: the mailto link, the form, and both copy buttons. */
	const EMAIL = 'tugordon@outlook.com';

	/** From the bio (VISA) and the Projects' Clients (project.js). */
	const workedWith = ['VISA', 'Yale University', 'UC Berkeley', 'World Bank'];

	/** The message as the form wrote it out, once sent: kept to copy if no email app opened. */
	let draft = $state('');
	/** Which copy button last worked, for its "Copied". @type {'' | 'email' | 'draft'} */
	let copied = $state('');
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let copiedTimer;

	/**
	 * The site is static, so the form has no server to post to: it writes the message out and opens
	 * it in the visitor's email app, addressed and ready to send. Without script the browser does the
	 * same with the subject and message alone.
	 * @param {SubmitEvent & { currentTarget: HTMLFormElement }} event
	 */
	function send(event) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		/** @param {string} name */
		const field = (name) => String(data.get(name) ?? '').trim();
		const name = field('name');
		const reference = field('reference');
		// Mail wants CRLF line breaks (RFC 6068), the visitor's own included; a blank line before the signature.
		const message = field('body').replace(/\r?\n/g, '\r\n');
		const signature = [`— ${name}`, field('email'), reference && `Found you through: ${reference}`].filter(Boolean);
		draft = [message, '', ...signature].join('\r\n');
		const subject = field('subject') || `Hello from ${name}`;
		location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`;
	}

	/** @param {string} text @param {'email' | 'draft'} which */
	async function copy(text, which) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			return;
		}
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
		Email me at <a class="email" href="mailto:{EMAIL}">{EMAIL}</a>
		<button class="copy text-copy-14" type="button" onclick={() => copy(EMAIL, 'email')}>
			{copied === 'email' ? 'Copied' : 'Copy'}
		</button>
		<br />or write below, and I’ll get back to you soon.
	</p>

	<form
		class="form"
		action="mailto:{EMAIL}"
		method="get"
		aria-label="Write to Gordon"
		onsubmit={send}
	>
		<div class="pair">
			<label>
				<span class="text-eyebrow">Name</span>
				<input name="name" autocomplete="name" required />
			</label>
			<label>
				<span class="text-eyebrow">Email</span>
				<input name="email" type="email" autocomplete="email" required />
			</label>
		</div>
		<label>
			<span class="text-eyebrow">How did you find me? <span class="optional">Optional</span></span>
			<input name="reference" placeholder="A search, a friend, a project of mine…" />
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
				placeholder="What are you working on? It helps to hear what data you have, who it is for, whether it should be static or interactive, and any budget or deadline."
			></textarea>
		</label>
		<div class="send">
			<button class="submit text-copy-14" type="submit">Send message</button>
			<span class="text-copy-13">Opens your email app with the message written out.</span>
		</div>
	</form>

	<div class="status" role="status">
		{#if draft}
			<p class="text-copy-14">
				<span class="check" aria-hidden="true">✓</span> Your email app should now be open, with the message
				ready to send. Nothing opened? Copy it and send it to {EMAIL}.
			</p>
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

	/* Links in the panel's words: ink, over a light rule that darkens when pointed at. */
	.email {
		color: var(--color-obsidian);
		text-decoration: underline;
		text-decoration-color: var(--color-ash);
		text-decoration-thickness: 1px;
		text-underline-offset: 0.3em;
		transition: text-decoration-color 160ms var(--ease-out);
	}

	.email:hover {
		text-decoration-color: currentColor;
	}

	/* A quiet text button; padding grows its target to 44px without moving the line. */
	.copy {
		margin: -0.75rem 0 -0.75rem var(--spacing-4);
		padding: 0.75rem var(--spacing-4);
		border: 0;
		background: none;
		color: var(--color-stone);
		cursor: pointer;
		transition: color 160ms var(--ease-out);
	}

	.copy:hover {
		color: var(--color-obsidian);
	}

	.form {
		display: grid;
		gap: var(--spacing-20);
		margin-top: var(--spacing-40);
	}

	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
		gap: var(--spacing-20);
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

	input:hover,
	textarea:hover {
		border-color: var(--color-ash);
	}

	textarea {
		min-height: 9rem;
		resize: vertical;
	}

	::placeholder {
		color: var(--color-slate);
		opacity: 1;
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

	.submit:hover {
		background: var(--color-charcoal);
	}

	.copy:active,
	.submit:active,
	.email:active {
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
		padding-left: 0;
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
