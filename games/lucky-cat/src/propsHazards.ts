// Ladders, paint, cracked paving and other superstition props for Lucky Cat.
import { type Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { T, art, blank, hatch, onSky, type Pal } from './print';

/** The stepladder's leg: a slanted ink rail with paper rungs, `left` leaning one way. */
export function stepLeg(pal: Pal, left: boolean): Pixels {
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
export function stepTop(pal: Pal, part: 'L' | 'M' | 'R'): Pixels {
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
export function drip(pal: Pal, gone: boolean): Pixels {
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
export function crack(pal: Pal, dust: boolean): Pixels {
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
export function crate(pal: Pal): Pixels {
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

/** An open umbrella floating up: a ribbed canopy in `ink` and a hooked handle. */
export function brolly(pal: Pal, canopy: [number, number]): Pixels {
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

/** A knock-on-wood box: pale grain, an ink frame and a gold knocker ring (solid; it opens when touched). */
export function woodBox(pal: Pal): Pixels {
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
