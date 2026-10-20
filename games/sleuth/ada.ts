// Inspector Ada Penn, seen from above at a slant: cloche hat, auburn bob, a belted trench
// coat. One block tall, so she fits every doorway and the gap between two rows of seats.
import { Pixels } from '../kit/pixels';
import { CLEAR, art } from './draw';
import { c, ink } from './pal';

const KEY: Record<string, number> = {
  o: c('black', 0),
  h: c('velvet', 2),
  i: c('velvet', 4),
  H: c('black', 1),
  a: c('auburn', 1),
  A: c('auburn', 2),
  k: c('skin', 4),
  K: c('skin', 3),
  e: c('black', 0),
  m: c('velvet', 3),
  c: c('tan', 3),
  C: c('tan', 1),
  d: c('tan', 4),
  b: c('tan', 0),
  l: c('navy', 1),
  s: c('black', 0),
  g: c('gold', 3),
  G: c('teal', 3),
  w: c('ghost', 3),
  x: ink('red'),
};

const pic = (rows: string[]) => art(new Pixels(20, 20, CLEAR), 0, 0, rows, KEY);

const HEAD_DOWN = [
  '......oooooooo......',
  '.....ohhhhiihhoo....',
  '....ohhhhhhhhhhho...',
  '...oHHHHHHHHHHHHHo..',
  '..ohhhhhhhhhhhhhhho.',
  '...oaAkkkkkkkkAao...',
  '...oakkekkkkekkao...',
  '...oakkkkkkkkkkao...',
  '....oakkkmmkkkao....',
  '.....ooKkkkkKoo.....',
];
const BODY_DOWN = [
  '....occccddcccco....',
  '...occcccddccccco...',
  '...occCcccccccCco...',
  '...obbbbbbgbbbbbo...',
  '...occCcccccccCco...',
  '....occcccccccco....',
];
const LEGS = {
  stand: ['.....olloo.olloo....', '.....ollo..ollo.....', '.....osso..osso.....', '....................'],
  stepL: ['.....olloo.olloo....', '....ollo....ollo....', '....osso....ollo....', '............osso....'],
  stepR: ['.....olloo.olloo....', '....ollo....ollo....', '....ollo....osso....', '....osso............'],
};

const HEAD_UP = [
  '......oooooooo......',
  '.....ohhhhhhhhoo....',
  '....ohhhhhhhhhhho...',
  '...oHHHHHHHHHHHHHo..',
  '..ohhhhhhhhhhhhhhho.',
  '...oaAAAAAAAAAAao...',
  '...oaAAaAAAAaAAao...',
  '...oaaAAAAAAAAaao...',
  '....oaaaAAAAaaao....',
  '.....ooKkkkkKoo.....',
];
const BODY_UP = [
  '....occcccccccco....',
  '...occcccCccccco....',
  '...occCcccCccCco....',
  '...obbbbbbbbbbbo....',
  '...occCccCcccCco....',
  '....occcCcccccco....',
];

const HEAD_SIDE = [
  '......ooooooo.......',
  '.....ohhhhhiioo.....',
  '....ohhhhhhhhhho....',
  '....oHHHHHHHHHHHoo..',
  '...ohhhhhhhhhhhhhhho',
  '....oaAAkkkkkkoo....',
  '....oaAakkkkekko....',
  '....oaAakkkkkkkko...',
  '.....oaakkkkmko.....',
  '......ooKkkkkoo.....',
];
const BODY_SIDE = [
  '.....occccccddo.....',
  '....occcccccddco....',
  '....oCccccccccco....',
  '....obbbbbbbbbgo....',
  '....oCcccccccccco...',
  '.....occccccccco....',
];
const LEGS_SIDE = {
  stand: ['......olloollo......', '......ollo.ollo.....', '......osssosss......', '....................'],
  step1: ['......olloollo......', '.....ollo...ollo....', '....osso.....ollo...', '..............osss..'],
  step2: ['......olloollo......', '.......olloollo.....', '.......ollollo......', '.......osssoss......'],
};

export const ADA: Record<string, Pixels> = {
  down0: pic([...HEAD_DOWN, ...BODY_DOWN, ...LEGS.stand]),
  down1: pic([...HEAD_DOWN, ...BODY_DOWN, ...LEGS.stepL]),
  down2: pic([...HEAD_DOWN, ...BODY_DOWN, ...LEGS.stepR]),
  up0: pic([...HEAD_UP, ...BODY_UP, ...LEGS.stand]),
  up1: pic([...HEAD_UP, ...BODY_UP, ...LEGS.stepL]),
  up2: pic([...HEAD_UP, ...BODY_UP, ...LEGS.stepR]),
  side0: pic([...HEAD_SIDE, ...BODY_SIDE, ...LEGS_SIDE.stand]),
  side1: pic([...HEAD_SIDE, ...BODY_SIDE, ...LEGS_SIDE.step1]),
  side2: pic([...HEAD_SIDE, ...BODY_SIDE, ...LEGS_SIDE.step2]),
  blink: pic([...HEAD_DOWN.slice(0, 6), '...oakkookkookkao...', ...HEAD_DOWN.slice(7), ...BODY_DOWN, ...LEGS.stand]),
  // bending to pick something up: hat tipped forward, a hand reaching down
  pickup: pic([
    '....................',
    '....................',
    '......oooooooo......',
    '.....ohhhhiihhoo....',
    '....ohhhhhhhhhhho...',
    '...oHHHHHHHHHHHHHo..',
    '..ohhhhhhhhhhhhhhho.',
    '...oaAkkkkkkkkAao...',
    '...oakkookkookkao...',
    '....oakkkkkkkkao....',
    '...occccddcccccco...',
    '..occcccddcccccccoo.',
    '..occCcccccccCcckko.',
    '..obbbbbbgbbbbbbkko.',
    '...occCcccccccCcoo..',
    '....occcccccccco....',
    '.....olloo.olloo....',
    '.....ollo..ollo.....',
    '.....osso..osso.....',
    '....................',
  ]),
  // peering through the prop magnifying glass
  lens: pic([
    '......oooooooo......',
    '.....ohhhhiihhoo....',
    '....ohhhhhhhhhhho...',
    '...oHHHHHHHHHHHHHo..',
    '..ohhhhhhhhhhhhhhho.',
    '...oaAkkkkkkoggggo..',
    '...oakkekkkogGGGGgo.',
    '...oakkkkkkogGwGGgo.',
    '....oakkkmmkogGGGgo.',
    '.....ooKkkkkKoggggo.',
    '....occccddccckoo...',
    '...occcccddcckko....',
    '...occCcccccccCco...',
    '...obbbbbbgbbbbbo...',
    '...occCcccccccCco...',
    '....occcccccccco....',
    '.....olloo.olloo....',
    '.....ollo..ollo.....',
    '.....osso..osso.....',
    '....................',
  ]),
};

/** A wrong accusation: the hat comes off, and a big red X. */
export function strikeFrames(): Pixels[] {
  const a = ADA.down0;
  const f1 = new Pixels(20, 20, CLEAR);
  f1.blit(ADA.pickup, 0, 0, CLEAR);
  const f2 = new Pixels(20, 20, CLEAR);
  f2.blit(a, 0, 3, CLEAR);
  for (let y = 0; y < 5; y++) for (let x = 0; x < 20; x++) if (f2.get(x, y) === c('velvet', 2) || f2.get(x, y) === c('velvet', 4)) f2.set(x, y, CLEAR);
  const f3 = new Pixels(20, 20, CLEAR);
  f3.px.set(f2.px);
  for (let i = 0; i < 20; i++) {
    for (const d of [0, 1]) {
      f3.set(i, i + d - 1, KEY.x);
      f3.set(19 - i, i + d - 1, KEY.x);
    }
  }
  return [f1, f2, f3];
}
