// Town scenery, fair decorations and clockwork for Lucky Cat.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { T, art, blank, onSky, skyTile, tri, type Pal } from './print';

/** A house wall with one lit window, its blind half down (solid: the hero walks in front of houses only as ground). */
export function windowBlock(pal: Pal): Pixels {
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
export function awning(pal: Pal, alt: boolean): Pixels {
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
export function lamp(pal: Pal, head: boolean): Pixels {
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
export function fence(pal: Pal): Pixels {
  const s = blank();
  for (const x of [2, 8, 14]) {
    s.rect(x, 6, 4, 14, pal.c('ink', 0));
    tri(s, [x, 6], [x + 4, 6], [x + 2, 2], pal.c('ink', 0));
  }
  s.rect(0, 9, 20, 2, pal.c('ink', 0)).rect(0, 16, 20, 2, pal.c('ink', 0));
  return onSky(pal, s);
}

/** The fair's tent: diagonal red and paper stripes, side 0 the left slope, 1 the right. */
export function tent(pal: Pal, side: 0 | 1): Pixels {
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
export function bunting(pal: Pal): Pixels {
  const s = blank();
  s.line(0, 2, 19, 2, pal.c('ink', 0));
  const inks = [pal.c('red', 2), pal.c('gold', 3), pal.c('paper', 4)];
  [1, 8, 15].forEach((x, i) => tri(s, [x, 3], [x + 5, 3], [x + 2.5, 9], inks[i]));
  return onSky(pal, s);
}

/** The tower's clock face, 40x40: paper dial, ink ticks, the hands at the top, and 13 where 12 should be. */
export function clockFace(pal: Pal): Pixels {
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
export function pip(pal: Pal, lit: boolean): Pixels {
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
export function fairGate(pal: Pal, shut: boolean): Pixels {
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
