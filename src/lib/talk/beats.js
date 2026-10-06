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
	{ name: 'Search', at: '1:20' },
	{ name: 'Find', at: '2:40' },
	{ name: 'Take', at: '3:00' },
	{ name: 'Return', at: '3:40' },
	{ name: 'Change', at: '4:35' }
];

/**
 * A beat is one press of the arrow key.
 * @typedef {object} Beat
 * @property {number} step which of `STEPS` it belongs to
 * @property {string} scene what the stage shows: one of the world's poses (world.js), or a panel of
 *   the page's own (`live`, `blank`, `drawn`, `evolution`, `film`, `credits`)
 * @property {string} line the one line on screen
 * @property {string} [sub] the line under it
 * @property {string} read the stage's caption, until the pointer is over something
 * @property {string} say what Gordon says (shown with N, for rehearsing)
 * @property {boolean} [glasses] the glasses, taken off, are set down under the line
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
		say: 'This is me: a hundred and thirty-four pixels at the top of my portfolio. I’m a design engineer. I make maps and data visualization.'
	},
	{
		step: 1,
		scene: 'rings',
		line: 'But it isn’t me. I move.',
		sub: 'And I want to be different. My difference is the round glasses.',
		read: 'the glasses',
		say: 'But it isn’t me, because I move. And I want to be different. What makes me different is this pair of round glasses.'
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
		say: 'Before that, I took myself apart: glasses, hair, face, shirt, like paper cut-outs. Four layers. In the end, two were enough.'
	},
	{
		step: 2,
		scene: 'sketch',
		line: 'The glasses had a job.',
		sub: '“Drag my glasses to explore the work behind the work.” My first sketch.',
		read: 'the first sketch',
		say: 'And the glasses had a job from the very first sketch: drag my glasses to explore the work behind the work.'
	},
	{
		step: 2,
		scene: 'live',
		line: 'My first try at making my site a game.',
		sub: 'Put my glasses somewhere on the screen, and see what turns up.',
		read: 'live · take the glasses',
		say: 'That was my first try at making my site a game. You take my glasses and put them somewhere on the screen, and something turns up. A little puzzle. (Take them off, wave them around. Don’t give it away yet.)'
	},
	{
		step: 3,
		scene: 'turns',
		line: 'Take my glasses, and I should look at them.',
		sub: 'I can’t draw that. So I asked Image 2, again and again.',
		read: 'Image 2 · tries',
		say: 'But if you take my glasses, I should look at them. I can’t draw that. So I asked Image 2, again and again: over my shoulder, in profile, puzzled, turned away.'
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
		say: 'Then Seedance turned the keyframes into video, so I could see how the motion might look. It wasn’t good enough to put on the site. But it was good reference.'
	},
	{
		step: 3,
		scene: 'tapnow',
		line: 'Behind the scenes.',
		sub: 'TapNow, where I ran Seedance. It isn’t cheap.',
		read: 'tapnow · profile pic',
		say: 'Behind the scenes, this is TapNow, where I ran Seedance. Every box is a picture or a video I asked for. It is not cheap.',
		travel: 1.8
	},
	{
		step: 3,
		scene: 'mesh',
		glasses: true,
		line: 'So Opus 5.5 rebuilt the motion in code.',
		sub: 'Every drawing gets the same 87 points.',
		read: '87 points · 162 triangles',
		say: 'So I handed the keyframes and the videos to Opus 5.5, and it rebuilt the motion in code. I take my glasses off, and every drawing gets the same eighty-seven points: the hair, the brows, the eyes, the jaw.',
		travel: 1.8
	},
	{
		step: 3,
		scene: 'bend',
		glasses: true,
		line: 'The picture bends between them.',
		sub: 'A video can’t look at your pointer. Code can.',
		read: 'looking up',
		say: 'Join the points into triangles, and the picture bends from one drawing to the next. The head tilts instead of fading. And unlike a video, it can follow your pointer.',
		travel: 1.6
	},
	{
		step: 4,
		scene: 'live',
		line: 'Now it’s me.',
		sub: 'Hold my glasses above me, and I sweat. Under my chin, I panic. Over the last line of my bio, they read what it hides.',
		read: 'live · hold them above, then below',
		say: 'Now it’s me, and now I can tell you the game. Hold my glasses above my head, and I look up and sweat. Under my chin, I panic. Point at the scrambled last line, and I wonder. Carry the glasses over it, and they read it.'
	},
	{
		step: 5,
		scene: 'blank',
		line: 'Last, it needed an entrance.',
		sub: 'Something to watch while the page loads.',
		read: 'a blank sheet',
		say: 'The last thing I made is the first thing you see. On a phone, the three icons arrived about two seconds after the page. So the page needed something to watch while it loads.'
	},
	{
		step: 5,
		scene: 'drawn',
		line: 'One pen. One line at a time.',
		sub: 'Then a brush, and a blink. Seven seconds, once a day.',
		read: 'the intro',
		say: 'One pen, one line at a time, then a brush for the colour, and a blink. Seven seconds. Seven seconds on every visit is too much, so it plays once a day, and one tap skips it.',
		len: 1.6,
		travel: 5
	},
	{
		step: 5,
		scene: 'evolution',
		line: 'Ten days, every version.',
		sub: 'What stayed on the line, and what I threw away.',
		read: 'Sep 23 to Oct 1',
		say: 'Here is how it got here, in ten days. Along the line, what stayed. Off it, what I threw away: four paper layers, the head turns, the Seedance video, an intro that stacked pencil, pen and colour, and a glassy blur.',
		len: 1.4,
		travel: 3.2
	},
	{
		step: 6,
		scene: 'film',
		line: 'Back to the page.',
		read: 'gordontu.com',
		say: '(Play the film. Say nothing.)'
	},
	{
		step: 7,
		scene: 'credits',
		line: 'It was a picture. Now it’s me.',
		sub: 'And it’s my odd, fun way of saying: I use AI.',
		read: 'the cast',
		say: 'It was a picture. Now it’s me. And it’s my odd, fun way of saying that I use AI. Image 2 drew, Seedance rehearsed, Opus wrote the code. I directed.'
	},
	{
		step: 7,
		scene: 'live',
		line: 'Go take my glasses off.',
		sub: 'gordontu.com',
		read: 'live',
		say: 'gordontu.com. Go take my glasses off.'
	}
];

/**
 * How the avatar got here, for the evolution beat: along the line, what stayed (with the day it
 * reached the site); off it, what was tried and thrown away, branching after the kept version it
 * came after. `thumb` names the little picture over a kept version (Evolution.svelte).
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
		{ after: 0, label: 'Four paper layers' },
		{ after: 1, label: 'Turning to look' },
		{ after: 1, label: 'A Seedance video' },
		{ after: 4, label: 'Pencil, pen, colour, stacked' },
		{ after: 5, label: 'A glassy blur' }
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
 * The film, "Portfolio update 2026". The file is Gordon's own copy, kept out of the repo (its music
 * is a released track), so it plays offline from his laptop; anywhere else the page falls back to
 * YouTube.
 */
export const FILM = { src: '/demo/portfolio-update-2026.mp4', youtube: 'D7HTbsX3RzE' };
