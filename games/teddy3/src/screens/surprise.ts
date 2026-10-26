// surprise.fli, the ending (won.lst plays it before the party picture): the Big Top is dark;
// Teddy pads into the ring and sniffs (cake!); the lights come up and everyone shouts
// SURPRISE! There's a banner, balloons, the biggest cake with the bakery's candles, the Clown
// Club, the geese and Doc Leo, and Gwinn brings her best bone and SITS. On purpose.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, centered, micro, outlined, scaleBlit } from '../art/draw';
import { errandSprite } from '../sprites/errands';
import { KLUB, gwinnSits } from '../sprites/klubfolk';
import { CRITTERS } from '../sprites/critters';
import { H, Reel, W, c, caption, gwinnAt, leoAt, teddyAt } from './reel';
import { SP } from './screens';

/** The Big Top's inside: red and white stripes up to the king pole, the ring, a string of lights. */
function bigTop(lit: boolean): Pixels {
  const p = new Pixels(W, H, c('ink', 0));
  for (let y = 0; y < 150; y++)
    for (let x = 0; x < W; x++) {
      const stripe = Math.floor((Math.atan2(x - 160, y + 60) + 2) * 9) % 2;
      p.set(x, y, lit ? (stripe ? c('tent', 2) : c('paint', 3 - (y > 110 ? 1 : 0))) : stripe ? c('ink', 1) : c('ink', 0));
    }
  if (lit) {
    // the string of lights, swagged twice across
    for (const [x0, x1] of [
      [0, 160],
      [160, 320],
    ])
      for (let x = x0; x < x1; x += 2) {
        const y = 22 + Math.round(Math.sin(((x - x0) / 160) * Math.PI) * 18);
        p.set(x, y, c('ink', 1));
        if ((x - x0) % 16 === 8) p.disc(x, y + 3, 2, c(['glow', 'red', 'blue', 'green'][(((x - x0) / 16) % 4) | 0], 3));
      }
  }
  // the ring: sawdust inside a red and white curb
  p.rect(0, 150, W, 50, lit ? c('dirt', 3) : c('ink', 0));
  blob(p, 160, 170, 170, 22, lit ? SP.r('hay') : [c('ink', 1)], lit ? 1 : 0, lit ? 3 : 0);
  for (let x = 0; x < W; x += 12) p.rect(x, 150, 12, 5, lit ? c((x / 12) % 2 ? 'red' : 'paint', 2) : c('ink', 1));
  return p;
}

/** The biggest cake in the Tri-County area: three tiers, pink frosting, the bakery's candles. */
function cake(p: Pixels, cx: number, base: number, flicker: number): void {
  const tiers: [number, number][] = [
    [96, 22],
    [70, 18],
    [44, 16],
  ];
  let y = base;
  for (const [w, h] of tiers) {
    y -= h;
    p.rect(cx - w / 2, y, w, h, c('cream', 3)).frame(cx - w / 2, y, w, h, c('ink', 0));
    p.rect(cx - w / 2 + 1, y + 1, w - 2, 4, c('frost', 1));
    for (let x = cx - w / 2 + 3; x < cx + w / 2 - 3; x += 7) p.rect(x, y + 5, 3, 2 + ((x * 3) % 4), c('frost', 1));
    for (let x = cx - w / 2 + 6; x < cx + w / 2 - 4; x += 12) p.disc(x, y + h - 5, 1, c('red', 3));
  }
  for (let k = 0; k < 7; k++) {
    const x = cx - 18 + k * 6;
    p.rect(x, y - 9, 2, 9, c(['blue', 'yellow', 'green', 'pink'][k % 4], 3));
    p.rect(x, y - 12 - ((k + flicker) % 2), 2, 3, c('glow', 3)).set(x + ((k + flicker) % 2), y - 13 - ((k + flicker) % 2), c('yellow', 3));
  }
}

/** A balloon on its string. */
function balloon(p: Pixels, x: number, y: number, col: string, sway: number): void {
  p.line(x, y + 11, x + sway, y + 40, c('ink', 1));
  blob(p, x, y, 8, 10, SP.r(col), 1, 3);
  p.rect(x - 1, y + 10, 3, 2, c(col, 1));
}

/** The party, lit: the banner, balloons, the cake, the guests (everyone but Teddy and Gwinn). */
export function party(f: number, bannerX = 42): Pixels {
  const p = bigTop(true);
  p.rect(bannerX, 40, 236, 16, c('ink', 0)).rect(bannerX + 2, 42, 232, 12, c('cream', 3));
  for (let x = 2; x < 234; x += 8) p.rect(bannerX + x, 54, 4, 3, c(['red', 'yellow', 'blue', 'green'][((x / 8) % 4) | 0], 2));
  centered(p, 44, 'HAPPY BIRTHDAY TEDDY', c('red', 1), 1, undefined, bannerX + 118);
  const R = rng(5);
  for (let i = 0; i < 10; i++)
    balloon(p, i < 5 ? 14 + i * 14 : 236 + (i - 5) * 16, 70 + Math.floor(R() * 20), ['red', 'yellow', 'blue', 'green', 'pink'][i % 5], ((f + i) % 4) - 2);
  cake(p, 160, 152, f);
  // the Clown Club at the left, Doc Leo at the right in his best fedora, the geese up front
  scaleBlit(p, KLUB.honker, 0, 72, 2);
  scaleBlit(p, KLUB.bubbles, 34, 76, 2);
  scaleBlit(p, KLUB.pratfall, 68, 70, 2);
  leoAt(p, f % 8 < 4 ? 'wave' : 'front', 268, 72, 2);
  scaleBlit(p, KLUB.twirly, 232, 76, 2);
  for (let k = 0; k < 3; k++) scaleBlit(p, CRITTERS[(f + k) % 2 ? 'goose1' : 'goose2'], 4 + k * 22, 166, 1, true);
  return p;
}

/** Confetti falling over everything. */
function confetti(p: Pixels, f: number): void {
  const R = rng(9);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(R() * W) + Math.round(Math.sin(f / 3 + i) * 3);
    const y = (Math.floor(R() * H) + f * 5) % 150;
    p.rect(x, y, 2, 2, c(['red', 'yellow', 'blue', 'green', 'pink'][i % 5], 3));
  }
}

export function surpriseFli(): Uint8Array {
  const r = new Reel(bigTop(false));
  // in the dark: a sliver of light from the flap, and Teddy padding in
  for (let f = 0; f < 22; f++)
    r.frame((p) => {
      for (let y = 100; y < 170; y++) p.rect(0, y, Math.max(0, 40 - Math.abs(y - 140)), 1, c('ink', 1));
      teddyAt(p, f < 16 ? (f % 2 ? 'walk1' : 'walk2') : 'front', Math.min(130, -40 + f * 11), 132);
      caption(p, 'THE BIG TOP IS DARK.');
      caption(p, 'TEDDY PADS INTO THE RING...', 22);
    });
  for (let f = 0; f < 14; f++)
    r.frame((p) => {
      teddyAt(p, f % 4 < 2 ? 'frontSniff' : 'frontSniff2', 130, 132);
      outlined(p, 196, 140, 'SNIFF', c('green', 2), c('ink', 0), 1);
      caption(p, 'SNIFF... SNIFF...');
      if (f >= 6) caption(p, 'THAT SMELLS LIKE... CAKE?', 22);
    });
  // the lights come up from the middle of the ring
  for (let f = 0; f < 8; f++)
    r.frame((p) => {
      const lit = party(0);
      const rad = 20 + f * 28;
      p.px.set(lit.map((x, y, k) => ((x - 160) ** 2 + ((y - 150) * 1.4) ** 2 < rad * rad ? k : p.get(x, y))).px);
      teddyAt(p, 'frontTilt', 130, 132);
    });
  r.scene(bigTop(true));
  for (let f = 0; f < 26; f++)
    r.frame((p) => {
      p.px.set(party(f).px);
      teddyAt(p, f % 4 < 2 ? 'frontHop' : 'frontBeg', 120, 132 - (f % 4 < 2 ? 6 : 0));
      gwinnAt(p, f % 2 ? 'gwinnRun1' : 'gwinnRun2', 300 - Math.min(f, 10) * 10, 140, 2);
      confetti(p, f);
      const bounce = f < 6 ? 6 - f : 0;
      centered(p, 8 - bounce * 2, 'SURPRISE!', c('yellow', 3), 3, c('red', 1));
    });
  // Gwinn brings her best bone, with a bow on it, and drops it at his paws. Then she SITS.
  for (let f = 0; f < 30; f++)
    r.frame((p) => {
      p.px.set(party(f + 26).px);
      teddyAt(p, f < 18 ? 'front' : f % 4 < 2 ? 'frontBeg' : 'frontReach', 120, 132);
      if (f < 10) gwinnAt(p, 'gwinn1', 196, 132, 3, true);
      else scaleBlit(p, gwinnSits(false, f % 2), 196, 132, 3);
      if (f >= 6) scaleBlit(p, errandSprite('bestBone'), 164, 144, 2);
      if (f >= 10)
        for (const [dx, dy] of [
          [-6, 0],
          [62, 6],
          [28, -8],
        ])
          if (f % 4 < 2) p.rect(196 + dx, 136 + dy, 2, 2, c('yellow', 3));
      confetti(p, f + 26);
      caption(p, 'GWINN BRINGS HIM HER BEST BONE.');
      if (f >= 10) caption(p, 'THEN SHE SITS. ON PURPOSE!', 22, c('yellow', 3));
    });
  for (let f = 0; f < 18; f++)
    r.frame((p) => {
      p.px.set(party(f + 56).px);
      teddyAt(p, f % 6 < 3 ? 'frontBeg' : 'frontHop', 120, 132);
      scaleBlit(p, gwinnSits(false, f % 2), 196, 132, 3);
      scaleBlit(p, errandSprite('bestBone'), 164, 144, 2);
      confetti(p, f + 56);
      micro(p, 132, 124, f % 4 < 2 ? 'WOOF!' : '', c('paint', 3));
      caption(p, 'HAPPY BIRTHDAY, TEDDY!', 10, c('yellow', 3));
      caption(p, 'THE LITTLEST DOG. THE BIGGEST DAY.', 22);
    });
  return r.fli(6);
}
