// Houses in 3/4 view: two rows of snowy roof over one row of wall (red brick, blue siding or
// butter yellow) with windows, doors and garages. The eaves and chimneys animate by next/ntime
// chains: each block names its second frame as "next", and that frame names the first.
import { rng, type Pixels } from '../../../kit/pixels';
import { blob, gradient, shadeAt } from '../art/draw';
import { Ctx, SOLID } from './book';
import { cartReturn } from './cartReturn';

export function addHouses(k: Ctx, painters: { lot: (seed: number) => Pixels }): void {
  const { book, R, c, snow, P } = k;
  // No map shows a house's plain wall block, so those three slots hold the mall lot's cart return.
  const cart = cartReturn(k, painters.lot);
  const spare = { red: 'cartSign0', blue: 'cartSign1', yellow: 'cartCorral' } as const;
  // ---------- houses (3/4 view: two rows of snowy roof over one row of wall) ----------
  // the roof's snow darkens down the block to the shade the eave below starts at (no band)
  const roofTop = (edge: 'L' | 'M' | 'R') => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(snow, 3, 6, 0.95 - y / 45 + Math.sin(x * 0.8 + y) * 0.06, x, y));
    p.rect(0, 0, 20, 2, c('brick', 0)).rect(0, 2, 20, 1, c('snow', 6));
    if (edge === 'L') for (let y = 0; y < 20; y++) p.set(0, y, c('ink', 0)).set(1, y, c('wood', 1));
    if (edge === 'R') for (let y = 0; y < 20; y++) p.set(19, y, c('ink', 0)).set(18, y, c('wood', 1));
    return p;
  };
  const eave = (edge: 'L' | 'M' | 'R', frame: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(snow, 2, 6, 0.65 - y / 22 + Math.sin(x * 0.7) * 0.05, x, y));
    // overhanging snow lip, fascia board and a string of Christmas lights
    for (let x = 0; x < 20; x++) p.set(x, 14 + (x % 5 === 2 ? 1 : 0), c('snow', 6));
    p.rect(0, 16, 20, 3, c('wood', 1)).rect(0, 19, 20, 1, c('ink', 0));
    const bulbs = R('bulbs');
    for (let x = 1; x < 20; x += 4) {
      const k = (x >> 2) + frame;
      p.set(x, 17, c('ink', 0))
        .set(x + 1, 18, bulbs[k % 4])
        .set(x + 1, 19, bulbs[k % 4]);
    }
    if (edge === 'L') for (let y = 0; y < 20; y++) p.set(0, y, c('ink', 0)).set(1, y, c('wood', 1));
    if (edge === 'R') for (let y = 0; y < 20; y++) p.set(19, y, c('ink', 0)).set(18, y, c('wood', 1));
    return p;
  };
  for (const e of ['L', 'M', 'R'] as const) book.add(`roof${e}`, roofTop(e), { solid: SOLID });
  for (const e of ['L', 'M', 'R'] as const) {
    book.add(`eave${e}`, eave(e, 0), { solid: SOLID, next: `eave${e}2`, ntime: 9 });
    book.add(`eave${e}2`, eave(e, 1), { solid: SOLID, next: `eave${e}`, ntime: 9 });
  }
  const chimney = (frame: number) => {
    const p = roofTop('M');
    for (let y = 6; y < 16; y++)
      for (let x = 11; x < 17; x++) p.set(x, y, y % 3 === 0 || (x + (Math.floor(y / 3) % 2) * 3) % 6 === 0 ? c('brick', 0) : c('brick', 2 + (x < 13 ? 1 : 0)));
    p.rect(10, 5, 8, 2, c('snow', 6));
    const r = rng(7 + frame);
    for (let k = 0; k < 3; k++) {
      const yy = 4 - k * 2 - frame;
      if (yy >= 0) blob(p, 13 + k + frame, yy, 2 + k * 0.3, 1.5, R('grey'), 3, 5);
    }
    void r;
    return p;
  };
  book.add('chimney', chimney(0), { solid: SOLID, next: 'chimney2', ntime: 7 });
  book.add('chimney2', chimney(1), { solid: SOLID, next: 'chimney', ntime: 7 });

  const walls = { red: 'brick', blue: 'siding', yellow: 'butter' } as const;
  for (const [name, ramp] of Object.entries(walls)) {
    const wr = R(ramp);
    const wall = () => {
      const p = P();
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          let k: number;
          if (ramp === 'brick') k = y % 4 === 3 || (x + (Math.floor(y / 4) % 2) * 4) % 8 === 0 ? 0 : 2 + ((x * 3 + y) % 7 === 0 ? 1 : 0);
          else k = y % 4 === 3 ? 1 : wr.length - 2 - (y % 4 === 0 ? 0 : 1);
          p.set(x, y, wr[Math.max(0, Math.min(wr.length - 1, k))]);
        }
      // shadow under the eaves and icicles
      p.rect(0, 0, 20, 2, c('ink', 0));
      for (let x = 2; x < 20; x += 5) for (let i = 0; i < 2 + (x % 3); i++) p.set(x, 2 + i, c('ice', 4 - i));
      return p;
    };
    const slot = spare[name as keyof typeof spare];
    book.add(slot, cart[slot]);
    const win = wall();
    win.rect(3, 5, 14, 11, c('wood', 4)).rect(4, 6, 12, 9, c('glow', 2));
    gradient(win, 4, 6, 12, 9, R('glow'), 3, 1);
    win.rect(9, 6, 2, 9, c('wood', 4)).rect(4, 10, 12, 1, c('wood', 4));
    win.rect(4, 6, 2, 9, c('coat', 2)).rect(14, 6, 2, 9, c('coat', 2));
    win.rect(2, 16, 16, 2, c('snow', 6)).rect(2, 18, 16, 1, c('wood', 2));
    book.add(`${name}Win`, win, { solid: SOLID });
    const door = wall();
    door.rect(4, 4, 12, 16, c('wood', 4)).rect(5, 5, 10, 15, c(name === 'red' ? 'siding' : 'coat', 1));
    door.rect(6, 6, 8, 5, c(name === 'red' ? 'siding' : 'coat', 2)).rect(6, 12, 8, 6, c(name === 'red' ? 'siding' : 'coat', 2));
    door.ring(10, 9, 3.4, c('pine', 2)).ring(10, 9, 2.6, c('pine', 3)).set(10, 12, c('coat', 3)).set(9, 13, c('coat', 3)).set(11, 13, c('coat', 3));
    door.set(13, 14, c('gold', 3));
    door.rect(2, 19, 16, 1, c('concrete', 3));
    book.add(`${name}Door`, door, { solid: SOLID });
    for (const side of ['L', 'R'] as const) {
      const g = wall();
      const x0 = side === 'L' ? 3 : 0;
      const x1 = side === 'L' ? 20 : 17;
      for (let y = 4; y < 20; y++) for (let x = x0; x < x1; x++) g.set(x, y, c('concrete', y % 4 === 3 ? 1 : 3));
      g.rect(x0, 4, x1 - x0, 1, c('ink', 0));
      if (side === 'L') g.rect(3, 4, 1, 16, c('ink', 0));
      else g.rect(16, 4, 1, 16, c('ink', 0));
      for (let x = x0 + 2; x < x1 - 1; x += 4) g.rect(x, 6, 2, 2, c('glow', 1));
      book.add(`${name}Garage${side}`, g, { solid: SOLID });
    }
  }
}
