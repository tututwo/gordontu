<script>
	import rough from 'roughjs';

	/** @type {{ width?: number, height?: number, shapes?: any[], class?: string, label?: string }} */
	let {
		width = 100,
		height = 100,
		shapes = [],
		class: className = '',
		label = ''
	} = $props();

	/** @param {any[]} shapeList */
	function draw(shapeList) {
		/** @param {SVGSVGElement} node */
		return (node) => {
			const renderer = rough.svg(node);
			node.replaceChildren();

			for (const shape of shapeList) {
				const options = {
					stroke: 'var(--sketch-ink, var(--ink, #1d1d1f))',
					strokeWidth: 1.7,
					roughness: 1.25,
					bowing: 1.1,
					...shape.options
				};

				let drawing;
				switch (shape.type) {
					case 'line':
						drawing = renderer.line(shape.x1, shape.y1, shape.x2, shape.y2, options);
						break;
					case 'rectangle':
						drawing = renderer.rectangle(shape.x, shape.y, shape.width, shape.height, options);
						break;
					case 'ellipse':
						drawing = renderer.ellipse(shape.x, shape.y, shape.width, shape.height, options);
						break;
					case 'curve':
						drawing = renderer.curve(shape.points, options);
						break;
					case 'linearPath':
						drawing = renderer.linearPath(shape.points, options);
						break;
					case 'polygon':
						drawing = renderer.polygon(shape.points, options);
						break;
					case 'path':
						drawing = renderer.path(shape.d, options);
						break;
					default:
						continue;
				}

				node.appendChild(drawing);
			}
		};
	}
</script>

<svg
	class={className}
	viewBox={`0 0 ${width} ${height}`}
	preserveAspectRatio="none"
	role={label ? 'img' : undefined}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
	focusable="false"
	{@attach draw(shapes)}
></svg>
