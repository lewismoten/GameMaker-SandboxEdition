// Two short weather lessons. The second map is revisited with a darker palette, as in Day and Night.
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { addSign } from '../../kit/starter/sign';
import { addHouse, HOUSE } from './house';
import { addRain, rainPalette, stormPalette, type Timed } from './rain';
import type { Pal } from '../../kit/starter/palette';

export interface Level {
  file: string;
  card: string;
  title: string;
  hint: string;
  palette: 'rain' | 'storm';
  book: Book;
  timed: Timed[];
  map: StarterMap;
}
export const GROUND = 10;
/** Where the puddles start (three tiles each) and their ripples' first picture. */
export const PUDDLES = [
  [9, 0],
  [20, 2],
  [29, 1],
] as const;
/** The house's left column; its spout and rain barrel are the sixth. */
export const HOUSE_X = 13;

function lesson(pal: Pal, pools: boolean): Level {
  const width = pools ? 40 : 36;
  const book = new Book('bbl');
  const timed: Timed[] = [];
  addStarterBlocks(book, pal);
  addRain(book, pal, timed, pools);
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, GROUND - 1, 'X').col(width - 1, 0, GROUND - 1, 'X');
  g.put(2, GROUND - 2, 's').put(2, GROUND - 1, 'S');
  g.put(width - 3, GROUND - 2, 'e').put(width - 3, GROUND - 1, 'E');
  const map = new StarterMap(book, g.rows());
  const words = pools
    ? ([
        [4, 'RAIN SPLASHES. PUDDLES RIPPLE'],
        [24, 'STEP IN A PUDDLE: A TOUCH SWAPS IN SPLASH BLOCKS'],
        [33, 'SAME MAP, DARKER COLORS: GO THROUGH THE DOOR'],
      ] as const)
    : ([
        [4, 'THIS RAIN FALLS IN ROWS'],
        [21, 'OFFSET THE PICTURES FOR SCATTERED RAIN'],
      ] as const);
  for (const [x, text] of words) {
    const sign = addSign(book, pal, `sign${x}`, text, 4, 3);
    map.sign(x, GROUND - 1 - sign.board.length, sign);
  }
  // Rain fills the actual play view, not just the strip above it. Don't paint over signs or doors.
  for (let y = 0; y < GROUND; y++)
    for (let x = 1; x < width - 1; x++) {
      if (map.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN] !== book.n('sky')) continue;
      const phase = pools || x >= 19 ? (x + y * 3) % 4 : 0;
      map.set(x, y, `${pools && y === GROUND - 1 ? 'splash' : 'rain'}.${phase}`);
    }
  if (pools) {
    // three puddles: the ground ripples; the air above each is armed to splash when stepped in
    for (const [x, phase] of PUDDLES)
      for (let p = 0; p < 3; p++) {
        map.set(x + p, GROUND, `pool${p}.${phase}`);
        map.set(x + p, GROUND - 1, `wet.${(x + p + (GROUND - 1) * 3) % 4}`);
      }
    // the house, its roof and spout on the rain's clock (same phase as the rain around each cell)
    const cells = addHouse(book, pal, timed);
    cells.forEach((row, r) =>
      row.forEach((name, c) => {
        const x = HOUSE_X + c;
        const y = GROUND - HOUSE.rows + r;
        map.set(x, y, book.index.has(name) ? name : `${name}.${(x + y * 3) % 4}`);
      }),
    );
  }
  return {
    file: pools ? 'two' : 'one',
    card: pools ? 'two' : 'one',
    title: pools ? 'Splashes and Pools' : 'Falling Rain',
    hint: pools ? 'Watch the ground. Try the door.' : 'One loop, with different starts.',
    palette: 'rain',
    book,
    timed,
    map,
  };
}

export function buildLevels() {
  const pal = rainPalette();
  const one = lesson(pal, false);
  const two = lesson(pal, true);
  // Same .MAP and .BBL in scenes 3 and 4. Only the palette slot changes; no weather simulation.
  const storm: Level = { ...two, card: 'three', title: 'Rainy Palette', hint: 'The same puddles in storm colors.', palette: 'storm' };
  return { pal, storm: stormPalette(pal), levels: [one, two, storm] };
}
