// The Bandstand, after each neighborhood: Teddy sets each instrument he brought home on its
// stand (the stand rings a bell, counter 25), the band waits behind (Honker, Bubbles and
// Twirly of the Clown Club), and Doc Leo waves from the lawn. The gate at the end opens when
// every stand is full. The song is the parade tune with one more family than last time; the
// families already home sit on the back riser.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { over } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { KLUB } from '../../../teddy2/src/sprites/klubfolk';
import { LEO } from '../../../teddy3/src/sprites/leo';
import { iconPic } from '../art/icons';
import type { Pal } from '../art/pal';
import { kit, LEDGE, SOLID, GRAV, type Kit } from '../blocks/common';
import { CTR } from '../ids';
import { MapBuilder, at, type Level } from './maps';

/** The families in the order Teddy brings them home, with the instruments of each. */
export const FAMILIES: { id: string; finds: string[] }[] = [
  { id: 'keys', finds: ['piano-bright', 'piano-mellow', 'epiano', 'epiano-round', 'harpsichord', 'clavinet', 'tine-glass'] },
  { id: 'strings', finds: ['violin', 'orchestra', 'pizzicato', 'guitar-steel', 'guitar-nylon', 'oud', 'harp', 'harp-chime'] },
];
const W = 16;
/** Stands start here on the stage (level x), in Teddy's row. */
const STAND_X = 2;
const STAGE_ROW = 6;

/** Splits a 20x40 figure over two background tiles: [top, bottom]. */
function tall(top: Pixels, bottom: Pixels, figure: Pixels): [Pixels, Pixels] {
  const a = new Pixels(20, 20).blit(top, 0, 0);
  over(a, figure.crop(0, 0, 20, 20));
  const b = new Pixels(20, 20).blit(bottom, 0, 0);
  over(b, figure.crop(0, 20, 20, 20));
  return [a, b];
}

/** The bandstand's blocks for homecoming `n` (0 the keys, 1 the strings). */
export function bandBlocks(n: number) {
  return (pal: Pal): Kit => {
    const k = kit(pal);
    const { book, c, P } = k;
    const air = { grav: GRAV.down };
    // the evening sky over the town square, dusk overhead to gold at the rooftops (a shade a
    // row), and the gazebo's back wall (white lattice)
    const sky = (row: number) => P(c('sky', Math.min(7, row))).rect(0, 15, 20, 5, c('sky', Math.min(7, row + 1)));
    const lattice = () => {
      const p = P(c('paint', 1));
      for (let i = -20; i < 20; i += 6) p.line(i, 0, i + 20, 20, c('paint', 3)).line(i + 20, 0, i, 20, c('paint', 3));
      return p;
    };
    for (let r = 0; r < 9; r++) book.add(`sky${r}`, sky(r), air);
    book.add('lattice', lattice(), air);
    // the roof: red and white stripes, a gold ball on top
    book.add('roof', P(c('red', 2)).rect(0, 0, 20, 4, c('red', 0)).rect(5, 4, 5, 16, c('paint', 3)).rect(15, 4, 5, 16, c('paint', 3)), { solid: SOLID });
    book.add('eave', sky(1).rect(0, 0, 20, 6, c('red', 1)).rect(0, 6, 20, 2, c('gold', 2)), air);
    book.add('post', lattice().rect(8, 0, 4, 20, c('paint', 3)).rect(8, 0, 1, 20, c('paint', 2)), air);
    // the stage: painted boards (stand on top), and the lattice skirt under it
    book.add('stage', P(c('wood', 3)).rect(0, 0, 20, 3, c('wood', 4)).rect(0, 3, 20, 1, c('wood', 1)), { solid: LEDGE, grav: GRAV.down });
    book.add('skirt', lattice().rect(0, 0, 20, 2, c('wood', 1)), air);
    book.add('lawn', P(c('grass', 3)).rect(0, 0, 20, 2, c('grass', 4)), { solid: SOLID });
    book.add('square', sky(8).rect(0, 12, 20, 8, c('stone', 3)).rect(0, 12, 20, 1, c('stone', 4)), air);
    // a music stand, empty; and the same stand with its instrument on it
    const stand = (id?: string) => {
      const p = lattice();
      p.rect(9, 12, 2, 8, c('metal', 1)).rect(5, 19, 10, 1, c('metal', 1));
      if (!id) return p.rect(4, 8, 12, 4, c('metal', 2)).rect(4, 8, 12, 1, c('metal', 3));
      return iconPic(id, p);
    };
    const fam = FAMILIES[n];
    fam.finds.forEach((id, i) => {
      book.add(`stand${i}`, stand(), { ...air, effect: CTR.band, eamt: 1, score: 100, touch: `stand${i}.full` });
      book.add(`stand${i}.full`, stand(id), air);
    });
    // the families already home, on the back riser
    FAMILIES.slice(0, n).forEach((f, fi) => f.finds.forEach((id, i) => book.add(`home${fi}.${i}`, iconPic(id, lattice()), air)));
    // the band behind the stands, and Doc Leo on the lawn, waving
    (['honker', 'bubbles', 'twirly'] as const).forEach((who) => {
      const [t, b] = tall(lattice(), lattice(), KLUB[who]);
      book.add(`${who}.top`, t, air);
      book.add(who, b, air);
    });
    const [lt, lb] = tall(sky(7), sky(8), LEO.wave);
    book.add('leo.top', lt, air);
    book.add('leo', lb, air);
    // the gate in the picket fence: shut until every stand has its instrument
    const picket = (open: boolean) => {
      const p = sky(8);
      if (open) return p.rect(0, 6, 3, 14, c('paint', 3));
      for (let x = 1; x < 20; x += 5) p.rect(x, 4, 3, 16, c('paint', 3)).set(x + 1, 3, c('paint', 3));
      return p.rect(0, 9, 20, 2, c('paint', 2)).rect(0, 15, 20, 2, c('paint', 2));
    };
    book.add('gate', picket(false), { solid: SOLID, effect: CTR.band, eamt: -fam.finds.length, touch: 'gate.open' });
    book.add('gate.open', picket(true), air);
    // the rose arbor over the gate, up to the treetops: the way on is through the gate
    const arbor = (row: number) => {
      const p = sky(row).rect(2, 0, 3, 20, c('paint', 3)).rect(15, 0, 3, 20, c('paint', 3));
      for (let y = 2; y < 20; y += 6)
        p.disc(4, y, 2, c('red', 2))
          .disc(16, y + 3, 2, c('pink', 2))
          .set(6, y + 1, c('leaf', 2));
      return p;
    };
    for (let r = 0; r < 8; r++) book.add(`arbor${r}`, arbor(r), { solid: SOLID });
    return k;
  };
}

/** The bandstand for homecoming `n`. */
export function band(n: number) {
  return (book: Kit['book']): Level => {
    const m = new MapBuilder(book, { l: 'lattice', R: 'roof', e: 'eave', p: 'post', s: 'stage', k: 'skirt', g: 'lawn', q: 'square' }, 'roof');
    for (let r = 0; r < 9; r++) m.fill(0, r, W, 1, `sky${r}`);
    m.fill(0, 8, W, 1, 'q').fill(0, 9, W, 1, 'g');
    // the gazebo: roof, eave, back wall, posts, stage and skirt
    m.fill(1, 0, 12, 1, 'R').fill(1, 1, 12, 1, 'e').fill(1, 2, 12, 4, 'l');
    m.fill(1, 2, 1, 4, 'p').fill(12, 2, 1, 4, 'p');
    m.fill(1, STAGE_ROW, 12, 1, 's').fill(1, STAGE_ROW + 1, 12, 2, 'k');
    // the band at the back, the families home already on the riser, the stands in front
    (['honker', 'bubbles', 'twirly'] as const).forEach((who, i) => m.set(9 + i, 3, `${who}.top`).set(9 + i, 4, who));
    FAMILIES.slice(0, n).forEach((f, fi) => f.finds.forEach((_, i) => m.set(STAND_X + i, 4 - fi, `home${fi}.${i}`)));
    FAMILIES[n].finds.forEach((_, i) => m.set(STAND_X + i, 5, `stand${i}`));
    m.set(13, 7, 'leo.top').set(13, 8, 'leo');
    m.set(14, 8, 'gate');
    for (let r = 0; r < 8; r++) m.set(14, r, `arbor${r}`);
    m.link(15, 8);
    return { m, start: at(8, 5), size: [W, 10] };
  };
}
