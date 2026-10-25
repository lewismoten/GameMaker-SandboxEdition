// The cartoons (FLIs drawn here, frame by frame, with the game's own sprites): the song's
// animated cover for the title (its seven frames, the seed popping out of its mound, bouncing
// and growing, dithered into one palette), the story (big loud things pass by looking for a
// miracle and never look down), the level cards, how to play, wilting, and the endings (the
// plant grows into a tree and the birds come to its branches; the palm of God's hand; THE
// END). Each reel opens on black and fades by palette (kit/reel.ts); only what moves is stored.
import { loadScan, resample } from '../../../kit/photo';
import { Pixels, rng } from '../../../kit/pixels';
import { medianCutPalette, Quantizer } from '../../../kit/quantize';
import { Reel } from '../../../kit/reel';
import { fadeOutLength } from '../../../kit/fadeOut';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { drawHand, HAND_W } from '../art/hand';
import { buildScreenPalette, type Pal } from '../art/pal';
import { gardenBackdrop, mound } from './screens';
import { AUTHOR, CARDS } from './text';

const W = 320;
const H = 200;
/** Clear pixels in sprites. */
const T = 255;
/** 1/70 s per frame: about 12 frames a second. */
export const SPEED = 6;

export interface Cast {
  /** The seed's sprites (the .CBL's pictures). */
  seed: Map<string, Pixels>;
  /** Everybody else's (the .MBL's pictures). */
  mons: Map<string, Pixels>;
  /** A background block's picture. */
  block: (name: string) => Pixels;
}

/** A four-point twinkle of size 0..3. */
function twinkle(p: Pixels, pal: Pal, x: number, y: number, size: number, ramp = 'faith'): void {
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
  lines.forEach((l, i) => centered(p, 176 + i * 12, l, pal.c(i ? 'seed' : 'white', i ? 4 : 2)));
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

// ---- the title: the song's animated cover ---------------------------------------------------

/** The cover frames in story order (games/kit/scans/seed1..7.jpg) and how long each one shows (frames). */
const COVER: [number, number][] = [
  [1, 8],
  [2, 4],
  [3, 3],
  [4, 3],
  [5, 3],
  [6, 4],
  [7, 6],
];

/** The cover as a 320x200 true-color picture: the square frame centered, its backdrop carried out to the sides. */
function coverRgb(k: number): Uint8Array {
  const s = resample(loadScan(`seed${k}`), 240, 200);
  const out = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const sx = Math.max(0, Math.min(239, x - 40));
      // past the cover's edges: its edge column, a touch darker toward the screen's sides
      const fade = x < 40 ? 1 - (40 - x) / 160 : x >= 280 ? 1 - (x - 279) / 160 : 1;
      for (let ch = 0; ch < 3; ch++) out[(y * W + x) * 3 + ch] = Math.round(s.rgb[(y * 240 + sx) * 3 + ch] * fade);
    }
  return out;
}

/** The title cartoon (cover.fli: the cover comes to life, an iris closes, a fade to black) and the cover with the name on it (title.gif's pixels and palette). */
export function coverFli(): { fli: Uint8Array; title: Pixels; pal: Uint8Array } {
  const frames = COVER.map(([k]) => coverRgb(k));
  // inks for the lettering first (black, the seed's gold, its shadow, white), then the cover's colors
  const INKS: [number, number, number][] = [
    [0, 0, 0],
    [255, 222, 60],
    [150, 84, 6],
    [36, 14, 18],
    [255, 252, 240],
  ];
  const pal = medianCutPalette(frames, INKS);
  const q = new Quantizer(pal, 10);
  // Where a frame hardly differs from the one before (the backdrop, the mound), it keeps the
  // pixels it had: the scans' noise would otherwise change every frame of the FLI.
  const pics: Pixels[] = [];
  frames.forEach((f, i) => {
    const p = new Pixels(W, H);
    p.px.set(q.apply(f, W, H));
    const prev = frames[i - 1];
    if (prev)
      for (let j = 0; j < W * H; j++) {
        const d = Math.abs(f[j * 3] - prev[j * 3]) + Math.abs(f[j * 3 + 1] - prev[j * 3 + 1]) + Math.abs(f[j * 3 + 2] - prev[j * 3 + 2]);
        if (d < 18) p.px[j] = pics[i - 1].px[j];
      }
    pics.push(p);
  });
  const name = (p: Pixels, drop: number, sub: boolean) => {
    outlined(p, 160 - textWidth('MUSTARD SEED HUSTLE', 2) / 2, drop, 'MUSTARD SEED HUSTLE', 1, 3, 2, 2);
    if (sub) {
      p.rect(0, 186, W, 14, 3);
      centered(p, 189, `${AUTHOR} (c) 1995 Shareware`, 4);
    }
  };
  const r = new Reel(pal);
  r.fadeIn(pics[0], 4);
  // the seed pops out, bounces and grows; then once more, faster, and it stays grown
  COVER.forEach(([, hold], i) => r.add(pics[i], hold));
  for (const i of [1, 2, 3, 4, 5]) r.add(pics[i], 2);
  const last = pics[6];
  // the name is the title picture's: the cartoon closes on an iris and fades to black instead
  r.irisOut(146, 44, 8).fadeOut(fadeOutLength(SPEED));
  const title = new Pixels(W, H);
  title.px.set(last.px);
  name(title, 8, true);
  return { fli: r.fli(SPEED), title, pal };
}

// ---- the story: big loud things looking for a miracle ---------------------------------------

export function storyFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = gardenBackdrop(pal, 150);
  mound(bg, pal, 110, 150, 36, 22);
  const seed = (p: Pixels, k: number) => {
    // the seed sits on top of its mound, blinking; when the coast is clear it hops for joy
    const hop = k >= 52 ? [0, 8, 14, 16, 14, 8, 0][Math.min(6, k - 52)] : 0;
    const pose = k >= 52 && hop ? 'seed.joy' : k % 14 === 7 ? 'seed.blink' : 'seed.front';
    scaleBlit(p, sprite(cast.seed, pose), 100, 104 - hop, 1);
  };
  const lines = (k: number) =>
    k < 20
      ? ["While we're lookin' for miracles,", 'big and loud and grand,']
      : k < 40
        ? ['the peacock struts, the crow hollers,', 'the mole digs for treasure...']
        : k < 52
          ? ['Nobody looks down', 'at a mustard seed.']
          : ['That suits it fine.', 'It has some growing to do.'];
  const scene = (p: Pixels, k: number) => {
    // the peacock struts across, shouting
    const px = 330 - k * 7;
    if (px > -60) {
      scaleBlit(p, sprite(cast.mons, `peaA${k % 2}`).flipX(), px + 40, 96, 2);
      scaleBlit(p, sprite(cast.mons, `peaB${k % 2}`).flipX(), px, 96, 2);
      if (k >= 4 && k < 22) shout(p, pal, px + 20, 70, 'LOOK AT ME!');
    }
    // the crow flies over
    if (k >= 14) {
      const cx = -40 + (k - 14) * 10;
      scaleBlit(p, sprite(cast.mons, `crow${k % 2}`), cx, 30 + Math.round(Math.sin(k / 2) * 4), 2);
      if (k >= 18 && k < 34) shout(p, pal, cx + 20, 10, "CAW! WHERE'S THE MIRACLE?");
    }
    // the mole pops up, looks the wrong way and goes back down
    if (k >= 30 && k < 50) {
      const up = Math.min(20, (k - 30) * 5, (50 - k) * 5);
      const m = new Pixels(40, 40, T);
      scaleBlit(m, sprite(cast.mons, `mole${k % 2}`), 0, 0, 2);
      p.blit(m.crop(0, 0, 40, up + 2), 240, 150 - up, T);
      if (k >= 34 && k < 46) shout(p, pal, 260, 104, 'A MIRACLE? DOWN HERE?');
    }
    seed(p, k);
    caption(p, pal, lines(k));
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 4);
  for (let k = 0; k < 62; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the level cards ------------------------------------------------------------------------

export interface CardView {
  /** The level's view (16 x 6 blocks), in the level's palette. */
  map: Pixels;
  pal: Pal;
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
  const frame = (p: Pixels, k: number) => {
    p.rect(0, 0, W, STRIP, ink).rect(0, 174, W, 26, ink);
    p.rect(0, STRIP - 1, W, 1, c('seed', 2)).rect(0, 174, W, 1, c('seed', 2));
    const drop = [-24, -14, -2, 10, 6, 8][Math.min(5, k)];
    outlined(p, 160 - textWidth(info.title, 2) / 2, drop, info.title, c('seed', 4), c('ink', 1), 2);
    if (k >= 5) centered(p, 32, info.where, c('white', 2));
    if (k >= 9) centered(p, 178, `"${info.lines[0]}`, c('white', 2));
    if (k >= 15) centered(p, 189, ` ${info.lines[1]}"`, c('white', 2));
  };
  const s = (name: string) => sprite(cast.seed, name);
  const say = (p: Pixels, x: number, y: number, words: string) => outlined(p, Math.round(x - textWidth(words) / 2), y, words, c('seed', 4), ink);
  const actors: ((p: Pixels, k: number) => void)[] = [
    // 1. the mound: the seed pops out and bounces across
    (p, k) => {
      const x = 40 + k * 8;
      const hop = Math.abs(Math.sin(k / 2.2)) * 34;
      scaleBlit(p, s(hop > 6 ? 'seed.hop' : 'seed.side0'), x, STRIP + 70 - Math.round(hop), 2);
      if (hop > 30) say(p, x + 20, STRIP + 30 - Math.round(hop), 'BOING!');
    },
    // 2. the dust: the sprout pushes a root down into the dirt
    (p, k) => {
      const y = STRIP + 20 + Math.min(k, 16) * 3;
      for (let d = 0; d < Math.min(k, 16) * 3; d += 2)
        p.set(158 + Math.round(Math.sin(d / 5) * 2), STRIP + 58 + d, c('root', 3)).set(162 + Math.round(Math.cos(d / 4) * 3), STRIP + 60 + d, c('root', 2));
      scaleBlit(p, s(k % 4 < 2 ? 'sprout.root0' : 'sprout.root1'), 140, y - 20, 2);
      if (k >= 16) say(p, 160, STRIP + 6, k % 6 < 3 ? 'scritch...' : '...scritch');
    },
    // 3. the mountain: glimmers fly to the plant and the wall of boulders crumbles away
    (p, k) => {
      const gone = Math.max(0, Math.floor((k - 10) / 3));
      for (let b = 0; b < 4; b++) {
        const pic = 3 - b < gone - 1 ? undefined : 3 - b < gone ? 'crumble1' : 'boulder';
        if (pic) p.blit(cast.block(pic), 220, STRIP + 100 - b * 20);
      }
      for (let g = 0; g < 3; g++) {
        const t = Math.min(1, Math.max(0, (k - g * 3) / 9));
        if (t < 1) twinkle(p, pal, Math.round(20 + t * 110 + g * 6), Math.round(STRIP + 20 + t * 40), 3 - g);
      }
      scaleBlit(p, s('plant.front'), 120, STRIP + 80, 2);
      scaleBlit(p, sprite(cast.seed, k >= 10 ? 'topJoy' : 'top0'), 120, STRIP + 40, 2);
      if (k >= 12) say(p, 230, STRIP + 4, 'FAITH!');
    },
    // 4. the sky: the plant rides the breeze up, and a bird comes to say hello
    (p, k) => {
      const y = STRIP + 70 - k * 3;
      scaleBlit(p, s('plant.hop'), 140, y, 2);
      scaleBlit(p, sprite(cast.seed, 'topJoy'), 140, y - 40, 2);
      scaleBlit(p, sprite(cast.mons, `birdOff${k % 2}`), 300 - k * 5, STRIP + 10 + k, 2, true);
      if (k >= 20) say(p, 250 - k * 3, STRIP + k, 'TWEET!');
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

// ---- how to play: hop over a beetle, sink into the dust, find water ---------------------------

export function howtoFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  // a cut-away: the garden above, the dust below it
  const bg = gardenBackdrop(pal, 110, 7);
  bg.rect(0, 110, W, 62, c('dust', 1));
  const rr = rng(4);
  for (let i = 0; i < 500; i++) bg.set(Math.floor(rr() * W), 110 + Math.floor(rr() * 62), c('dust', rr() < 0.5 ? 0 : 2));
  blob(bg, 240, 150, 10, 10, pal.r('water'), 1, 3, 1.3);
  const s = (n: string) => sprite(cast.seed, n);
  const scene = (p: Pixels, k: number) => {
    const bx = k < 20 ? 150 - k * 4 : 70 - (k - 20) * 4;
    // a beetle walks left; the seed walks right and hops it
    scaleBlit(p, sprite(cast.mons, `beetle${k % 2}`), bx + 40, 70, 2, true);
    let x = 20 + k * 5;
    let y = 70;
    let pose = `seed.side${k % 3}`;
    if (k >= 10 && k < 20) {
      y = 70 - Math.round(Math.sin(((k - 10) / 10) * Math.PI) * 44);
      pose = 'seed.hop';
    }
    if (k >= 24) {
      // it lands on the soft dust and sinks in, a root behind it, down to the water
      x = 140 + Math.min(k - 24, 10) * 8;
      y = k < 34 ? 70 : 70 + Math.min(70, (k - 34) * 5);
      pose = k < 34 ? `seed.side${k % 3}` : k % 2 ? 'seed.root0' : 'seed.root1';
      if (k >= 34) for (let d = 110; d < y + 34; d += 2) p.set(x + 20 + Math.round(Math.sin(d / 4) * 2), d, c('root', 3));
    }
    scaleBlit(p, s(pose), x, y, 2);
    if (k >= 12 && k < 18) outlined(p, x + 6, y - 14, 'BOING!', c('seed', 4), c('ink', 0));
    if (k >= 46) outlined(p, 210, 124, 'DRIP!', c('water', 3), c('ink', 0));
    caption(
      p,
      pal,
      k < 24
        ? ['UP hops, Q and E hop sideways.', 'Hop over big loud things.']
        : k < 46
          ? ['Soft dust gives way to roots:', 'DOWN pushes them deeper.']
          : ['Five drops of water', 'open the crack.'],
    );
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 54; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(3);
  return r.fli(SPEED);
}

// ---- wilting (the game is lost) -------------------------------------------------------------

export function lostFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = gardenBackdrop(pal, 150, 11);
  // a grey evening
  const sky = new Pixels(W, 136);
  gradient(sky, 0, 0, W, 136, pal.r('stone'), 1, 4);
  bg.map((x, y, v) => (y < 136 && v !== pal.c('grass', 3) && v !== pal.c('grass', 2) ? sky.get(x, y) : v));
  mound(bg, pal, 160, 150, 40, 20);
  const scene = (p: Pixels, k: number) => {
    const sinking = Math.max(0, k - 24) * 2;
    if (k < 24) scaleBlit(p, sprite(cast.seed, k < 6 ? 'seed.front' : k < 14 ? 'seed.wilt0' : 'seed.wilt1'), 140, 92 + (k >= 14 ? 4 : 0), 2);
    else if (sinking < 36) {
      const m = new Pixels(40, 40, T);
      scaleBlit(m, sprite(cast.seed, 'seed.wilt1'), 0, 0, 2);
      p.blit(m.crop(0, 0, 40, Math.max(1, 40 - sinking)), 140, 96 + sinking, T);
    }
    // a raindrop falls; when the seed is gone under, a tiny sprout pokes up: just wait
    if (k >= 18 && k < 30) scaleBlit(p, sprite(cast.mons, 'drop0'), 150, 20 + (k - 18) * 9, 2);
    if (k >= 44) {
      const h = Math.min(10, k - 44);
      p.line(160, 130, 160, 130 - h, c('leaf', 2));
      if (h >= 6) p.disc(162, 130 - h, 2, c('leaf', 3)).disc(157, 131 - h, 1.6, c('leaf', 3));
    }
    caption(p, pal, k < 24 ? ['When life feels like a mountain,', "and you're feelin' beat..."] : ['Just wait and believe.', 'Try again!']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 58; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the endings -----------------------------------------------------------------------------

/** The great mustard tree, grown `g` of the way (0..1), on its mound at (cx, base). */
function tree(p: Pixels, pal: Pal, cx: number, base: number, g: number): void {
  const c = pal.c;
  const h = Math.round(10 + g * 100);
  const w = Math.max(1, Math.round(g * 8));
  for (let y = 0; y < h; y++) p.rect(cx - w / 2 - Math.round((y / h) * 0), base - y, w, 1, c('bark', y % 7 === 0 ? 1 : 2));
  if (g > 0.35) {
    // branches out to the sides as it grows
    const reach = (g - 0.35) / 0.65;
    for (const [dy, dir, len] of [
      [0.55, -1, 46],
      [0.62, 1, 50],
      [0.78, -1, 34],
      [0.82, 1, 38],
    ] as const) {
      const y0 = base - Math.round(h * dy);
      p.line(cx, y0, cx + dir * len * reach, y0 - 18 * reach, c('bark', 1)).line(cx, y0 + 1, cx + dir * len * reach, y0 - 17 * reach, c('bark', 2));
    }
  }
  if (g > 0.5) {
    const leaf = (g - 0.5) / 0.5;
    const top = base - h;
    for (const [dx, dy, rx, ry] of [
      [0, 0, 44, 22],
      [-38, 26, 34, 18],
      [40, 24, 36, 18],
      [-20, 12, 30, 16],
      [22, 10, 30, 16],
    ] as const)
      blob(p, cx + dx, top + dy, rx * leaf, ry * leaf, pal.r('leaf'), 0, 4);
    if (leaf > 0.8)
      for (const [dx, dy] of [
        [-30, 8],
        [20, -4],
        [36, 30],
        [-44, 34],
        [4, 18],
      ])
        blob(p, cx + dx, top + dy, 3, 3.6, pal.r('seed'), 1, 4, 1.2);
  } else {
    // a sprout, then a plant with the cover's yellow bud
    p.disc(cx + 3, base - h + 4, 3, c('leaf', 3)).disc(cx - 3, base - h + 8, 2.4, c('leaf', 3));
    blob(p, cx, base - h - 3, 3.4, 4.2, pal.r('seed'), 1, 4, 1.2);
  }
}

/** won1.fli (the tree grows, the birds come), won2.fli (the palm of God's hand), won3.fli (THE END). */
export function wonFlis(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  // a golden evening over the garden
  const evening = gardenBackdrop(pal, 150, 21);
  evening.map((_x, y, v) => (y < 132 ? pal.r('gold2')[Math.min(5, Math.floor((132 - y) / 24))] : v));
  mound(evening, pal, 160, 150, 40, 18);
  {
    const r = new Reel(pal.pal);
    const BIRDS: [number, number][] = [
      [100, 46],
      [210, 50],
      [138, 30],
    ];
    const scene = (p: Pixels, k: number) => {
      const g = Math.min(1, k / 26);
      tree(p, pal, 160, 134, g);
      BIRDS.forEach(([x, y], i) => {
        const t = Math.min(1, Math.max(0, (k - 28 - i * 4) / 8));
        if (t <= 0) return;
        const from = i % 2 ? 340 : -30;
        const bx = Math.round(from + (x - from) * t);
        const by = Math.round(-10 + (y + 10) * t);
        scaleBlit(p, sprite(cast.mons, t < 1 ? `birdOff${k % 2}` : `bird${(k >> 2) % 2}`), bx, by, 1, i % 2 === 1);
      });
      caption(p, pal, k < 28 ? ["That mustard seed's", "growin' strong..."] : ['...and the birds of the air', 'come to rest in its branches.']);
    };
    const first = new Pixels(W, H);
    first.px.set(evening.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 50; k++) r.frame(evening, (p) => scene(p, k));
    r.fadeOut(3);
    files['won1.fli'] = r.fli(SPEED);
  }
  {
    // the palm of God's hand rises in the light and holds the mound and the tree
    const r = new Reel(pal.pal);
    const sky = new Pixels(W, H);
    for (let y = 0; y < H; y++) sky.rect(0, y, W, 1, pal.r('gold2')[Math.min(5, Math.floor((H - y) / 34))]);
    const scene = (p: Pixels, k: number) => {
      const rise = Math.min(1, k / 18);
      const s = 1.6;
      const hx = Math.round(160 - (HAND_W * s) / 2);
      const hy = Math.round(200 - rise * 140);
      for (let a = 0; a < 12; a++) {
        const ang = Math.PI * (1.05 + a / 11) + (k % 4) * 0.01;
        if ((a + (k >> 1)) % 3) continue;
        p.line(160, hy + 30, 160 + Math.cos(ang) * 260, hy + 30 + Math.sin(ang) * 260, c('sun', 2));
      }
      drawHand(p, pal, hx, hy, s, 0.6 + rise * 0.4);
      // the mound and the little tree in the palm
      mound(p, pal, 160, hy + 62, 30, 10);
      tree(p, pal, 160, hy + 54, 0.62);
      for (let t = 0; t < 6; t++) twinkle(p, pal, (37 + t * 53 + k * 3) % W, 20 + ((t * 31 + k * 2) % 60), [1, 2, 3, 2][(k + t) % 4]);
      caption(p, pal, k < 20 ? ["That mustard seed's", "growin' strong..."] : ['...in the palm', "of God's hand."]);
    };
    const first = new Pixels(W, H);
    first.px.set(sky.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 40; k++) r.frame(sky, (p) => scene(p, k));
    r.fadeOut(3);
    files['won2.fli'] = r.fli(SPEED);
  }
  {
    // THE END: the seed jumps for joy, Hallelujah
    const r = new Reel(pal.pal);
    const bg = new Pixels(W, H, c('purple', 0));
    const rr = rng(77);
    for (let i = 0; i < 70; i++) bg.set(Math.floor(rr() * W), Math.floor(rr() * 150), c('faith', i % 3));
    const scene = (p: Pixels, k: number) => {
      outlined(p, 160 - textWidth('THE END', 3) / 2, 18, 'THE END', c('seed', 4), c('ink', 0), 3, c('seed', 1));
      const hop = Math.round(Math.abs(Math.sin(k / 2.4)) * 16);
      scaleBlit(p, sprite(cast.seed, hop > 5 ? 'plant.joy' : 'plant.front'), 140, 104 - hop, 2);
      scaleBlit(p, sprite(cast.seed, hop > 5 ? 'topJoy' : 'top0'), 140, 64 - hop, 2);
      for (let t = 0; t < 8; t++) twinkle(p, pal, 60 + ((t * 47 + k * 5) % 200), 60 + ((t * 23 + k * 7) % 90), [0, 1, 2, 3, 2, 1][(k + t) % 6]);
      if (k >= 8) outlined(p, 160 - textWidth('HALLELUJAH!', 2) / 2, 150, 'HALLELUJAH!', c('sun', 3), c('ink', 0), 2);
      caption(p, pal, ['Keep the mustard seed', 'hustle alive!']);
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
