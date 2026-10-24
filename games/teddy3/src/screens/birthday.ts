// birthday.fli, the opening cartoon (after the Sandbox Software logo, and before the story
// pages): dawn at Doc Leo's house. Teddy wakes up and nobody says happy birthday; Gwinn's bed
// is empty again; Doc Leo hands him a list of ERRANDS. Then the camera winks at the audience
// (a paw print on today's date, a party hat peeking out of the cupboard) and the logo drops in.
import { Pixels } from '../../../kit/pixels';
import { blob, gradient, micro, outlined, scaleBlit } from '../art/draw';
import { errandSprite } from '../sprites/errands';
import { H, Reel, W, c, caption, leoAt, teddyAt } from './reel';
import { SP, landscape, logo, titleScreen } from './screens';

/** A paw print: the pad and four toes. */
export function paw(p: Pixels, x: number, y: number, s: number, col: number): void {
  p.disc(x, y + s, s * 1.4, col);
  for (const [dx, dy] of [
    [-2.2, -1.2],
    [-0.8, -2.4],
    [0.8, -2.4],
    [2.2, -1.2],
  ])
    p.disc(Math.round(x + dx * s), Math.round(y + dy * s), Math.max(1, s * 0.6), col);
}

/** A striped party hat with a pompom, its point at (x, y), `h` tall. */
export function partyHat(p: Pixels, x: number, y: number, h: number, a = 'blue', b = 'yellow'): void {
  for (let k = 0; k < h; k++) {
    const half = Math.round((k * h) / (2 * h) / 1.4);
    p.rect(x - half, y + k, half * 2 + 1, 1, c(Math.floor((k + 2) / 4) % 2 ? a : b, 2 + (k < h / 2 ? 1 : 0)));
  }
  p.disc(x, y - 1, Math.max(2, h / 8), c('red', 3));
}

/** The wall calendar: a red header, rings, a grid of days, and today with a red paw print. */
function calendar(p: Pixels, x: number, y: number, s: number, today = 17): void {
  const w = 7 * 6 * s + 4;
  const h = 5 * 6 * s + 12 * s;
  p.rect(x + 2, y + 2, w, h, c('peach', 0));
  p.rect(x, y, w, h, c('paint', 3)).frame(x, y, w, h, c('ink', 0));
  p.rect(x + 1, y + 1, w - 2, 8 * s, c('red', 2));
  for (let k = 0; k < 4; k++) p.rect(x + 6 + k * Math.round((w - 12) / 3) - 1, y - 2, 2, 5, c('metal', 1));
  for (let d = 0; d < 35; d++) {
    const gx = x + 2 + (d % 7) * 6 * s;
    const gy = y + 10 * s + Math.floor(d / 7) * 6 * s;
    p.frame(gx, gy, 6 * s + 1, 6 * s + 1, c('stone', 3));
    if (s >= 3 && d > 2 && d < 34) micro(p, gx + 2, gy + 2, String(d - 2), c('ink', 1));
    if (d === today) paw(p, gx + 3 * s, gy + 3 * s + Math.floor(s / 2), Math.max(1, s * (s > 1 ? 1.1 : 0.7)), c('red', 2));
  }
}

/** Doc Leo's front room at dawn: the window, the calendar, the cupboard, the two beds. */
function frontRoom(hatOut = 3): Pixels {
  const p = new Pixels(W, H);
  for (let y = 0; y < 150; y++) for (let x = 0; x < W; x++) p.set(x, y, Math.floor(x / 10) % 2 ? c('peach', 2) : c('peach', 3));
  // the window: a pink dawn outside, the sun just up over the hills
  p.rect(214, 24, 80, 64, c('paint', 3));
  for (let y = 28; y < 84; y++) p.rect(218, y, 72, 1, c('dusk', 4 + Math.floor((y - 28) / 8)));
  p.disc(268, 74, 8, c('glow', 3));
  for (let x = 218; x < 290; x++) p.rect(x, 78 + Math.round(Math.sin(x / 9) * 2), 1, 84 - 78 - Math.round(Math.sin(x / 9) * 2), c('grass', 1));
  p.rect(252, 28, 4, 56, c('paint', 3)).rect(218, 54, 72, 4, c('paint', 3));
  calendar(p, 128, 24, 1);
  // the cupboard, its door open a crack: a party hat peeks out (more as `hatOut` grows)
  p.rect(10, 62, 52, 88, c('wood', 1)).frame(10, 62, 52, 88, c('wood', 0));
  p.rect(14, 66, 21, 80, c('wood', 2)).rect(37, 66, 21, 80, c('wood', 2));
  p.rect(31, 102, 2, 6, c('metal', 3)).rect(39, 102, 2, 6, c('metal', 3));
  if (hatOut > 0) {
    p.rect(35, 70, 2 + hatOut, 18, c('ink', 0));
    partyHat(p, 37 + hatOut, 72, 14);
  }
  p.rect(0, 150, W, 50, c('wood', 2));
  for (let x = 0; x < W; x += 32) p.rect(x, 150, 1, 50, c('wood', 0));
  p.rect(0, 150, W, 3, c('wood', 4));
  // the beds: Teddy's little blue one, Gwinn's big purple one (empty but for a dent)
  blob(p, 76, 168, 34, 12, SP.r('blue'), 0, 3);
  blob(p, 76, 166, 22, 6, SP.r('blue'), 1, 2);
  blob(p, 210, 170, 48, 16, SP.r('purple'), 0, 3);
  blob(p, 210, 168, 34, 8, SP.r('purple'), 0, 1);
  micro(p, 192, 186, 'GWINN', c('paint', 3));
  // the doggy door at the right
  p.rect(294, 140, 26, 34, c('ink', 0)).rect(296, 142, 22, 30, c('wood', 1)).rect(296, 142, 22, 4, c('wood', 3));
  return p;
}

/** Doc Leo's little blue house at dawn, the sun coming up (`t` 0..1) behind the hills. */
function houseAtDawn(t: number): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 140, SP.r('dusk'), Math.round(t * 3), 11);
  p.disc(80, Math.round(140 - t * 46), 18, c('glow', 3));
  const fold = (x: number) => 120 + Math.round(Math.sin(x / 40) * 6 + Math.sin(x / 15) * 2);
  for (let x = 0; x < W; x++) for (let y = fold(x); y < H; y++) p.set(x, y, c('grass', y - fold(x) < 2 ? 3 : 1));
  // the house: siding, a red roof, a door, and one window going gold
  p.rect(150, 86, 120, 70, c('siding', 2));
  for (let y = 88; y < 156; y += 5) p.rect(150, y, 120, 1, c('siding', 1));
  for (let k = 0; k < 34; k++) p.rect(144 + k * 2, 86 - k, 132 - k * 4, 1, c('roof', 1 + (k % 6 === 0 ? 1 : 0)));
  p.rect(232, 112, 22, 44, c('wood', 1)).rect(250, 132, 2, 3, c('gold', 2));
  p.rect(166, 104, 40, 28, c('paint', 3)).rect(169, 107, 34, 22, t > 0.5 ? c('glow', 2) : c('sky', 1));
  p.rect(185, 107, 2, 22, c('paint', 3));
  return p;
}

/** The list Doc Leo hands over, close up: ERRANDS, and the things on it. */
function theList(): Pixels {
  const p = new Pixels(W, H, c('wood', 2));
  for (let y = 0; y < H; y += 9) p.rect(0, y, W, 1, c('wood', 1));
  p.rect(74, 14, 176, 182, c('ink', 0));
  p.rect(70, 10, 176, 182, c('paint', 3)).frame(70, 10, 176, 182, c('ink', 0));
  for (let y = 44; y < 186; y += 12) p.rect(74, y, 168, 1, c('blue', 3));
  p.rect(90, 10, 1, 182, c('red', 3));
  outlined(p, 104, 18, 'ERRANDS', c('red', 2), c('ink', 0), 2);
  const items: [string, string][] = [
    ['keys', 'CAR KEYS'],
    ['streamers', 'KITE STREAMERS'],
    ['candles', 'CANDLES'],
    ['banner', 'A BANNER'],
    ['horns', 'HORNS'],
    ['lantern', 'A LANTERN'],
  ];
  items.forEach(([name, words], i) => {
    const y = 44 + i * 24;
    scaleBlit(p, errandSprite(name), 96, y - 6, 1);
    micro(p, 122, y + 4, words, c('ink', 1), 2);
  });
  micro(p, 150, 182, 'THANKS BUDDY', c('blue', 1));
  return p;
}

/** The wink, close up: the calendar's today with its paw print, the hat peeking out next door. */
function calendarCloseUp(hatOut: number): Pixels {
  const p = new Pixels(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, Math.floor(x / 20) % 2 ? c('peach', 2) : c('peach', 3));
  calendar(p, 16, 22, 4);
  // the cupboard's edge at the right, its door open a crack, a party hat peeking out
  p.rect(232, 0, 88, H, c('wood', 1)).rect(240, 0, 80, H, c('wood', 2)).rect(232, 0, 3, H, c('wood', 0));
  p.rect(214, 40, 18, 110, c('ink', 0));
  partyHat(p, 222 - hatOut, 62, 40, 'pink', 'yellow');
  return p;
}

export function birthdayFli(): Uint8Array {
  const r = new Reel(houseAtDawn(0));
  for (let f = 0; f < 16; f++)
    r.frame((p) => {
      p.px.set(houseAtDawn(f / 15).px);
      caption(p, "DAWN AT DOC LEO'S HOUSE.");
      if (f >= 6) caption(p, 'A VERY BIG DAY FOR A LITTLE DOG.', 22);
    });
  r.scene(frontRoom());
  for (let f = 0; f < 22; f++)
    r.frame((p) => {
      teddyAt(p, f < 10 ? 'sleep' : f === 12 || f === 13 ? 'frontBlink' : 'front', 46, 118);
      if (f < 10 && f % 4 < 2) outlined(p, 110, 104 - (f % 8), 'Z', c('paint', 3), c('ink', 0), 2);
      caption(p, 'TEDDY WAKES UP. IT IS HIS');
      caption(p, 'BIRTHDAY! (HE IS PRETTY SURE.)', 22);
    });
  for (let f = 0; f < 18; f++)
    r.frame((p) => {
      teddyAt(p, f % 6 < 3 ? 'front' : 'frontTilt', 46, 118);
      caption(p, 'NOBODY SAYS HAPPY BIRTHDAY.');
      if (f >= 8) caption(p, 'NOT ONE WORD.', 22);
    });
  for (let f = 0; f < 18; f++)
    r.frame((p) => {
      teddyAt(p, 'frontTilt', 46, 118);
      if (f >= 6) outlined(p, 200, 128, '?', c('yellow', 3), c('ink', 0), 3);
      caption(p, "AND GWINN'S BED IS EMPTY.");
      if (f >= 8) caption(p, '(NOT AGAIN!)', 22);
    });
  for (let f = 0; f < 28; f++)
    r.frame((p) => {
      const x = Math.max(150, 300 - f * 14);
      const walking = x > 150;
      leoAt(p, walking ? `side${(f % 4) + 1}` : f % 8 < 4 ? 'front' : 'frontBlink', x, 74, 2, walking);
      teddyAt(p, f < 14 ? 'front' : 'frontBeg', 64, 118);
      if (!walking) {
        // the list in his hand, held out to Teddy
        p.rect(130, 108, 20, 24, c('paint', 3)).frame(130, 108, 20, 24, c('ink', 0));
        for (let k = 0; k < 5; k++) p.rect(133, 112 + k * 4, 12 - (k % 2) * 4, 1, c('ink', 1));
      }
      caption(p, walking ? '"GOOD MORNING, BUDDY!"' : '"HERE IS A LIST OF ERRANDS.');
      if (!walking) caption(p, 'LOTS TO DO TODAY!"', 22);
    });
  r.scene(theList());
  r.frame(() => {}, 18);
  r.scene(frontRoom());
  for (let f = 0; f < 14; f++)
    r.frame((p) => {
      teddyAt(p, f % 4 < 2 ? 'walk1' : 'walk2', 80 + f * 12, 118);
      caption(p, 'JUST ERRANDS. NOTHING SPECIAL.');
    });
  // the camera stays behind for a wink to the audience
  for (let f = 0; f < 22; f++)
    r.frame((p) => {
      p.px.set(calendarCloseUp(Math.min(12, f * 2)).px);
      if (f % 4 < 2)
        for (const [dx, dy] of [
          [-30, -18],
          [26, -14],
          [-4, 26],
        ])
          p.rect(102 + dx, 122 + dy, 3, 3, c('yellow', 3));
      if (f >= 6) caption(p, 'BUT LOOK WHAT DAY IT IS...', 190 - 12);
      if (f >= 12) caption(p, '(SHH. DO NOT TELL TEDDY.)', 190, c('yellow', 3));
    });
  // the logo drops in, bouncing, over the morning
  for (let f = 0; f < 14; f++) {
    const drop = Math.round(-90 * Math.cos((f / 13) * Math.PI * 2.5) * (1 - f / 13));
    r.frame((p) => {
      p.px.set(landscape(7).px);
      logo(p, 6 + Math.min(0, drop) + (drop > 0 ? Math.round(drop / 6) : 0));
    });
  }
  r.frame((p) => p.px.set(titleScreen().px), 4);
  return r.fli(8);
}
