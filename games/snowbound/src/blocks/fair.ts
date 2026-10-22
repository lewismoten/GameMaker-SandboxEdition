// The History Fair table at LaVale Mall: a volunteer in a tricorn and a linen hunting shirt
// (he looks oddly familiar), a Liberty Bell on a little yoke, and a thirteen-star flag, all
// over a red, white and blue skirt. Push the bell to ring it for 1776 points. The rung bell
// is a block of its own whose next/ntime pair swings it back and forth for the rest of the
// night: a next chain runs from the moment the scene starts, so a chain that ends would have
// stopped long before you got there, and only a loop still swings when you arrive. Beside
// it, a corkboard on the mall wall with a 4-H poster on it. Added after the paper route so
// older blocks keep their numbers.
import { micro } from '../art/font';
import { Ctx, SOLID } from './book';
import type { addGround } from './ground';
import type { addMall } from './mall';

type Painters = ReturnType<typeof addGround>;

export function addFair(k: Ctx, { sidewalk }: Painters, { mallWall }: ReturnType<typeof addMall>): void {
  const { book, R, c } = k;
  // The table: walk behind, a tabletop at y 11, and a bunting skirt to the ground.
  const table = (seed: number) => {
    const p = sidewalk(seed);
    p.rect(0, 11, 20, 2, c('wood', 3)).rect(0, 12, 20, 1, c('wood', 1));
    for (let x = 0; x < 20; x++) {
      const sag = Math.round(Math.sin((x / 20) * Math.PI) * 2);
      for (let y = 13; y < 19; y++) p.set(x, y, c(y < 15 + sag ? 'siding' : y < 17 + sag ? 'snow' : 'coat', y < 15 + sag ? 2 : y < 17 + sag ? 6 : 2));
    }
    for (let x = 2; x < 20; x += 5) p.set(x, 14, c('snow', 6));
    p.rect(0, 19, 20, 1, c('ink', 0));
    return p;
  };

  // The volunteer: black tricorn, wire glasses, an off-white hunting shirt with a fringed
  // cape collar and a red placket.
  const volunteer = table(131);
  const ink = c('ink', 0);
  volunteer.rect(5, 1, 10, 2, ink).rect(3, 2, 14, 1, ink).set(3, 1, ink).set(16, 1, ink).set(10, 0, ink);
  volunteer.rect(6, 3, 8, 5, c('skin', 2)).rect(6, 3, 8, 1, c('hair', 1)).rect(13, 4, 1, 3, c('skin', 1));
  volunteer.set(7, 5, c('grey', 2)).set(8, 5, c('grey', 2)).set(11, 5, c('grey', 2)).set(12, 5, c('grey', 2)).set(9, 5, c('grey', 3)).set(10, 5, c('grey', 3));
  volunteer.set(8, 5, ink).set(11, 5, ink).rect(9, 7, 2, 1, c('skin', 0));
  volunteer.rect(4, 8, 12, 3, c('snow', 5)).rect(3, 9, 14, 2, c('snow', 5)).rect(5, 8, 10, 1, c('snow', 6));
  for (let x = 3; x < 17; x += 2) volunteer.set(x, 10, c('snow', 3));
  volunteer.rect(9, 9, 2, 2, c('coat', 2));
  book.add('fairMan', volunteer, { solid: SOLID });

  // The bell: bronze, on a wooden yoke, with the crack showing. tilt -1, 0 or 1.
  const bell = (tilt: number) => {
    const p = table(133);
    p.rect(2, 1, 16, 2, c('wood', 1)).rect(2, 1, 2, 10, c('wood', 1)).rect(16, 1, 2, 10, c('wood', 1));
    const bronze = R('gold');
    for (let y = 0; y < 8; y++) {
      const w = 2 + Math.round(y * 0.55) + (y === 7 ? 1 : 0);
      const cx = 10 + Math.round((tilt * y) / 3);
      for (let x = -w; x < w; x++) p.set(cx + x, 3 + y, bronze[x < -w / 3 ? 2 : x < w / 3 ? 1 : 0]);
    }
    const lip = 10 + Math.round((tilt * 7) / 3);
    p.rect(lip - 6, 10, 12, 1, c('wood', 0));
    // the crack
    p.set(lip - 1, 6, ink).set(lip, 7, ink).set(lip - 1, 8, ink).set(lip, 9, ink);
    if (tilt) {
      // ringing: little sound lines on the side it swings toward
      const sx = tilt > 0 ? 18 : 1;
      p.set(sx, 4, c('snow', 6)).set(sx, 6, c('snow', 6)).set(sx + tilt, 5, c('snow', 6));
    }
    return p;
  };
  book.add('fairBell', bell(0), { solid: SOLID, score: 1776, touch: 'fairBellR' });
  book.add('fairBellR', bell(1), { solid: SOLID, next: 'fairBellL', ntime: 4 });
  book.add('fairBellL', bell(-1), { solid: SOLID, next: 'fairBellR', ntime: 4 });

  // Thirteen stars in a ring on a little flag, and the HISTORY FAIR sign.
  const flag = table(135);
  flag.rect(3, 0, 1, 11, c('wood', 1)).set(3, 0, c('gold', 3));
  for (let y = 0; y < 7; y++) flag.rect(4, 1 + y, 12, 1, c(y % 2 ? 'snow' : 'coat', y % 2 ? 6 : 2));
  flag.rect(4, 1, 6, 4, c('siding', 1));
  for (const [sx, sy] of [
    [6, 1],
    [8, 1],
    [5, 3],
    [9, 3],
    [7, 4],
  ])
    flag.set(sx, sy, c('snow', 6));
  // a card taped to the skirt
  flag.rect(2, 13, 17, 6, c('snow', 6)).frame(2, 13, 17, 6, c('concrete', 2));
  micro(flag, 3, 14, '1776', c('coat', 2));
  book.add('fairFlag', flag, { solid: SOLID });

  // The corkboard on the mall wall, two blocks: a 4-H poster with its four-leaf clover, then
  // the History Fair flyer and a card with tear-off tabs.
  const board = (right: boolean) => {
    const p = mallWall(right ? 141 : 139);
    const x0 = right ? 0 : 2;
    const x1 = right ? 18 : 20;
    p.rect(x0, 2, x1 - x0, 16, c('wood', 0)).rect(x0 + (right ? 0 : 1), 3, x1 - x0 - 1, 14, c('wood', 3));
    for (let y = 4; y < 16; y += 3) for (let x = x0 + 2; x < x1 - 1; x += 4) p.set(x + (y % 2), y, c('wood', 2));
    if (!right) {
      // the 4-H poster: white, a green clover with an H on each leaf
      p.rect(5, 4, 13, 12, c('snow', 6)).set(11, 4, c('coat', 3));
      p.draw(7, 5, [
        '.GG...GG.',
        'GGGG.GGGG',
        'GGWGGGWGG',
        '.GGGGGGG.',
        '...GGG...',
        '.GGGGGGG.',
        'GGWGGGWGG',
        'GGGG.GGGG',
        '.GG...GG.',
      ], { G: c('pine', 3), W: c('snow', 6) });
      p.rect(11, 14, 1, 1, c('pine', 1));
    } else {
      // HISTORY FAIR flyer, red white and blue, and a lost-mitten card
      p.rect(1, 4, 9, 11, c('snow', 6)).rect(1, 4, 9, 2, c('siding', 2)).rect(1, 13, 9, 2, c('coat', 2));
      p.rect(2, 7, 7, 1, c('ink', 1)).rect(2, 9, 5, 1, c('ink', 1)).rect(2, 11, 6, 1, c('ink', 1));
      p.set(5, 4, c('coat', 3));
      p.rect(11, 6, 6, 8, c('butter', 3)).rect(12, 8, 4, 1, c('siding', 2)).set(14, 6, c('siding', 3));
      for (let x = 11; x < 17; x += 2) p.rect(x, 14, 1, 2, c('butter', 3));
    }
    p.rect(x0, 18, x1 - x0, 1, c('butter', 0));
    return p;
  };
  book.add('board0', board(false), { solid: SOLID });
  book.add('board1', board(true), { solid: SOLID });
}
