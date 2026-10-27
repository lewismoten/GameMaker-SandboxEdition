// The lobby: the box office (its count, signed at ten past nine, is Agatha's alibi), the bar
// (Sam's chalkboard of tabs), the cloakroom and the booth. Returns the flagstone floor that
// the dark under the stage is drawn on.
import { Pixels, rng } from '../../../kit/pixels';
import { microC } from '../art/draw';
import { c } from '../art/pal';
import { CTR } from '../ids';
import { Add, S, chalkboard, flagstones, marble, on, wallFace, wallNote } from './painters';
import { ITEM, symbol } from './items';

export function addLobby(add: Add, { B }: { B: Pixels }) {
  // Lobby: box office, bar, cloakroom, booth
  add(
    'counter',
    on(B, (p) => {
      p.rect(0, 4, 20, 12, c('wood', 3)).rect(0, 4, 20, 2, c('wood', 5)).rect(0, 14, 20, 2, c('wood', 1));
      p.rect(13, 6, 5, 4, c('gold', 3)).rect(14, 7, 3, 1, c('black', 1)); // a cash register
    }),
    S,
  );
  add(
    'window',
    on(wallFace(), (p) => {
      p.rect(3, 3, 14, 12, c('rain', 2));
      for (let x = 4; x < 17; x += 3) p.rect(x, 3, 1, 12, c('gold', 3));
      p.rect(2, 14, 16, 2, c('gold', 2));
      microC(p, 10, 4, 'TIX', c('paper', 5));
    }),
    S,
  );
  // The box office count, signed at ten past nine: Agatha's alibi, on the wall.
  add('tally0', wallNote(['COUNT', '9:10', 'A.C.']), S);
  add('tally1', wallNote(['NELL', 'SAW', 'IT OK']), S);
  add(
    'bar',
    on(B, (p) => {
      p.rect(0, 2, 20, 14, c('panel', 2)).rect(0, 2, 20, 3, c('gold', 2)).rect(0, 15, 20, 1, c('panel', 0));
      p.rect(4, 6, 2, 5, c('green', 3)).rect(10, 7, 3, 3, c('ghost', 1)).rect(15, 6, 2, 5, c('auburn', 2));
    }),
    S,
  );
  add(
    'bottles',
    on(wallFace(), (p) => {
      for (const y of [5, 12]) p.rect(0, y + 5, 20, 1, c('wood', 4));
      for (let x = 1; x < 19; x += 3) {
        p.rect(x, 5, 2, 5, c(['green', 'auburn', 'gold', 'teal'][x % 4], 2));
        p.rect(x, 12, 2, 5, c(['tan', 'green', 'velvet', 'auburn'][x % 4], 2));
      }
    }),
    S,
  );
  // Sam's chalkboard of bar tabs: Edgar Bliss bought two gin fizzes in the interval.
  add('chalk0', chalkboard(['BAR', 'TABS', '-----']), S);
  add('chalk1', chalkboard(['BLISS', 'FIZZ', '9:05']), S);
  add('chalk2', chalkboard(['BLISS', 'FIZZ', '9:15']), S);
  add(
    'coats',
    on(B, (p) => {
      p.rect(0, 4, 20, 1, c('gray', 4));
      const R = rng(8);
      for (let x = 0; x < 20; x += 4) p.rect(x + 1, 5, 3, 12, c(['tan', 'black', 'navy', 'gray', 'auburn'][Math.floor(R() * 5)], 1 + Math.floor(R() * 2)));
      for (let x = 2; x < 20; x += 4) p.rect(x, 13, 2, 3, c('paper', 4));
    }),
    S,
  );
  add(
    'board',
    on(B, (p) => {
      p.rect(0, 3, 20, 14, c('black', 1)).rect(0, 3, 20, 1, c('gray', 4));
      for (let x = 2; x < 19; x += 3) {
        p.rect(x, 5, 1, 9, c('gray', 2));
        p.rect(x - 1, 6 + ((x * 7) % 7), 3, 2, c('gold', 3));
      }
      p.set(3, 15, c('velvet', 5)).set(6, 15, c('green', 4)).set(9, 15, c('glow', 4));
    }),
    S,
  );
  add(
    'spot',
    on(B, (p) => {
      p.disc(10, 10, 6, c('black', 1));
      p.rect(4, 4, 12, 4, c('black', 2));
      p.disc(10, 13, 3, c('ghost', 2));
    }),
    S,
  );
  add(
    'poster0',
    on(wallFace(), (p) => {
      p.rect(2, 2, 16, 17, c('black', 1)).frame(2, 2, 16, 17, c('gold', 3));
      symbol(p, 4, 4, 'raven', c('velvet', 4), c('gold', 4));
      microC(p, 10, 13, 'THE', c('gold', 4));
    }),
    S,
  );
  add(
    'poster1',
    on(wallFace(1), (p) => {
      p.rect(2, 2, 16, 17, c('black', 1)).frame(2, 2, 16, 17, c('gold', 3));
      microC(p, 10, 4, 'RAVEN', c('velvet', 5));
      microC(p, 10, 10, 'BRIDE', c('velvet', 5));
    }),
    S,
  );
  add(
    'palm',
    on(marble(), (p) => {
      p.disc(10, 13, 5, c('auburn', 1));
      for (let a = 0; a < 7; a++) {
        const ang = (a / 7) * Math.PI * 2;
        p.line(10, 10, 10 + Math.cos(ang) * 9, 10 + Math.sin(ang) * 8, c('green', 2 + (a % 2)));
      }
    }),
    S,
  );

  const LF = flagstones(5);
  add('key', ITEM.key(B), { effect: CTR.keys, eamt: 1, score: 25, touch: 'boards' });
  add(
    'stub_hidden',
    on(B, (p) => p.rect(0, 0, 20, 3, c('wood', 0))),
    { effect: CTR.lens, eamt: -1, touch: 'stub' },
  );
  return LF;
}
