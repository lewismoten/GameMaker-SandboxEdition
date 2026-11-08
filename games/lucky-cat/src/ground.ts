// The town's ground and walls, cut in LUCKY CAT's white-line woodcut (print.ts), under the block names the kit's map
// letters use (kit/starter/map.ts), so a level's rows read the same: ' ' the night plate, G the curb, D the ink earth
// under it, B brick, = a plank, H a ladder, ( ) a carved cloud, b a thistle, f a milk bottle on the step, s S the way
// in, e E the red door out, X a stone pillar at the end of the street.
import { PULL, SOLID, LEDGE, type Book } from '../../kit/starter/book';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { T, art, blank, cut, hatch, onSky, skyTile, type Pal } from './print';

const air = { grav: PULL.down };

/** The curb: a lit cut along the top, a row of curbstones, then cobbles set in ink. */
function curb(pal: Pal): Pixels {
  return art(pal, [
    'pppppppppppppppppppp',
    'nnnnnnnnnnnpnnnnnnnn',
    'nNNNNnnnnnnpnNNNnnnn',
    'nnnnnnnnnnnpnnnnnnnn',
    'kkkkkkkkkkkpkkkkkkkk',
    'qqqqqqqqqqqqqqqqqqqq',
    'KkkkkkQKkkkkkkQKkkkk',
    'KknNkkQKknkkkkQKkNnk',
    'KkkkkkQKkkkkkkQKkkkk',
    'QQQQQQQQQQQQQQQQQQQQ',
    'kkkQKkkkkkkkQKkkkkkk',
    'knkQKkkNnkkkQKknkkkk',
    'kkkQKkkkkkkkQKkkkkkk',
    'QQQQQQQQQQQQQQQQQQQQ',
    'KkkkkkkkQKkkkkkkkkQK',
    'KkNnkkkkQKkknkkkkkQK',
    'KkkkkkkkQKkkkkkkkkQK',
    'KKKKKKKKKKKKKKKKKKKK',
    'KKKKKKKKKKKKKKKKKKKK',
    'KKKKKKKKKKKKKKKKKKKK',
  ]);
}

/** The ink earth under the street: almost solid black, with a few gouge chips. */
function earth(pal: Pal): Pixels {
  const p = new Pixels(20, 20, pal.c('ink', 0));
  for (const [x, y, w] of [
    [3, 4, 3],
    [13, 9, 2],
    [7, 15, 3],
    [16, 17, 2],
  ])
    p.rect(x, y, w, 1, pal.c('ink', 2));
  return p;
}

/** Brick: ink bricks parted by paper mortar, each with a carved gleam on its top edge. */
function brick(pal: Pal): Pixels {
  const p = new Pixels(20, 20, pal.c('paper', 1));
  for (let row = 0; row < 4; row++) {
    const y = row * 5;
    const shift = row % 2 ? 5 : 0;
    for (let x = -10 + shift; x < 20; x += 10) {
      p.rect(Math.max(0, x), y, Math.min(9, x + 9) - Math.max(0, x), 4, pal.c('ink', 1));
      for (let k = 1; k < 4; k++) if (x + k >= 0 && x + k < 20) p.set(x + k, y, pal.c('ink', 3));
    }
  }
  return p;
}

/** The pillar at each end of the street: dressed stones, cut apart, with a hatched shadow side. */
function pillar(pal: Pal): Pixels {
  const p = new Pixels(20, 20, pal.c('paper', 2));
  for (let row = 0; row < 2; row++) {
    const y = row * 10;
    p.rect(1, y + 1, 18, 8, pal.c('ink', 1));
    hatch(p, 13, y + 2, 5, 6, pal.c('ink', 0), 2);
    p.rect(2, y + 2, 6, 1, pal.c('ink', 3));
  }
  return p;
}

/** A plank to stand on: pale wood with ink grain; the night shows under it. */
function plank(pal: Pal): Pixels {
  const s = art(pal, ['qqqqqqqqqqqqqqqqqqqq', 'qqqKqqqqqqqqqKKqqqqq', 'qqqqqKKKqqqqqqqqqqKq', 'QQQQQQQQQQQQQQQQQQQQ', 'kkkkkkkkkkkkkkkkkkkk']);
  const p = skyTile(pal);
  return p.blit(cut(pal, s), 0, 0, T);
}

/** A ladder: two ink rails and paper rungs. */
function ladder(pal: Pal): Pixels {
  const s = blank();
  s.rect(4, 0, 2, 20, pal.c('ink', 0)).rect(14, 0, 2, 20, pal.c('ink', 0));
  for (const y of [3, 8, 13, 18]) s.rect(6, y, 8, 2, pal.c('paper', 2)).rect(6, y + 1, 8, 1, pal.c('paper', 0));
  const p = skyTile(pal);
  p.rect(3, 0, 1, 20, pal.c('paper', 3)).rect(6, 0, 1, 20, pal.c('paper', 3));
  p.rect(13, 0, 1, 20, pal.c('paper', 3)).rect(16, 0, 1, 20, pal.c('paper', 3));
  return p.blit(s, 0, 0, T);
}

/** A thistle by the curb: spiky leaves and a gold-tipped head, all one cut shape. */
function thistle(pal: Pal): Pixels {
  return onSky(
    pal,
    art(pal, [
      '....................',
      '....................',
      '....................',
      '........G.G.........',
      '.......GgGgG........',
      '........KKK.........',
      '.......KKKKK........',
      '........KKK.........',
      '.........K..........',
      '.....K...K...K......',
      '......K..K..K.......',
      '.......K.K.K........',
      '...KK...KKK...KK....',
      '.....KK.KKK.KK......',
      '.......KKKKK........',
      '..KKK...KKK...KKK...',
      '....KKK.KKK.KKK.....',
      '......KKKKKKK.......',
      '.......KKKKK........',
      '........KKK.........',
    ]),
  );
}

/** A milk bottle left on the step (no one in Fennel Hollow will take it in today). */
function bottle(pal: Pal): Pixels {
  return onSky(
    pal,
    art(pal, [
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '........RRR.........',
      '........PPP.........',
      '........PpP.........',
      '.......PPPpP........',
      '......PPPPPpP.......',
      '......PPPPPpP.......',
      '......PPPPPpP.......',
      '......PPPPPpP.......',
      '......pppppqp.......',
      '......pppppqp.......',
      '......pppppqp.......',
      '......qqqqqqq.......',
      '....................',
      '....................',
    ]),
  );
}

/** The door out: red, with a gold crescent window and knob, in an ink frame (40 high: top and bottom). */
function door(pal: Pal): Pixels {
  const { c } = pal;
  const s = new Pixels(20, 40, T);
  s.rect(2, 2, 16, 38, c('ink', 0));
  s.rect(4, 4, 12, 36, c('red', 1));
  s.rect(5, 5, 10, 34, c('red', 2));
  // panels, cut in
  s.frame(6, 14, 8, 10, c('red', 1)).frame(6, 27, 8, 10, c('red', 1));
  // the crescent window
  s.disc(10, 9, 3.2, c('gold', 3));
  s.disc(11.5, 8.2, 2.6, c('red', 2));
  s.disc(14, 25, 1.2, c('gold', 3));
  const p = new Pixels(20, 40, c('sky', 1));
  p.blit(skyTile(pal), 0, 0).blit(skyTile(pal), 0, 20);
  return p.blit(cut(pal, s), 0, 0, T);
}

/** The way in: a dark arch cut into the plate. */
function archway(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 40, T);
  p.blit(skyTile(pal), 0, 0).blit(skyTile(pal), 0, 20);
  p.disc(10, 10, 8, c('paper', 3)).rect(2, 10, 16, 30, c('paper', 3));
  p.disc(10, 10, 7, c('ink', 0)).rect(3, 10, 14, 30, c('ink', 0));
  hatch(p, 3, 12, 14, 28, c('ink', 1), 4, -1);
  return p;
}

/** A carved cloud: a woodblock swirl, two blocks wide. */
function cloud(pal: Pal): Pixels {
  const { c } = pal;
  const s = new Pixels(40, 20, T);
  s.disc(12, 12, 6, c('sky', 3)).disc(22, 9, 7, c('sky', 3)).disc(31, 12, 5, c('sky', 3)).rect(8, 12, 28, 5, c('sky', 3));
  s.ring(12, 12, 3, c('sky', 1)).ring(22, 9, 4, c('sky', 1));
  s.rect(12, 12, 1, 1, c('sky', 3));
  const p = new Pixels(40, 20, c('sky', 1));
  p.blit(skyTile(pal), 0, 0).blit(skyTile(pal), 20, 0);
  return p.blit(cut(pal, s, 1), 0, 0, T);
}

/** Adds the ground, walls and fittings every level uses. */
export function addGround(book: Book, pal: Pal): void {
  book.add('sky', skyTile(pal), air);
  book.add('edge', pillar(pal), { ...air, solid: SOLID });
  const cl = cloud(pal);
  book.add('cloudL', cl.crop(0, 0, 20, 20), air);
  book.add('cloudR', cl.crop(20, 0, 20, 20), air);
  book.add('grass', curb(pal), { solid: SOLID });
  book.add('dirt', earth(pal), { solid: SOLID });
  book.add('brick', brick(pal), { solid: SOLID });
  book.add('plank', plank(pal), { solid: LEDGE, grav: PULL.down });
  book.add('bush', thistle(pal), air);
  book.add('flower', bottle(pal), air);
  book.add('ladder', ladder(pal), { grav: PULL.none });
  const d = door(pal);
  book.add('doorTop', d.crop(0, 0, 20, 20), air);
  book.add('doorBottom', d.crop(0, 20, 20, 20), air);
  const a = archway(pal);
  book.add('doorwayTop', a.crop(0, 0, 20, 20), air);
  book.add('doorwayBottom', a.crop(0, 20, 20, 20), air);
}
