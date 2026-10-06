// The species drawings' SVG strings, keyed by kind, for Node (scripts/garden-sprites.mjs renders them to
// static/garden/<kind>.webp). Never imported by the browser: the catalogue (index.js) is metadata only.
import { svg as moonLotus } from './moon-lotus.js';
import { svg as marginsMophead } from './margins-mophead.js';
import { svg as rainBell } from './rain-bell.js';
import { svg as planetBloom } from './planet-bloom.js';
import { svg as origamiBloom } from './origami-bloom.js';
import { svg as houseLupine } from './house-lupine.js';
import { svg as emberSpire } from './ember-spire.js';
import { svg as voronoiBloom } from './voronoi-bloom.js';
import { svg as palettePoppy } from './palette-poppy.js';
import { svg as clover } from './clover.js';
import { svg as daisies } from './daisies.js';
import { svg as forgetMeNots } from './forget-me-nots.js';

/** @type {Record<string, string>} */
export const svgs = {
	'moon-lotus': moonLotus,
	'margins-mophead': marginsMophead,
	'rain-bell': rainBell,
	'planet-bloom': planetBloom,
	'origami-bloom': origamiBloom,
	'house-lupine': houseLupine,
	'ember-spire': emberSpire,
	'voronoi-bloom': voronoiBloom,
	'palette-poppy': palettePoppy,
	clover,
	daisies,
	'forget-me-nots': forgetMeNots
};
