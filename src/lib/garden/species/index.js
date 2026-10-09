// The Garden's catalogue of Plants: every species drawing, keyed by the kind a cell names.
// Flowers are keyed by a Featured Project's `plant`; ground covers by layout.js's COVER map.
// Metadata only: the drawings' SVG strings are in svgs.js, for Node (the sprite script), never the browser.
import { moonLotus } from './moon-lotus.js';
import { marginsMophead } from './margins-mophead.js';
import { rainBell } from './rain-bell.js';
import { planetBloom } from './planet-bloom.js';
import { origamiBloom } from './origami-bloom.js';
import { houseLupine } from './house-lupine.js';
import { emberSpire } from './ember-spire.js';
import { voronoiBloom } from './voronoi-bloom.js';
import { palettePoppy } from './palette-poppy.js';
import { notebookPeony } from './notebook-peony.js';
import { clover } from './clover.js';
import { daisies } from './daisies.js';
import { forgetMeNots } from './forget-me-nots.js';

/**
 * A drawing's size, where its foot is (`anchor`, a fraction of its height down), the colours its burst
 * of petals comes in, and, for ground cover, the colour of its ground: one background <rect>, which the
 * sprite script takes off so the cell's wash shows through.
 * @typedef {{ width: number, height: number, anchor: number, ground?: string, petals: string[] }} Species
 */

/** @type {Record<string, Species>} */
export const species = {
	'moon-lotus': moonLotus,
	'margins-mophead': marginsMophead,
	'rain-bell': rainBell,
	'planet-bloom': planetBloom,
	'origami-bloom': origamiBloom,
	'house-lupine': houseLupine,
	'ember-spire': emberSpire,
	'voronoi-bloom': voronoiBloom,
	'palette-poppy': palettePoppy,
	'notebook-peony': notebookPeony,
	clover,
	daisies,
	'forget-me-nots': forgetMeNots
};

/** The kinds that stand up as flowers, one per Featured Project. */
export const FLOWERS = ['moon-lotus', 'margins-mophead', 'rain-bell', 'planet-bloom', 'origami-bloom', 'house-lupine', 'ember-spire', 'voronoi-bloom', 'palette-poppy', 'notebook-peony'];

/** The kinds that lie flat as ground cover, one per category. */
export const COVERS = ['clover', 'daisies', 'forget-me-nots'];
