// BUS<n>.MBL: what comes at the BLASTER down the data bus, drawn at four sizes (a dot on the
// horizon, small, nearly there, full size beside the ship). A monster shows its sizes in turn
// as it slides down its lane (busMonsters.ts), so it seems to come closer. Only the two
// nearest sizes can touch the ship, so only they hurt (or help). Interrupts and stray bits
// ride every bus; the next stage's own virus rides the bus that leads to it.
import { Pixels } from '../../../kit/pixels';
import { ROAD_SIZES, shrinkSprite } from '../../../kit/road3d';
import { CLEAR, bevel, blob, micro, outline, text } from '../art/draw';
import type { Pal } from '../art/pal';
import { HURT } from '../characters/sharedMonsters';
import type { Bestiary } from '../characters/mons';
import { bat, keyOf, note, opcode, skull } from '../sprites/sprites';
import type { Kind } from './rides';

const pic = () => new Pixels(20, 20, CLEAR);

/** An interrupt: a red flag with a lightning bolt, IRQ across it. */
function irq(p: Pal): Pixels {
  const s = pic();
  s.rect(2, 3, 16, 13, p.c('red', 2)).rect(2, 3, 16, 2, p.c('red', 4)).rect(2, 14, 16, 2, p.c('red', 0));
  const bolt = ['....XX', '...XX.', '..XXXX', '...XX.', '..XX..'];
  s.draw(7, 4, bolt, { X: p.c('gold', 4) });
  s.rect(4, 10, 13, 5, p.c('red', 1));
  micro(s, 5, 10, 'IRQ', p.c('gray', 7));
  s.rect(9, 16, 2, 3, p.c('steel', 4));
  return outline(s, p.c('ink', 0));
}

/** Stray bits: a 1 and a 0 tumbling loose, glowing green. */
function bits(p: Pal): Pixels {
  const s = pic();
  blob(s, 10, 11, 8, 7, p.r('slime'), 0, 2, 0.5);
  text(s, 2, 7, '1', p.c('slime', 5));
  text(s, 10, 6, '0', p.c('slime', 5));
  s.set(3, 7, p.c('gray', 7)).set(11, 6, p.c('gray', 7));
  return outline(s, p.c('ink', 0));
}

/** Good data: a loose byte, a cyan chip with its bits on it. */
function byte(p: Pal): Pixels {
  const s = pic();
  bevel(s, 4, 4, 12, 12, p.r('cyan'), 3, 1);
  for (let x = 5; x < 16; x += 2) s.set(x, 3, p.c('steel', 6)).set(x, 16, p.c('steel', 6));
  s.draw(7, 7, ['X.XX', 'XXX.', '.X.X', 'XX.X', 'X..X'], { X: p.c('ink', 0) });
  return outline(s, p.c('ink', 0));
}

/** A hull repair: the green capsule with its white and red cross. */
function fix(p: Pal): Pixels {
  const s = pic();
  blob(s, 9.5, 9.5, 7, 7, p.r('slime'), 1, 5);
  s.rect(8, 5, 4, 10, p.c('gray', 7)).rect(5, 8, 10, 4, p.c('gray', 7));
  s.rect(9, 6, 2, 8, p.c('red', 2)).rect(6, 9, 8, 2, p.c('red', 2));
  return outline(s, p.c('ink', 0));
}

/** The next stage's virus, as it looks there. */
function foe(p: Pal, n: number): Pixels {
  const v = (main: string, accent: string) => keyOf(p, { main, accent });
  if (n === 2) return bat(v('virus', 'slime'))[0];
  if (n === 3) return note(v('virus', 'slime'))[0];
  if (n === 4) return skull(v('virus', 'red'))[0];
  return opcode(v('virus', 'slime'))[0];
}

/** A pulse on a line between the lanes, slanted along its line (drawn for the right line; `left` mirrors it). */
function pulse(p: Pal, size: number, left: boolean): Pixels {
  const s = pic();
  const len = [1, 2, 4, 6, 9][size];
  const wide = [1, 1, 2, 2, 3][size];
  for (let i = 0; i < len; i++) {
    const y = 10 - Math.floor(len / 2) + i;
    const dx = Math.round((i - len / 2) * 0.4);
    const x = left ? 10 - dx - wide + 1 : 10 + dx;
    s.rect(x, y, wide, 1, i === 0 && len > 2 ? p.c('glow', 2) : p.c('glow', 4));
  }
  return s;
}

/** A hazard the ship hit, popping. */
function pop(p: Pal, k: number): Pixels {
  const s = pic();
  const r = 3 + k * 3;
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4 + k * 0.4;
    s.line(10 + Math.cos(ang) * r, 10 + Math.sin(ang) * r, 10 + Math.cos(ang) * (r + 3), 10 + Math.sin(ang) * (r + 3), a % 2 ? p.c('fire', 5) : p.c('gray', 7));
  }
  if (k === 0) blob(s, 10, 10, 3, 3, p.r('fire'), 4, 7);
  return s;
}

/** A prize, caught: a sparkle. */
function sparkle(p: Pal, k: number): Pixels {
  const s = pic();
  const r = 3 + k * 4;
  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ])
    s.line(10, 10, 10 + dx * r, 10 + dy * r, p.c('cyan', 5));
  s.set(10, 10, p.c('gray', 7));
  return s;
}

/** What touching each kind does, at the two nearest sizes. */
const NEAR: Record<Kind, object> = {
  irq: { chHitPt: HURT.enemy },
  foe: { chHitPt: HURT.enemy },
  bits: { chHitPt: HURT.hazard },
  byte: { scorePts: 50 },
  fix: { chHitPt: 10 },
};

/** Adds every picture of the ride's traffic to the bestiary's monster blocks. */
export function busPictures(b: Bestiary, p: Pal, n: number): void {
  const full: Record<Kind, Pixels> = { irq: irq(p), bits: bits(p), foe: foe(p, n), byte: byte(p), fix: fix(p) };
  for (const kind of Object.keys(full) as Kind[])
    ROAD_SIZES.forEach(({ scale, bottom }, i) => b.mb.add(`${kind}${i}`, shrinkSprite(full[kind], scale, bottom, CLEAR), i >= 2 ? NEAR[kind] : {}));
  for (let i = 0; i < 5; i++) {
    b.mb.add(`pulseL${i}`, pulse(p, i, true));
    b.mb.add(`pulseR${i}`, pulse(p, i, false));
  }
  for (let k = 0; k < 2; k++) {
    b.mb.add(`pop${k}`, pop(p, k));
    b.mb.add(`sparkle${k}`, sparkle(p, k));
  }
}
