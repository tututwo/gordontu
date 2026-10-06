/*
 * The talk at /talk: five minutes on how Gordon's website grew up and his portfolio picture came
 * alive, told round Dan Harmon's Story Circle (you, need, go, search, find, take, return, change), in
 * the order he tells it: a site like everyone else's, a look at himself, ChatGPT, the glasses and the
 * game, TapNow, Opus, the intro, and what came of it. This file is the script: change the words here.
 */

/** The circle's eight steps, and when each should start for the talk to end on five minutes. */
export const STEPS = [
	{ name: 'You', at: '0:00' },
	{ name: 'Need', at: '0:50' },
	{ name: 'Go', at: '1:00' },
	{ name: 'Search', at: '1:40' },
	{ name: 'Find', at: '2:45' },
	{ name: 'Take', at: '3:30' },
	{ name: 'Return', at: '4:00' },
	{ name: 'Change', at: '4:35' }
];

/**
 * A beat is one press of the arrow key.
 * @typedef {object} Beat
 * @property {number} step which of `STEPS` it belongs to
 * @property {string} scene what the stage shows: one of the world's poses (world.js), or a panel of
 *   the page's own (`live`, `shots`, `numbers`, `blank`, `drawn`, `evolution`, `film`)
 * @property {string} line the one line on screen
 * @property {string} [sub] the line under it
 * @property {string} read the stage's caption, until the pointer is over something
 * @property {string} say what Gordon says (shown with N, for rehearsing)
 * @property {Shot[]} [shots] the screenshots side by side on the stage, for scene `shots`
 * @property {boolean} [glasses] the glasses, taken off, are set down under the line
 * @property {boolean} [qr] the site's QR code under the line, for the room to scan
 * @property {number} [len] how much scrolling the way here takes, in screens (1 if not given)
 * @property {number} [travel] how long the arrow key takes to get here (s), where the way here is
 *   itself the show
 */

/**
 * A screenshot, or a placeholder for one Gordon has still to send.
 * @typedef {object} Shot
 * @property {string} label what it is, under it
 * @property {string} [src] which picture (the page's `SHOTS`); without one, a placeholder
 * @property {string} [want] for a placeholder: the file to send, and what it shows
 * @property {number} [ratio] for a placeholder: its width over its height (4 / 3 if not given)
 * @property {{ x: number, y: number, w: number, h: number }} [mark] a box drawn round part of it, in
 *   shares of its width and height
 */

/** @type {Beat[]} */
export const BEATS = [
	{
		step: 0,
		scene: 'picture',
		line: 'How I animated my own portfolio picture.',
		sub: 'My personal website, and the little picture at the top of it.',
		read: 'avatar.png · 134 px',
		say: 'Hello everyone. I’m Gordon, a design engineer in the Bay Area. I’d like to show you my personal website, and especially how I animated my own portfolio picture.'
	},
	{
		step: 0,
		scene: 'shots',
		line: 'This is where I almost said: ready to go.',
		read: 'gordontu.com · before',
		say: 'This is where I almost said I was ready to go.',
		shots: [{ src: 'iteration2', label: 'Almost ready to go' }]
	},
	{
		step: 0,
		scene: 'shots',
		line: 'It took three phases to get here.',
		sub: 'Each one learned from other people’s minimalist portfolios.',
		read: 'phases 1 to 3',
		say: 'I got here in three phases, after learning a lot from other people’s minimalist portfolio sites.',
		shots: [
			{ src: 'site2024', label: 'Phase 1' },
			{ src: 'iteration0', label: 'Phase 2' },
			{ src: 'iteration1', label: 'Phase 3' }
		]
	},
	{
		step: 0,
		scene: 'shots',
		line: 'Then I wanted it more fun.',
		sub: 'And I had a message that isn’t about my work. So it got a gray bar.',
		read: 'the gray bar',
		say: 'But I wanted it to be more fun. And I had a message I wanted to share that isn’t really about my work. Like my old tools, struck through, it could sit there quietly. Therefore, the gray bar.',
		shots: [{ src: 'iteration2', label: 'The gray bar', mark: { x: 0.045, y: 0.815, w: 0.925, h: 0.105 } }]
	},
	{
		step: 0,
		scene: 'shots',
		line: 'But this is everyone else’s website.',
		sub: 'With a gray box of text. I wanted to be different.',
		read: 'gordontu.com · before',
		say: 'Then I realized this isn’t really me. It’s basically everyone else’s website, with a gray area of text. I want to be more different.',
		shots: [{ src: 'iteration2', label: 'Like everyone else’s' }]
	},
	{
		step: 1,
		scene: 'picture',
		line: 'So I looked at myself again.',
		sub: 'This is me: 134 pixels, and a pair of round glasses.',
		read: 'avatar.png · 134 px',
		say: 'So I looked at myself again. This is me.'
	},
	{
		step: 1,
		scene: 'rings',
		line: 'But it isn’t me. I move.',
		sub: 'And what makes me different is the round glasses.',
		read: 'the glasses',
		say: 'But this also isn’t me, because I move. And what makes me different is this pair of round glasses.'
	},
	{
		step: 2,
		scene: 'shots',
		line: 'I tried ChatGPT, in 3D and 2D.',
		sub: 'I put in pictures I like, and had it describe their style.',
		read: 'ChatGPT · 3D and 2D',
		say: 'So I tried ChatGPT. I tried 3D, and I tried 2D. I put in pictures I like, and had it describe their style.',
		shots: [
			{ label: '3D', want: 'chatgpt-3d.png: a 3D try', ratio: 1 },
			{ label: '2D', want: 'chatgpt-2d.png: a 2D try', ratio: 1 },
			{ label: 'The style, in words', want: 'chatgpt-style.png: ChatGPT describing the style', ratio: 3 / 4 }
		]
	},
	{
		step: 2,
		scene: 'picture',
		line: 'I stayed 2D.',
		sub: 'To stay in character, fit the site’s vibe, and be subtle.',
		read: 'avatar.png · 2D',
		say: 'After hours of back and forth, I decided to stay where I am: a 2D animation. To stay in character, to fit the overall vibe, and to be subtle on the site.'
	},
	{
		step: 2,
		scene: 'cut',
		line: 'I took myself apart.',
		sub: 'Glasses, hair, face, shirt: four layers. Two were enough.',
		read: 'paper-cut studies',
		say: 'I took myself apart like paper cut-outs: glasses, hair, face, shirt. Four layers. Two were enough.'
	},
	{
		step: 2,
		scene: 'layers',
		line: 'Wait a minute. What do these glasses do?',
		sub: 'They came off. What could I do with them?',
		read: 'face.png + glasses.png',
		say: 'I made it, and the glasses came off. Then I thought: wait a minute. What do these glasses do? What can I do with them?'
	},
	{
		step: 3,
		scene: 'live',
		line: 'Then I saw the gray bar.',
		sub: 'It became a scrambled line, and my glasses decipher it.',
		read: 'live · the hidden line',
		say: 'Then I saw the gray bar, and I thought: let’s use those glasses to decipher my text. (Carry the glasses over the scrambled line.)'
	},
	{
		step: 3,
		scene: 'live',
		line: 'I gamified my own portfolio.',
		sub: 'Hidden for the curious, and only my glasses can read it.',
		read: 'live · the hidden line',
		say: 'Isn’t that interesting? I somehow gamified my own portfolio. It says: I practice tai chi, play acoustic guitar, and I’m learning tango with my retired neighbor.'
	},
	{
		step: 3,
		scene: 'sketch',
		line: 'What if I move my glasses somewhere else?',
		sub: 'So I started tweaking the little figure.',
		read: 'the sketch',
		say: 'Speaking of gamification: what happens if I move my glasses somewhere else? I took my website and started tweaking the little figure.'
	},
	{
		step: 3,
		scene: 'turns',
		line: 'ChatGPT drew the keyframes.',
		sub: 'Different expressions, again and again.',
		read: 'ChatGPT · keyframes',
		say: 'I used ChatGPT to generate different keyframes, with different expressions.'
	},
	{
		step: 3,
		scene: 'keys',
		line: 'Three made it.',
		sub: 'Looking up, looking down, and wondering.',
		read: 'the keyframes',
		say: 'Three made it: looking up, looking down, and wondering.'
	},
	{
		step: 3,
		scene: 'strip',
		line: 'Then I passed them to Seedance.',
		sub: 'To see how they might move.',
		read: 'seedance · test',
		say: 'Then I passed them to Seedance, to see them move.'
	},
	{
		step: 3,
		scene: 'tapnow',
		line: 'On TapNow, five ways to generate.',
		sub: 'Text to image. Image to image. Text to video. Image to video. Video to video.',
		read: 'tapnow · profile pic',
		say: 'Specifically on TapNow, a platform with many image and video models. There are five ways to generate: text to image, image to image, text to video, image to video, and video to video.',
		travel: 1.8
	},
	{
		step: 3,
		scene: 'tapnow',
		line: 'I burned $20.',
		sub: 'And I got the idea of what I wanted to show.',
		read: 'tapnow · profile pic',
		say: 'After burning about twenty dollars, I got the idea of what I wanted to show.'
	},
	{
		step: 4,
		scene: 'mesh',
		glasses: true,
		line: 'Then I went back to Opus.',
		sub: 'Which is what I should have done in the first place.',
		read: '87 points · 162 triangles',
		say: 'Then I went back to Opus, which is what I should have done in the first place.',
		travel: 1.8
	},
	{
		step: 4,
		scene: 'shots',
		line: 'I told it the beginning and the end.',
		sub: 'And passed it my screenshots from ChatGPT and Seedance, so it stayed consistent.',
		read: 'Claude Code · Opus 5.5',
		say: 'I told Opus what I wanted to create, the beginning and the end, and to stay consistent with what I had, by passing it my screenshots from ChatGPT and Seedance.',
		shots: [{ label: 'My prompt to Opus', want: 'opus-prompt.png: your prompt to Opus in Claude Code', ratio: 16 / 10 }]
	},
	{
		step: 4,
		scene: 'bend',
		glasses: true,
		line: 'After several hours, I got this.',
		sub: 'The picture bends from one drawing to the next, and follows your pointer.',
		read: 'looking up',
		say: 'After several hours, I got this. The picture bends from one drawing to the next, and it follows your pointer.',
		travel: 1.6
	},
	{
		step: 4,
		scene: 'live',
		line: 'Now it’s me.',
		sub: 'Hold my glasses above me, and I sweat. Under my chin, I panic.',
		read: 'live · hold them above, then below',
		say: 'Now it’s me. Hold my glasses above my head, and I look up and sweat. Under my chin, I panic.'
	},
	{
		step: 5,
		scene: 'blank',
		line: 'Then I added an intro.',
		sub: 'Something to watch while the page loads.',
		read: 'a blank sheet',
		say: 'I figured I should add more to that, so I added an intro animation, something to watch while the page loads.'
	},
	{
		step: 5,
		scene: 'drawn',
		line: 'One pen. One line at a time.',
		sub: 'Then a brush, and a blink. Seven seconds, once a day.',
		read: 'the intro',
		say: 'One pen, one line at a time, then a brush for the colour, and a blink. Seven seconds, so it plays once a day, and one tap skips it.',
		len: 1.6,
		travel: 5
	},
	{
		step: 5,
		scene: 'evolution',
		line: 'It took me ten days.',
		sub: 'Every version: what stayed, what I threw away, and why.',
		read: 'Sep 23 to Oct 1',
		say: 'It took me ten days, and here are the iterations: what stayed on the line, and what I threw away, and why.',
		len: 1.4,
		travel: 3.2
	},
	{
		step: 6,
		scene: 'film',
		line: 'Back to the page.',
		read: 'gordontu.com',
		say: '(Play the film: sixteen seconds. Say nothing.)'
	},
	{
		step: 6,
		scene: 'numbers',
		line: 'One in four took my glasses off.',
		sub: 'Almost four times each. 35 of them found the hidden line.',
		read: 'the numbers',
		say: 'And people play with it. Since September 26th, one in four visitors took my glasses off, almost four times each.'
	},
	{
		step: 6,
		scene: 'shots',
		line: 'GSAP picked it as Site of the Day.',
		sub: 'Go see the other great portfolios on the GSAP Showcase.',
		read: 'gsap.com/showcase',
		say: 'And just this morning, I found out I’m Site of the Day on the GSAP Showcase. Feel free to check out the great portfolios there.',
		shots: [{ src: 'siteOfTheDay', label: 'From the GSAP team' }]
	},
	{
		step: 7,
		scene: 'live',
		qr: true,
		line: 'Here’s my website. Go take my glasses off.',
		sub: 'gordontu.com · Open to full-time roles and projects',
		read: 'live',
		say: 'Here’s my website. Scan the QR code, and do anything you want with it. I’m open to any questions, and to my next role or project.'
	}
];

/**
 * What visitors did with the glasses, for the numbers beat (keep its words in step): PostHog, on
 * gordontu.com from Sep 26 (when it started counting) to Oct 6, without San Mateo, where Gordon's
 * own phones and laptops are. Count again before the talk.
 */
export const NUMBERS = {
	rows: [
		{ n: 214, what: 'visited gordontu.com' },
		{ n: 56, what: 'took my glasses off' },
		{ n: 35, what: 'read the hidden line' }
	],
	source: 'PostHog · Sep 26 to Oct 6 · my own visits left out'
};

/**
 * How the avatar got here, for the evolution beat: along the line, what stayed (with the day it
 * reached the site); off it, what was tried and thrown away and why, branching after the kept
 * version it came after, in that order. `thumb` names the little picture over a kept version
 * (Evolution.svelte).
 */
export const EVOLUTION = {
	kept: [
		{ date: 'Sep 23', label: 'A picture', thumb: 'picture' },
		{ date: 'Sep 24', label: 'The glasses come off', thumb: 'off' },
		{ date: 'Sep 24', label: 'He looks up and down', thumb: 'up' },
		{ date: 'Sep 25', label: 'Sweat, and three marks', thumb: 'down' },
		{ date: 'Sep 26', label: 'He wonders', thumb: 'wonder' },
		{ date: 'Sep 27', label: 'Drawn in, line by line', thumb: 'lines' },
		{ date: 'Sep 28', label: 'A brush, and a blink', thumb: 'face' },
		{ date: 'Oct 1', label: 'Once a day', thumb: 'day' }
	],
	dropped: [
		{ after: 0, label: 'Four paper layers', why: 'Two were enough' },
		{ after: 1, label: 'A Seedance video', why: 'Can’t follow your pointer' },
		{ after: 4, label: 'Pencil, pen, colour, stacked', why: 'Too many layers' },
		{ after: 5, label: 'A glassy blur', why: 'Not my vibe' },
		{ after: 6, label: 'Every visit', why: 'Too much' }
	]
};

/**
 * The film, "Portfolio update 2026", from `from` to `to` (s): the page coming in on the drop, the
 * glasses reading the hidden line, and the projects. The file is in static/demo, so it plays
 * offline; where it cannot load, the page falls back to YouTube.
 */
export const FILM = {
	src: '/demo/portfolio-update-2026.mp4',
	youtube: 'D7HTbsX3RzE',
	from: 8,
	to: 23.9
};
