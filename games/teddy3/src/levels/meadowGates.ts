// Firefly Meadow's three garden gates in a hedge across the road to THE CHEZ, and the seven signs
// each wears over it (the Face Dial's windows show the code of Gwinn's face: src/wheel/wheel.ts).
// Only the gate that wears that code opens; the other two look the same and stay shut, which
// costs nothing, so Teddy can also just try them. The blocks are built here, the map laid out here.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Tiles, LevelMap } from './level';
import { GATE_CODES, GATES } from '../wheel/wheel';
import { SYMBOLS } from '../wheel/symbols';
import { c } from '../blocks/tiles';
import { G } from './meadowTiles';
import { bandAt, wideSign } from './common';

/**
 * The tall hedge across the road, three blocks thick: from its top row down, each gate (a three
 * block passage, bottom to top: Honker's, Gwinn's, Doc Leo's) has its board of seven signs over
 * it, which is also the floor under the gate above. Two steps up to the upper gates stand
 * on the near side, and the signs that say what to do stand on the ground before them.
 */
export const GATE_WALL = {
  x0: 63,
  width: 3,
  top: 29,
  /** Each gate's row (the board is the row above it). */
  rows: [39, 37, 35],
  /** The steps up (a floor row and its columns), then the two notes' left columns. */
  steps: [
    { row: 38, x0: 60, x1: 62 },
    { row: 36, x0: 61, x1: 62 },
  ],
  notes: [58, 60],
};

/** A wooden garden gate three blocks wide, planks and a latch, set into the hedge. */
function gatePic(hedge: Pixels): Pixels {
  const p = new Pixels(60, 20);
  for (let k = 0; k < 3; k++) p.blit(hedge, k * 20, 0);
  p.rect(1, 1, 58, 19, c('wood', 3)).frame(1, 1, 58, 19, c('wood', 0));
  for (let x = 6; x < 58; x += 5) p.rect(x, 2, 1, 17, c('wood', 2));
  p.rect(2, 5, 56, 2, c('wood', 1)).rect(2, 14, 56, 2, c('wood', 1));
  p.rect(28, 9, 4, 3, c('yellow', 3)).frame(28, 9, 4, 3, c('wood', 0));
  return p;
}

/** A board three blocks wide on the hedge with seven signs in a row, window 1 on the left. */
function signPic(hedge: Pixels, code: string[]): Pixels {
  const p = new Pixels(60, 20);
  for (let k = 0; k < 3; k++) p.blit(hedge, k * 20, 0);
  p.rect(0, 2, 60, 16, c('wood', 3)).frame(0, 2, 60, 16, c('wood', 0));
  code.forEach((name, i) => {
    SYMBOLS[name].forEach((row, y) => [...row].forEach((ch, x) => ch === '#' && p.set(3 + i * 8 + x, 7 + y, c('ink', 0))));
  });
  return p;
}

/** A plank step up to the gates, over the lawn behind it. */
function stepPic(base: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  p.rect(0, 0, 20, 5, c('wood', 3)).frame(0, 0, 20, 5, c('wood', 0));
  p.rect(1, 1, 18, 1, c('wood', 4));
  p.rect(2, 5, 2, 4, c('wood', 1)).rect(16, 5, 2, 4, c('wood', 1));
  return p;
}

/** Adds the gates' blocks: the gate (shut, and the true one, open) and each gate's board. */
export function addGateBlocks(t: Tiles): void {
  const hedge = t.pic('hedge');
  const g = gatePic(hedge);
  GATES.faces.forEach((_, k) => {
    const s = signPic(hedge, GATE_CODES[k]);
    for (let b = 0; b < 3; b++) t.wall(`gateBoard${'ABC'[k]}${'xyz'[b]}`, s.crop(b * 20, 0, 20, 20));
  });
  for (const [b, side] of ['Hinge', 'Mid', 'Latch'].entries()) {
    t.wall(`gate${side}`, g.crop(b * 20, 0, 20, 20));
    t.air(`gateOpen${side}`, g.crop(b * 20, 0, 20, 20));
  }
  t.ledge('gateStep0', stepPic(t.pic('far')));
  t.ledge('gateStep1', stepPic(t.pic(`sky${bandAt(36, G)}`)));
  for (const [name, words] of [
    ['Gate', "GWINN'S\nFACE"],
    ['Try', 'SHUT GATE?\nTRY NEXT'],
  ]) {
    const [l, r] = wideSign(t.pic('lawn'), words);
    t.air(`sign${name}L`, l);
    t.air(`sign${name}R`, r);
  }
}

/** Lays the hedge, the three boards and the three gates (the true one open), and the steps up. */
export function layGates(m: LevelMap): void {
  const { x0, width, top, rows, steps, notes } = GATE_WALL;
  for (let x = x0; x < x0 + width; x++) {
    m.set(x, top, 'hedgeTop');
    for (let y = top + 1; y < 40; y++) m.set(x, y, 'hedge');
  }
  const [a, b] = notes;
  m.set(a, 39, 'signGateL')
    .set(a + 1, 39, 'signGateR')
    .set(b, 39, 'signTryL')
    .set(b + 1, 39, 'signTryR');
  steps.forEach((st, i) => {
    for (let x = st.x0; x <= st.x1; x++) m.set(x, st.row, `gateStep${i}`);
  });
  rows.forEach((row, k) => {
    for (let n = 0; n < 3; n++) {
      m.set(x0 + n, row - 1, `gateBoard${'ABC'[k]}${'xyz'[n]}`);
      m.set(x0 + n, row, `gate${k === GATES.open ? 'Open' : ''}${['Hinge', 'Mid', 'Latch'][n]}`);
    }
  });
}
