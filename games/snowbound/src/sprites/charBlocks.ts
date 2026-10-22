// KID.CBL: the kid's character blocks (walking down, up and sideways with the shovel, a
// blink, the wind-up and throw, a white-and-red hurt flash, flat on their back in a drift)
// and the sled (straight, steering left/right, braking, crashed, hurt).
import { Pixels } from '../../../kit/pixels';
import { blob, recolor, rotate } from '../art/draw';
import type { Pal } from '../art/pal';
import {
  BODY_BACK,
  BODY_FRONT,
  BODY_SIDE,
  HEAD_BLINK,
  HEAD_DOWN,
  HEAD_SIDE,
  HEAD_UP,
  LEGS_A,
  LEGS_B,
  LEGS_SIDE_A,
  LEGS_SIDE_B,
  LEGS_STAND,
  T,
  keyFor,
  kidPic,
  makeBook,
  shovel,
} from './kidArt';

// ---------------------------------------------------------------- character blocks
export function buildCharBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const key = keyFor(pal);
  const front = (head: string[], legs: string[]) => shovel(kidPic([...head, ...BODY_FRONT, ...legs], key), pal, 'front');
  const back = (legs: string[]) => shovel(kidPic([...HEAD_UP, ...BODY_BACK, ...legs], key), pal, 'back');
  const side = (legs: string[]) => shovel(kidPic([...HEAD_SIDE, ...BODY_SIDE, ...legs], key), pal, 'side');
  book.add('down0', front(HEAD_DOWN, LEGS_STAND));
  book.add('down1', front(HEAD_DOWN, LEGS_A));
  book.add('down2', front(HEAD_DOWN, LEGS_B));
  book.add('blink', front(HEAD_BLINK, LEGS_STAND));
  book.add('up0', back(LEGS_STAND));
  book.add('up1', back(LEGS_A));
  book.add('up2', back(LEGS_B));
  book.add('side0', side(LEGS_SIDE_B));
  book.add('side1', side(LEGS_SIDE_A));
  // Throw: the arm comes up over the hat with a snowball.
  const wind = kidPic([...HEAD_DOWN, ...BODY_FRONT, ...LEGS_STAND], key);
  wind.rect(15, 3, 2, 8, pal.c('coat', 2)).rect(14, 3, 1, 8, pal.c('ink', 0)).rect(17, 3, 1, 8, pal.c('ink', 0));
  blob(wind, 16, 1.5, 2.5, 2, pal.r('snow'), 3, 6);
  book.add('windup', wind);
  const thrown = kidPic([...HEAD_DOWN, ...BODY_FRONT, ...LEGS_A], key);
  thrown.rect(15, 8, 4, 2, pal.c('coat', 2)).rect(18, 7, 2, 2, pal.c('gold', 2));
  book.add('throw', thrown);
  // Hurt: flash white and red.
  const down0 = book.pics.get('down0')!;
  const white = pal.c('snow', 6);
  book.add(
    'hurt',
    recolor(down0, (c) => (c === T ? T : c === pal.c('ink', 0) ? pal.c('coat', 1) : white)),
  );
  // Die: flat on your back in a snowdrift.
  const lying = rotate(rotate(rotate(down0)));
  const die0 = new Pixels(20, 20, T).blit(lying, 0, 2, T);
  book.add('die0', die0);
  const die1 = new Pixels(20, 20, T).blit(lying, 0, 4, T);
  blob(die1, 6, 16, 7, 4, pal.r('snow'), 3, 6);
  blob(die1, 15, 17, 6, 3, pal.r('snow'), 3, 6);
  for (const [x, y] of [
    [4, 4],
    [9, 2],
    [15, 5],
    [12, 1],
  ])
    die1.set(x, y, pal.c('gold', 3));
  book.add('die1', die1);

  // The sled: you sit on it facing down the hill.
  const sledBase = (lean: number, brake = false) => {
    const p = new Pixels(20, 20, T);
    const k = pal.c('ink', 0);
    // rider (head and shoulders), then the sled in front of their knees
    const rider = kidPic([...HEAD_DOWN.slice(1), ...BODY_FRONT.slice(0, 4)], key);
    p.blit(rider, lean * 2, -1, T);
    p.rect(2 + lean, 10, 2, 9, k).rect(16 + lean, 10, 2, 9, k);
    p.rect(3 + lean, 10, 14, 8, k)
      .rect(4 + lean, 10, 12, 7, pal.c('coat', 2))
      .rect(4 + lean, 10, 12, 1, pal.c('coat', 3));
    for (let y = 12; y < 17; y += 2) p.rect(5 + lean, y, 10, 1, pal.c('coat', 1));
    p.rect(5 + lean, 9, 3, 2, pal.c('gold', 2)).rect(12 + lean, 9, 3, 2, pal.c('gold', 2));
    p.rect(2 + lean, 18, 16, 1, pal.c('grey', 4)).rect(3 + lean, 19, 14, 1, k);
    if (brake) {
      p.rect(1, 13, 3, 4, pal.c('wood', 0)).rect(16, 13, 3, 4, pal.c('wood', 0));
      for (const [x, y] of [
        [0, 17],
        [2, 18],
        [18, 17],
        [19, 18],
      ])
        p.set(x, y, pal.c('snow', 6));
    }
    return p;
  };
  book.add('sled', sledBase(0));
  book.add('sledL', sledBase(-1));
  book.add('sledR', sledBase(1));
  book.add('sledBrake', sledBase(0, true));
  const crash = sledBase(0);
  const tumble = new Pixels(20, 20, T).blit(rotate(crash), 0, 0, T);
  blob(tumble, 10, 16, 9, 4, pal.r('snow'), 3, 6);
  book.add('sledCrash', tumble);
  book.add(
    'sledHurt',
    recolor(book.pics.get('sled')!, (c) => (c === T ? T : c === pal.c('ink', 0) ? pal.c('coat', 1) : white)),
  );
  return book;
}
