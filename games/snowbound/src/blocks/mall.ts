// LaVale Mall: its walls and glass doors, the window with THE  box in it, the store door
// and register (which only opens with $89 in your pocket), and Bleeps, the arcade, with its
// chasing marquee and a door that takes a dollar a game.
import { Pixels } from '../../../kit/pixels';
import { gradient, shadeAt, speckle } from '../art/draw';
import { micro, microWidth } from '../art/font';
import { Ctx, MONEY, SOLID } from './book';

export function addMall(k: Ctx) {
  const { book, R, c, snow, P } = k;
  // ---------- LaVale Mall ----------
  const flat = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) flat.set(x, y, shadeAt(snow, 3, 6, 0.9 - y / 40 + ((x * 13 + y * 7) % 11 === 0 ? -0.2 : 0), x, y));
  flat.rect(0, 16, 20, 1, c('snow', 6)).rect(0, 17, 20, 3, c('brick', 1)).rect(0, 19, 20, 1, c('ink', 0));
  book.add('flatRoof', flat, { solid: SOLID });

  const mallWall = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('butter'), 1, 1, seed, 0.15);
    p.rect(0, 0, 1, 20, c('butter', 0)).rect(0, 9, 20, 1, c('butter', 0));
    return p;
  };
  book.add('mallWall', mallWall(1), { solid: SOLID });
  {
    const label = 'LAVALE MALL';
    const tiles = 6;
    const big = new Pixels(tiles * 20, 20);
    for (let t = 0; t < tiles; t++) big.blit(mallWall(t + 3), t * 20, 0);
    big.rect(1, 3, tiles * 20 - 2, 14, c('ink', 0));
    micro(big, Math.floor((tiles * 20 - microWidth(label, 2)) / 2), 5, label, c('glow', 3), 2);
    big.rect(0, 2, tiles * 20, 1, c('snow', 6));
    for (let t = 0; t < tiles; t++) book.add(`mall${t}`, big.crop(t * 20, 0, 20, 20), { solid: SOLID });
  }
  const glassDoor = mallWall(9);
  glassDoor.rect(1, 2, 18, 18, c('concrete', 0));
  gradient(glassDoor, 2, 3, 7, 17, R('glow'), 2, 0);
  gradient(glassDoor, 11, 3, 7, 17, R('glow'), 2, 0);
  glassDoor.rect(7, 9, 1, 5, c('concrete', 3)).rect(12, 9, 1, 5, c('concrete', 3));
  book.add('mallDoor', glassDoor, { solid: SOLID });
  {
    const label = 'BITS & BYTES';
    const tiles = 5;
    const big = new Pixels(tiles * 20, 20);
    for (let t = 0; t < tiles; t++) big.blit(mallWall(t + 13), t * 20, 0);
    big.rect(1, 3, tiles * 20 - 2, 14, c('ink', 0));
    const x = Math.floor((tiles * 20 - microWidth(label, 2)) / 2);
    micro(big, x + 1, 6, label, c('pink', 1), 2);
    micro(big, x, 5, label, c('pink', 4), 2);
    big.rect(0, 2, tiles * 20, 1, c('snow', 6));
    // The middle tile, over the door, lets you through: once the door is open you walk in under
    // the sign, and the link is there, a step past the register, so its ka-CHING plays out.
    for (let t = 0; t < tiles; t++) book.add(`store${t}`, big.crop(t * 20, 0, 20, 20), t === 2 ? {} : { solid: SOLID });
  }
  // The window with THE box in it: pink, $89.
  const boxWin = mallWall(21);
  boxWin.rect(1, 2, 18, 16, c('concrete', 0));
  gradient(boxWin, 2, 3, 16, 14, R('glow'), 3, 1);
  boxWin.rect(5, 4, 9, 12, c('pink', 3)).rect(5, 4, 9, 1, c('pink', 4)).rect(13, 4, 1, 12, c('pink', 1)).rect(14, 5, 1, 11, c('pink', 0));
  micro(boxWin, 6, 6, 'GM', c('snow', 6));
  boxWin.rect(6, 12, 7, 1, c('siding', 2)).rect(6, 14, 5, 1, c('gold', 3));
  boxWin.rect(10, 15, 9, 3, c('snow', 6));
  micro(boxWin, 11, 15, '89', c('coat', 2));
  boxWin.rect(1, 18, 18, 2, c('snow', 6));
  book.add('boxWindow', boxWin, { solid: SOLID });
  const storeDoor = (open: boolean) => {
    const p = mallWall(23);
    if (open) {
      p.rect(2, 2, 16, 18, c('glow', 3));
      gradient(p, 2, 2, 16, 18, R('glow'), 3, 2);
      p.rect(2, 2, 3, 18, c('ice', 2)).rect(3, 2, 1, 18, c('ice', 4));
      for (let x = 2; x < 18; x++) p.set(x, 19, c('pink', 2));
    } else {
      p.rect(2, 2, 16, 18, c('concrete', 0)).rect(3, 3, 14, 16, c('ice', 1));
      gradient(p, 3, 3, 14, 16, R('glow'), 2, 0);
      p.rect(4, 6, 12, 8, c('snow', 6)).frame(4, 6, 12, 8, c('pink', 2));
      micro(p, 5, 8, '$89', c('pink', 1));
      p.rect(9, 3, 2, 3, c('ink', 0));
      p.rect(15, 11, 1, 4, c('concrete', 3));
    }
    return p;
  };
  // The register: it only opens when you have $89 (the touch is refused below that).
  book.add('storeDoor', storeDoor(false), { solid: SOLID, effect: MONEY, eamt: -89, score: 8900, touch: 'storeOpen' });
  book.add('storeOpen', storeDoor(true));

  // Bleeps, the arcade: a marquee with chasing bulbs, two glowing cabinets in the
  // windows, and a door that eats four quarters ($1) a push for a game - and warms you up.
  const marquee = (frame: number) => {
    const big = new Pixels(60, 20);
    for (let t = 0; t < 3; t++) big.blit(mallWall(t + 31), t * 20, 0);
    big.rect(1, 3, 58, 15, c('ink', 0));
    for (let x = 2; x < 58; x += 2) big.set(x, 3, c('bulbs', (x / 2 + frame) % 4)).set(x, 17, c('bulbs', (x / 2 + frame + 2) % 4));
    const label = 'BLEEPS';
    const x = Math.floor((60 - microWidth(label, 2)) / 2);
    micro(big, x + 1, 7, label, c('orange', 0), 2);
    micro(big, x, 6, label, frame ? c('orange', 3) : c('gold', 3), 2);
    big.rect(0, 2, 60, 1, c('snow', 6));
    return big;
  };
  for (const f of [0, 1]) {
    const big = marquee(f);
    for (let t = 0; t < 3; t++) book.add(`arcade${f}${t}`, big.crop(t * 20, 0, 20, 20), { solid: SOLID, next: `arcade${1 - f}${t}`, ntime: 6 });
  }
  const arcadeWin = mallWall(35);
  arcadeWin.rect(1, 2, 18, 16, c('concrete', 0)).rect(2, 3, 16, 15, c('ink', 0));
  for (const cx of [3, 11]) {
    arcadeWin
      .rect(cx, 5, 6, 13, c('siding', 1))
      .rect(cx + 1, 6, 4, 4, c('money', 2))
      .set(cx + 2, 7, c('gold', 3))
      .set(cx + 3, 8, c('coat', 3));
    arcadeWin.rect(cx + 1, 12, 4, 1, c('grey', 4)).set(cx + 2, 11, c('coat', 3));
  }
  arcadeWin.rect(1, 18, 18, 2, c('snow', 6));
  book.add('arcadeWin', arcadeWin, { solid: SOLID });
  const arcadeDoor = mallWall(37);
  arcadeDoor.rect(2, 2, 16, 18, c('concrete', 0));
  gradient(arcadeDoor, 3, 3, 14, 17, R('pink'), 1, 3);
  arcadeDoor.rect(5, 6, 10, 7, c('ink', 0));
  micro(arcadeDoor, 6, 7, '25', c('gold', 3));
  arcadeDoor.rect(11, 8, 2, 3, c('grey', 4));
  arcadeDoor.rect(15, 11, 1, 4, c('concrete', 3));
  book.add('arcadeDoor', arcadeDoor, { solid: SOLID, effect: MONEY, eamt: -1, hp: 5, score: 100 });
  return { mallWall };
}

/** Bleeps' snack bar sells exactly one thing: a frosty mug of root beer on the walk out
 * front, which warms you up like cocoa (don't ask how). Added last so older blocks keep
 * their numbers. */
export function addSnack(k: Ctx, { sidewalk }: { sidewalk: (seed: number) => Pixels }): void {
  const { book, c } = k;
  const p = sidewalk(143);
  p.rect(5, 6, 9, 11, c('wood', 1)).rect(5, 6, 2, 11, c('wood', 2)).rect(12, 6, 2, 11, c('wood', 0));
  p.rect(5, 5, 9, 2, c('glow', 3)).rect(4, 4, 11, 2, c('snow', 6)).set(6, 3, c('snow', 6)).set(11, 3, c('snow', 6));
  p.rect(14, 8, 3, 1, c('ice', 4)).rect(16, 8, 1, 6, c('ice', 4)).rect(14, 13, 3, 1, c('ice', 4));
  for (let y = 8; y < 16; y += 3) p.set(7, y, c('ice', 4));
  p.rect(4, 17, 11, 1, c('concrete', 1));
  book.add('rootBeer', p, { hp: 35, score: 25, touch: 'walk' });
}
