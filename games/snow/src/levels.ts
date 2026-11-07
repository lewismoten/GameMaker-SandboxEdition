// Two small snowy walks. All motion is DOS block animation; touch changes only the visited map cell.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { addSign } from '../../kit/starter/sign';

export interface Level {
  file: string;
  title: string;
  hint: string;
  book: Book;
  map: StarterMap;
}

export const GROUND = 10;
const WIDTH = 27;

/** Snow and cold blue shadows, retaining the Starter's purple text-page color and hero ramps. */
function snowPalette(): Pal {
  const pal = buildStarterPalette(undefined, 'snow');
  const set = (ramp: string, colors: number[][]) => colors.forEach((rgb, i) => rgb.forEach((v, k) => (pal.pal[pal.c(ramp, i) * 3 + k] = v >> 2)));
  set('sky', [
    [30, 44, 76],
    [40, 58, 90],
    [50, 70, 104],
    [60, 82, 116],
    [86, 112, 146],
    [126, 152, 178],
  ]);
  set('grass', [
    [100, 132, 164],
    [132, 164, 188],
    [168, 196, 216],
    [200, 220, 232],
    [228, 240, 248],
    [248, 252, 252],
  ]);
  set('dirt', [
    [58, 72, 94],
    [72, 92, 118],
    [90, 112, 138],
    [112, 136, 160],
    [136, 160, 182],
    [164, 186, 204],
  ]);
  return pal;
}

/** An eight-frame flake falls through the tile and sways sideways, then wraps; never moves a map cell. */
function flakes(book: Book, pal: Pal): void {
  const sway = [0, 2, 3, 2, 0, -2, -3, -2];
  for (let type = 0; type < 2; type++) {
    for (let frame = 0; frame < 8; frame++) {
      const p = new Pixels(20, 20, skyOf(pal));
      const x = 9 + sway[frame] * (type ? -1 : 1);
      const y = frame * 2 + 2;
      p.set(x, y - 1, pal.c('white', 2))
        .rect(x - 1, y, 3, 1, pal.c('white', 3))
        .set(x, y + 1, pal.c('white', 2));
      // A distant flake, smaller and dimmer, at another phase of the fall.
      p.set((x + 9) % 20, (y + 9) % 20, pal.c('white', 0));
      book.add(`flake${type}.${frame}`, p, { grav: PULL.down });
    }
  }
}

/** Powder sits in the lower half of a passable tile, just above the solid floor. */
function powder(pal: Pal, tracks: boolean): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  for (let x = 0; x < 20; x++) {
    const top = 11 + (x % 7 === 0 ? 1 : 0);
    p.rect(x, top, 1, 20 - top, pal.c('grass', 4)).set(x, top, pal.c('grass', 5));
  }
  if (tracks) {
    // Two staggered boot soles: rounded toes, dark tread and a separate heel.
    for (const [x, y] of [
      [4, 12],
      [12, 14],
    ]) {
      p.rect(x + 1, y, 2, 1, pal.c('dirt', 1)).rect(x, y + 1, 4, 2, pal.c('dirt', 2));
      p.rect(x, y + 4, 4, 2, pal.c('dirt', 1)).rect(x + 1, y + 1, 2, 1, pal.c('dirt', 0));
    }
  }
  return p;
}

/** Three 60-pixel-wide pictures of a growing drift, cut into three ordinary blocks each. */
function drifts(book: Book, pal: Pal): void {
  for (let stage = 0; stage < 3; stage++) {
    const p = new Pixels(60, 20, skyOf(pal));
    for (let x = 0; x < 60; x++) {
      const hump = Math.sin((x / 59) * Math.PI);
      const top = 19 - Math.round(hump * (5 + stage * 6));
      p.rect(x, top, 1, 20 - top, pal.c('grass', 3)).set(x, top, pal.c('grass', 5));
      if (top < 16) p.rect(x, top + 1, 1, 2, pal.c('grass', 4));
    }
    for (let col = 0; col < 3; col++) book.add(`drift${col}.${stage}`, p.crop(col * 20, 0, 20, 20), { grav: PULL.down });
  }
}

function level(pal: Pal, grow: boolean): Level {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  flakes(book, pal);
  drifts(book, pal);
  book.add('powder', powder(pal, false), { grav: PULL.down, touch: 'footprints' });
  book.add('footprints', powder(pal, true), { grav: PULL.down });
  const words = grow
    ? ['WATCH THE SNOW DRIFT GET DEEPER', 'BOOT MARKS STAY UNTIL YOU RESTART']
    : ['SNOW SWAYS AS IT FALLS', 'WALK BACK TO SEE YOUR BOOT MARKS'];
  const signs = words.map((s, i) => addSign(book, pal, `lesson${i}`, s, 4, 3));
  const g = new Grid(WIDTH, 14);
  g.row(GROUND, 0, WIDTH - 1, 'G').fill(0, GROUND + 1, WIDTH, 3, 'D');
  g.col(0, 0, GROUND - 1, 'X').col(WIDTH - 1, 0, GROUND - 1, 'X');
  g.put(2, GROUND - 2, 's').put(2, GROUND - 1, 'S');
  g.put(WIDTH - 3, GROUND - 2, 'e').put(WIDTH - 3, GROUND - 1, 'E');
  const map = new StarterMap(book, g.rows());
  for (let x = 4; x < WIDTH - 3; x++) map.set(x, GROUND - 1, 'powder');
  for (let col = 0; col < 3; col++) map.set(8 + col, GROUND - 1, `drift${col}.${grow ? 0 : 2}`);
  signs.forEach((s, i) => map.sign(i ? 17 : 4, GROUND - 1 - s.board.length, s));
  // Scatter only on remaining sky. Phase offsets and alternating loops break up rows of identical flakes.
  for (let y = 0; y < GROUND; y++)
    for (let x = 1; x < WIDTH - 1; x++) {
      if ((x * 7 + y * 3) % 5 > 1) continue;
      if (map.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN] !== book.n('sky')) continue;
      map.set(x, y, `flake${x % 2}.${(x * 3 + y * 5) % 8}`);
    }
  return {
    file: grow ? 'two' : 'one',
    title: grow ? 'Snow Piles Up' : 'A Snowy Walk',
    hint: grow ? 'Watch the drift grow.' : 'Walk, hop, then look behind you.',
    book,
    map,
  };
}

export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = snowPalette();
  return { pal, levels: [level(pal, false), level(pal, true)] };
}

/** PLAYGAME.C changeblks remaps each block number; really_checktouch changes the individual map cell. */
export function finishBlocks(l: Level) {
  const blocks = l.book.finish();
  for (let type = 0; type < 2; type++)
    for (let frame = 0; frame < 8; frame++) {
      const b = blocks[l.book.n(`flake${type}.${frame}`)];
      b.nextBl = l.book.n(`flake${type}.${(frame + 1) % 8}`);
      b.ntime = 3 + type;
    }
  if (l.file === 'two')
    for (let col = 0; col < 3; col++)
      for (let stage = 0; stage < 2; stage++) {
        const b = blocks[l.book.n(`drift${col}.${stage}`)];
        b.nextBl = l.book.n(`drift${col}.${stage + 1}`);
        b.ntime = 36;
      }
  return blocks;
}
