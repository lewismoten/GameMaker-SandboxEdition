// LEO.CBL and CAST.MBL. Doc Leo, two blocks tall, is the hobo clown (leo.ts). The monster blocks: the rubber chicken (Sir
// Reginald III, then Lady Regina III), the friendly noise critters that live in the engine (the
// Squeaks), the oil can's drop and the calm note head an oiled Squeak becomes; then the dream's
// end and the real tune-up's (realCast.ts).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '../../../snowbound/src/art/draw';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import { buildLeoBlocks } from './leo';
import { chicken } from '../art/chicken';
import { P, type Pal } from '../art/palette';
import { CTR } from '../ids';
import { addRealCast } from './realCast';

const c = P.c;
const ink = c('ink', 0);

/** Doc Leo's colors: his face paint's white is this palette's brightest paint. */
const leoPal = (): Pal => ({ ...P, c: (name: string, shade: number) => (name === 'paint' ? P.c('paint', 3) : P.c(name, shade)) }) as Pal;

/** Doc Leo's poses (top and bottom blocks each). */
export function buildCharBlocks() {
  return buildLeoBlocks(leoPal());
}
export type LeoBlocks = ReturnType<typeof buildCharBlocks>;

/** A Squeak: a little round critter of a rusty nut, wide eyes, a squeaky "o" of a mouth (frame 0/1 hops). */
function squeak(f: number, oiled = false): Pixels {
  const p = new Pixels(20, 20, T);
  const y = 11 - f;
  // the nut: a hexagon in the scene's machinery color, a hole in the middle
  for (let yy = -6; yy <= 6; yy++) {
    const half = 7 - Math.abs(yy) * 0.45;
    for (let x = Math.round(10 - half); x <= 10 + half; x++) p.set(x, y + yy, c('mach', yy < -2 ? 5 : yy < 3 ? 4 : 2));
  }
  // rust spots (gone when oiled)
  if (!oiled)
    for (const [x, yy] of [
      [5, -2],
      [14, 2],
      [8, 4],
      [13, -4],
    ])
      p.set(x, y + yy, c('pipe', 1));
  // eyes and the squeaking mouth
  for (const ex of [7, 13]) p.rect(ex - 1, y - 3, 3, 3, c('paint', 3)).set(ex, y - 2, ink);
  if (oiled)
    p.line(8, y + 2, 12, y + 2, ink)
      .set(7, y + 1, ink)
      .set(13, y + 1, ink);
  else p.disc(10, y + 2.5, 1.4, ink);
  // little feet
  p.rect(6, 18, 3, 2, c('mach', 1)).rect(11, 18, 3, 2, c('mach', 1));
  // a squeak mark
  if (!oiled && f) p.line(16, 2, 18, 0, c('lamp', 4)).line(17, 4, 19, 3, c('lamp', 4));
  return outline(p, ink);
}

/** The oil can's drop, flying right (two frames: a wobble). */
function drop(f: number): Pixels {
  const p = new Pixels(20, 20, T);
  blob(p, 11, 10, 4.2 + f * 0.4, 3.4 - f * 0.4, P.r('cheese'), 0, 2);
  p.line(2, 10, 7, 10, c('cheese', 0)).line(4, 8, 7, 9, c('cheese', 0));
  p.set(12, 8, c('paint', 3)).set(13, 8, c('paint', 3));
  return outline(p, ink);
}

/** A calm note head, a quarter note with a smile, floating home to Doc Leo. */
function noteHead(f: number): Pixels {
  const p = new Pixels(20, 20, T);
  blob(p, 8, 14 - f, 5, 3.6, P.r('cheese'), 0, 2);
  p.rect(12, 2 - f, 2, 12, ink);
  p.set(6, 14 - f, ink)
    .set(10, 14 - f, ink)
    .line(7, 16 - f, 9, 16 - f, ink);
  return outline(p, ink);
}

/** A rubber chicken in a 20x20 block. */
const bird = (o: Parameters<typeof chicken>[1]) => chicken(1, o);

export function buildMonsterBlocks() {
  const book = makeBook('mbl');
  book.add('reggie0', bird({}));
  book.add('reggie1', bird({ bob: 1, squawk: true }));
  book.add('reggiePeck', bird({ peck: true }));
  // in the dream he stands and walks like a live bird
  book.add('dream0', bird({ stand: true }));
  book.add('dream1', bird({ stand: true, step: 1 }));
  book.add('dreamPeck', bird({ stand: true, peck: true }));
  book.add('dreamSquawk', bird({ stand: true, bob: 1, squawk: true }));
  book.add('regina0', bird({ lady: true }));
  book.add('regina1', bird({ lady: true, bob: 1, squawk: true }));
  book.add('squeak0', squeak(0));
  book.add('squeak1', squeak(1));
  book.add('drop0', drop(0));
  book.add('drop1', drop(1));
  // an oiled Squeak's note comes home to Doc Leo's hand: touching him counts it
  const home = { effect: CTR.oiled, eamt: 1, scorePts: 25 };
  book.add('note0', noteHead(0), home);
  book.add('note1', noteHead(1), home);
  book.add('calm0', squeak(0, true));
  addRealCast(book.add);
  return book;
}
export type MonsterBlocks = ReturnType<typeof buildMonsterBlocks>;
