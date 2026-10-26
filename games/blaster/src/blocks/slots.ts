// Stage 1's side leg, "Expansion Slots", seen from the side (its own palette, s1s.pal):
// the motherboard edge-on underfoot, the steel drive cage overhead, and the dark inside of
// the case behind, with its vent slots and the cards of the far slots dim in the distance.
// In the way: expansion cards standing up in their black slots, tall capacitors, and the
// gray IDE cable hanging down from the drive cage.
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, bevel, blob, flipY, micro, shadeAt } from '../art/draw';
import type { Pal } from '../art/pal';
import { SOLID, addTerrain, type SideArt } from './sideTiles';

/** The ramps this leg adds to the motherboard's palette. */
export function slotsRamps(p: Pal): void {
  p.ramp('case', 6, [6, 8, 12], [92, 100, 116], [34, 38, 48]);
  p.ramp('ins', 6, [40, 42, 46], [220, 220, 214], [140, 142, 140]);
}

/** The dark inside of the case: brushed steel, a little lighter low down where the light falls. */
function caseWall(p: Pal, seed: number): Pixels {
  const r = rng(seed);
  return new Pixels(20, 20).map((x, y) => shadeAt(p.r('case'), 0, 2, 0.35 + ((x * 7 + y) % 5 === 0 ? 0.12 : 0) + r() * 0.1, x, y));
}

export function slotsArt(p: Pal): SideArt {
  const floor = (v: number) => {
    const t = caseWall(p, 40 + v);
    if (v === 1) {
      // a screw in the back wall
      blob(t, 9.5, 9.5, 2.5, 2.5, p.r('case'), 2, 5);
      t.line(8, 9, 11, 9, p.c('case', 1));
    }
    return t;
  };
  const face = (side: 'floor' | 'ceil') => (side === 'floor' ? boardTop(p) : flipY(cageBottom(p)));
  return { pal: p, floor, edge: (_s, v) => floor(v), floors: 2, edges: 1, face };
}

/** The motherboard edge-on: its green top with pads and tiny parts, the fiberglass below. */
function boardTop(p: Pal): Pixels {
  const t = boardSide(p);
  for (let x = 0; x < 20; x++) for (let y = 0; y < 5; y++) t.set(x, y, shadeAt(p.r('base'), 2, 5, 0.8 - y * 0.15, x, y));
  t.rect(0, 0, 20, 1, p.c('base', 6));
  // solder pads and a little resistor on the board's top
  t.rect(3, 0, 3, 1, p.c('trim', 5)).rect(13, 0, 3, 1, p.c('trim', 5));
  return t;
}

function boardSide(p: Pal): Pixels {
  return new Pixels(20, 20).map((x, y) => shadeAt(p.r('base'), 0, 2, 0.45 + ((x + y * 2) % 6 === 0 ? 0.2 : 0) - y * 0.01, x, y));
}

/** The drive cage's steel underside: panel, rivets and the lip at the bottom. */
function cagePanel(p: Pal): Pixels {
  const t = new Pixels(20, 20).map((x, y) => shadeAt(p.r('steel'), 1, 2, 0.5 + (x % 10 === 0 ? -0.3 : 0), x, y));
  t.set(5, 5, p.c('steel', 4)).set(15, 15, p.c('steel', 4));
  return t;
}

/** The cage's bottom edge, drawn upright (flipped to hang): the lip on top. */
function cageBottom(p: Pal): Pixels {
  const t = cagePanel(p);
  bevel(t, 0, 0, 20, 5, p.r('steel'), 3, 1);
  for (const x of [4, 14]) blob(t, x + 0.5, 2.5, 1.5, 1.5, p.r('steel'), 3, 6);
  return t;
}

/** The leg's own blocks: terrain, the things in the way, and scenery. */
export function slotsBlocks(bs: BlockSet, a: SideArt): void {
  const p = a.pal;
  const back = a.floor(0);
  addTerrain(bs, back, { cIn: cagePanel(p), cBot: flipY(cageBottom(p)), fIn: boardSide(p), fTop: boardTop(p) }, p.c('base', 6));

  // an expansion card, edge-on in its slot: the slot, the board standing in it, its top edge
  const card = (part: 'B' | 'M' | 'T', k: number) => {
    const t = back.crop(0, 0, 20, 20);
    // the green board, edge-on, with a copper layer showing down the middle
    for (let y = 0; y < 20; y++) for (let x = 5; x < 13; x++) t.set(x, y, shadeAt(p.r('base'), 1, 5, 0.85 - (x - 5) / 9, x, y));
    t.rect(8, 0, 1, 20, p.c('trim', 3)).rect(5, 0, 1, 20, p.c('base', 6)).rect(12, 0, 1, 20, p.c('base', 0));
    // chips on its face, seen edge-on as black bumps with their legs
    if (part === 'M') {
      bevel(t, 13, 2 + k * 6, 5, 12, p.r('deep'), 2, 1);
      for (let y = 3 + k * 6; y < 13 + k * 6; y += 2) t.set(13, y, p.c('steel', 5));
    }
    if (part === 'T') {
      // the steel bracket that screws it to the case
      t.rect(3, 0, 12, 3, p.c('steel', 5)).rect(3, 0, 12, 1, p.c('steel', 6)).rect(3, 3, 2, 6, p.c('steel', 3));
      t.rect(5, 3, 8, 1, p.c('base', 0));
    }
    if (part === 'B') {
      // gold edge fingers down into the black slot
      for (let x = 5; x < 13; x += 2) t.rect(x, 4, 1, 4, p.c('trim', 5));
      bevel(t, 2, 8, 16, 12, p.r('deep'), 1, 1);
      t.rect(5, 8, 8, 2, p.c('ink', 0));
    }
    return t;
  };
  bs.add('cardB', card('B', 0), { solid: SOLID });
  bs.add('cardM0', card('M', 0), { solid: SOLID });
  bs.add('cardM1', card('M', 1), { solid: SOLID });
  bs.add('cardT', card('T', 0), { solid: SOLID });

  // a tall capacitor standing on the board: a can, its sleeve and the vent on top
  const cap = new Pixels(20, 40);
  cap.blit(back, 0, 0).blit(back, 0, 20);
  for (let y = 4; y < 40; y++) for (let x = 3; x < 17; x++) cap.set(x, y, shadeAt(p.r('label'), 0, 4, 0.9 - Math.abs(x - 7) / 9, x, y));
  cap.rect(3, 4, 14, 2, p.c('steel', 5)).rect(5, 2, 10, 2, p.c('steel', 4));
  for (let y = 12; y < 36; y += 2) cap.set(5, y, p.c('gray', 7));
  micro(cap, 8, 14, '470', p.c('gray', 7));
  bs.add('cap00', cap.crop(0, 0, 20, 20), { solid: SOLID });
  bs.add('cap10', cap.crop(0, 20, 20, 20), { solid: SOLID });

  // the IDE cable from the drive cage, hanging in a loop: gray wires, the red one on the edge
  const rib = (end: boolean) => {
    const t = back.crop(0, 0, 20, 20);
    const h = end ? 12 : 20;
    for (let y = 0; y < h; y++) for (let x = 4; x < 16; x++) t.set(x, y, x === 4 ? p.c('red', 2) : (x & 1) === 0 ? p.c('ins', 2) : p.c('ins', 4));
    if (end) bevel(t, 3, 10, 14, 8, p.r('deep'), 1, 1);
    return t;
  };
  bs.add('ribM', rib(false), { solid: SOLID });
  bs.add('ribE', rib(true), { solid: SOLID });

  // scenery far off in the dark: cards in the far slots, a row of vents
  const far = new Pixels(20, 80);
  for (let r = 0; r < 4; r++) far.blit(back, 0, r * 20);
  far.rect(8, 6, 4, 74, p.c('case', 3)).rect(8, 6, 1, 74, p.c('case', 4));
  for (let y = 16; y < 70; y += 18) far.rect(12, y, 2, 8, p.c('case', 2));
  far.rect(4, 70, 12, 10, p.c('case', 1));
  for (let r = 0; r < 4; r++) bs.add(`far${r}0`, far.crop(0, r * 20, 20, 20));
  const vent = new Pixels(40, 20);
  vent.blit(back, 0, 0).blit(back, 20, 0);
  for (const x of [3, 11, 19, 27]) vent.rect(x, 4, 5, 12, p.c('ink', 0)).rect(x, 15, 5, 1, p.c('case', 4));
  bs.add('vent00', vent.crop(0, 0, 20, 20));
  bs.add('vent01', vent.crop(20, 0, 20, 20));
}
