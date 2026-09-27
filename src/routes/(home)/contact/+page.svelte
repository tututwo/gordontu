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
		/** Anything added once the letter is shown, sent as its P.S. Never removed, so `id` is its place. @type {{ id: number, text: string }[]} */
		notes: [],
		/** What is typed in the composer and not yet sent. */
		draft: '',
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
	import { onMount, tick } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { MediaQuery } from 'svelte/reactivity';
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

	/**
	 * What the composer can be filling in, what a changed answer is called, and its hint.
	 * @typedef {'name' | 'topic' | 'body' | 'email' | 'note'} Field
	 */
	const fields = {
		name: { called: 'your name', hint: 'Your name', max: 80 },
		topic: { called: 'what you’re working on', hint: 'Or type it here', max: 80 },
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
	const ask = $derived(
		topics.find((topic) => topic.label === chat.topic)?.ask ??
			'Ooh, tell me more! What’s it about, and who’s it for?'
	);
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

	/** @param {string} label */
	function choose(label) {
		engaged = true;
		chat.topic = label;
		if (chat.step !== 'topic') return;
		chat.step = 'body';
		if (!editing) chat.draft = '';
		want = 'composer';
		reveal();
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
	 * The topic and name make its subject, so his inbox says who wrote and about what.
	 */
	async function send() {
		status = 'sending';
		const data = new FormData();
		data.set('email', chat.email);
		data.set('subject', `${chat.topic}, from ${chat.name}`);
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

	/** @param {'start' | 'end'} at */
	const called = (at) => window.posthog.capture?.('contact_call_clicked', { at });

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
	<!-- The chat: its lines scroll on their own, and the page scrolls on around it as ever. -->
	<section class="thread" aria-label="Chat with Gordon">
		<!-- Focusable, so a keyboard can scroll it too. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div class="chat" role="log" tabindex="0" bind:this={log}>
			<div class="gordon">
				<p class="line"><span class="sr-only">Gordon:{' '}</span>Hey! I’m Gordon.</p>
				<p class="line">
					Got a project in mind, a question, or just want to say hi? Tell me here. It goes straight to
					my inbox, and I read every one myself.
				</p>
				<p class="line">
					Too much to type? Let’s just talk.
					<a href={CALL} target="_blank" rel="noreferrer" onclick={() => called('start')}
						>Book a 30-min call ↗</a
					>
				</p>
				<p class="line" id="ask-name">First, what should I call you?</p>
				<p class="line no-script">JavaScript’s off, so this chat can’t run. Email me instead!</p>
			</div>

			{#if reached('topic')}
				{@render said('name', chat.name)}
				<div class="gordon" {@attach arrive}>
					<p class="line"><span class="sr-only">Gordon:{' '}</span>Nice to meet you, {chat.name}!</p>
					<p class="line" id="ask-topic">So, what are you working on?</p>
					<div class="choices" role="group" aria-labelledby="ask-topic">
						{#each topics as { label } (label)}
							<button
								class="choice text-copy-14"
								type="button"
								aria-pressed={chat.topic === label}
								disabled={sent}
								onclick={() => choose(label)}
							>
								{label}{#if chat.topic === label}<span aria-hidden="true">✓</span>{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if reached('body')}
				{@render said('topic', chat.topic)}
				<div class="gordon" {@attach arrive}>
					<p class="line" id="ask-body"><span class="sr-only">Gordon:{' '}</span>{ask}</p>
					{#if chat.topic !== 'Something else'}
						<p class="line">Got a deadline or a budget? Toss those in too.</p>
					{/if}
				</div>
			{/if}

			{#if reached('email')}
				{@render said('body', chat.body)}
				<div class="gordon" {@attach arrive}>
					<p class="line" id="ask-email">
						<span class="sr-only">Gordon:{' '}</span>Got it. Where should I write back?
					</p>
				</div>
			{/if}

			{#if reached('review')}
				{@render said('email', chat.email)}
				<div class="gordon" {@attach arrive}>
					<p class="line" id="ask-note" tabindex="-1" {@attach want === 'review' ? focus : null}>
						<span class="sr-only">Gordon:{' '}</span>Here’s what I’ll get. Want to change something? Just tap it.
					</p>
					<div class="letter">
						<dl>
							<div>
								<dt class="text-eyebrow">From</dt>
								<dd>{chat.name} · {chat.email}</dd>
							</div>
							<div>
								<dt class="text-eyebrow">About</dt>
								<dd>{chat.topic}</dd>
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

				{#each chat.notes as note (note.id)}
					{@render said('note', note.text, note.id)}
				{/each}
				{#if chat.notes.length}
					<div class="gordon" {@attach arrive}>
						<p class="line"><span class="sr-only">Gordon:{' '}</span>Got it, I’ll add that as a P.S.</p>
					</div>
				{/if}

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
					<p class="line" id="ask-sent" tabindex="-1" {@attach want === 'sent' ? focus : null}>
						<span class="sr-only">Gordon:{' '}</span><span class="check" aria-hidden="true">✓</span> Sent!
					</p>
					<p class="line">
						I’ll get back to you at {chat.email} soon. Usually within <span class="whitespace-nowrap">1–2 days</span>.
					</p>
					<p class="line">
						Can’t wait?
						<a href={CALL} target="_blank" rel="noreferrer" onclick={() => called('end')}
							>Book a 30-min call ↗</a
						>
					</p>
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
					{:else if mode === 'email'}
						<!-- The same rule as the server's: one address, with a dot after the @. -->
						<input
							bind:value={chat.draft}
							name="email"
							type="email"
							autocomplete="email"
							enterkeyhint="send"
							maxlength={fields.email.max}
							pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
							placeholder={fields.email.hint}
							aria-labelledby={editing ? undefined : 'ask-email'}
							aria-label={editing ? `Change ${fields.email.called}` : undefined}
							onkeydown={keydown}
							{@attach want === 'composer' ? focus : null}
						/>
					{:else}
						<input
							bind:value={chat.draft}
							name={mode}
							autocomplete={mode === 'name' ? 'name' : 'off'}
							enterkeyhint="send"
							maxlength={mode === 'sent' ? undefined : fields[mode].max}
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
	 * A chat, in the site's own material and on the page's own column. Gordon's lines are white boxes
	 * edged by a hairline, flush left like the headline and the tabs, in the panel's grey; the
	 * visitor's are the grey wash, flush right, in ink, and so is the composer where they write. Each
	 * side is at most 85% of the column, so its lines start (or end) on one edge. Nothing types,
	 * pulses or waits: it is a letter, asked one question at a time.
	 */

	/*
	 * No box round it: the chat is the column itself. Its lines scroll on their own while the page
	 * scrolls on around it, in a height taken from the headline above (about 30.5rem to here), so on
	 * most computer screens the chat fits under the headline whole, the composer at its foot. It is
	 * no taller than 22rem, so a new chat, whose few lines sit at its foot, leaves little room above.
	 */
	.thread {
		display: flex;
		flex-direction: column;
		height: clamp(18rem, 100svh - 30.5rem, 22rem);
	}

	/*
	 * On a phone the headline fills the first screen, so the chat is scrolled to anyway: it is sized to
	 * fit a screen then, with room for the greeting's longer lines.
	 */
	@media (max-width: 30em) {
		.thread {
			height: min(26rem, 100svh - 8rem);
		}
	}

	/*
	 * The newest lines sit just above the composer, as in a messaging app, so a question and the field
	 * that answers it are one group; a short chat leaves its room above, under the tabs (the first
	 * line's auto margin, which unlike flex-end still lets a long chat scroll to its start). Lines
	 * fade out at the top and bottom edges as they scroll away rather than being cut, the padding
	 * keeping them clear of the fades at rest. The scrollbar is hidden: a wheel, a finger and the
	 * keyboard (the chat takes focus) all still scroll it.
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

	.chat > :first-child {
		margin-top: auto;
	}

	.chat:focus-visible {
		outline-offset: -2px;
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

	/* The answer open in the composer, ringed in ink like a chosen topic. */
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

	.actions {
		display: flex;
		margin-top: calc(-1 * var(--spacing-8));
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
	 * The composer is where the visitor's next line is written, so it is theirs in look and place:
	 * the grey wash, flush right, as wide as their longest line, at the chat's foot.
	 */
	.composer {
		align-self: flex-end;
		width: 85%;
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
	 * arrow as one, a hairline like a chosen topic's: it has the cursor most of the chat, so the site's
	 * heavier 2px ring would sit on it throughout.
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
	.bubble:active:not(:disabled),
	.go:active:not(:disabled),
	.button:active:not(:disabled),
	.cancel:active,
	.copy:active,
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

		.composer {
			display: none;
		}
	}
</style>
