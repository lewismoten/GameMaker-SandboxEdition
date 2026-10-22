// The rooms backstage: the dressing rooms and their vanities (Victor's blackmail letter is
// propped on Lila's mirror), Victor's office with its typewriter and its playbill (raven, rose and moon in a
// row: the safe's combination), the safe, and a cot and a stove.
//
// The safe is a combination lock made of counters. Each of its three dials is four blocks,
// one per symbol, each touching into the next. Turning a dial onto its right symbol adds 1
// to the dials counter and turning it off again takes 1 away, so the counter is 3 only
// when all three are right; the safe door's touch costs 3 from that counter, and
// Game-Maker refuses a touch that a counter can't pay for (it would leave it at nothing).
import { Pixels, rng } from '../../../kit/pixels';
import { micro } from '../art/draw';
import { c } from '../art/pal';
import { CTR } from '../ids';
import { Add, S, on, wallFace } from './painters';
import { SYMBOLS, dial, safeDoor, symbol } from './items';

export function addBackstage(add: Add, { B, RG }: { B: Pixels; RG: Pixels }) {
  // Backstage rooms
  const vanity = (letter?: string[]) =>
    on(wallFace(), (p) => {
      p.rect(1, 3, 18, 10, c('ghost', 1)).frame(1, 3, 18, 10, c('gold', 2));
      for (let x = 2; x < 19; x += 4) p.set(x, 2, c('glow', 4));
      p.rect(0, 13, 20, 7, c('wood', 2)).rect(0, 13, 20, 1, c('wood', 4));
      if (letter) {
        p.rect(2, 4, 16, 9, c('paper', 5));
        letter.forEach((l, i) => micro(p, 3, 4 + i * 5, l, c('navy', 0)));
      } else {
        p.disc(6, 16, 2, c('velvet', 4));
        p.rect(12, 15, 4, 3, c('gold', 3));
      }
    });
  add('vanity', vanity(), S);
  // Victor's letter, propped on Lila's mirror: blackmail, in his own hand.
  add('letter0', vanity(['SIGN', 'OR I']), S);
  add('letter1', vanity(['TELL', 'ALL-V']), S);
  add(
    'flowers',
    on(RG, (p) => {
      p.rect(7, 11, 6, 7, c('teal', 2));
      for (const [x, y, k] of [
        [7, 7, 'velvet'],
        [12, 6, 'velvet'],
        [10, 9, 'paper'],
        [5, 10, 'plum'],
        [14, 10, 'velvet'],
      ] as [number, number, string][])
        p.disc(x, y, 2, c(k, 4));
    }),
    S,
  );
  add(
    'screen',
    on(RG, (p) => {
      for (let i = 0; i < 3; i++) p.rect(1 + i * 6, 2, 5, 16, c('paper', 2 + (i % 2))).frame(1 + i * 6, 2, 5, 16, c('gold', 1));
      p.disc(9, 9, 2, c('plum', 3));
    }),
    S,
  );
  add(
    'rack',
    on(B, (p) => {
      p.rect(0, 9, 20, 1, c('grey', 4));
      const R = rng(3);
      for (let x = 1; x < 19; x += 3) p.rect(x, 4, 3, 13, c(['velvet', 'navy', 'green', 'plum', 'gold'][Math.floor(R() * 5)], 2 + Math.floor(R() * 2)));
    }),
    S,
  );
  add(
    'robe',
    on(B, (p) => {
      p.rect(0, 9, 20, 1, c('grey', 4));
      p.rect(3, 3, 14, 15, c('black', 2)).rect(3, 3, 14, 2, c('velvet', 3)).rect(9, 3, 2, 15, c('velvet', 2));
    }),
    S,
  );
  add(
    'decanter',
    on(RG, (p) => {
      p.disc(10, 10, 8, c('wood', 2));
      p.disc(8, 9, 3, c('ghost', 0)).disc(8, 10, 2, c('velvet', 2));
      p.rect(13, 8, 3, 4, c('ghost', 1)).rect(13, 10, 3, 2, c('velvet', 3));
    }),
    S,
  );
  add(
    'trunk',
    on(B, (p) => {
      p.rect(1, 3, 18, 14, c('auburn', 1)).frame(1, 3, 18, 14, c('gold', 2));
      p.rect(1, 8, 18, 1, c('gold', 2)).rect(8, 7, 4, 4, c('gold', 3));
      micro(p, 3, 11, 'VC', c('gold', 4));
    }),
    S,
  );
  add(
    'shelf',
    on(wallFace(), (p) => {
      for (const y of [3, 9, 15]) p.rect(0, y + 4, 20, 1, c('wood', 4));
      p.disc(4, 5, 2, c('paper', 5)); // a skull
      p.set(3, 5, c('black', 0)).set(5, 5, c('black', 0));
      p.rect(9, 3, 1, 4, c('grey', 5)).rect(12, 2, 2, 5, c('gold', 3));
      p.rect(3, 10, 5, 3, c('velvet', 3)).rect(11, 9, 6, 4, c('green', 2));
      p.rect(2, 16, 4, 3, c('tan', 3)).rect(9, 15, 3, 4, c('teal', 3)).rect(14, 16, 4, 3, c('plum', 3));
    }),
    S,
  );
  add(
    'shelf2',
    on(wallFace(), (p) => {
      for (const y of [3, 9, 15]) p.rect(0, y + 4, 20, 1, c('wood', 4));
      p.rect(2, 2, 6, 5, c('black', 1)).rect(3, 1, 4, 1, c('black', 1)); // a deerstalker
      p.rect(11, 3, 6, 4, c('tan', 2));
      p.rect(2, 9, 14, 3, c('grey', 4));
      p.rect(4, 15, 3, 4, c('gold', 2)).rect(12, 14, 4, 5, c('navy', 3));
    }),
    S,
  );
  // Victor's Remington Noiseless, a fresh title page still in it, signed V.C.
  add(
    'desk0',
    on(RG, (p) => {
      p.rect(0, 3, 20, 14, c('wood', 1)).rect(0, 3, 20, 1, c('wood', 3));
      p.rect(2, 0, 16, 8, c('paper', 5)).frame(2, 0, 16, 8, c('paper', 3));
      micro(p, 3, 2, 'V.C.', c('black', 0));
      p.rect(2, 8, 16, 2, c('black', 0)).set(1, 8, c('grey', 4)).set(18, 8, c('grey', 4));
      p.rect(3, 10, 14, 6, c('black', 1)).rect(3, 15, 14, 1, c('black', 0));
      for (let y = 11; y < 15; y += 2) for (let x = 4 + ((y >> 1) % 2); x < 16; x += 2) p.set(x, y, c('paper', 3));
      p.rect(7, 14, 6, 1, c('grey', 3));
      p.set(17, 11, c('gold', 3));
    }),
    S,
  );
  add(
    'desk1',
    on(RG, (p) => {
      p.rect(0, 3, 20, 14, c('wood', 1)).rect(0, 3, 20, 1, c('wood', 3));
      p.disc(8, 9, 3, c('black', 1)).rect(13, 5, 2, 9, c('green', 3)).disc(14, 5, 2, c('glow', 3));
    }),
    S,
  );
  add(
    'bookcase',
    on(wallFace(), (p) => {
      for (const y of [2, 8, 14]) {
        p.rect(0, y + 5, 20, 1, c('wood', 4));
        for (let x = 1; x < 19; x += 2) p.rect(x, y + 1, 2, 4, c(['velvet', 'navy', 'green', 'tan'][(x + y) % 4], 2));
      }
    }),
    S,
  );
  // The playbill in Victor's office: THE RAVEN'S BRIDE, raven, rose and moon in a row.
  const bill = new Pixels(60, 20);
  for (let i = 0; i < 3; i++) bill.blit(wallFace(i), i * 20, 0);
  bill.rect(2, 2, 56, 17, c('gold', 2)).rect(3, 3, 54, 15, c('paper', 4));
  symbol(bill, 6, 5, 'raven', c('black', 0), c('velvet', 4));
  symbol(bill, 24, 5, 'rose', c('velvet', 3), c('green', 2));
  symbol(bill, 42, 5, 'moon', c('gold', 3), c('paper', 4));
  for (let i = 0; i < 3; i++) add(`bill${i}`, bill.crop(i * 20, 0, 20, 20), S);
  for (let d = 0; d < 3; d++)
    for (let s = 0; s < 4; s++) {
      // turning a dial from symbol s: +1 when it lands on the right one, -1 when it leaves it
      const right = d + 1;
      const next = (s + 1) % 4;
      const eamt = next === right ? 1 : s === right ? -1 : 0;
      add(`dial${d}${s}`, dial(SYMBOLS[s]), { ...S, touch: `dial${d}${next}`, effect: eamt ? CTR.dials : 0, eamt });
    }
  add('safe_empty', safeDoor(true));
  add('safe', safeDoor(false), { ...S, effect: CTR.dials, eamt: -3, touch: 'safe_ms', score: 200 });
  add(
    'cot',
    on(B, (p) => {
      p.rect(1, 2, 18, 16, c('grey', 1)).rect(2, 3, 16, 14, c('navy', 2)).rect(2, 3, 16, 4, c('paper', 4));
    }),
    S,
  );
  add(
    'stove',
    on(B, (p) => {
      p.disc(10, 10, 7, c('black', 1)).disc(10, 10, 4, c('black', 2));
      p.rect(9, 0, 2, 4, c('black', 1));
      p.set(8, 12, c('glow', 2)).set(11, 13, c('glow', 1));
    }),
    S,
  );
}
