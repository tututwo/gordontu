<script>
	import { PEN, RIMS } from '$lib/landingPage/introStrokes.js';
	import { EVOLUTION } from './beats.js';
	import face from './face.webp';
	import glasses from './glasses.webp';
	import keyDown from './keyframe-down.webp';
	import keyUp from './keyframe-up.webp';
	import keyWonder from './keyframe-wonder.webp';

	/*
	 * How the avatar got here, for the talk's evolution beat: one line from Sep 23 to Oct 1, each
	 * version that stayed a node on it, with its picture, its day and its name, and what was tried and
	 * thrown away branching off it, struck out. Across a wide panel the line runs left to right, the
	 * pictures over it and the names under it, the branches dropping between the names and forking;
	 * on a narrow one it runs down the left. The page's timeline draws it (talk/+page.svelte): the line
	 * first, each node as the line reaches it (`data-at`, its share of the way), each branch after it.
	 */

	/** @type {{ onlayout?: () => void }} */
	let { onlayout = () => {} } = $props();

	let width = $state(0);
	let height = $state(0);

	/** A label on at most two lines, broken between words near its middle when it is long. @param {string} text @param {number} most */
	function lines(text, most) {
		if (text.length <= most) return [text];
		const words = text.split(' ');
		let best = [text];
		let worst = Infinity;
		for (let i = 1; i < words.length; i++) {
			const pair = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
			const longer = Math.max(...pair.map((line) => line.length));
			if (longer < worst) [best, worst] = [pair, longer];
		}
		return best;
	}

	const layout = $derived.by(() => {
		if (!width || !height) return null;
		const n = EVOLUTION.kept.length;
		/** Which of the branches after the same version each is, from 0. */
		const sibling = EVOLUTION.dropped.map((dropped, j) => EVOLUTION.dropped.slice(0, j).filter((other) => other.after === dropped.after).length);

		if (width >= 560) {
			const pad = Math.min(64, Math.max(36, width * 0.07));
			const gap = (width - 2 * pad) / (n - 1);
			const size = Math.round(Math.max(36, Math.min(84, gap * 0.66)));
			const DEPTHS = [96, 134, 172];
			const above = size + 18;
			const below = DEPTHS[DEPTHS.length - 1] + 14;
			const trunk = Math.round(Math.max(above, (height - above - below) / 2 + above));
			const most = Math.max(10, Math.floor(gap / 7.2));
			return {
				size,
				anchor: 'middle',
				trunk: `M${pad - 20} ${trunk}H${width - pad + 20}`,
				nodes: EVOLUTION.kept.map((kept, i) => {
					const x = pad + i * gap;
					return {
						...kept,
						at: i / (n - 1),
						dot: { x, y: trunk },
						box: { x: x - size / 2, y: trunk - 14 - size },
						day: { x, y: trunk + 26 },
						lines: lines(kept.label, most).map((text, k) => ({ text, x, y: trunk + 44 + k * 17 }))
					};
				}),
				branches: EVOLUTION.dropped.map((dropped, j) => {
					const mid = pad + (dropped.after + 0.5) * gap;
					const drop = trunk + 70;
					const x1 = mid + gap * (0.16 + 0.7 * sibling[j]);
					const y1 = trunk + DEPTHS[j % DEPTHS.length];
					return {
						...dropped,
						at: (dropped.after + 0.5) / (n - 1),
						path: `M${mid} ${trunk}V${drop}Q${mid} ${y1} ${x1} ${y1}`,
						end: { x: x1, y: y1 },
						text: { x: x1 + 10, y: y1 + 4 }
					};
				})
			};
		}

		// Narrow: the line down the left, each version's picture and its day and name beside it, the
		// branches out to the right.
		const top = 24;
		const gap = (height - 2 * top) / (n - 1);
		const size = Math.round(Math.max(20, Math.min(40, gap * 0.8)));
		const line = 10;
		return {
			size,
			anchor: 'start',
			trunk: `M${line} ${top - 8}V${height - top + 8}`,
			nodes: EVOLUTION.kept.map((kept, i) => {
				const y = top + i * gap;
				return {
					...kept,
					at: i / (n - 1),
					dot: { x: line, y },
					box: { x: line + 12, y: y - size / 2 },
					day: { x: line + size + 22, y: y - 2 },
					lines: [{ text: kept.label, x: line + size + 22, y: y + 13 }]
				};
			}),
			branches: EVOLUTION.dropped.map((dropped, j) => {
				const y0 = top + (dropped.after + 0.5) * gap;
				const x1 = Math.round(width * 0.56);
				const y1 = y0 + 4 + 12 * sibling[j];
				return {
					...dropped,
					at: (dropped.after + 0.5) / (n - 1),
					path: `M${line} ${y0}C${line + 40} ${y0} ${x1 - 40} ${y1} ${x1} ${y1}`,
					end: { x: x1, y: y1 },
					text: { x: x1 + 8, y: y1 + 4 }
				};
			})
		};
	});
</script>

<div class="evolution" bind:clientWidth={width} bind:clientHeight={height}>
	{#if layout}
		{@const { nodes, branches, trunk, size, anchor } = layout}
		<svg
			class={{ narrow: anchor === 'start' }}
			viewBox="0 0 {width} {height}"
			{width}
			{height}
			role="img"
			aria-label="How the avatar changed, from Sep 23 to Oct 1"
			{@attach () => {
				if (layout) onlayout();
			}}
		>
			<defs>
				<clipPath id="evolution-thumb"><rect width={size} height={size} rx="4" /></clipPath>
			</defs>

			<path class="trunk" d={trunk} pathLength="1" />

			{#each branches as branch (branch.label)}
				<g class="branch" data-at={branch.at}>
					<path d={branch.path} pathLength="1" />
					<g class="end">
						<circle cx={branch.end.x} cy={branch.end.y} r="3" />
						<text x={branch.text.x} y={branch.text.y}>{branch.label}</text>
					</g>
				</g>
			{/each}

			{#each nodes as node (node.label)}
				<g class="node" data-at={node.at}>
					<g transform="translate({node.box.x} {node.box.y})">
						<g clip-path="url(#evolution-thumb)">
							<rect class="paper" width={size} height={size} />
							{#if node.thumb === 'picture' || node.thumb === 'face'}
								<image href={face} width={size} height={size} />
								<image href={glasses} width={size} height={size} />
								{#if node.thumb === 'face'}
									<!-- Mid-blink, as the Intro ends: skin over each eye's dot, and a line where it was. -->
									<svg class="lids" width={size} height={size} viewBox="0 0 134 134">
										<ellipse cx="51.3" cy="58.9" rx="2.3" ry="2.1" />
										<ellipse cx="80.8" cy="57.9" rx="2.3" ry="2.1" />
										<path d="M49.7 59Q51.3 60 52.9 59" />
										<path d="M79.2 58Q80.8 59 82.4 58" />
									</svg>
								{/if}
							{:else if node.thumb === 'off'}
								<image href={face} width={size} height={size} />
								<image href={glasses} width={size} height={size} transform="translate({size * 0.2} {-size * 0.26}) rotate(-12 {size / 2} {size / 2})" />
							{:else if node.thumb === 'up'}
								<image href={keyUp} width={size} height={size} />
							{:else if node.thumb === 'down'}
								<image href={keyDown} width={size} height={size} />
							{:else if node.thumb === 'wonder'}
								<image href={keyWonder} width={size} height={size} />
							{:else if node.thumb === 'lines'}
								<svg class="lines" width={size} height={size} viewBox="0 0 134 134">
									{#each [...PEN, ...RIMS] as d (d)}<path {d} />{/each}
								</svg>
							{:else if node.thumb === 'day'}
								{#each { length: 24 }, hour (hour)}
									{@const a = (hour / 24) * 2 * Math.PI - Math.PI / 2}
									<circle class={['hour', { lit: !hour }]} cx={size / 2 + Math.cos(a) * size * 0.32} cy={size / 2 + Math.sin(a) * size * 0.32} r={Math.max(1, size * 0.028)} />
								{/each}
							{/if}
						</g>
						<rect class="frame" width={size} height={size} rx="4" />
					</g>
					<circle class="dot" cx={node.dot.x} cy={node.dot.y} r="3.5" />
					<text class="date" x={node.day.x} y={node.day.y} text-anchor={anchor}>{node.date}</text>
					{#each node.lines as line (line.text)}<text class="label" x={line.x} y={line.y} text-anchor={anchor}>{line.text}</text>{/each}
				</g>
			{/each}
		</svg>
	{/if}
</div>

<style>
	.evolution {
		position: relative;
		width: 100%;
		height: 100%;
	}

	svg {
		position: absolute;
		inset: 0;
		overflow: visible;
	}

	/* The line, and each branch's, drawn on by the page's timeline: undrawn until then. */
	.trunk,
	.branch path {
		fill: none;
		stroke-dasharray: 1 2;
		stroke-dashoffset: 1;
		stroke-linecap: round;
	}

	.trunk {
		stroke: #000;
		stroke-width: 1;
	}

	.branch path {
		stroke: rgb(0 0 0 / 0.32);
		stroke-width: 1;
	}

	.node,
	.end {
		visibility: hidden;
		opacity: 0;
	}

	.paper {
		fill: #fff;
	}

	.frame {
		fill: none;
		stroke: rgb(0 0 0 / 0.18);
	}

	.lines path {
		fill: none;
		stroke: #140606;
		stroke-width: 1.7;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.lids ellipse {
		fill: #f8d5b8;
	}

	.lids path {
		fill: none;
		stroke: #140606;
		stroke-width: 1.1;
		stroke-linecap: round;
	}

	.hour {
		fill: rgb(0 0 0 / 0.18);
	}

	.hour.lit {
		fill: #000;
	}

	.dot {
		fill: #000;
	}

	.end circle {
		fill: #fff;
		stroke: rgb(0 0 0 / 0.44);
	}

	text {
		font-size: 13px;
		font-variant-numeric: tabular-nums;
	}

	.date {
		fill: rgb(0 0 0 / 0.56);
		font-size: 12px;
	}

	.label {
		fill: rgb(0 0 0 / 0.72);
	}

	.narrow text {
		font-size: 11px;
	}

	/* Thrown away: struck out, as the site strikes its old tool list. */
	.end text {
		fill: rgb(0 0 0 / 0.56);
		text-decoration: line-through;
	}
</style>
