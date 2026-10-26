// The drawbridge (the River Road's and Lookout Hill's): a leaf of four pieces standing upright
// in one column at the near edge of a gap, rows 36 to 39, the lamp on its tip. HONK at it: the
// honk beats the bottom piece, which turns into a spark that runs up the leaf and back down,
// and each piece it touches falls, tilting, out over the gap; they land side by side on the
// road's row as the deck (and the spark, back at the bottom, lands as its first piece). A
// timed bridge's deck blinks amber, then stands back up into the leaf (honk again).
//
// Each piece is its own monster because a monster moves as one block. Nothing is solid on its
// way down or up, so a falling or rising piece can never shove the car.
import { POWER } from '../ids';
import { SOLBOT } from '../../../../web/src/formats/blocks';
import type { Bestiary } from '../characters/mons';
import { deck, leafFall, leafUp } from '../sprites/roadTrip';
import { zap } from '../sprites/gadgets';

/** How many blocks wide a drawbridge's gap is (and how many pieces its leaf has). */
export const SPAN = 4;

/**
 * The power of every moving part (spark, falling and rising pieces, deck): all the same, so
 * they pass through each other (a weaker one touching a stronger one would be beaten and land
 * early), and above the honk, so a honk can't knock a piece of deck out.
 */
const BRIDGE = POWER.honk + 2;

/** Ticks a piece takes to fall (or rise) into place. */
const FALL = 10;

function pics(b: Bestiary): void {
  if (b.mb.has('leafUp')) return;
  const solid = { solid: 15 };
  // the deck holds the car up but never shoves it sideways (where two pieces meet, the car
  // sinking a pixel into the next one would otherwise stop it dead)
  const top = { solid: SOLBOT };
  b.pic('leafUp', leafUp(false), solid)
    .pic('leafTip', leafUp(true), solid)
    .pic('leafTipDim', leafUp(true, false), solid)
    .pic('leafFall', leafFall())
    .pic('deck', deck(), top)
    .pic('deckWarn', deck(true), top);
  if (!b.mb.has('zap1')) b.pic('zap1', zap(0)).pic('zap2', zap(1));
}

/** Names of the leaf's pieces, bottom (honk it) to tip: place them up column x from row 39. */
export const leafPieces = (name: string) => Array.from({ length: SPAN }, (_, k) => `${name}${k}`);

/**
 * Adds drawbridge `name`. Place `leafPieces(name)` in the gap's first column, rows 39 up to
 * 36. With `life`, the deck stays down that many ticks (blinking for the last second) and
 * then stands back up.
 */
export function drawbridge(b: Bestiary, name: string, life?: number): void {
  pics(b);
  const leaf = (k: number): [string, number][] =>
    k < SPAN - 1
      ? [['leafUp', 50]]
      : [
          ['leafTip', 9],
          ['leafTipDim', 9],
        ];
  const deckPics: [string, number][] = life
    ? [
        ['deck', 1],
        ['deck', life - 24],
        ['deckWarn', 4],
        ['deck', 4],
        ['deckWarn', 4],
        ['deck', 3],
        ['deckWarn', 8],
      ]
    : [['deck', 50]];
  for (let k = 0; k < SPAN; k++) {
    // the bottom piece gives way to the honk, the others to the spark
    b.add(`${name}${k}`, { pics: leaf(k), power: k ? BRIDGE - 1 : POWER.honk - 1, becomes: k ? `${name}Fall${k}` : `${name}Zap`, upscore: k ? 0 : 50 });
    if (k)
      b.add(`${name}Fall${k}`, {
        pics: [['leafFall', 50]],
        power: BRIDGE,
        path: [
          [0, 0, 1],
          [k, k + 1, Math.ceil(((k + 1) * 20) / FALL)],
        ],
        end: -1,
        becomes: `${name}Deck${k}`,
      });
    b.add(`${name}Deck${k}`, { pics: deckPics, power: BRIDGE, end: life ?? 0, becomes: life ? `${name}Rise${k}` : undefined });
    if (life)
      b.add(`${name}Rise${k}`, {
        pics: [['leafFall', 50]],
        power: BRIDGE,
        path: [
          [0, 0, 1],
          [-k, -(k + 1), Math.ceil(((k + 1) * 20) / FALL)],
        ],
        end: -1,
        becomes: `${name}${k}`,
      });
  }
  // the spark: up the leaf to its tip, then down to the deck's first cell (where it lands)
  b.add(`${name}Zap`, {
    pics: [
      ['zap1', 1],
      ['zap2', 1],
    ],
    power: BRIDGE,
    path: [
      [0, 0, 9],
      [0, 1 - SPAN, 9],
      [0, 1, 9],
    ],
    end: -1,
    becomes: `${name}Deck0`,
  });
}
