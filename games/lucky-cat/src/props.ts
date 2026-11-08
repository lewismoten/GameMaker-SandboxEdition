// LUCKY CAT's props: the town's superstitions cut in the game's white-line woodcut (print.ts), as 20x20 blocks on
// the night plate. `addProps` puts them in a level's block set under the names the levels use.
//   stepladder   stepTopL, stepTop, stepTopR (the beam, a paint can on it), stepL, stepR (the legs); a drop of
//                white paint hangs under it (bad luck, once)
//   crack        a heaved paving slab with a crack across it (bad luck, once)
//   crate        a shipping crate stenciled 13
//   mirror       a mirror wall in two cuts, a hand mirror (the key) and the gate it opens (no broken glass anywhere)
//   brolly       an open umbrella that floats up (an updraft: PULL.up), in three inks
//   salt         a salt shaker (the key) and a heap of spilled salt (the gate), with its arch
//   woodBox      a knock-on-wood box with a gold knocker, gone when touched
//   town         a lit window with its blind half down, awnings, a gas lamp, a fence, the fair's tent and bunting
//   clock        the tower's face, whose top number is 13
//   rascal       Rascal on his roof, and his pulley
//   chores       Rascal's morning: rope cleats he ties off, empty steps he leaves a saucer of cream on, the bins'
//                padlock (the Committee locks them for luck) and its key
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, LEDGE, type Book } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import { SILVER_KEYS } from '../../kit/starter/locks';
import { CHARMS, charmPicture } from './charms';
import { T, art, blank, cut, hatch, onSky, skyTile, tri, type Pal } from './print';
import { rascalStanding } from './rascal';

/** Hit points a bad-luck hazard takes, once. */
export const BAD_LUCK = -5;
/** Points a charm is worth: lucky 13. */
export const CHARM_POINTS = 13;
/** The counter the charms add to (counters 20 to 29 are free; 20 is the salt shaker's and the bin key's, 21 the mirror key's). */
export const CHARM_COUNTER = 22;
/** Points for each of Rascal's chores (a rope tied off, a saucer set out). */
export const CHORE_POINTS = 7;

const air = { grav: PULL.down };

/** The stepladder's leg: a slanted ink rail with paper rungs, `left` leaning one way. */
function stepLeg(pal: Pal, left: boolean): Pixels {
  const s = blank();
  for (let y = 0; y < 20; y++) {
    const x = left ? 3 + Math.floor(y / 5) : 14 - Math.floor(y / 5);
    s.rect(x, y, 3, 1, pal.c('ink', 0));
  }
  for (const y of [5, 14]) {
    const x0 = left ? 6 + Math.floor(y / 5) : 0;
    const x1 = left ? 20 : 14 - Math.floor(y / 5);
    s.rect(x0, y, x1 - x0, 2, pal.c('ink', 1));
  }
  return onSky(pal, s);
}

/** The stepladder's top: the hinge beam, with a can of white paint on its middle. */
function stepTop(pal: Pal, part: 'L' | 'M' | 'R'): Pixels {
  const s = blank();
  const x0 = part === 'L' ? 2 : 0;
  const x1 = part === 'R' ? 18 : 20;
  s.rect(x0, 8, x1 - x0, 8, pal.c('ink', 0));
  hatch(s, x0, 11, x1 - x0, 4, pal.c('ink', 2), 4);
  if (part === 'M') {
    s.rect(5, 1, 10, 7, pal.c('ink', 1)).rect(6, 2, 8, 5, pal.c('paper', 4)).rect(6, 2, 8, 1, pal.c('paper', 2));
    s.rect(3, 6, 3, 2, pal.c('paper', 4));
  }
  return onSky(pal, s);
}

/** A fat drop of white paint hanging under the beam, or the splat it leaves (touched once). */
function drip(pal: Pal, gone: boolean): Pixels {
  const s = blank();
  s.rect(0, 0, 20, 2, pal.c('ink', 0));
  if (!gone) {
    // a teardrop of paint about to let go: a point at the top, round at the bottom, a gap above it
    for (let y = 3; y < 10; y++) {
      const half = Math.floor((y - 3) / 1.5);
      s.rect(10 - half, y, half * 2 + 1, 1, pal.c('paper', 4));
    }
    s.disc(10, 13, 6.4, pal.c('paper', 4));
    s.rect(12, 14, 2, 2, pal.c('paper', 2)).rect(8, 9, 1, 3, pal.c('paper', 2));
  } else {
    s.rect(4, 17, 12, 2, pal.c('paper', 4)).rect(6, 16, 3, 1, pal.c('paper', 4)).rect(12, 16, 2, 1, pal.c('paper', 4));
  }
  return onSky(pal, s);
}

/** A paving slab heaved up with a crack across it, or the rubble once it's been stepped on. */
function crack(pal: Pal, dust: boolean): Pixels {
  if (dust)
    return onSky(
      pal,
      art(pal, [
        ...Array(15).fill('....................'),
        '....kk........kkk...',
        '..kkkkkk...kkkkkkk..',
        'kkkkkkkkkkkkkkkkkkkk',
        'KKKKKKKKKKKKKKKKKKKK',
        'KKKKKKKKKKKKKKKKKKKK',
      ]),
    );
  return onSky(
    pal,
    art(pal, [
      ...Array(6).fill('....................'),
      '..........nnnnnnnnnn',
      '..........nNNNnnnnnn',
      '..........nnnnnnnnnn',
      '.........pnnnnnnnnnn',
      '.........pnnnnnnnnnn',
      'kkkkkkkk.pnnnnnnnnnn',
      'kNNkkkkkp.nnnnnnnnnn',
      'kkkkkkkkp..nnnnnnnnn',
      'kkkkkkkkk.pnnnnnnnnn',
      'kkkkkkkk.pnnnnnnnnnn',
      'kkkkkkkk.pnnnnnnnnnn',
      'kkkkkkkkk.pnnnnnnnnn',
      'KKKKKKKKKK.pnnnnnnnn',
      'KKKKKKKKKKK.KKKKKKKK',
    ]),
  );
}

/** A shipping crate stenciled 13 (solid). */
function crate(pal: Pal): Pixels {
  return art(pal, [
    'pppppppppppppppppppp',
    'pKKKKKKKKKKKKKKKKKKp',
    'pKnnnnnnnnnnnnnnnnKp',
    'pKKKKKKKKKKKKKKKKKKp',
    'pKkkkkkkkkkkkkkkkkKp',
    'pKkkkkPkkPPPPkkkkkKp',
    'pKkkkPPkkkkkPkkkkkKp',
    'pKkkkkPkkkPPPkkkkkKp',
    'pKkkkkPkkkkkPkkkkkKp',
    'pKkkkPPPkPPPPkkkkkKp',
    'pKkkkkkkkkkkkkkkkkKp',
    'pKKKKKKKKKKKKKKKKKKp',
    'pKnnnnnnnnnnnnnnnnKp',
    'pKKKKKKKKKKKKKKKKKKp',
    'pKkkkkkkkkkkkkkkkkKp',
    'pKkkkkkkkkkkkkkkkkKp',
    'pKkkkkkkkkkkkkkkkkKp',
    'pKKKKKKKKKKKKKKKKKKp',
    'pKnnnnnnnnnnnnnnnnKp',
    'pppppppppppppppppppp',
  ]);
}

/** A mirror wall: an ink frame round a pane printed in the spot ink (silver in the funhouse), with two gleams. */
function mirrorWall(pal: Pal, variant: number): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('ink', 0));
  p.frame(1, 1, 18, 18, c('paper', 3));
  p.rect(3, 3, 14, 14, c('gold', 2));
  hatch(p, 3, 3, 14, 14, c('gold', 1), 4, -1);
  const dx = variant ? 3 : 0;
  p.line(5 + dx, 14, 9 + dx, 4, c('gold', 3)).line(7 + dx, 15, 12 + dx, 5, c('paper', 4));
  return p;
}

/** A hand mirror to carry: the mirror gate's key. */
function mirrorKey(pal: Pal): Pixels {
  return onSky(
    pal,
    art(pal, [
      '....................',
      '.......KKKKKK.......',
      '.....KKGGGGGGKK.....',
      '....KGGgggggGGGK....',
      '....KGgPPgggggGK....',
      '...KGggPPgggggggK...',
      '...KGgggPggggggGK...',
      '...KGggggggggggGK...',
      '....KGgggggggggK....',
      '....KGGgggggggGK....',
      '.....KKGGGGGGKK.....',
      '.......KKKKKK.......',
      '.........KK.........',
      '.........KK.........',
      '.........KK.........',
      '.........KK.........',
      '........KKKK........',
      '........KKKK........',
      '.........KK.........',
      '....................',
    ]),
  );
}

/** The mirror gate: a tall ink door with a spot-ink pane and a keyhole (solid; spends the hand mirror). */
function mirrorGate(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('ink', 0));
  p.rect(2, 0, 1, 20, c('paper', 3)).rect(17, 0, 1, 20, c('paper', 3));
  p.rect(5, 2, 10, 16, c('gold', 2)).line(6, 15, 11, 3, c('paper', 4));
  p.disc(10, 12, 1.6, c('ink', 0)).rect(10, 12, 1, 4, c('ink', 0));
  return p;
}

/** The arch above a gate: a ink lintel with a cut keystone. */
function archOf(pal: Pal): Pixels {
  const { c } = pal;
  const p = skyTile(pal);
  p.rect(0, 0, 20, 12, c('ink', 1)).rect(0, 11, 20, 1, c('paper', 3));
  p.rect(8, 0, 4, 12, c('ink', 0)).rect(7, 0, 1, 12, c('paper', 3)).rect(12, 0, 1, 12, c('paper', 3));
  hatch(p, 0, 1, 7, 9, c('ink', 2), 3);
  return p;
}

/** An open umbrella floating up: a ribbed canopy in `ink` and a hooked handle. */
function brolly(pal: Pal, canopy: [number, number]): Pixels {
  const [lit, dark] = canopy;
  const s = blank();
  for (let y = 2; y < 10; y++) {
    const half = Math.round(Math.sqrt(Math.max(0, 1 - ((10 - y) / 8) ** 2)) * 8.5);
    s.rect(10 - half, y, half * 2, 1, lit);
  }
  // scalloped hem and dark gores between the ribs
  for (const x of [2, 7, 12, 17]) s.rect(x, 9, 2, 1, T);
  for (const x of [5, 10, 15]) s.line(10, 2, x, 9, dark);
  s.rect(10, 1, 1, 1, pal.c('ink', 0));
  s.rect(10, 10, 1, 7, pal.c('ink', 0)).rect(8, 17, 1, 1, pal.c('ink', 0)).rect(8, 16, 1, 1, pal.c('ink', 0)).rect(9, 17, 1, 1, pal.c('ink', 0));
  return onSky(pal, s);
}

/** A salt shaker to carry: the key to the spilled salt. */
function shaker(pal: Pal): Pixels {
  return onSky(
    pal,
    art(pal, [
      '....................',
      '....................',
      '........KKKK........',
      '.......KnKnKK.......',
      '.......KKKKKK.......',
      '.......PPPPPP.......',
      '......PPPPPPqP......',
      '......PPPPPPqP......',
      '......PKKKKPqP......',
      '......PKPPPPqP......',
      '......PKKKKPqP......',
      '......PPPPKPqP......',
      '......PKKKKPqP......',
      '......PPPPPPqP......',
      '......qqqqqqqq......',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
    ]),
  );
}

/** A heap of spilled salt across the doorway (solid; a pinch from the shaker clears it). */
function saltPile(pal: Pal): Pixels {
  const p = skyTile(pal);
  const s = blank();
  for (let y = 0; y < 20; y++) {
    const half = Math.min(10, 3 + y);
    s.rect(10 - half, y, half * 2, 1, pal.c('paper', 4));
  }
  for (const [x, y] of [
    [7, 6],
    [12, 9],
    [5, 13],
    [14, 15],
    [9, 17],
  ])
    s.set(x, y, pal.c('paper', 2));
  return p.blit(cut(pal, s, 1), 0, 0, T);
}

/** A knock-on-wood box: pale grain, an ink frame and a gold knocker ring (solid; it opens when touched). */
function woodBox(pal: Pal): Pixels {
  return art(pal, [
    'KKKKKKKKKKKKKKKKKKKK',
    'KqqqqqqqqqqqqqqqqqqK',
    'KqQqqqqqqqqQQqqqqqqK',
    'KqqqqQQQqqqqqqqqQqqK',
    'KqqqqqqqqqqqqqqqqqqK',
    'KqqqqqqqKKKKqqqqqqqK',
    'KqqQqqqKGGGGKqqqqqqK',
    'KqqqqqKGKKKKGKqqqQqK',
    'KqqqqqKGKqqKGKqqqqqK',
    'KqqqqqKGKqqKGKqqqqqK',
    'KqqqqqKGKKKKGKqqqqqK',
    'KqqqqqqKGGGGKqqqqqqK',
    'KqqqqqqqKKKKqqqqqqqK',
    'KqqqqqqqqqqqqqqqQqqK',
    'KqqQQQqqqqqqqqqqqqqK',
    'KqqqqqqqqqqQQQqqqqqK',
    'KqqqqqqqqqqqqqqqqqqK',
    'KqqqqqQqqqqqqqqqqqqK',
    'KqqqqqqqqqqqqqqqqqqK',
    'KKKKKKKKKKKKKKKKKKKK',
  ]);
}

/** A house wall with one lit window, its blind half down (solid: the hero walks in front of houses only as ground). */
function windowBlock(pal: Pal): Pixels {
  return art(pal, [
    'kkkkkkkkkkkkkkkkkkkk',
    'knkkkkkkkkkkkkkkknkk',
    'kkkkpppppppppppkkkkk',
    'kkkkpPPPPPPPPPpkkkkk',
    'kkkkpPqPqPqPqPpkkkkk',
    'kkkkpPPPPPPPPPpkkkkk',
    'kkkkpPPPPPPPPPpkkkkk',
    'kkkkpPPPPPKPPPpkkkkk',
    'kkkkpGGGGGGGGGpkkkkk',
    'kkkkpGGGGGGGGGpkkkkk',
    'kkkkpGGgGGGGGGpkkkkk',
    'kkkkpGGGGGGGgGpkkkkk',
    'kkkkpGGGGGGGGGpkkkkk',
    'kkkkpgggggggggpkkkkk',
    'kkkpppppppppppppkkkk',
    'kkkKKKKKKKKKKKKKkkkk',
    'kkkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkknkkkkkkkk',
    'knkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkk',
  ]);
}

/** A striped shop awning to stand on (red and paper, a scalloped hem); `alt` starts on the other stripe. */
function awning(pal: Pal, alt: boolean): Pixels {
  const s = blank();
  for (let x = 0; x < 20; x++) {
    const red = Math.floor((x + (alt ? 5 : 0)) / 5) % 2 === 0;
    s.rect(x, 0, 1, 6, red ? pal.c('red', 2) : pal.c('paper', 4));
    const hem = (x + (alt ? 5 : 0)) % 5;
    if (hem > 0 && hem < 4) s.set(x, 6, red ? pal.c('red', 1) : pal.c('paper', 2));
  }
  s.rect(0, 0, 20, 1, pal.c('ink', 0));
  return skyTile(pal).blit(s, 0, 0, T);
}

/** A gas lamp: the lantern with a gold flame, or a length of its ink post. */
function lamp(pal: Pal, head: boolean): Pixels {
  if (!head) {
    const s = blank();
    s.rect(8, 0, 4, 20, pal.c('ink', 0)).rect(6, 17, 8, 3, pal.c('ink', 0));
    return onSky(pal, s);
  }
  return onSky(
    pal,
    art(pal, [
      '....................',
      '.........KK.........',
      '........KKKK........',
      '......KKKKKKKK......',
      '.....KKKKKKKKKK.....',
      '......KGGGGGGK......',
      '......KGgPPgGK......',
      '......KGgPPgGK......',
      '......KGggggGK......',
      '......KGGGGGGK......',
      '......KKKKKKKK......',
      '.......KKKKKK.......',
      '........KKKK........',
      '........KKKK........',
      '........KKKK........',
      '........KKKK........',
      '........KKKK........',
      '........KKKK........',
      '........KKKK........',
      '........KKKK........',
    ]),
  );
}

/** A picket fence, cut in ink. */
function fence(pal: Pal): Pixels {
  const s = blank();
  for (const x of [2, 8, 14]) {
    s.rect(x, 6, 4, 14, pal.c('ink', 0));
    tri(s, [x, 6], [x + 4, 6], [x + 2, 2], pal.c('ink', 0));
  }
  s.rect(0, 9, 20, 2, pal.c('ink', 0)).rect(0, 16, 20, 2, pal.c('ink', 0));
  return onSky(pal, s);
}

/** The fair's tent: diagonal red and paper stripes, side 0 the left slope, 1 the right. */
function tent(pal: Pal, side: 0 | 1): Pixels {
  const s = blank();
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const inside = side === 0 ? x >= 19 - y : x <= y;
      if (!inside) continue;
      const band = Math.floor((side === 0 ? x : 19 - x) / 4) % 2;
      s.set(x, y, band ? pal.c('red', 2) : pal.c('paper', 4));
    }
  return onSky(pal, s);
}

/** A string of pennants: red, gold and paper. */
function bunting(pal: Pal): Pixels {
  const s = blank();
  s.line(0, 2, 19, 2, pal.c('ink', 0));
  const inks = [pal.c('red', 2), pal.c('gold', 3), pal.c('paper', 4)];
  [1, 8, 15].forEach((x, i) => tri(s, [x, 3], [x + 5, 3], [x + 2.5, 9], inks[i]));
  return onSky(pal, s);
}

/** The tower's clock face, 40x40: paper dial, ink ticks, the hands at the top, and 13 where 12 should be. */
function clockFace(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(40, 40, c('ink', 0));
  p.disc(19.5, 19.5, 18, c('paper', 3)).disc(19.5, 19.5, 16.5, c('paper', 4));
  for (let k = 0; k < 12; k++) {
    if (k === 0) continue;
    const a = (k / 12) * Math.PI * 2;
    const x = Math.round(19.5 + Math.sin(a) * 14);
    const y = Math.round(19.5 - Math.cos(a) * 14);
    p.rect(x - 1, y - 1, 2, 2, c('ink', 0));
  }
  // "13" at the top, three by five digits
  p.draw(15, 3, ['.K.KKK', 'KK...K', '.K.KKK', '.K...K', 'KKKKKK'], { K: c('ink', 0) });
  p.rect(19, 10, 2, 10, c('ink', 0)).rect(20, 12, 1, 8, c('ink', 1));
  p.line(19, 20, 25, 13, c('red', 1));
  p.disc(19.5, 19.5, 2, c('gold', 3));
  return p;
}

/** A bell for the chime meter, lit gold or gone dark. */
function pip(pal: Pal, lit: boolean): Pixels {
  const { c } = pal;
  const s = blank();
  const body = lit ? c('gold', 3) : c('ink', 2);
  const shade = lit ? c('gold', 1) : c('ink', 1);
  s.rect(9, 1, 2, 2, c('ink', 0));
  for (let y = 3; y < 14; y++) {
    const half = 3 + Math.floor((y - 3) / 3);
    s.rect(10 - half, y, half * 2, 1, body);
    s.rect(10 + half - 2, y, 2, 1, shade);
  }
  s.rect(3, 14, 14, 2, body);
  s.disc(10, 17, 1.6, lit ? c('gold', 2) : c('ink', 0));
  if (lit) s.rect(7, 5, 1, 4, c('paper', 4));
  return onSky(pal, s);
}

/** The fair's gate: open (two striped posts with a gold rope between) or shut (a solid ink gate). */
function fairGate(pal: Pal, shut: boolean): Pixels {
  const { c } = pal;
  if (!shut) {
    const s = blank();
    for (const x0 of [0, 16]) for (let y = 0; y < 20; y++) s.rect(x0, y, 4, 1, (y + (x0 ? 3 : 0)) % 6 < 3 ? c('red', 2) : c('paper', 4));
    s.rect(4, 1, 12, 1, c('gold', 3)).set(10, 2, c('gold', 3));
    return onSky(pal, s);
  }
  const p = new Pixels(20, 20, c('ink', 0));
  for (let x = 1; x < 20; x += 5) p.rect(x, 0, 3, 20, c('ink', 1));
  p.rect(0, 4, 20, 2, c('paper', 3)).rect(0, 14, 20, 2, c('paper', 3));
  p.disc(10, 10, 2.5, c('gold', 3)).rect(9, 10, 2, 3, c('gold', 2));
  return p;
}

/** Rascal's pulley: a wheel on a beam with a rope over it. */
function pulley(pal: Pal): Pixels {
  const { c } = pal;
  const s = blank();
  s.rect(0, 1, 20, 3, c('ink', 0));
  s.rect(9, 4, 2, 2, c('ink', 0));
  s.disc(10, 10, 5, c('ink', 0)).ring(10, 10, 3, c('smoke', 2)).disc(10, 10, 1, c('gold', 3));
  s.rect(4, 10, 1, 10, c('paper', 2)).rect(15, 10, 1, 7, c('paper', 2));
  return onSky(pal, s);
}

/** A squat iron bollard: a loose coil of rope beside it (a chore waiting), or the rope wound tight round it. */
function cleat(pal: Pal, tied: boolean): Pixels {
  const s = blank();
  const ink = pal.c('ink', 0);
  s.rect(7, 10, 6, 10, ink).rect(6, 9, 8, 2, ink).rect(7, 8, 6, 1, ink).rect(5, 18, 10, 2, ink);
  s.rect(8, 11, 1, 6, pal.c('ink', 2));
  const rope = pal.c('gold', 3);
  if (tied) for (const y of [12, 14, 16]) s.rect(6, y, 8, 1, rope).set(13, y + 1, pal.c('gold', 1));
  else {
    s.ring(16, 16, 2.5, rope).ring(16, 16, 1.2, pal.c('gold', 1));
    s.line(13, 16, 13, 12, rope);
  }
  return onSky(pal, s);
}

/** A doorstep: bare (a chore waiting) or with a saucer of cream on it (a trap for a certain cat). */
function step(pal: Pal, saucer: boolean): Pixels {
  const s = blank();
  s.rect(0, 16, 20, 4, pal.c('ink', 1)).rect(0, 16, 20, 1, pal.c('paper', 2));
  if (saucer) s.rect(4, 13, 12, 3, pal.c('paper', 4)).rect(6, 12, 8, 1, pal.c('paper', 2)).rect(5, 15, 10, 1, pal.c('paper', 2));
  else s.rect(8, 14, 4, 2, pal.c('ink', 2));
  return onSky(pal, s);
}

/** The bins' padlock (solid; the key opens it) and the key on its string. */
function padlock(pal: Pal): Pixels {
  return art(pal, [
    'kkkkkkkkkkkkkkkkkkkk',
    'knkkkkkkkkkkkkkkknkk',
    'kkkkkkkKKKKKkkkkkkkk',
    'kkkkkkKkkkkkKkkkkkkk',
    'kkkkkKkkkkkkkKkkkkkk',
    'kkkkkKkkkkkkkKkkkkkk',
    'kkkkkKkkkkkkkKkkkkkk',
    'kkkkGGGGGGGGGGGkkkkk',
    'kkkkGGgggggggGGkkkkk',
    'kkkkGgggKKKgggGkkkkk',
    'kkkkGgggKKKgggGkkkkk',
    'kkkkGggggKggggGkkkkk',
    'kkkkGggggKggggGkkkkk',
    'kkkkGgggggggggGkkkkk',
    'kkkkGGGGGGGGGGGkkkkk',
    'kkkkkkkkkkkkkkkkkkkk',
    'pppppppppppppppppppp',
    'kkkkkkkkkkkkkkkkkkkk',
    'knkkkkkkkkkkkkknkkkk',
    'kkkkkkkkkkkkkkkkkkkk',
  ]);
}

function binKey(pal: Pal): Pixels {
  return onSky(
    pal,
    art(pal, [
      '....................',
      '....................',
      '........GGGG........',
      '.......GgKKgG.......',
      '.......GK..KG.......',
      '.......GgKKgG.......',
      '........GGGG........',
      '.........GG.........',
      '.........GG.........',
      '.........GG.........',
      '.........GGGG.......',
      '.........GG.........',
      '.........GGG........',
      '.........GG.........',
      '....................',
      ...Array(5).fill('....................'),
    ]),
  );
}

/** A trash can, lid on: the Committee chains them shut on Friday the 13th. */
function bin(pal: Pal, top: boolean): Pixels {
  const s = blank();
  if (top) {
    s.rect(3, 12, 14, 3, pal.c('smoke', 1)).rect(8, 10, 4, 2, pal.c('smoke', 1));
    s.rect(4, 15, 12, 5, pal.c('smoke', 0));
  } else {
    s.rect(4, 0, 12, 20, pal.c('smoke', 0));
    for (const x of [6, 10, 14]) s.rect(x, 2, 1, 16, pal.c('smoke', 1));
    s.rect(3, 6, 14, 2, pal.c('ink', 0)).rect(3, 6, 14, 1, pal.c('gold', 1));
  }
  return onSky(pal, s);
}

export interface PropOptions {
  charms?: readonly (typeof CHARMS)[number][];
}

/** Adds the props a level asks for by group (blocks are precious), then its charms. */
export function addProps(book: Book, pal: Pal, groups: readonly string[], o: PropOptions = {}): void {
  const has = (g: string) => groups.includes(g);
  if (has('stepladder')) {
    book.add('stepTopL', stepTop(pal, 'L'), { solid: SOLID });
    book.add('stepTop', stepTop(pal, 'M'), { solid: SOLID });
    book.add('stepTopR', stepTop(pal, 'R'), { solid: SOLID });
    book.add('stepL', stepLeg(pal, true), air);
    book.add('stepR', stepLeg(pal, false), air);
    book.add('drip', drip(pal, false), { ...air, hp: BAD_LUCK, touch: 'dripGone' });
    book.add('dripGone', drip(pal, true), air);
  }
  if (has('crack')) {
    book.add('crack', crack(pal, false), { ...air, hp: BAD_LUCK, touch: 'crackDust' });
    book.add('crackDust', crack(pal, true), air);
  }
  if (has('crate')) book.add('crate', crate(pal), { solid: SOLID });
  if (has('mirror')) {
    book.add('mirrorWall', mirrorWall(pal, 0), { solid: SOLID });
    book.add('mirrorWall2', mirrorWall(pal, 1), { solid: SOLID });
    book.add('mirrorKey', mirrorKey(pal), { ...air, score: 25, effect: SILVER_KEYS, eamt: 1, touch: 'sky' });
    book.add('mirrorGate', mirrorGate(pal), { solid: SOLID, effect: SILVER_KEYS, eamt: -1, touch: 'sky' });
    book.add('mirrorArch', archOf(pal), air);
  }
  if (has('brolly')) {
    const { c } = pal;
    for (const [n, canopy] of [
      ['brollyRed', [c('red', 2), c('red', 1)]],
      ['brollyGold', [c('gold', 3), c('gold', 1)]],
      ['brollyTeal', [c('paper', 4), c('paper', 1)]],
    ] as const)
      book.add(n, brolly(pal, canopy as unknown as [number, number]), { grav: PULL.up });
  }
  if (has('salt')) {
    book.add('shaker', shaker(pal), { ...air, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
    book.add('saltPile', saltPile(pal), { solid: SOLID, effect: KEYS, eamt: -1, touch: 'sky' });
    book.add('saltArch', archOf(pal), air);
  }
  if (has('wood')) {
    book.add('woodBox', woodBox(pal), { solid: SOLID, score: 5, touch: 'sky' });
  }
  if (has('town')) {
    book.add('window', windowBlock(pal), { solid: SOLID });
    book.add('awning', awning(pal, false), { solid: LEDGE, grav: PULL.down });
    book.add('awning2', awning(pal, true), { solid: LEDGE, grav: PULL.down });
    book.add('lampHead', lamp(pal, true), air);
    book.add('lampPost', lamp(pal, false), air);
    book.add('fence', fence(pal), air);
    book.add('tentL', tent(pal, 0), air);
    book.add('tentR', tent(pal, 1), air);
    book.add('bunting', bunting(pal), air);
  }
  if (has('clock')) {
    const face = clockFace(pal);
    book.add('clockTL', face.crop(0, 0, 20, 20), { solid: SOLID });
    book.add('clockTR', face.crop(20, 0, 20, 20), { solid: SOLID });
    book.add('clockBL', face.crop(0, 20, 20, 20), { solid: SOLID });
    book.add('clockBR', face.crop(20, 20, 20, 20), { solid: SOLID });
  }
  if (has('rascal')) {
    const r = rascalStanding(pal);
    book.add('rascalTop', skyTile(pal).blit(cut(pal, r.top), 0, 0, T), air);
    book.add('rascalBottom', skyTile(pal).blit(cut(pal, r.bottom), 0, 0, T), air);
    book.add('pulley', pulley(pal), air);
  }
  if (has('chores')) {
    book.add('cleat', cleat(pal, false), { ...air, score: CHORE_POINTS, touch: 'cleatTied' });
    book.add('cleatTied', cleat(pal, true), air);
    book.add('step', step(pal, false), { ...air, score: CHORE_POINTS, touch: 'saucer' });
    book.add('saucer', step(pal, true), air);
    book.add('binKey', binKey(pal), { ...air, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
    book.add('padlock', padlock(pal), { solid: SOLID, effect: KEYS, eamt: -1, touch: 'sky' });
    book.add('binTop', bin(pal, true), air);
    book.add('bin', bin(pal, false), air);
  }
  for (const name of o.charms ?? []) {
    book.add(`charm.${name}`, charmPicture(pal, name), { ...air, score: CHARM_POINTS, effect: CHARM_COUNTER, eamt: 1, touch: 'sky' });
  }
}

export { pip, fairGate };
