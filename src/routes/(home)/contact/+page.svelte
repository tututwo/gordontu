<script module>
	/** @typedef {'name' | 'topic' | 'body' | 'email' | 'review' | 'sent'} Step */

	/** The chat's turns in order: each answer moves it on one. */
	const steps = /** @type {const} */ (['name', 'topic', 'body', 'email', 'review', 'sent']);

	const blank = () => ({
		step: /** @type {Step} */ ('name'),
		name: '',
		topic: '',
		body: '',
		email: '',
		note: '',
		/** The honeypot: only a bot fills it in. */
		website: ''
	});

	/**
	 * What the visitor has said so far. It lives here, not in the page, so their words survive a look
	 * at another tab. The page is prerendered and this only ever changes in the visitor's browser.
	 */
	const chat = $state(blank());
</script>

<script>
	import ArrowUpIcon from 'phosphor-svelte/lib/ArrowUpIcon';
	import gsap from 'gsap';
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { EMAIL } from '$lib/contact.js';

	/** Gordon's calendar, for anyone who would rather talk than type. */
	const CALL = 'https://cal.com/gordon-tu-jjhuo5/30min';

	/** From the bio (VISA) and the Projects' Clients (project.js). */
	const workedWith = ['VISA', 'Yale University', 'UC Berkeley', 'World Bank'];

	/** What a visitor might be working on (it becomes the email's subject), and what Gordon asks next. */
	const topics = [
		{ label: 'An interactive map', ask: 'Ooh, a map! Tell me about it. What’s the data, and who’s it for?' },
		{ label: 'A visual story', ask: 'Love a good story. What’s it about, and what data is behind it?' },
		{ label: 'A web tool', ask: 'Nice! What should it help people do, and who’ll be using it?' },
		{ label: 'Something else', ask: 'Sure thing. What’s on your mind?' }
	];

	/** Set once the page runs in the browser: until then, and without script, nothing can be typed. */
	let live = $state(false);
	/** An earlier answer opened again to change it. @type {'' | 'name' | 'body' | 'email'} */
	let editing = $state('');
	/** The answer just changed, whose reply takes the cursor back. @type {'' | 'name' | 'body' | 'email'} */
	let edited = $state('');
	/** Whether the letter has its P.S. field open. */
	let adding = $state(false);
	/** Where the send got to. @type {'' | 'sending' | 'invalid' | 'failed'} */
	let status = $state('');
	/** The server's reason, when it turned the message away. */
	let reason = $state('');
	/** Which copy button last worked, for its "Copied". @type {'' | 'email' | 'letter'} */
	let copied = $state('');
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let copiedTimer;
	/** Whether the visitor has said anything yet: only then do new lines move and take the cursor. */
	let engaged = false;

	const ask = $derived(topics.find((topic) => topic.label === chat.topic)?.ask);
	/** The message as Gordon will read it. */
	const letter = $derived(
		chat.note.trim() ? `${chat.body.trim()}\n\nP.S. ${chat.note.trim()}` : chat.body.trim()
	);
	const sent = $derived(chat.step === 'sent');

	/** Whether the chat has got to this turn. @param {Step} step */
	const reached = (step) => steps.indexOf(chat.step) >= steps.indexOf(step);

	onMount(() => {
		live = true;
		// Once sent, the chat starts afresh the next time the tab opens.
		return () => {
			if (chat.step === 'sent') Object.assign(chat, blank());
		};
	});

	/**
	 * A reply field's answer moves the chat on; a changed earlier answer just closes again.
	 * @param {SubmitEvent} event
	 * @param {'name' | 'body' | 'email'} step
	 */
	function reply(event, step) {
		event.preventDefault();
		engaged = true;
		if (editing === step) {
			editing = '';
			edited = step;
			return;
		}
		if (step === 'name') window.posthog.capture?.('contact_chat_started');
		chat.step = steps[steps.indexOf(step) + 1];
	}

	/** A tapped answer opens again, to change it, and a refusal it may fix goes. @param {'name' | 'body' | 'email'} step */
	function edit(step) {
		engaged = true;
		editing = step;
		if (status === 'invalid') status = '';
	}

	/** @param {string} label */
	function choose(label) {
		engaged = true;
		chat.topic = label;
		if (chat.step === 'topic') chat.step = 'body';
	}

	/** In the message, Enter starts a new line and ⌘ or Ctrl + Enter sends it. @param {KeyboardEvent & { currentTarget: HTMLTextAreaElement }} event */
	function sendOnModEnter(event) {
		if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey) || event.isComposing) return;
		event.preventDefault();
		if (event.currentTarget.value.trim()) event.currentTarget.form?.requestSubmit();
	}

	/**
	 * Sends the letter to /api/contact, which emails it to Gordon with Reply-To set to the visitor.
	 * The topic and name make its subject, so his inbox says who wrote and about what.
	 */
	async function send() {
		status = 'sending';
		const data = new FormData();
		data.set('email', chat.email.trim());
		data.set('subject', `${chat.topic}, from ${chat.name.trim()}`);
		data.set('body', letter);
		data.set('website', chat.website);
		try {
			const response = await fetch('/api/contact', { method: 'POST', body: data });
			const result = await response.json().catch(() => ({}));
			if (response.status === 400) {
				status = 'invalid';
				reason = result.error ?? 'Something’s off. Check what you wrote and try again.';
				return;
			}
			if (!response.ok) throw new Error(result.error);
			status = '';
			chat.step = 'sent';
			window.posthog.capture?.('contact_form_submitted');
		} catch {
			status = 'failed';
			window.posthog.capture?.('contact_form_failed');
		}
	}

	/** @param {string} text @param {'email' | 'letter'} which */
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

	/** @param {'start' | 'end'} at */
	const called = (at) => window.posthog.capture?.('contact_call_clicked', { at });

	/** A new reply field (or line) takes the cursor once the visitor is talking, never on arrival. */
	const focus = (/** @type {HTMLElement} */ node) => {
		if (engaged) node.focus();
	};

	/** Gordon's lines rise in one after another when a reply brings them, not when the tab opens. */
	function arrive(/** @type {HTMLElement} */ node) {
		if (!engaged || prefersReducedMotion.current) return;
		const tween = gsap.from(node.children, {
			opacity: 0,
			y: 6,
			duration: 0.3,
			ease: 'power3.out',
			stagger: 0.08,
			clearProps: 'opacity,transform'
		});
		return () => tween.kill();
	}
</script>

<svelte:head>
	<title>Contact — Gordon Tu</title>
	<meta
		name="description"
		content="Get in touch with Gordon Tu about interactive maps, visual stories, and web tools."
	/>
</svelte:head>

<!-- An answer the visitor can tap to change, until it is sent. -->
{#snippet said(/** @type {'name' | 'body' | 'email'} */ step, /** @type {string} */ text)}
	<button
		class="you bubble"
		type="button"
		disabled={sent || status === 'sending'}
		onclick={() => edit(step)}
		{@attach edited === step ? focus : null}
	>
		<span class="sr-only">You:{' '}</span>{text.trim()}<span class="sr-only">. Change it</span>
	</button>
{/snippet}

<div class="contact">
	<div class="chat" role="log" aria-label="Chat with Gordon">
		<div class="gordon">
			<p class="line"><span class="sr-only">Gordon:{' '}</span>Hey! I’m Gordon.</p>
			<p class="line">
				Got a project in mind, a question, or just want to say hi? Tell me here. It goes straight to my
				inbox, and I read every one myself.
			</p>
			<p class="line" id="ask-name">First, what should I call you?</p>
			<p class="line no-script">JavaScript’s off, so this chat can’t run. Email me instead!</p>
		</div>

		{#if chat.step === 'name' || editing === 'name'}
			<form class="you reply" onsubmit={(event) => reply(event, 'name')}>
				<input
					bind:value={chat.name}
					name="name"
					autocomplete="name"
					maxlength="80"
					placeholder="Your name"
					aria-labelledby="ask-name"
					disabled={!live}
					{@attach focus}
				/>
				<button class="go" aria-label="Reply" disabled={!live || !chat.name.trim()}>
					<ArrowUpIcon size="1.25em" aria-hidden="true" />
				</button>
			</form>
		{:else}
			{@render said('name', chat.name)}
		{/if}

		{#if reached('topic')}
			<div class="gordon" {@attach arrive}>
				<p class="line"><span class="sr-only">Gordon:{' '}</span>Nice to meet you, {chat.name.trim()}!</p>
				<p class="line" id="ask-topic">So, what are you working on?</p>
				<div class="choices" role="group" aria-labelledby="ask-topic">
					{#each topics as { label }, i (label)}
						<button
							class="choice text-copy-14"
							type="button"
							aria-pressed={chat.topic === label}
							disabled={sent}
							onclick={() => choose(label)}
							{@attach i === 0 && !chat.topic ? focus : null}
						>
							{label}{#if chat.topic === label}<span class="tick" aria-hidden="true">✓</span>{/if}
						</button>
					{/each}
				</div>
				<p class="line">
					Too much to type? Let’s just talk.
					<a href={CALL} target="_blank" rel="noreferrer" onclick={() => called('start')}
						>Book a 30-min call ↗</a
					>
				</p>
			</div>
		{/if}

		{#if chat.topic}
			<p class="you bubble"><span class="sr-only">You:{' '}</span>{chat.topic}</p>
		{/if}

		{#if reached('body')}
			<div class="gordon" {@attach arrive}>
				<p class="line" id="ask-body"><span class="sr-only">Gordon:{' '}</span>{ask}</p>
				{#if chat.topic !== 'Something else'}
					<p class="line">Got a deadline or a budget? Toss those in too.</p>
				{/if}
			</div>

			{#if chat.step === 'body' || editing === 'body'}
				<form class="you reply" onsubmit={(event) => reply(event, 'body')}>
					<textarea
						bind:value={chat.body}
						name="body"
						rows="4"
						maxlength="8000"
						placeholder="Type away…"
						aria-labelledby="ask-body"
						onkeydown={sendOnModEnter}
						{@attach focus}
					></textarea>
					<button class="go" aria-label="Reply" disabled={!chat.body.trim()}>
						<ArrowUpIcon size="1.25em" aria-hidden="true" />
					</button>
				</form>
			{:else}
				{@render said('body', chat.body)}
			{/if}
		{/if}

		{#if reached('email')}
			<div class="gordon" {@attach arrive}>
				<p class="line" id="ask-email"><span class="sr-only">Gordon:{' '}</span>Got it. Where should I write back?</p>
			</div>

			{#if chat.step === 'email' || editing === 'email'}
				<form class="you reply" onsubmit={(event) => reply(event, 'email')}>
					<!-- The same rule as the server's: one address, with a dot after the @. -->
					<input
						bind:value={chat.email}
						name="email"
						type="email"
						autocomplete="email"
						maxlength="254"
						pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
						placeholder="you@example.com"
						aria-labelledby="ask-email"
						{@attach focus}
					/>
					<button class="go" aria-label="Reply" disabled={!chat.email.trim()}>
						<ArrowUpIcon size="1.25em" aria-hidden="true" />
					</button>
				</form>
			{:else}
				{@render said('email', chat.email)}
			{/if}
		{/if}

		{#if reached('review')}
			<div class="gordon" {@attach arrive}>
				<p class="line" tabindex="-1" {@attach focus}>
					<span class="sr-only">Gordon:{' '}</span>Here’s what I’ll get. Want to change something? Just tap it.
				</p>
				<div class="letter">
					<dl>
						<div>
							<dt class="text-eyebrow">From</dt>
							<dd>{chat.name.trim()} · {chat.email.trim()}</dd>
						</div>
						<div>
							<dt class="text-eyebrow">About</dt>
							<dd>{chat.topic}</dd>
						</div>
					</dl>
					<p class="body">{chat.body.trim()}</p>
					{#if sent ? chat.note.trim() : adding || chat.note}
						<label class="ps">
							<span class="text-eyebrow">P.S.</span>
							{#if sent}
								<span class="body">{chat.note.trim()}</span>
							{:else}
								<textarea
									bind:value={chat.note}
									name="note"
									rows="2"
									maxlength="1000"
									placeholder="A link, a deadline, anything else"
									{@attach focus}
								></textarea>
							{/if}
						</label>
					{/if}
				</div>
				{#if !sent}
					<div class="actions">
						<button class="button filled text-copy-14" type="button" disabled={status === 'sending'} onclick={send}>
							{status === 'sending' ? 'Sending…' : status === 'failed' ? 'Try again' : 'Send it'}
						</button>
						{#if !adding && !chat.note}
							<button
								class="button ghost text-copy-14"
								type="button"
								onclick={() => {
									engaged = true;
									adding = true;
								}}>Add a P.S.</button
							>
						{/if}
					</div>
				{/if}
			</div>

			{#if status === 'invalid'}
				<div class="gordon" {@attach arrive}>
					<p class="line"><span class="sr-only">Gordon:{' '}</span>{reason}</p>
				</div>
			{:else if status === 'failed'}
				<div class="gordon" {@attach arrive}>
					<p class="line"><span class="sr-only">Gordon:{' '}</span>Hmm, that didn’t go through. Sorry about that!</p>
					<p class="line">
						Try again? Or copy your message and email it to me at {EMAIL}.
						<button class="copy text-copy-14" type="button" onclick={() => copy(letter, 'letter')}>
							{copied === 'letter' ? 'Copied' : 'Copy message'}
						</button>
					</p>
				</div>
			{/if}
		{/if}

		{#if sent}
			<div class="gordon" {@attach arrive}>
				<p class="line" tabindex="-1" {@attach focus}>
					<span class="sr-only">Gordon:{' '}</span><span class="check" aria-hidden="true">✓</span> Sent!
				</p>
				<p class="line">I’ll get back to you at {chat.email.trim()} soon. Usually within <span class="whitespace-nowrap">1–2 days</span>.</p>
				<p class="line">
					Can’t wait?
					<a href={CALL} target="_blank" rel="noreferrer" onclick={() => called('end')}
						>Book a 30-min call ↗</a
					>
				</p>
			</div>
		{/if}
	</div>

	<!-- A trap for bots, which fill in every field: hidden from people and screen readers. -->
	<div class="trap" aria-hidden="true">
		<input bind:value={chat.website} name="website" tabindex="-1" autocomplete="off" />
	</div>

	<footer>
		<p>
			Prefer email? <span class="email">{EMAIL}</span>
			<button class="copy text-copy-14" type="button" onclick={() => copy(EMAIL, 'email')}>
				{copied === 'email' ? 'Copied' : 'Copy'}
			</button>
			<span class="sr-only" aria-live="polite">{copied === 'email' ? 'Email address copied' : ''}</span>
		</p>

		<section class="worked-with" aria-labelledby="worked-with">
			<h2 id="worked-with" class="text-eyebrow">Worked with</h2>
			<ul>
				{#each workedWith as name (name)}
					<li class="text-heading-16">{name}</li>
				{/each}
			</ul>
		</section>
	</footer>
</div>

<style>
	/*
	 * A chat, in the site's own material: Gordon's lines are white boxes edged by a hairline, on the
	 * left, in the panel's grey; the visitor's are the grey wash, on the right, in ink. Both sides are
	 * boxed and square, and nothing types, pulses or waits: it is a letter, asked one question at a time.
	 */
	.chat {
		display: grid;
		gap: var(--spacing-16);
	}

	.gordon {
		display: grid;
		justify-items: start;
		gap: var(--spacing-6);
		min-width: 0;
	}

	.line,
	.bubble {
		max-width: 85%;
		padding: var(--spacing-8) var(--spacing-12);
		overflow-wrap: anywhere;
		text-wrap: pretty;
	}

	.line {
		border: 1px solid var(--color-hairline);
		background: var(--color-pure-white);
	}

	/* Its focus only brings it into view and tells a screen reader where the chat went. */
	.line:focus {
		outline: none;
	}

	.you {
		justify-self: end;
	}

	/* The visitor's words keep their line breaks. Their answers are buttons, to tap and change. */
	.bubble {
		margin: 0;
		border: 0;
		background: var(--color-gray-alpha-100);
		color: var(--color-obsidian);
		text-align: start;
		white-space: pre-wrap;
	}

	button.bubble {
		cursor: pointer;
		transition: background 160ms var(--ease-out);
	}

	@media (hover: hover) {
		button.bubble:hover:not(:disabled) {
			background: var(--color-gray-alpha-200);
		}
	}

	button.bubble:disabled {
		cursor: default;
	}

	.no-script {
		display: none;
	}

	/* The link to the calendar: ink, underlined in ash until pointed at. */
	a {
		color: var(--color-obsidian);
		text-decoration: underline;
		text-decoration-color: var(--color-ash);
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
		transition: text-decoration-color 160ms var(--ease-out);
	}

	a:hover {
		text-decoration-color: var(--color-obsidian);
	}

	/* A reply field where the visitor's next line will go, with its send button joined on. */
	.reply {
		display: flex;
		align-items: flex-end;
		width: 85%;
	}

	input,
	textarea {
		flex: 1;
		min-width: 0;
		margin: 0;
		padding: var(--spacing-12);
		border: 1px solid var(--color-hairline);
		border-radius: 0;
		background: var(--color-pure-white);
		color: var(--color-obsidian);
		transition: border-color 160ms var(--ease-out);
	}

	@media (hover: hover) {
		input:hover:not(:disabled),
		textarea:hover {
			border-color: var(--color-ash);
		}
	}

	/* The message grows with what is written, up to about fifteen lines. */
	textarea {
		min-height: 7.5rem;
		max-height: 24rem;
		resize: vertical;
		field-sizing: content;
	}

	::placeholder {
		color: var(--color-slate);
		opacity: 1;
	}

	/* The send arrow: the filled button, as tall as a one-line field. */
	.go {
		display: grid;
		flex: none;
		place-items: center;
		width: 3.125rem;
		height: 3.125rem;
		border: 0;
		border-radius: 0;
		background: var(--color-obsidian);
		color: var(--color-pure-white);
		cursor: pointer;
		transition:
			background 160ms var(--ease-out),
			opacity 160ms var(--ease-out);
	}

	@media (hover: hover) {
		.go:hover:not(:disabled) {
			background: var(--color-charcoal);
		}
	}

	.go:disabled {
		cursor: default;
		opacity: 0.2;
	}

	/* Answers to tap, as Muse offers them: ghost buttons, the chosen one ringed in ink and ticked. */
	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-8);
		margin: var(--spacing-4) 0;
	}

	.choice {
		display: inline-flex;
		gap: var(--spacing-8);
		align-items: center;
		padding: var(--spacing-12) var(--spacing-16);
		border: 0;
		border-radius: 0;
		background: var(--color-pure-white);
		box-shadow: inset 0 0 0 1px var(--color-hairline);
		color: var(--color-charcoal);
		cursor: pointer;
		transition:
			background 160ms var(--ease-out),
			color 160ms var(--ease-out),
			box-shadow 160ms var(--ease-out);
	}

	@media (hover: hover) {
		.choice:hover:not(:disabled) {
			background: var(--color-gray-alpha-100);
			color: var(--color-obsidian);
		}
	}

	.choices:has([aria-pressed='true']) .choice {
		color: var(--color-stone);
	}

	.choices .choice[aria-pressed='true'] {
		box-shadow: inset 0 0 0 1px var(--color-obsidian);
		color: var(--color-obsidian);
	}

	.choice:disabled {
		cursor: default;
	}

	/* The letter as it will arrive: a bordered card with its labels stamped in mono. */
	.letter {
		display: grid;
		gap: var(--spacing-16);
		width: 100%;
		padding: var(--spacing-16);
		border: 1px solid var(--color-hairline);
		background: var(--color-pure-white);
		color: var(--color-obsidian);
	}

	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--spacing-8) var(--spacing-16);
		padding-bottom: var(--spacing-16);
		border-bottom: 1px solid var(--color-hairline);
	}

	dl div {
		display: contents;
	}

	dt {
		/* The eyebrow's 16px line, sat on the 24px line of the value beside it. */
		padding-top: var(--spacing-4);
		color: var(--color-stone);
	}

	dd {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.body {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.ps {
		display: grid;
		gap: var(--spacing-8);
	}

	.ps .text-eyebrow {
		color: var(--color-stone);
	}

	.ps textarea {
		min-height: 4.5rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-8);
		margin-top: var(--spacing-4);
	}

	/* The filled button (the one primary action) and a ghost beside it: square, 44px tall. */
	.button {
		padding: var(--spacing-12) var(--spacing-20);
		border: 0;
		border-radius: 0;
		cursor: pointer;
		transition:
			background 160ms var(--ease-out),
			color 160ms var(--ease-out);
	}

	.filled {
		background: var(--color-obsidian);
		color: var(--color-pure-white);
	}

	.ghost {
		background: var(--color-pure-white);
		box-shadow: inset 0 0 0 1px var(--color-hairline);
		color: var(--color-charcoal);
	}

	@media (hover: hover) {
		.filled:hover:not(:disabled) {
			background: var(--color-charcoal);
		}

		.ghost:hover {
			background: var(--color-gray-alpha-100);
			color: var(--color-obsidian);
		}
	}

	.button:disabled {
		cursor: progress;
		opacity: 0.55;
	}

	/* Vercel keeps its one colour for confirmations, with the tick as its non-colour cue. */
	.check {
		color: var(--color-terminal-green);
	}

	/* Off the page rather than display: none, which some bots know to skip. */
	.trap {
		position: absolute;
		left: -9999px;
	}

	footer {
		margin-top: var(--spacing-40);
		padding-top: var(--spacing-24);
		border-top: 1px solid var(--color-hairline);
	}

	/* The address is plain words, in ink; the Copy button beside it is the thing to press. */
	.email {
		color: var(--color-obsidian);
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

	@media (hover: hover) {
		.copy:hover {
			border-color: var(--color-ash);
			color: var(--color-obsidian);
		}
	}

	.line .copy {
		margin-left: 0;
	}

	.choice:active:not(:disabled),
	button.bubble:active:not(:disabled),
	.go:active:not(:disabled),
	.button:active,
	.copy:active,
	a:active {
		opacity: 0.55;
	}

	.worked-with {
		margin-top: var(--spacing-24);
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

	/* On a phone the visitor's side takes the whole width to type in. */
	@media (max-width: 30em) {
		.reply {
			width: 100%;
		}
	}

	/* Without script the chat cannot run: Gordon says so, and his address sits below. */
	@media (scripting: none) {
		.no-script {
			display: block;
		}

		.reply {
			display: none;
		}
	}
</style>
