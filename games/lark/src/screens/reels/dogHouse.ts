// The two cartoons at the little red door of The Dog House, the story's bookends. door.fli (the
// workbench talk's last word): at closing time Joe opens the door, steps out under the stars,
// shuts it behind him and sets off down the road, counting: step one. home.fli (before opening
// time's page): at sunrise he comes back up the same road, the count running up to 12,816, stops
// at the door with the gold ticking in his chest, goes in, and the OPEN card goes up.
import { Pixels } from '../../../../kit/pixels';
import { Reel } from '../../../../kit/reel';
import { gradient, micro, scaleBlit } from '../../art/draw';
import { c, r } from '../../art/pal';
import { joe, type Dir, type Look } from '../../sprites/joe';
import { H, W, caption, close, lit, stars } from './common';

/** The doorway, and where Joe stands in it at scale 2. */
const DOOR = { x: 120, y: 116, w: 26, h: 48 };
const AT_DOOR = { x: 113, y: 124 };
/** Joe's feet on the road, at scale 2. */
const ROAD_Y = 138;

function dogHouse(morning: boolean): Pixels {
  const p = new Pixels(W, H);
  // the sky: night with stars, or the dawn coming up warm at the horizon, the sun just showing
  if (morning) {
    gradient(p, 0, 0, W, 104, r('dusk'), 1, 5);
    p.disc(276, 104, 14, c('gold', 4)).disc(276, 104, 10, c('gold', 5));
  } else {
    gradient(p, 0, 0, W, 104, r('dusk'), 0, 2);
    stars(p, 11, 90);
  }
  // far hills, and the town clock a long way down the road
  for (let x = 0; x < W; x++) {
    const y = Math.round(100 + Math.sin(x / 29) * 4 + Math.sin(x / 11) * 1.5);
    p.rect(x, y, 1, H - y, c('grass', 0));
  }
  p.rect(284, 72, 8, 30, c('ink', 1)).rect(286, 66, 4, 6, c('ink', 1));
  p.disc(288, 78, 2, c('window', morning ? 0 : 2));
  // The Dog House: a brick front with a parapet
  p.rect(16, 40, 220, 8, c('wood', 1)).rect(16, 40, 220, 1, c('wood', 3));
  for (let y = 48; y < 166; y += 6) for (let x = 16 + ((y / 6) % 2) * 6; x < 236; x += 12) p.rect(x, y, 11, 5, c('brick', 2 + ((x + y) % 3 === 0 ? 1 : 0)));
  for (let y = 53; y < 166; y += 6) p.rect(16, y, 220, 1, c('brick', 0));
  // its sign
  p.rect(70, 56, 112, 18, c('wood', 1)).frame(70, 56, 112, 18, c('wood', 3));
  micro(p, 74, 60, 'THE DOG HOUSE', c('paper', morning ? 3 : 2), 2);
  // the front window, lit, with the library's shelves in it
  p.rect(28, 84, 56, 58, c('wood', 0)).rect(31, 87, 50, 52, c('window', morning ? 1 : 2));
  for (const sy of [104, 124]) p.rect(31, sy, 50, 2, c('wood', 1));
  for (let x = 33; x < 79; x += 4) {
    p.rect(x, 96 + (x % 3), 3, 8 - (x % 3), c('ink', 1));
    p.rect(x, 116 + ((x + 1) % 3), 3, 8 - ((x + 1) % 3), c('ink', 1));
  }
  // the little red door's frame, the lamp over it
  p.rect(DOOR.x - 3, DOOR.y - 3, DOOR.w + 6, DOOR.h + 3, c('wood', 1));
  p.disc(DOOR.x + DOOR.w / 2, DOOR.y - 9, 3, c('window', 2)).rect(DOOR.x + DOOR.w / 2 - 1, DOOR.y - 5, 2, 2, c('ink', 0));
  // the ground: grass, the step down from the door, and the road off to the right
  p.rect(0, 166, W, H - 166, c('grass', 1));
  for (let x = 0; x < W; x += 7) p.set(x + ((x / 7) % 3), 170 + ((x / 7) % 4) * 6, c('grass', 2));
  p.rect(DOOR.x - 4, 164, DOOR.w + 8, 4, c('stone', 2));
  p.rect(DOOR.x - 6, 168, W - DOOR.x + 6, 12, c('stone', 3)).rect(DOOR.x - 6, 168, W - DOOR.x + 6, 1, c('stone', 4));
  for (let x = DOOR.x; x < W; x += 9) p.rect(x, 172 + ((x / 9) % 2) * 3, 5, 1, c('stone', 2));
  return p;
}

/** The door, open `open` of the way (0 shut, 1 open), the warm library behind it. */
function door(p: Pixels, open: number, card?: string): void {
  const { x, y, w, h } = DOOR;
  p.rect(x, y, w, h, c('window', 2));
  p.rect(x + 3, y + 8, w - 6, 2, c('wood', 2)).rect(x + 3, y + 22, w - 6, 2, c('wood', 2));
  const dw = Math.max(3, Math.round(w * (1 - open)));
  p.rect(x, y, dw, h, c('red', 2))
    .rect(x, y, dw, 1, c('red', 3))
    .rect(x + dw - 1, y, 1, h, c('red', 1));
  if (dw > 12) {
    p.frame(x + 3, y + 4, dw - 6, 16, c('red', 1)).frame(x + 3, y + 25, dw - 6, 18, c('red', 1));
    p.disc(x + dw - 5, y + 24, 1.5, c('brass', 3));
  }
  if (card && open === 0) {
    p.line(x + 9, y + 6, x + 13, y + 2, c('ink', 1)).line(x + 17, y + 6, x + 13, y + 2, c('ink', 1));
    p.rect(x + 3, y + 6, 20, 9, c('paper', 4)).frame(x + 3, y + 6, 20, 9, c('ink', 1));
    micro(p, x + 6, y + 8, card, c('red', 1));
  }
}

/** Joe at scale 2 with his bulb's glow round it; `clip` keeps him inside the doorway. */
function joeAt(p: Pixels, x: number, y: number, dir: Dir, step: number, look: Look, flip: boolean, glow: number, clip = false): void {
  p.disc(x + 20, y + 1, 4 + glow, c('window', 0)).disc(x + 20, y + 1, 2 + glow, c('window', 1));
  if (!clip) {
    scaleBlit(p, joe(dir, step, look), x, y, 2, flip);
    return;
  }
  const q = new Pixels(W, H, 255);
  scaleBlit(q, joe(dir, step, look), x, y, 2, flip);
  for (let yy = DOOR.y; yy < DOOR.y + DOOR.h; yy++)
    for (let xx = DOOR.x; xx < DOOR.x + DOOR.w; xx++) {
      const v = q.get(xx, yy);
      if (v !== 255) p.set(xx, yy, v);
    }
}

/** Joe's count, in the corner. */
function steps(p: Pixels, n: number): void {
  const s = `STEPS: ${n.toLocaleString('en-US')}`;
  p.rect(W - 12 - s.length * 8, 6, s.length * 8 + 6, 16, c('ink', 0));
  micro(p, W - 9 - s.length * 8, 9, s, c('paper', 4), 2);
}

export function doorFli(): Uint8Array {
  const bg = dogHouse(false);
  const reel = new Reel(lit('night'));
  const shut =
    (draw: (p: Pixels) => void = () => {}) =>
    (p: Pixels) => (door(p, 0), draw(p));
  for (let k = 1; k <= 8; k++) reel.frame(bg, shut(), 1, k / 8);
  reel.frame(bg, shut(), 4);
  // the door opens on Joe, his bow tie straight
  for (let k = 1; k <= 4; k++)
    reel.frame(bg, (p) => {
      door(p, k / 4);
      if (k > 1) joeAt(p, AT_DOOR.x, AT_DOOR.y, 'down', 0, 'open', false, 0, true);
    });
  reel.frame(bg, (p) => (door(p, 1), joeAt(p, AT_DOOR.x, AT_DOOR.y, 'down', 0, 'blink', false, 0, true)), 2);
  // out onto the step, down to the road
  for (let k = 1; k <= 6; k++)
    reel.frame(bg, (p) => {
      door(p, 1);
      joeAt(p, AT_DOOR.x, AT_DOOR.y + Math.round((k * (ROAD_Y - AT_DOOR.y)) / 6), 'down', k % 2, 'open', false, k % 2);
      caption(p, 'GONE TO FIND A REAL HEART.');
    });
  // he shuts it behind him, quietly
  for (let k = 3; k >= 0; k--)
    reel.frame(bg, (p) => {
      door(p, k / 4);
      joeAt(p, AT_DOOR.x, ROAD_Y, 'down', 0, k ? 'open' : 'shh', false, 0);
      caption(p, 'GONE TO FIND A REAL HEART.');
    });
  reel.frame(bg, (p) => (door(p, 0), joeAt(p, AT_DOOR.x, ROAD_Y, 'down', 0, 'glad', false, 1), caption(p, 'BACK BY OPENING TIME.')), 6);
  // and off down the road, counting
  for (let n = 1; n <= 22; n++)
    reel.frame(bg, (p) => {
      door(p, 0);
      joeAt(p, AT_DOOR.x + n * 10, ROAD_Y, 'side', n % 2, 'open', true, n % 2);
      steps(p, n);
      caption(p, n <= 3 ? 'STEP ONE.' : 'BACK BY OPENING TIME.');
    });
  reel.frame(bg, (p) => (door(p, 0), steps(p, 22), caption(p, 'BACK BY OPENING TIME.')), 6);
  return close(reel);
}

export function homeFli(): Uint8Array {
  const bg = dogHouse(true);
  const reel = new Reel(lit('day'));
  const start = 12816 - 20;
  // up the road at sunrise, counting
  for (let n = 0; n <= 20; n++)
    reel.frame(
      bg,
      (p) => {
        door(p, 0);
        joeAt(p, AT_DOOR.x + (20 - n) * 11, ROAD_Y, 'side', n % 2, 'open', false, 0);
        steps(p, start + n);
        if (n > 8) caption(p, 'OPENING TIME.');
      },
      1,
      Math.min(1, (n + 1) / 8),
    );
  // at the door: the gold in his chest ticks
  for (let k = 0; k < 12; k++)
    reel.frame(bg, (p) => {
      door(p, 0);
      joeAt(p, AT_DOOR.x, ROAD_Y, 'down', 0, 'glad', false, 0);
      const beat = k % 6 < 2;
      p.disc(AT_DOOR.x + 20, ROAD_Y + 25, beat ? 6 : 3, c('gold', beat ? 3 : 2)).disc(AT_DOOR.x + 20, ROAD_Y + 25, 2, c('gold', 5));
      steps(p, 12816);
      caption(p, k < 6 ? 'TICK.' : 'TOCK.');
    });
  // in he goes, up the step and through
  for (let k = 1; k <= 4; k++) reel.frame(bg, (p) => (door(p, k / 4), joeAt(p, AT_DOOR.x, ROAD_Y, 'up', 0, 'open', false, 0), steps(p, 12816)));
  for (let k = 1; k <= 6; k++)
    reel.frame(bg, (p) => {
      door(p, 1);
      joeAt(p, AT_DOOR.x, ROAD_Y - Math.round((k * (ROAD_Y - AT_DOOR.y + 10)) / 6), 'up', k % 2, 'open', false, 0, true);
      steps(p, 12816);
    });
  for (let k = 3; k >= 0; k--) reel.frame(bg, (p) => (door(p, k / 4), steps(p, 12816)));
  reel.frame(bg, (p) => (door(p, 0, 'OPEN'), steps(p, 12816), caption(p, 'OPENING TIME.')), 14);
  return close(reel);
}
