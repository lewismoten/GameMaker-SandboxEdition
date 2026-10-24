// The cartoons (FLIs drawn here, frame by frame, with the game's own sprites): the song's
// animated cover for the title (its fourteen frames, a man by an oasis holding a needle up to a
// camel and the picture closing in until the needle's eye is an actual eye, dithered into one
// palette), the story (the rich man walks off; was He talkin' 'bout ME?), the level cards, how
// to play, the camel kneeling in the dusk (lost), and the endings (through the eye of the
// needle; stitched whole with Heaven's seam; THE END). Each reel opens on black and fades by
// palette (kit/reel.ts); only what moves is stored.
import { loadScan, resample } from '../../../kit/photo';
import { Pixels, rng } from '../../../kit/pixels';
import { medianCutPalette, Quantizer } from '../../../kit/quantize';
import { Reel } from '../../../kit/reel';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';
import { desertBackdrop, palm } from './screens';
import { AUTHOR, CARDS } from './text';

const W = 320;
const H = 200;
/** 1/70 s per frame: about 12 frames a second. */
export const SPEED = 6;

export interface Cast {
  /** The camel, posed (20x40: his top block over his bottom), as he is in each level ('loaded'... 'bare'). */
  camel: (pose: string, form?: string) => Pixels;
  /** Everybody else's sprites (the .MBL's pictures). */
  mons: Map<string, Pixels>;
}

/** A four-point twinkle of size 0..3. */
function twinkle(p: Pixels, pal: Pal, x: number, y: number, size: number, ramp = 'star'): void {
  if (size <= 0) return;
  p.set(x, y, pal.c(ramp, 2));
  for (let k = 1; k <= size; k++) {
    const col = pal.c(ramp, Math.max(0, 2 - k));
    p.set(x + k, y, col)
      .set(x - k, y, col)
      .set(x, y + k, col)
      .set(x, y - k, col);
  }
}

/** The bar along the bottom with one or two lines of the song. */
function caption(p: Pixels, pal: Pal, lines: string[]): void {
  p.rect(0, 172, W, H - 172, pal.c('ink', 0));
  lines.forEach((l, i) => centered(p, 176 + i * 12, l, pal.c(i ? 'gold' : 'white', i ? 4 : 2)));
}

/** A speech bubble with words over (x, y). */
function shout(p: Pixels, pal: Pal, x: number, y: number, words: string): void {
  const w = textWidth(words) + 8;
  const bx = Math.max(2, Math.min(W - w - 2, Math.round(x - w / 2)));
  p.rect(bx, y, w, 13, pal.c('white', 2)).frame(bx, y, w, 13, pal.c('ink', 0));
  p.line(x, y + 13, x - 3, y + 17, pal.c('ink', 0)).line(x - 3, y + 17, x - 6, y + 13, pal.c('ink', 0));
  outlined(p, bx + 4, y + 3, words, pal.c('red', 1), pal.c('white', 2));
}

const sprite = (set: Map<string, Pixels>, name: string) => {
  const s = set.get(name);
  if (!s) throw new Error(`No sprite ${name}`);
  return s;
};

/** A great golden needle standing at (cx, top) to (cx, bottom), its eye an actual eye, open by `open` (0..1). */
function bigNeedle(p: Pixels, pal: Pal, cx: number, top: number, bottom: number, s: number, open = 1, look = 0): { ey: number } {
  const c = pal.c;
  const head = 60 * s;
  for (let y = top; y < bottom; y++) {
    const t = y - top;
    const w =
      t < head * 0.45
        ? (t / (head * 0.45)) * 15 * s
        : t < head
          ? 15 * s - ((t - head * 0.45) / (head * 0.55)) * 5 * s
          : bottom - y < 30 * s
            ? ((bottom - y) / (30 * s)) * 10 * s
            : 10 * s;
    for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++)
      p.set(x, y, pal.r('gold')[Math.max(0, Math.min(4, Math.round(4 - ((x - cx + w) / (2 * w + 1)) * 3 + (x % 7 === 0 ? 0.5 : 0))))]);
  }
  const ey = Math.round(top + head * 0.62);
  const rx = 12 * s;
  const ry = 10 * s * open;
  for (let y = Math.round(ey - 10 * s); y <= ey + 10 * s; y++)
    for (let x = Math.round(cx - rx); x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - ey) / Math.max(0.6, ry)) ** 2;
      if (d > 1) continue;
      const r = Math.hypot(x - cx - look * 4 * s, y - ey);
      p.set(x, y, r < 3.4 * s ? c('ink', 0) : r < 8 * s ? pal.r('purple')[Math.max(0, Math.min(3, Math.round(3 - r / (3 * s))))] : c('white', y > ey ? 1 : 2));
    }
  if (open > 0.5) p.disc(cx - 3 * s + look * 4 * s, ey - 3 * s, 1.2 * s, c('white', 2));
  for (let a = 0; a < 7; a++) p.line(cx - 9 * s + a * 3 * s, ey - ry - 1, cx - 10 * s + a * 3.2 * s, ey - ry - 4 * s, c('ink', 0));
  return { ey };
}

// ---- the title: the song's animated cover ---------------------------------------------------

/** The cover frames in story order (games/kit/scans/needle1..14.jpg) and how long each one shows (frames). */
const COVER: [number, number][] = [
  [1, 10],
  [3, 3],
  [4, 3],
  [5, 3],
  [6, 3],
  [7, 3],
  [8, 3],
  [9, 3],
  [10, 3],
  [11, 3],
  [12, 3],
  [13, 3],
  [14, 6],
];

/** The cover as a 320x200 true-color picture: the square frame's middle, filling the screen (VGA's pixels are tall). */
function coverRgb(k: number): Uint8Array {
  return resample(loadScan(`needle${k}`), W, H, [0.02, 0.06, 0.98, 0.79]).rgb;
}

/** The title cartoon (cover.fli) and its last picture with the name on it (title.gif's pixels and palette). */
export function coverFli(): { fli: Uint8Array; title: Pixels; pal: Uint8Array } {
  const frames = COVER.map(([k]) => coverRgb(k));
  // inks for the lettering first (black, gold, its shadow, a dark band, white), then the cover's colors
  const INKS: [number, number, number][] = [
    [0, 0, 0],
    [255, 214, 70],
    [140, 80, 10],
    [36, 22, 16],
    [255, 252, 240],
  ];
  const pal = medianCutPalette(frames, INKS);
  const q = new Quantizer(pal, 10);
  // Where a frame hardly differs from the one before, it keeps the pixels it had: the scans'
  // noise would otherwise change every frame of the FLI.
  const pics: Pixels[] = [];
  frames.forEach((f, i) => {
    const p = new Pixels(W, H);
    p.px.set(q.apply(f, W, H));
    const prev = frames[i - 1];
    if (prev)
      for (let j = 0; j < W * H; j++) {
        const d = Math.abs(f[j * 3] - prev[j * 3]) + Math.abs(f[j * 3 + 1] - prev[j * 3 + 1]) + Math.abs(f[j * 3 + 2] - prev[j * 3 + 2]);
        if (d < 24) p.px[j] = pics[i - 1].px[j];
      }
    pics.push(p);
  });
  const name = (p: Pixels, drop: number, sub: boolean) => {
    for (const [line, dy] of [
      ['THREAD THE NEEDLE,', 0],
      ['BROTHER CAMEL', 20],
    ] as const)
      outlined(p, 160 - textWidth(line, 2) / 2, drop + dy, line, 1, 3, 2, 2);
    if (sub) {
      p.rect(0, 186, W, 14, 3);
      centered(p, 189, `${AUTHOR} (c) 1995 Shareware`, 4);
    }
  };
  const r = new Reel(pal);
  r.fadeIn(pics[0], 4);
  // closing in on the needle until its eye looks back
  COVER.forEach(([, hold], i) => r.add(pics[i], hold));
  const last = pics[pics.length - 1];
  for (const [k, drop] of [220, 196, 172, 150, 140, 145, 142].entries()) {
    const p = new Pixels(W, H);
    p.px.set(last.px);
    name(p, drop, k >= 5);
    r.add(p, k === 6 ? 10 : 1);
  }
  const title = new Pixels(W, H);
  title.px.set(last.px);
  name(title, 142, true);
  return { fli: r.fli(SPEED), title, pal };
}

// ---- the story: the rich man walks off; was He talkin' 'bout ME? ---------------------------

export function storyFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = desertBackdrop(pal, 150);
  palm(bg, pal, 236, 152, 80);
  const lines = (k: number) =>
    k < 18
      ? ["I was mindin' my humps", 'by the city gate...']
      : k < 38
        ? ['The man walked off', 'with his coins and frown...']
        : k < 54
          ? ['"...easier for a camel to go', 'through the eye of a needle..."']
          : ["Was He talkin' 'bout ME?!", 'My double-wide stride?'];
  const scene = (p: Pixels, k: number) => {
    // the rich man walks off to the right with his moneybags, nose in the air
    if (k >= 10 && k < 44) {
      const x = 120 + (k - 10) * 7;
      scaleBlit(p, sprite(cast.mons, `richA${k % 2}`), x, 112, 2);
      scaleBlit(p, sprite(cast.mons, `richB${k % 2}`), x + 40, 112, 2);
      if (k >= 14 && k < 26) shout(p, pal, x + 40, 84, 'HMPH!');
    }
    // the words, from off to the side
    if (k >= 38 && k < 54) shout(p, pal, 40, 30, '...A CAMEL...');
    // the camel by the gate, chewing; then he looks round at himself
    const pose = k >= 54 ? (k % 6 < 3 ? 'hurt' : 'stand') : k % 10 < 3 ? 'chew' : k % 23 === 0 ? 'blink' : 'stand';
    scaleBlit(p, cast.camel(pose === 'hurt' ? 'dream' : pose), 70, 72, 2);
    if (k >= 54) {
      shout(p, pal, 100, 44, 'ME?!');
      if (k % 4 < 2)
        for (const [x, y] of [
          [60, 70],
          [118, 66],
        ])
          p.line(x, y, x + (x < 100 ? -6 : 6), y - 6, c('red', 2));
    }
    caption(p, pal, lines(k));
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 4);
  for (let k = 0; k < 70; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the level cards ------------------------------------------------------------------------

export interface CardView {
  /** The level's view (16 x 6 blocks), in the level's palette. */
  map: Pixels;
  pal: Pal;
  /** The camel's form in that level. */
  form: string;
}

/** The strip of level on a card: y 54 to 174. */
const STRIP = 54;

export function cardFli(i: number, card: CardView, cast: Cast): Uint8Array {
  const pal = card.pal;
  const c = pal.c;
  const ink = c('ink', 0);
  const info = CARDS[i];
  const bg = new Pixels(W, H, ink);
  bg.blit(card.map, 0, STRIP);
  const camel = (pose: string) => cast.camel(pose, card.form);
  const frame = (p: Pixels, k: number) => {
    p.rect(0, 0, W, STRIP, ink).rect(0, 174, W, 26, ink);
    p.rect(0, STRIP - 1, W, 1, c('gold', 2)).rect(0, 174, W, 1, c('gold', 2));
    const drop = [-24, -14, -2, 10, 6, 8][Math.min(5, k)];
    outlined(p, 160 - textWidth(info.title, 2) / 2, drop, info.title, c('gold', 4), c('ink', 1), 2);
    if (k >= 5) centered(p, 32, info.where, c('white', 2));
    if (k >= 9) centered(p, 178, `"${info.lines[0]}`, c('white', 2));
    if (k >= 15) centered(p, 189, ` ${info.lines[1]}"`, c('white', 2));
  };
  const say = (p: Pixels, x: number, y: number, words: string) => outlined(p, Math.round(x - textWidth(words) / 2), y, words, c('gold', 4), ink);
  const actors: ((p: Pixels, k: number) => void)[] = [
    // 1. the city gate: he walks up and a coin flies to the beggar's bowl
    (p, k) => {
      const x = Math.min(150, 20 + k * 8);
      scaleBlit(p, camel(k * 8 < 130 ? `walk${k % 3}` : 'stand'), x, STRIP + 40, 2);
      if (k >= 17) {
        const t = Math.min(1, (k - 17) / 5);
        p.disc(Math.round(190 + t * 40), Math.round(STRIP + 60 - Math.sin(t * Math.PI) * 30 + t * 40), 3, c('gold', 3));
      }
      if (k >= 22) say(p, 230, STRIP + 8, 'BLESS YOU!');
    },
    // 2. the desert: he kneels, humps down, and crawls under the rock
    (p, k) => {
      const x = 40 + k * 6;
      const low = k >= 8;
      scaleBlit(p, camel(low ? `crawl${k % 2}` : `walk${k % 3}`), x, STRIP + 40, 2);
      if (low && k < 20) say(p, x + 20, STRIP + 20, 'HUMP DOWN!');
    },
    // 3. the tailor's: he climbs a red thread
    (p, k) => {
      const y = STRIP + 70 - k * 4;
      for (let yy = 0; yy < 120; yy++) p.set(160 + Math.round(Math.sin(yy / 6) * 2), STRIP + yy, c('red', 3));
      scaleBlit(p, camel('hop'), 140, y, 2);
      if (k >= 18) say(p, 230, STRIP + 10, 'THREAD UP!');
    },
    // 4. the eye: he walks along the top cloud, kneels and crawls toward the eye; it blinks
    (p, k) => {
      // the eye's lid (the map's needle head is at x 220..259, its pupil row at y STRIP + 80)
      if (k % 12 < 2) p.rect(224, STRIP + 64, 32, 12, c('gold', 3)).rect(224, STRIP + 75, 32, 1, c('ink', 0));
      const x = Math.max(262, 312 - k * 3);
      const low = k >= 8;
      scaleBlit(p, camel(low ? `crawl${k % 2}` : `walk${k % 3}`), x, STRIP + 60, 1, true);
      if (k >= 14) say(p, 150, STRIP + 30, 'MERCY, COME!');
    },
  ];
  const r = new Reel(pal.pal);
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  actors[i](first, 0);
  frame(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 28; k++) r.frame(bg, (p) => (actors[i](p, k), frame(p, k)));
  return r.fli(SPEED);
}

// ---- how to play: give a coin, kneel, crawl through the eye gate -------------------------------

export function howtoFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = desertBackdrop(pal, 150, 7, false);
  // a sandstone wall with an eye gate cut in it, low
  for (let y = 40; y < 150; y++) for (let x = 230; x < 270; x++) bg.set(x, y, c('sand', ((x >> 2) + (y >> 3)) % 3));
  const gateY = 112;
  const scene = (p: Pixels, k: number) => {
    // a beggar by the road; the camel walks up, a coin, a sparkle of grace
    const opened = k >= 40;
    if (!opened) {
      for (let y = gateY; y < 150; y++) for (let x = 240; x < 260; x++) p.set(x, y, c('grace', Math.abs(x - 250) < 4 ? 2 : 0));
    } else for (let y = gateY; y < 150; y++) for (let x = 230; x < 270; x++) p.set(x, y, c('sand', 1));
    let x = Math.min(100, 10 + k * 6);
    let pose = k * 6 < 100 ? `walk${k % 3}` : 'stand';
    if (k >= 30) {
      x = 100 + (k - 30) * 6;
      pose = `crawl${k % 2}`;
    }
    const y = 70;
    // the beggar on his mat, bowl out
    p.rect(146, 144, 34, 6, c('red', 1));
    blob(p, 162, 132, 10, 10, pal.r('cloth'), 0, 2);
    blob(p, 162, 116, 6, 6, pal.r('skin'), 1, 3);
    blob(p, 180, 138, 6, 3, pal.r('wood'), 1, 3);
    scaleBlit(p, cast.camel(pose), x, y, 2);
    if (k >= 16 && k < 30) {
      const t = Math.min(1, (k - 16) / 5);
      p.disc(Math.round(140 + t * 40), Math.round(110 - Math.sin(t * Math.PI) * 24 + t * 26), 3, c('gold', 3));
      if (k >= 21) for (let s = 0; s < 3; s++) twinkle(p, pal, 150 + s * 12, 100 - s * 6, 2, 'grace');
    }
    caption(
      p,
      pal,
      k < 16
        ? ['Walk up to the poor', 'and give them the gold.']
        : k < 30
          ? ['Every coin given', 'is a grace.']
          : ['A grace opens an eye gate:', 'then DOWN, and Z or C to crawl.'],
    );
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 56; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(3);
  return r.fli(SPEED);
}

// ---- kneeling in the dusk (the game is lost) ------------------------------------------------

export function lostFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = desertBackdrop(pal, 150, 11, false);
  gradient(bg, 0, 0, W, 130, pal.r('dusk'), 0, 6);
  const scene = (p: Pixels, k: number) => {
    const pose = k < 8 ? 'stand' : k < 16 ? 'kneel0' : k < 30 ? 'kneel1' : 'dream';
    scaleBlit(p, cast.camel(pose), 140, 72, 2);
    // the first star comes out, then more: just wait and dream
    for (let s = 0; s < Math.max(0, Math.min(6, Math.floor((k - 20) / 4))); s++) twinkle(p, pal, 40 + s * 47, 20 + ((s * 37) % 50), 1 + ((k + s) % 3));
    caption(p, pal, k < 30 ? ['Lord, I got knees', "that don't even bend..."] : ['Even a camel can dream.', 'Try again!']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 56; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the endings -----------------------------------------------------------------------------

/** won1.fli (through the eye of the needle), won2.fli (stitched whole with Heaven's seam), won3.fli (THE END). */
export function wonFlis(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const night = new Pixels(W, H);
  gradient(night, 0, 0, W, H, pal.r('dusk'), 0, 7);
  const rr = rng(21);
  for (let i = 0; i < 70; i++) night.set(Math.floor(rr() * W), Math.floor(rr() * 120), c('star', i % 3));
  {
    // the camel crawls along a cloud into the pupil of the great eye; light pours out of it
    const r = new Reel(pal.pal);
    const scene = (p: Pixels, k: number) => {
      const { ey } = bigNeedle(p, pal, 210, 0, 200, 2.2, 1, k < 20 ? Math.sin(k / 4) : -1);
      blob(p, 120, ey + 46, 110, 12, pal.r('white'), 0, 2);
      const x = Math.min(170, 20 + k * 5);
      const inside = x >= 170;
      if (!inside) scaleBlit(p, cast.camel(k < 8 ? `walk${k % 3}` : `crawl${k % 2}`, 'bare'), x, ey - 44, 2);
      if (inside) for (let a = 0; a < 14; a++) p.line(210, ey, 210 + Math.cos(a * 0.45) * 140, ey + Math.sin(a * 0.45) * 140, c('heaven', 4 + (a % 2)));
      caption(
        p,
        pal,
        k < 10
          ? ['Thread the needle,', 'Brother Camel...']
          : k < 34
            ? ['...tuck your humps', 'and squeeze on through!']
            : ['Hump down...', 'thread up... mercy come!'],
      );
    };
    const first = new Pixels(W, H);
    first.px.set(night.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 46; k++) r.frame(night, (p) => scene(p, k));
    r.fadeOut(3);
    files['won1.fli'] = r.fli(SPEED);
  }
  {
    // on the other side: dawn, the golden thread stitches a heart round him, doves come
    const r = new Reel(pal.pal);
    const dawn = new Pixels(W, H);
    gradient(dawn, 0, 0, W, H, pal.r('heaven'), 2, 5);
    const heart = (t: number) => [16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];
    const scene = (p: Pixels, k: number) => {
      const upTo = Math.min(1, k / 26) * Math.PI * 2;
      for (let t = 0; t < upTo; t += 0.01) {
        const [hx, hy] = heart(t);
        p.rect(Math.round(160 + hx * 5), Math.round(84 + hy * 5), 2, 2, c('red', (Math.floor(t * 20) % 2) + 2));
      }
      scaleBlit(p, cast.camel(k > 28 && k % 6 < 3 ? 'dream' : 'stand', 'bare'), 140, 52, 2);
      for (const [x, y, d] of [
        [40, 30, 0],
        [270, 40, 1],
        [70, 120, 1],
      ] as const)
        if (k > 20) scaleBlit(p, sprite(cast.mons, `dove${(k + d) % 2}`), x + (d ? -1 : 1) * (k - 20), y, 2, d === 1);
      caption(p, pal, k < 26 ? ['Let the Spirit pull you apart,', 'then stitch you whole...'] : ["...with Heaven's seam.", 'Even a camel can dream!']);
    };
    const first = new Pixels(W, H);
    first.px.set(dawn.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 46; k++) r.frame(dawn, (p) => scene(p, k));
    r.fadeOut(3);
    files['won2.fli'] = r.fli(SPEED);
  }
  {
    // THE END: the camel hops for joy among the stars
    const r = new Reel(pal.pal);
    const bg = new Pixels(W, H, c('purple', 0));
    const r2 = rng(77);
    for (let i = 0; i < 70; i++) bg.set(Math.floor(r2() * W), Math.floor(r2() * 150), c('star', i % 3));
    const scene = (p: Pixels, k: number) => {
      outlined(p, 160 - textWidth('THE END', 3) / 2, 14, 'THE END', c('gold', 4), c('ink', 0), 3, c('gold', 1));
      const hop = Math.round(Math.abs(Math.sin(k / 2.4)) * 16);
      scaleBlit(p, cast.camel(hop > 5 ? 'hop' : 'stand', 'bare'), 140, 64 - hop, 2);
      for (let t = 0; t < 8; t++) twinkle(p, pal, 60 + ((t * 47 + k * 5) % 200), 60 + ((t * 23 + k * 7) % 90), [0, 1, 2, 3, 2, 1][(k + t) % 6]);
      if (k >= 8) outlined(p, 160 - textWidth('EVEN A CAMEL', 2) / 2, 132, 'EVEN A CAMEL', c('gold', 3), c('ink', 0), 2);
      if (k >= 12) outlined(p, 160 - textWidth('CAN DREAM!', 2) / 2, 150, 'CAN DREAM!', c('gold', 3), c('ink', 0), 2);
      caption(p, pal, ['', 'Hump down... thread up... mercy come.']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 44; k++) r.frame(bg, (p) => scene(p, k));
    files['won3.fli'] = r.fli(SPEED);
  }
  return files;
}
