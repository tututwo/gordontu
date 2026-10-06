/*
 * The talk at /talk: five minutes on how the landing's avatar came alive, told round Dan Harmon's
 * Story Circle (you, need, go, search, find, take, return, change), with Gordon as the one who goes
 * round it and the avatar as what he is after. This file is the script: change the words here.
 */

/** The circle's eight steps, and when each should start for the talk to end on five minutes. */
export const STEPS = [
	{ name: 'You', at: '0:00' },
	{ name: 'Need', at: '0:15' },
	{ name: 'Go', at: '0:30' },
	{ name: 'Search', at: '1:30' },
	{ name: 'Find', at: '2:50' },
	{ name: 'Take', at: '3:30' },
	{ name: 'Return', at: '4:00' },
	{ name: 'Change', at: '4:30' }
];

/**
 * A beat is one press of the arrow key.
 * @typedef {object} Beat
 * @property {number} step which of `STEPS` it belongs to
 * @property {string} scene what the stage shows: one of the world's poses (world.js), or a panel of
 *   the page's own (`live`, `numbers`, `blank`, `drawn`, `evolution`, `film`, `credits`)
 * @property {string} line the one line on screen
 * @property {string} [sub] the line under it
 * @property {string} read the stage's caption, until the pointer is over something
 * @property {string} say what Gordon says (shown with N, for rehearsing)
 * @property {boolean} [glasses] the glasses, taken off, are set down under the line
 * @property {boolean} [struck] on the live site, all but the bio's struck tool list fades back
 * @property {boolean} [qr] the site's QR code under the line, for the room to scan
 * @property {number} [len] how much scrolling the way here takes, in screens (1 if not given)
 * @property {number} [travel] how long the arrow key takes to get here (s), where the way here is
 *   itself the show
 */

/** @type {Beat[]} */
export const BEATS = [
	{
		step: 0,
		scene: 'picture',
		line: 'This is me.',
		sub: '134 pixels, and a pair of round glasses.',
		read: 'avatar.png · 134 px',
		say: 'This is me: a hundred and thirty-four pixels at the top of my portfolio. I’m Gordon, a design engineer in the Bay Area. I’ve worked on design systems and AI workflows at VISA, and built visualization tools for Yale and UC Berkeley.'
	},
	{
		step: 1,
		scene: 'rings',
		line: 'But it isn’t me. I move.',
		sub: 'And I want to be different. My difference is the round glasses.',
		read: 'the glasses',
		say: 'But it isn’t me, because I move. A portfolio gets a few seconds, and I want those seconds to feel like me. What makes me different is this pair of round glasses.'
	},
	{
		step: 2,
		scene: 'layers',
		line: 'So I started with the glasses.',
		sub: 'One picture became two layers. The glasses come off.',
		read: 'face.png + glasses.png',
		say: 'So I started with the glasses. I split the picture into two layers, the face and the glasses, and hung the glasses on a spring. Now they come off.'
	},
	{
		step: 2,
		scene: 'cut',
		line: 'First I took myself apart.',
		sub: 'Glasses, hair, face, shirt: four layers. Two were enough.',
		read: 'paper-cut studies',
		say: 'Before that, I took myself apart like paper cut-outs: glasses, hair, face, shirt. Four layers. Two were enough.'
	},
	{
		step: 2,
		scene: 'sketch',
		line: 'The glasses had a job.',
		sub: '“Drag my glasses to explore the work behind the work.” My first sketch.',
		read: 'the first sketch',
		say: 'And the glasses had a job from the first sketch: drag my glasses to explore the work behind the work.'
	},
	{
		step: 2,
		scene: 'live',
		struck: true,
		line: 'The idea came from a strike-through.',
		sub: 'Some words matter less. Struck through, you still see them.',
		read: 'my bio · gordontu.com',
		say: 'That idea came from my bio. I struck through my old tools. They matter less now, but I still want you to see them. Some words can be quiet and still be there.'
	},
	{
		step: 2,
		scene: 'live',
		line: 'My first try at making my site a game.',
		sub: 'Put my glasses somewhere on the screen, and see what turns up.',
		read: 'live · take the glasses',
		say: 'Then the glasses came off, and I thought: they could be a way in, too. Like a game. Take my glasses, put them somewhere on the screen, and something turns up. I’ll come back to what. (Take them off, wave them around.)'
	},
	{
		step: 3,
		scene: 'turns',
		line: 'Take my glasses, and I should look at them.',
		sub: 'I can’t draw that. So I asked ChatGPT.',
		read: 'ChatGPT · Image 2',
		say: 'But if you take my glasses, I should look at them. I can’t draw that. So I sent ChatGPT my picture and my idea, and it drew me, again and again.'
	},
	{
		step: 3,
		scene: 'turns',
		line: 'Then I asked it to name the style.',
		sub: '2D. Simple shapes. Now I had words for my own style.',
		read: 'ChatGPT · the words',
		say: 'Then I took its pictures back and asked it for the prompt: what style is this? 2D. Simple shapes. I learned a lot from that. Now I had words for my own style.'
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
		line: 'Seedance turned the keyframes into video.',
		sub: 'Not good enough to ship. Good enough to study.',
		read: 'seedance · test',
		say: 'Then Seedance turned the keyframes into video, so I could see the motion. Not good enough to put on my site. Good to study.'
	},
	{
		step: 3,
		scene: 'tapnow',
		line: 'Behind the scenes.',
		sub: 'I only wanted to see it move. Remix after remix, it came to over $20.',
		read: 'tapnow · profile pic',
		say: 'Behind the scenes: this is TapNow, where I ran Seedance. Every box is a picture or a video I asked for. TapNow is pricey. I only wanted to see it move, and remix after remix, I spent over twenty dollars.',
		travel: 1.8
	},
	{
		step: 3,
		scene: 'mesh',
		glasses: true,
		line: 'So Opus 5.5 rebuilt the motion in code.',
		sub: 'A video can’t follow your pointer. Code can.',
		read: '87 points · 162 triangles',
		say: 'And a video can’t follow your pointer. So I gave the keyframes and the videos to Claude Code, and Opus 5.5 rebuilt the motion in canvas. Glasses off, and every drawing gets the same eighty-seven points.',
		travel: 1.8
	},
	{
		step: 3,
		scene: 'bend',
		glasses: true,
		line: 'The picture bends between them.',
		sub: 'Every drawing shares the same 87 points.',
		read: 'looking up',
		say: 'Join the points into triangles, and the picture bends from one drawing to the next. The head tilts instead of fading, and it follows you.',
		travel: 1.6
	},
	{
		step: 4,
		scene: 'live',
		line: 'Now it’s me.',
		sub: 'Hold my glasses above me, and I sweat. Under my chin, I panic. Over the last line of my bio, they read what it hides.',
		read: 'live · hold them above, then below',
		say: 'Now it’s me, and here is the game. Hold my glasses above my head, and I look up and sweat. Under my chin, I panic. Carry them over the scrambled last line, and they read it: I practice tai chi, play acoustic guitar, and I’m learning tango with my retired neighbor.'
	},
	{
		step: 4,
		scene: 'numbers',
		line: 'One in four took my glasses off.',
		sub: 'Almost four times each. 35 of them found the hidden line.',
		read: 'the numbers',
		say: 'I measured it. Since September 26th, one in four visitors took my glasses off, almost four times each. And thirty-five of them found the hidden line.'
	},
	{
		step: 5,
		scene: 'blank',
		line: 'Last, it needed an entrance.',
		sub: 'Something to watch while the page loads.',
		read: 'a blank sheet',
		say: 'The last thing I made is the first thing you see. On a phone, the icons came in about two seconds after the page. So it needed something to watch while it loads.'
	},
	{
		step: 5,
		scene: 'drawn',
		line: 'One pen. One line at a time.',
		sub: 'Then a brush, and a blink. Seven seconds, once a day.',
		read: 'the intro',
		say: 'One pen, one line at a time, then a brush for the colour, and a blink. Seven seconds. Seven seconds on every visit is too much, so it plays once a day, and one tap skips it. People have tapped it sixty-five times. Fair enough.',
		len: 1.6,
		travel: 5
	},
	{
		step: 6,
		scene: 'evolution',
		line: 'Ten days, every version.',
		sub: 'What stayed, on the line. What I threw away, and why.',
		read: 'Sep 23 to Oct 1',
		say: 'Ten days, every version. What stayed is on the line. What I threw away hangs off it, each with the reason I threw it away.',
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
		step: 7,
		scene: 'credits',
		line: 'It was a picture. Now it’s me.',
		sub: 'And it’s my odd, fun way of saying: I use AI.',
		read: 'the cast',
		say: 'It was a picture. Now it’s me. And it’s my odd, fun way of saying I use AI. I still can’t draw that. But I learned how to ask for it. ChatGPT drew, Seedance rehearsed, Opus wrote the code. I directed.'
	},
	{
		step: 7,
		scene: 'live',
		qr: true,
		line: 'Go take my glasses off.',
		sub: 'gordontu.com · Open to full-time roles and projects',
		read: 'live',
		say: 'I’m looking for my next role, or a project to build with you. Scan this, go take my glasses off, and say hi.'
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

/** Who made it, as the film's end credits have it (the site's /credits). @type {[string, string][]} */
export const CREDITS = [
	['Cast', 'Gordon'],
	['Director', 'Gordon'],
	['Producer', 'Gordon'],
	['Writer', 'Gordon'],
	['Photography and cinematography', 'Opus 5.5 · Seedance 2.5 · Image 2'],
	['Editor', 'Gordon · Image 2 · Opus 5.5'],
	['Animation', 'GSAP · Seedance 2.5 · Opus 5.5']
];

/**
 * The film, "Portfolio update 2026", from `from` to `to` (s): the page coming in on the drop, the
 * glasses reading the hidden line, and the projects. The file is Gordon's own copy, kept out of the
 * repo (its music is a released track), so it plays offline from his laptop; anywhere else the page
 * falls back to YouTube.
 */
export const FILM = {
	src: '/demo/portfolio-update-2026.mp4',
	youtube: 'D7HTbsX3RzE',
	from: 8,
	to: 23.9
};
