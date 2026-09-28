<script module>
	import { draw, lines } from './lines.js';

	/** @typedef {'name' | 'body' | 'email' | 'review' | 'sent'} Step */

	/** The chat's turns in order: each answer moves it on one. */
	const steps = /** @type {const} */ (['name', 'body', 'email', 'review', 'sent']);

	const blank = () => ({
		step: /** @type {Step} */ ('name'),
		name: '',
		body: '',
		email: '',
		/** Anything added once the letter is shown, sent as its P.S. Never removed, so `id` is its place. @type {{ id: number, text: string }[]} */
		notes: [],
		/** What is typed in the composer and not yet sent. */
		draft: '',
		/** The honeypot: only a bot fills it in. */
		website: '',
		/** This chat's wording of each of Gordon's lines, drawn at random (lines.js). */
		words: draw()
	});

	/**
	 * What the visitor has said so far. It lives here, not in the page, so their words survive a look
	 * at another tab. The page is prerendered and this only ever changes in the visitor's browser.
	 */
	const chat = $state(blank());
</script>

<script>
	import ArrowUpIcon from 'phosphor-svelte/lib/ArrowUpIcon';
	import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
	import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
	import gsap from 'gsap';
	import { onMount, tick } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { MediaQuery } from 'svelte/reactivity';
	import { EMAIL } from '$lib/contact.js';

	/** Gordon's calendar, offered once the message is sent to anyone who would rather talk sooner. */
	const CALL = 'https://cal.com/gordon-tu-jjhuo5/30min';

	/** From the bio (VISA), the Projects' Clients (project.js), and Climate TRACE. */
	const workedWith = ['VISA', 'Yale University', 'UC Berkeley', 'World Bank', 'Climate TRACE'];

	/**
	 * What the composer can be filling in, what a changed answer is called, and its hint.
	 * @typedef {'name' | 'body' | 'email' | 'note'} Field
	 */
	const fields = {
		name: { called: 'your name', hint: 'Your name', max: 80 },
		body: { called: 'your message', hint: 'Type away…', max: 8000 },
		email: { called: 'your email', hint: 'you@example.com', max: 254 },
		note: { called: 'your P.S.', hint: 'Anything else? Add a P.S.', max: 1000 }
	};

	/** On a computer, Enter sends; with a finger, Return starts a new line and the arrow sends. */
	const mouse = new MediaQuery('(pointer: fine)');

	/** Set once the page runs in the browser: until then, and without script, nothing can be typed. */
	let live = $state(false);
	/** An earlier answer being changed in the composer, and which P.S. if it is one. @type {'' | Field} */
	let editing = $state('');
	let editingNote = $state(-1);
	/** The draft put aside while an earlier answer is changed. */
	let stash = '';
	/** Where the cursor goes next: set by what the visitor just did, never on arrival. @type {'' | 'composer' | 'review' | 'sent'} */
	let want = $state('');
	/** Where the send got to. @type {'' | 'sending' | 'invalid' | 'failed'} */
	let status = $state('');
	/** The server's reason, when it turned the message away. */
	let reason = $state('');
	/** Which copy button last worked, for its "Copied". @type {'' | 'email' | 'letter'} */
	let copied = $state('');
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let copiedTimer;
	/** Whether the visitor has said anything yet: only then do new lines move. */
	let engaged = false;
	/** The chat's own scrolling list of lines. @type {HTMLElement | undefined} */
	let log;

	const sent = $derived(chat.step === 'sent');
	/** What the composer is for: a changed answer, the step's own, a P.S. once the letter shows, or nothing. */
	const mode = $derived(
		/** @type {Field | 'sent'} */ (editing || (sent ? 'sent' : chat.step === 'review' ? 'note' : chat.step))
	);
	/** A new field for each thing typed, so each opens empty and focused; a P.S. keeps its field. */
	const slot = $derived(editing ? `${editing} ${editingNote}` : mode);
	/** The message as Gordon will read it. */
	const ps = $derived(chat.notes.map((note) => note.text).join('\n\n'));
	const letter = $derived(ps ? `${chat.body}\n\nP.S. ${ps}` : chat.body);

	/** Whether the chat has got to this turn. @param {Step} step */
	const reached = (step) => steps.indexOf(chat.step) >= steps.indexOf(step);

	onMount(() => {
		live = true;
		// A chat opens on its latest line, as a messaging app does.
		if (log) log.scrollTop = log.scrollHeight;
		return () => {
			// A change left half done goes back to what was being typed; a sent chat starts afresh.
			if (editing) chat.draft = stash;
			if (chat.step === 'sent') Object.assign(chat, blank());
		};
	});

	/** Scrolls the chat (never the page) down to its newest line, just above the composer. */
	async function reveal() {
		await tick();
		log?.scrollTo({ top: log.scrollHeight, behavior: prefersReducedMotion.current ? 'auto' : 'smooth' });
	}

	/**
	 * What the composer sends: a changed answer, the answer the chat is waiting for, or a P.S.
	 * @param {SubmitEvent} event
	 */
	function submit(event) {
		event.preventDefault();
		const text = chat.draft.trim();
		const at = mode;
		if (!text || at === 'sent') return;
		engaged = true;
		want = 'composer';
		if (editing) {
			if (editing === 'note') chat.notes[editingNote].text = text;
			else chat[editing] = text;
			editing = '';
			chat.draft = stash;
			return;
		}
		chat.draft = '';
		if (at === 'note') {
			chat.notes.push({ id: chat.notes.length, text });
		} else {
			chat[at] = text;
			if (at === 'name') window.posthog.capture?.('contact_chat_started');
			if (at === 'email') want = 'review';
			chat.step = steps[steps.indexOf(at) + 1];
		}
		reveal();
	}

	/** A tapped answer opens in the composer, to change it. @param {Field} key @param {number} [index] */
	function edit(key, index = -1) {
		if (editing === key && editingNote === index) return;
		engaged = true;
		if (!editing) stash = chat.draft;
		editing = key;
		editingNote = index;
		chat.draft = key === 'note' ? chat.notes[index].text : chat[key];
		want = 'composer';
		if (status === 'invalid') status = '';
	}

	function cancel() {
		editing = '';
		chat.draft = stash;
		want = 'composer';
	}

	/** @param {KeyboardEvent & { currentTarget: HTMLInputElement | HTMLTextAreaElement }} event */
	function keydown(event) {
		if (event.key === 'Escape' && editing) {
			event.preventDefault();
			cancel();
			return;
		}
		// Shift+Enter starts a new line in a message; Enter with a finger does too (the arrow sends).
		if (event.key !== 'Enter' || event.shiftKey || event.isComposing || !mouse.current) return;
		event.preventDefault();
		event.currentTarget.form?.requestSubmit();
	}

	/**
	 * Sends the letter to /api/contact, which emails it to Gordon with Reply-To set to the visitor.
	 * The name makes its subject, so his inbox says who wrote.
	 */
	async function send() {
		status = 'sending';
		const data = new FormData();
		data.set('email', chat.email);
		data.set('subject', `Hello from ${chat.name}`);
		data.set('body', letter);
		data.set('website', chat.website);
		try {
			const response = await fetch('/api/contact', { method: 'POST', body: data });
			const result = await response.json().catch(() => ({}));
			if (response.status === 400) {
				status = 'invalid';
				reason = result.error ?? 'Something’s off. Check what you wrote and try again.';
			} else if (!response.ok) {
				throw new Error(result.error);
			} else {
				status = '';
				chat.step = 'sent';
				want = 'sent';
				window.posthog.capture?.('contact_form_submitted');
			}
		} catch {
			status = 'failed';
			window.posthog.capture?.('contact_form_failed');
		}
		reveal();
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

	/** The call is offered only once the message is sent (`at` stays for the events sent before). */
	const called = () => window.posthog.capture?.('contact_call_clicked', { at: 'end' });

	/** Takes the cursor without jumping the page: `reveal` does the scrolling. */
	const focus = (/** @type {HTMLElement} */ node) => node.focus({ preventScroll: true });

	/**
	 * The message field grows with what is written, up to its max-height, however the draft changes;
	 * a chat read to its end stays at its end as the field takes room from it.
	 */
	function grow(/** @type {HTMLTextAreaElement} */ node) {
		chat.draft;
		queueMicrotask(() => {
			const atEnd = !log || log.scrollHeight - log.scrollTop - log.clientHeight < 8;
			node.style.height = 'auto';
			node.style.height = `${node.scrollHeight}px`;
			if (log && atEnd) log.scrollTop = log.scrollHeight;
		});
	}

	/** Gordon's face and lines rise in one after another when a reply brings them, not when the tab opens. */
	function arrive(/** @type {HTMLElement} */ node) {
		if (!engaged || prefersReducedMotion.current) return;
		const tween = gsap.from(node.querySelectorAll('.avatar, .lines > *'), {
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

<!-- Gordon's face beside each run of his lines, as a messaging app shows who is talking. -->
{#snippet face()}
	<img class="avatar" src="/landing/avatar.png" alt="" width="32" height="32" />
{/snippet}

<!-- An answer the visitor can tap to change in the composer, until it is sent. -->
{#snippet said(/** @type {Field} */ key, /** @type {string} */ text, index = -1)}
	<button
		class={['you', 'bubble', { changing: editing === key && editingNote === index }]}
		type="button"
		disabled={sent || status === 'sending'}
		onclick={() => edit(key, index)}
	>
		<span class="sr-only">You:{' '}</span>{text}<span class="sr-only">. Change it</span>
	</button>
{/snippet}

<div class="contact">
	<p class="intro">
		Got a project in mind, a question, or just want to say hi? Tell me here. It goes straight to my
		inbox, and I read every one myself.
	</p>

	<!-- The chat: its lines scroll on their own, and the page scrolls on around it as ever. -->
	<section class="thread" aria-label="Chat with Gordon">
		<!-- Focusable, so a keyboard can scroll it too. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div class={['chat', { live }]} role="log" tabindex="0" bind:this={log}>
			<div class="gordon">
				{@render face()}
				<div class="lines">
					<p class="line" id="ask-name">
						<span class="sr-only">Gordon:{' '}</span>{live ? chat.words.hello : lines.hello[0]}
					</p>
					<p class="line no-script">JavaScript’s off, so this chat can’t run. Email me instead!</p>
				</div>
			</div>

			{#if reached('body')}
				{@render said('name', chat.name)}
				<div class="gordon" {@attach arrive}>
					{@render face()}
					<div class="lines">
						<p class="line"><span class="sr-only">Gordon:{' '}</span>{chat.words.meet(chat.name)}</p>
						<p class="line" id="ask-body">{chat.words.about}</p>
						<p class="line">{chat.words.extras}</p>
					</div>
				</div>
			{/if}

			{#if reached('email')}
				{@render said('body', chat.body)}
				<div class="gordon" {@attach arrive}>
					{@render face()}
					<div class="lines">
						<p class="line" id="ask-email">
							<span class="sr-only">Gordon:{' '}</span>{chat.words.where}
						</p>
					</div>
				</div>
			{/if}

			{#if reached('review')}
				{@render said('email', chat.email)}
				<div class="gordon" {@attach arrive}>
					{@render face()}
					<div class="lines">
						<p class="line" id="ask-note" tabindex="-1" {@attach want === 'review' ? focus : null}>
							<span class="sr-only">Gordon:{' '}</span>{chat.words.review}
						</p>
						<div class="letter">
							<dl>
								<div>
									<dt class="text-eyebrow">From</dt>
									<dd>{chat.name} · {chat.email}</dd>
								</div>
							</dl>
							<p class="body">{chat.body}</p>
							{#if chat.notes.length}
								<div class="ps">
									<span class="text-eyebrow">P.S.</span>
									<p class="body">{ps}</p>
								</div>
							{/if}
						</div>
					</div>
				</div>

				{#each chat.notes as note (note.id)}
					{@render said('note', note.text, note.id)}
				{/each}
				{#if chat.notes.length}
					<div class="gordon" {@attach arrive}>
						{@render face()}
						<div class="lines">
							<p class="line"><span class="sr-only">Gordon:{' '}</span>{chat.words.added}</p>
						</div>
					</div>
				{/if}

				{#if status === 'invalid'}
					<div class="gordon" {@attach arrive}>
						{@render face()}
						<div class="lines">
							<p class="line"><span class="sr-only">Gordon:{' '}</span>{reason}</p>
						</div>
					</div>
				{:else if status === 'failed'}
					<div class="gordon" {@attach arrive}>
						{@render face()}
						<div class="lines">
							<p class="line"><span class="sr-only">Gordon:{' '}</span>{chat.words.oops}</p>
							<p class="line">
								{chat.words.retry(EMAIL)}
								<button class="copy text-copy-14" type="button" onclick={() => copy(letter, 'letter')}>
									{copied === 'letter' ? 'Copied' : 'Copy message'}
								</button>
							</p>
						</div>
					</div>
				{/if}

				<!-- The one send, under Gordon's latest line, as Muse puts its actions in the conversation. -->
				{#if !sent}
					<div class="actions">
						<button
							class="button text-copy-14"
							type="button"
							disabled={status === 'sending' || !!editing}
							onclick={send}
						>
							{status === 'sending' ? 'Sending…' : status === 'failed' ? 'Try again' : 'Send it'}
						</button>
					</div>
				{/if}
			{/if}

			{#if sent}
				<div class="gordon" {@attach arrive}>
					{@render face()}
					<div class="lines">
						<p class="line" id="ask-sent" tabindex="-1" {@attach want === 'sent' ? focus : null}>
							<span class="sr-only">Gordon:{' '}</span><span class="check" aria-hidden="true">✓</span>
							{chat.words.sent}
						</p>
						<p class="line">{chat.words.reply(chat.email)}</p>
						<p class="line">
							{chat.words.hurry}
							<a href={CALL} target="_blank" rel="noreferrer" onclick={called}>Book a 30-min call ↗</a>
						</p>
					</div>
				</div>
			{/if}
		</div>

		<!--
			The composer: one field at the foot of the window, as in Muse, for whatever Gordon is asking,
			an answer tapped to change, or a P.S. It stays put while the lines scroll above it.
		-->
		<form class="composer" onsubmit={submit}>
			{#if editing}
				<p class="editing text-copy-13">
					Editing {fields[editing].called}
					<button class="cancel" type="button" onclick={cancel}>Cancel</button>
				</p>
			{/if}
			<div class="field">
				{#key slot}
					{#if mode === 'body' || mode === 'note'}
						<textarea
							bind:value={chat.draft}
							name={mode}
							rows="1"
							maxlength={fields[mode].max}
							placeholder={fields[mode].hint}
							aria-labelledby={editing ? undefined : `ask-${mode}`}
							aria-label={editing ? `Change ${fields[mode].called}` : undefined}
							onkeydown={keydown}
							{@attach grow}
							{@attach want === 'composer' ? focus : null}
						></textarea>
					{:else}
						<!-- An email takes the server's rule: one address, with a dot after the @. -->
						<input
							bind:value={chat.draft}
							name={mode}
							type={mode === 'email' ? 'email' : undefined}
							autocomplete={mode === 'name' || mode === 'email' ? mode : 'off'}
							enterkeyhint="send"
							maxlength={mode === 'sent' ? undefined : fields[mode].max}
							pattern={mode === 'email' ? '[^\\s@]+@[^\\s@]+\\.[^\\s@]+' : undefined}
							placeholder={mode === 'sent' ? 'Sent. Talk soon!' : fields[mode].hint}
							aria-labelledby={editing ? undefined : `ask-${mode}`}
							aria-label={editing && mode !== 'sent' ? `Change ${fields[mode].called}` : undefined}
							disabled={!live || sent}
							onkeydown={keydown}
							{@attach want === 'composer' ? focus : null}
						/>
					{/if}
				{/key}
				<button class="go" aria-label="Send" disabled={!live || sent || !chat.draft.trim()}>
					<ArrowUpIcon size="1.25em" aria-hidden="true" />
				</button>
			</div>
		</form>
	</section>

	<!-- A trap for bots, which fill in every field: hidden from people and screen readers. -->
	<div class="trap" aria-hidden="true">
		<input bind:value={chat.website} name="website" tabindex="-1" autocomplete="off" />
	</div>

	<footer>
		<!-- Set like "Worked with": an eyebrow, then the address in Gordon's lines' type, its copy button beside it. -->
		<section class="direct" aria-labelledby="prefer-email">
			<h2 id="prefer-email" class="text-eyebrow">Prefer email?</h2>
			<div class="address">
				<p class="email">{EMAIL}</p>
				<button
					class={['copy-email', { done: copied === 'email' }]}
					type="button"
					aria-label="Copy the email address"
					onclick={() => copy(EMAIL, 'email')}
				>
					{#if copied === 'email'}
						<CheckIcon size="1.25em" aria-hidden="true" />
					{:else}
						<CopyIcon size="1.25em" aria-hidden="true" />
					{/if}
				</button>
				<span class="sr-only" aria-live="polite">{copied === 'email' ? 'Email address copied' : ''}</span>
			</div>
			<p class="note text-copy-13">I usually reply within 1–&#8288;2&nbsp;days.</p>
		</section>

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
	 * A chat, in the site's own material and on the page's own column. Gordon's lines are white boxes
	 * edged by a hairline, in the panel's grey, beside his face; the visitor's are the grey wash,
	 * flush right, in ink. Two left edges hold it: the column's (the intro, Gordon's face, the address
	 * below) and his lines', which the Send button and the composer share. Nothing types, pulses or
	 * waits: it is a letter, asked one question at a time.
	 */

	/* The page's own words, under the tabs, as each tab's panel begins. */
	.intro {
		margin-bottom: var(--spacing-8);
	}

	/*
	 * No box round it: the chat is the column itself, and its lines scroll on their own while the page
	 * scrolls on around it. It takes the rest of the screen under the headline and intro (about
	 * 34.5rem down) but is never shorter than 28rem, so a good run of the conversation shows: on a
	 * tall screen (a tablet upright, a large window) it fits under them whole, and on a laptop its
	 * foot is a short scroll away. At most 36rem. Gordon's face sets the gutter his lines, the Send
	 * button and the composer start after.
	 */
	.thread {
		--face: 2rem;
		--gutter: calc(var(--face) + var(--spacing-12));
		display: flex;
		flex-direction: column;
		height: clamp(28rem, 100svh - 34.5rem, 36rem);
	}

	/*
	 * On a phone the headline fills the first screen and the chat is scrolled to: it is then nearly a
	 * screen tall, as a messaging app is, and a smaller face and gutter leave Gordon's lines the room
	 * to run the whole width.
	 */
	@media (max-width: 30em) {
		.thread {
			--face: 1.75rem;
			--gutter: calc(var(--face) + var(--spacing-8));
			height: min(36rem, 100svh - 5rem);
		}

		.lines .line {
			max-width: 100%;
		}
	}

	/* A screen held sideways is too short for that: the chat fits it, once scrolled to. */
	@media (max-height: 34rem) {
		.thread {
			height: calc(100svh - 3rem);
		}
	}

	/*
	 * Lines run down from the top, as in a messaging app, and the chat follows the newest. They fade
	 * out at the top and bottom edges as they scroll away rather than being cut, the padding keeping
	 * them clear of the fades at rest. The scrollbar is hidden: a wheel, a finger and the keyboard
	 * (the chat takes focus) all still scroll it.
	 */
	.chat {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--spacing-16);
		min-height: 0;
		padding: var(--spacing-24) 0 var(--spacing-16);
		overflow-y: auto;
		scrollbar-width: none;
		-webkit-mask-image: linear-gradient(transparent, var(--color-carbon) var(--spacing-24), var(--color-carbon) calc(100% - var(--spacing-16)), transparent);
		mask-image: linear-gradient(transparent, var(--color-carbon) var(--spacing-24), var(--color-carbon) calc(100% - var(--spacing-16)), transparent);
	}

	.chat::-webkit-scrollbar {
		display: none;
	}

	.chat:focus-visible {
		outline-offset: -2px;
	}

	/* The greeting is drawn in the browser, not at build: until the page runs it waits, unseen. */
	.chat:not(.live) > .gordon:first-child {
		visibility: hidden;
	}

	/* A run of Gordon's lines, his face beside it in the column's gutter, the lines on their own edge. */
	.gordon {
		display: grid;
		grid-template-columns: var(--face) minmax(0, 1fr);
		gap: calc(var(--gutter) - var(--face));
		align-items: start;
	}

	.lines {
		display: grid;
		justify-items: start;
		gap: var(--spacing-6);
		min-width: 0;
	}

	/* Centred on a one-line bubble: 2.625rem is its 1.5rem line, 0.5rem padding each side and hairlines. */
	.avatar {
		width: var(--face);
		height: var(--face);
		margin-top: calc((2.625rem - var(--face)) / 2);
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

	/* Its focus only tells a screen reader where the chat went. */
	.line:focus {
		outline: none;
	}

	.you {
		align-self: flex-end;
	}

	/* The visitor's words keep their line breaks. Each is a button, to tap and change. */
	.bubble {
		margin: 0;
		border: 0;
		background: var(--color-gray-alpha-100);
		color: var(--color-obsidian);
		text-align: start;
		white-space: pre-wrap;
		cursor: pointer;
		transition:
			background 160ms var(--ease-out),
			box-shadow 160ms var(--ease-out);
	}

	@media (hover: hover) {
		.bubble:hover:not(:disabled) {
			background: var(--color-gray-alpha-200);
		}
	}

	.bubble:disabled {
		cursor: default;
	}

	/* The answer open in the composer, ringed in ink like the composer itself while it is typed in. */
	.changing {
		box-shadow: inset 0 0 0 1px var(--color-obsidian);
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

	/* The send, under Gordon's lines and on their edge. */
	.actions {
		display: flex;
		margin-top: calc(-1 * var(--spacing-8));
		padding-left: var(--gutter);
	}

	/* The filled button: the one primary action, square, 44px tall. */
	.button {
		padding: var(--spacing-12) var(--spacing-20);
		border: 0;
		border-radius: 0;
		background: var(--color-obsidian);
		color: var(--color-pure-white);
		cursor: pointer;
		transition: background 160ms var(--ease-out);
	}

	@media (hover: hover) {
		.button:hover:not(:disabled) {
			background: var(--color-charcoal);
		}
	}

	.button:disabled {
		cursor: default;
		opacity: 0.55;
	}

	/* Vercel keeps its one colour for confirmations, with the tick as its non-colour cue. */
	.check {
		color: var(--color-terminal-green);
	}

	/*
	 * The composer is where the visitor's next line is written: the grey wash of their lines, at the
	 * chat's foot, from the left edge of Gordon's lines to the column's right edge, where theirs end.
	 */
	.composer {
		margin-left: var(--gutter);
	}

	.editing {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: var(--spacing-8);
		color: var(--color-stone);
	}

	/* A text button, grey until pointed at, its target grown to 44px without moving the line. */
	.cancel {
		margin: -0.75rem 0;
		padding: 0.75rem 0;
		border: 0;
		background: none;
		color: var(--color-stone);
		cursor: pointer;
		transition: color 160ms var(--ease-out);
	}

	@media (hover: hover) {
		.cancel:hover {
			color: var(--color-obsidian);
		}
	}

	/*
	 * The wash is the field's only edge. Being typed in, it is ringed in ink round the field and its
	 * arrow as one, with a hairline: it has the cursor most of the chat, so the site's heavier 2px
	 * ring would sit on it throughout.
	 */
	.field {
		display: flex;
		align-items: flex-end;
		background: var(--color-gray-alpha-100);
		transition: box-shadow 160ms var(--ease-out);
	}

	.field:focus-within {
		box-shadow: inset 0 0 0 1px var(--color-obsidian);
	}

	/* The text takes the wash it sits on, 48px tall for a line, like the arrow. */
	input,
	textarea {
		flex: 1;
		min-width: 0;
		margin: 0;
		padding: var(--spacing-12);
		border: 0;
		border-radius: 0;
		background: transparent;
		color: var(--color-obsidian);
	}

	input:focus-visible,
	textarea:focus-visible {
		outline: none;
	}

	/* One line to start; `grow` fits it to what is written, up to about eight lines. */
	textarea {
		max-height: 13.5rem;
		resize: none;
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
		width: 3rem;
		height: 3rem;
		border: 0;
		border-radius: 0;
		background: var(--color-obsidian);
		color: var(--color-pure-white);
		cursor: pointer;
		transition:
			background 160ms var(--ease-out),
			color 160ms var(--ease-out);
	}

	@media (hover: hover) {
		.go:hover:not(:disabled) {
			background: var(--color-charcoal);
		}
	}

	/* With nothing to send, the arrow is only a grey glyph; it fills with ink once there is. */
	.go:disabled {
		background: transparent;
		color: var(--color-slate);
		cursor: default;
	}

	/* Off the page rather than display: none, which some bots know to skip. */
	.trap {
		position: absolute;
		left: -9999px;
	}

	/* After the chat, well clear of its composer: the way round it, then who Gordon has worked with. */
	footer {
		margin-top: var(--spacing-40);
	}

	/*
	 * The way round the chat, set like "Worked with" below it: its eyebrow, then (as far below it as
	 * the names are) the address in the type and grey of Gordon's lines, unboxed, with a copy button
	 * that is only its icon right beside it. A helper line under them says when he replies.
	 */
	.address {
		display: flex;
		gap: var(--spacing-8);
		align-items: center;
		margin-top: var(--spacing-12);
	}

	.email {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	/* Grey until pointed at, like the page's text buttons, its target grown to 44px round the icon. */
	.copy-email {
		position: relative;
		display: grid;
		flex: none;
		place-items: center;
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-stone);
		cursor: pointer;
		transition: color 160ms var(--ease-out);
	}

	.copy-email::after {
		position: absolute;
		inset: -0.75rem;
		content: '';
	}

	@media (hover: hover) {
		.copy-email:hover {
			color: var(--color-obsidian);
		}
	}

	.note {
		margin-top: var(--spacing-4);
	}

	/* Copied: Vercel's one colour, on its tick. */
	.copy-email.done {
		color: var(--color-terminal-green);
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

	.bubble:active:not(:disabled),
	.go:active:not(:disabled),
	.button:active:not(:disabled),
	.cancel:active,
	.copy:active,
	.copy-email:active,
	a:active {
		opacity: 0.55;
	}

	.worked-with {
		margin-top: var(--spacing-40);
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

	/* Without script the chat cannot run: Gordon says so, and his address sits below. */
	@media (scripting: none) {
		.no-script {
			display: block;
		}

		.chat:not(.live) > .gordon:first-child {
			visibility: visible;
		}

		.composer {
			display: none;
		}
	}
</style>
