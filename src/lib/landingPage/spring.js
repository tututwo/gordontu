// A port of react-spring's spring integrator (semi-implicit Euler in 1 ms steps, same force
// units, same adaptive precision), so the Category link settles exactly like the uikit-expt card
// it copies. The defaults are react-spring's `config.default`, which that card uses.
export class Spring {
	/** Velocity in units per millisecond; carried across retargets like react-spring's `lastVelocity`. */
	velocity = 0;

	/** @param {number} value @param {{ tension?: number, friction?: number }} [config] */
	constructor(value, { tension = 170, friction = 26 } = {}) {
		this.value = value;
		this.from = value;
		this.target = value;
		this.config = { tension, friction };
	}

	/** @param {number} target */
	to(target) {
		this.from = this.value;
		this.target = target;
	}

	/** Jump to `value` at rest. @param {number} value */
	set(value) {
		this.value = this.from = this.target = value;
		this.velocity = 0;
	}

	/** Advance by `dt` ms; returns whether the spring is still moving. @param {number} dt */
	advance(dt) {
		const { tension, friction } = this.config;
		const { from, target } = this;
		const precision =
			from === target
				? 0.005
				: Math.max(
						Math.max(Math.abs(target), Math.abs(from), 1) * Number.EPSILON,
						Math.min(1, Math.abs(target - from) * 0.001)
					);
		const restVelocity = precision / 10;
		let { value, velocity } = this;
		for (let n = 0; n < Math.ceil(dt); n++) {
			if (Math.abs(velocity) <= restVelocity && Math.abs(target - value) <= precision) {
				this.set(target);
				return false;
			}
			const acceleration = -tension * 0.000001 * (value - target) - friction * 0.001 * velocity;
			velocity += acceleration;
			value += velocity;
		}
		this.value = value;
		this.velocity = velocity;
		return true;
	}
}
