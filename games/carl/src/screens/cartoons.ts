// The cartoons (FLIs drawn here, frame by frame): the title (the cover drawn for the game,
// art/cover.ts: the towel swings in and misses, and the name drops in), the story (the man on
// the couch with his snacks, a buzz, Carl), the level cards, how to play (the barrel roll, the
// buzz), the splat, and the endings (Carl takes the aux cord; the man mops in gloom while Carl
// DJs; THE END with a parade of the Bard's other songs). Each reel opens on black and fades by
// palette (kit/reel.ts); only what moves is stored.
import { Pixels, rng } from '../../../kit/pixels';
import { medianCutPalette, Quantizer } from '../../../kit/quantize';
import { Reel } from '../../../kit/reel';
import { gradient } from '../../../snowbound/src/art/draw';
import { centered, micro, outlined, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { coverRgb } from '../art/cover';
import { buildScreenPalette, type Pal } from '../art/pal';
import { lampArt, roomBackdrop } from './screens';
import { AUTHOR, CARDS } from './text';

const W = 320;
const H = 200;
/** Clear pixels in sprites. */
const T = 255;
/** 1/70 s per frame: about 12 frames a second. */
export const SPEED = 6;

export interface Cast {
  /** Carl's sprites (the .CBL's pictures). */
  carl: Map<string, Pixels>;
  /** Everybody else's (the .MBL's pictures). */
  mons: Map<string, Pixels>;
  /** A background block's picture (the house set). */
  block: (name: string) => Pixels;
}

/** The bar along the bottom with one or two lines of the song. */
function caption(p: Pixels, pal: Pal, lines: string[]): void {
  p.rect(0, 172, W, H - 172, pal.c('ink', 0));
  lines.forEach((l, i) => centered(p, 176 + i * 12, l, pal.c(i ? 'daisy' : 'white', i ? 2 : 3)));
}

/** Words said over (x, y), outlined. */
function say(p: Pixels, pal: Pal, x: number, y: number, words: string, ramp = 'eye', k = 2): void {
  outlined(p, Math.round(x - textWidth(words) / 2), y, words, pal.c(ramp, k), pal.c('ink', 0));
}

const sprite = (set: Map<string, Pixels>, name: string) => {
  const s = set.get(name);
  if (!s) throw new Error(`No sprite ${name}`);
  return s;
};

/** A sprite turned a quarter turn clockwise `q` times (the barrel roll). */
function turned(src: Pixels, q: number): Pixels {
  let p = src;
  for (let k = 0; k < ((q % 4) + 4) % 4; k++) {
    const n = new Pixels(p.w, p.h, T);
    const from = p;
    n.map((x, y) => from.get(y, from.h - 1 - x));
    p = n;
  }
  return p;
}

/** Blocks (the house set) laid out at 2x from (x, y): rows of block names, '' for none. */
function blocks2x(p: Pixels, cast: Cast, x: number, y: number, rows: string[][]): void {
  rows.forEach((row, j) => row.forEach((name, i) => name && scaleBlit(p, cast.block(name), x + i * 40, y + j * 40, 2)));
}

/** Carl flying (wings flicking by frame k), facing right or left, at 2x. */
function flyer(p: Pixels, cast: Cast, x: number, y: number, k: number, left = false, s = 2): void {
  scaleBlit(p, sprite(cast.carl, `side${k % 2}`), x, y, s, left);
}

// ---- the title: the cover ---------------------------------------------------------------------

const COVER_FRAMES = 12;

/** The title cartoon (cover.fli) and its last picture with the name on it (title.gif's pixels and palette). */
export function coverFli(): { fli: Uint8Array; title: Pixels; pal: Uint8Array } {
  const frames = Array.from({ length: COVER_FRAMES }, (_, k) => coverRgb(k / (COVER_FRAMES - 1)));
  // inks for the lettering first (black, Carl's red, its shadow, a deep plum, cream), then the cover's colors
  const INKS: [number, number, number][] = [
    [0, 0, 0],
    [236, 52, 40],
    [110, 10, 14],
    [30, 16, 34],
    [255, 250, 232],
  ];
  const pal = medianCutPalette(frames, INKS);
  const q = new Quantizer(pal, 10);
  const pics = frames.map((f) => {
    const p = new Pixels(W, H);
    p.px.set(q.apply(f, W, H));
    return p;
  });
  const name = (p: Pixels, drop: number, sub: boolean) => {
    outlined(p, 160 - textWidth('CARL', 4) / 2, drop + 12, 'CARL', 1, 3, 4, 2);
    if (sub) {
      outlined(p, 160 - textWidth('A FLY NAMED') / 2, drop, 'A FLY NAMED', 4, 3);
      p.rect(0, 186, W, 14, 3);
      centered(p, 189, `${AUTHOR} (c) 1995 - Shareware`, 4);
    }
  };
  const r = new Reel(pal);
  r.fadeIn(pics[0], 6);
  pics.forEach((p, i) => r.add(p, i === 0 ? 4 : 2));
  const last = pics[pics.length - 1];
  for (const [k, drop] of [-60, -36, -14, 4, 10, 5, 7].entries()) {
    const p = new Pixels(W, H);
    p.px.set(last.px);
    name(p, drop, k >= 5);
    r.add(p, k === 6 ? 10 : 1);
  }
  const title = new Pixels(W, H);
  title.px.set(last.px);
  name(title, 7, true);
  return { fli: r.fli(SPEED), title, pal };
}

// ---- the story: snacks, Netflix, a buzz ---------------------------------------------------------

/** The couch with the man on it at 2x, its left end at x (the room's floor at 180). */
function couch2x(p: Pixels, cast: Cast, x: number, glum = false): void {
  blocks2x(p, cast, x, 60, [
    ['', '', glum ? 'glumTL' : 'manTL', glum ? 'glumTR' : 'manTR', '', ''],
    ['armL', 'couchBack', 'manML', 'manMR', 'couchBack', 'armR'],
    ['armL', 'seat', 'manBL', 'manBR', 'seat', 'armR'],
  ]);
  blocks2x(p, cast, x - 20, 140, [['couchBase', 'couchBase', 'couchBase', 'couchBase', 'couchBase', 'couchBase', 'couchBase']]);
}

export function storyFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = roomBackdrop(pal, 100, 180);
  couch2x(bg, cast, 20);
  // the TV on the right, the snacks on the table
  blocks2x(bg, cast, 250, 60, [['tvTL0', 'tvTR0'], ['tvBL', 'tvBR'], ['sideTable', 'sideTable']]);
  blocks2x(bg, cast, 120, 140, [['', 'popcorn', 'chips', '']]);
  const lines = (k: number) =>
    k < 22 ? ['I sat down with my snacks', 'and my Netflix queue...'] : k < 44 ? ['Then came a buzz', 'like a judgmental tune.'] : k < 64 ? ["Now there's a fly in the room,", "and it's louder than June."] : ["I've named it Carl.", 'I hate Carl.'];
  const scene = (p: Pixels, k: number) => {
    // the TV flickers (the goat)
    if (k % 6 < 3) scaleBlit(p, cast.block('tvTL1'), 250, 60, 2);
    if (k < 22) return caption(p, pal, lines(k));
    // Carl buzzes in from the left, loops round his head, lands on the popcorn
    const u = k - 22;
    let x = -40 + u * 9;
    let y = 30 + Math.round(Math.sin(u / 2) * 10);
    if (u >= 16) {
      const a = (u - 16) / 3;
      x = 120 + Math.round(Math.cos(a) * 40);
      y = 50 + Math.round(Math.sin(a) * 26);
    }
    if (u >= 42) {
      x = 150;
      y = 116;
    }
    if (u < 42) flyer(p, cast, x, y, k, u >= 16 && Math.sin((u - 16) / 3) < 0);
    else scaleBlit(p, sprite(cast.carl, k % 8 < 5 ? 'grin' : 'front1'), x, y, 2);
    if (u >= 6 && u < 40 && k % 4 < 3) say(p, pal, x + 30, y - 12, 'BZZZ', 'white', 3);
    if (k >= 64 && k % 8 < 6) say(p, pal, 168, 100, 'CARL.', 'eye', 2);
    caption(p, pal, lines(k));
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 4);
  for (let k = 0; k < 80; k++) r.frame(bg, (p) => scene(p, k));
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
    p.rect(0, STRIP - 1, W, 1, c('eye', 2)).rect(0, 174, W, 1, c('eye', 2));
    const drop = [-24, -14, -2, 10, 6, 8][Math.min(5, k)];
    outlined(p, 160 - textWidth(info.title, 2) / 2, drop, info.title, c('white', 3), c('eye', 0), 2);
    if (k >= 5) centered(p, 32, info.where, c('daisy', 2));
    if (k >= 9) centered(p, 178, `"${info.lines[0]}`, c('white', 3));
    if (k >= 15) centered(p, 189, ` ${info.lines[1]}"`, c('white', 3));
  };
  const M = (name: string) => sprite(cast.mons, name);
  const words = (p: Pixels, x: number, y: number, w: string) => outlined(p, Math.round(x - textWidth(w) / 2), y, w, c('white', 3), ink);
  const actors: ((p: Pixels, k: number) => void)[] = [
    // 1. the couch: Carl zips to the popcorn, a hand reaches in
    (p, k) => {
      flyer(p, cast, 20 + k * 8, STRIP + 30 + Math.round(Math.sin(k / 2) * 8), k);
      if (k >= 14) words(p, 60 + k * 8, STRIP + 6, 'SNACKS!');
    },
    // 2. the walls: the old clap claps on empty air, Carl smiles from the wall
    (p, k) => {
      const shut = k % 8 >= 5;
      scaleBlit(p, M(shut ? 'clap1' : 'clap0'), 130, STRIP + 30, 2);
      scaleBlit(p, sprite(cast.carl, 'grin'), 230, STRIP + 20 + (k % 4 < 2 ? 0 : 2), 2);
      if (shut) words(p, 150, STRIP + 12, 'CLAP!');
      if (k >= 16) words(p, 250, STRIP + 4, ':)');
    },
    // 3. in bed: Carl buzzes an ear, it twitches
    (p, k) => {
      scaleBlit(p, M(k >= 12 ? `earT${k % 2}` : 'ear'), 200, STRIP + 40, 2);
      flyer(p, cast, Math.min(130, 20 + k * 8), STRIP + 40, k);
      if (k >= 8) scaleBlit(p, M(`buzz${k % 2}`), 170, STRIP + 40, 2);
      if (k >= 14) words(p, 220, STRIP + 10, 'BZZZ!');
    },
    // 4. the window: out he goes, past the begging hand
    (p, k) => {
      scaleBlit(p, M(`wave${(k >> 1) % 2}`), 40, STRIP + 40, 2);
      flyer(p, cast, 80 + k * 7, STRIP + 50 - Math.round(k * 1.2), k);
      if (k >= 14) words(p, 160, STRIP + 8, 'FREEDOM!');
    },
    // 5. seen things: an hourglass, the frog's tongue, Carl's stare
    (p, k) => {
      scaleBlit(p, M(k % 10 >= 7 ? 'tongue1' : 'tongue0'), 120, STRIP + 50, 2);
      scaleBlit(p, M(k % 10 >= 7 ? 'frog1' : 'frog0'), 120, STRIP + 80, 2);
      scaleBlit(p, sprite(cast.carl, k >= 16 ? 'blink' : 'front0'), 200, STRIP + 20, 2);
      if (k >= 16) words(p, 220, STRIP + 4, 'CARL HAS SEEN THINGS');
    },
    // 6. the aux cord: the mop goes by, Carl flies to the stereo
    (p, k) => {
      scaleBlit(p, M(`mop${k % 2}`), 260 - k * 4, STRIP + 80, 2);
      flyer(p, cast, 30 + k * 7, STRIP + 20, k);
      if (k >= 14) words(p, 120 + k * 4, STRIP + 4, 'MINE.');
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

// ---- how to play: fly, barrel roll (the towel misses), buzz --------------------------------------

export function howtoFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = roomBackdrop(pal, 110, 170);
  const scene = (p: Pixels, k: number) => {
    const M = (n: string) => sprite(cast.mons, n);
    if (k < 30) {
      // the towel snaps at Carl; he rolls; it misses
      const rolling = k >= 10 && k < 18;
      const towelPic = k >= 14 && k < 26 ? `miss${k % 2}` : k % 6 < 3 ? 'towel0' : 'towel1';
      scaleBlit(p, M(towelPic), 190, 60, 3);
      const carl = rolling ? turned(sprite(cast.carl, 'rollSide'), k - 10) : sprite(cast.carl, k >= 18 ? 'grin' : `side${k % 2}`);
      scaleBlit(p, carl, 120, 70 - (rolling ? Math.round(Math.sin(((k - 10) / 8) * Math.PI * 2) * 12) : 0), 3);
      if (k >= 14 && k < 26) say(p, pal, 214, 40, 'MISSED!');
      caption(p, pal, ['SPACE: barrel roll. Its whoosh', 'makes swatting things miss.']);
    } else {
      // the buzz flies off and an ear twitches
      const u = k - 30;
      scaleBlit(p, M(u >= 10 ? `earT${u % 2}` : 'ear'), 230, 70, 3);
      scaleBlit(p, sprite(cast.carl, u >= 3 && u < 8 ? `buzz${u % 2}` : 'front0'), 60, 70, 3);
      if (u >= 4 && u < 12) scaleBlit(p, M(`buzz${u % 2}`), 110 + (u - 4) * 14, 70, 3);
      if (u >= 10) say(p, pal, 250, 40, 'HUH?!', 'white', 3);
      caption(p, pal, ['B: buzz. It wakes', 'sleeping ears.']);
    }
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 52; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(3);
  return r.fli(SPEED);
}

// ---- splat (the game is lost) ----------------------------------------------------------------

export function lostFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = roomBackdrop(pal, 110, 170, 1);
  const scene = (p: Pixels, k: number) => {
    const M = (n: string) => sprite(cast.mons, n);
    const pose = k < 10 ? 'front0' : k < 14 ? 'hurt' : k < 20 ? 'splat0' : 'splat1';
    scaleBlit(p, sprite(cast.carl, pose), 130, 90, 3);
    if (k >= 6 && k < 16) scaleBlit(p, M(k < 10 ? 'swat0' : 'swat1'), 110, k < 10 ? 20 : 60, 4);
    if (k >= 10 && k < 18) say(p, pal, 160, 60, 'SPLAT!');
    // a little halo, and he peels himself up
    if (k >= 26) for (let a = 0; a < Math.PI * 2; a += 0.3) p.set(160 + Math.cos(a + k / 3) * 14, 92 + Math.sin(a + k / 3) * 4, pal.c('gold', 3));
    caption(p, pal, k < 30 ? ["I've named it Carl.", 'I hate Carl.'] : ['Some say flies live 24 hours.', 'Carl will be back. Try again!']);
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

/** won1.fli (Carl takes the aux cord), won2.fli (the man mops in gloom; Carl DJs), won3.fli (THE END). */
export function wonFlis(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const M = (n: string) => sprite(cast.mons, n);
  {
    // the stereo: Carl pulls the aux cord over and plugs in; the lights jump
    const r = new Reel(pal.pal);
    const bg = roomBackdrop(pal, 100, 180, 1);
    blocks2x(bg, cast, 80, 100, [
      ['speaker', 'receiver', 'deck', 'speaker'],
      ['speaker', 'sideTable', 'sideTable', 'speaker'],
    ]);
    const scene = (p: Pixels, k: number) => {
      const x = Math.max(160, 300 - k * 8);
      if (k < 22) {
        flyer(p, cast, x, 50, k, true);
        scaleBlit(p, cast.block('aux'), x + 10, 70, 2);
      } else {
        scaleBlit(p, sprite(cast.carl, k % 6 < 3 ? 'grin' : 'front1'), 160, 56 - (k % 4 < 2 ? 0 : 3), 2);
        // the meters and notes dancing
        for (let b = 0; b < 6; b++) p.rect(126 + b * 4, 116 - ((k * (b + 3)) % 12), 2, 2 + ((k * (b + 3)) % 12), c('led', 1));
        for (let n = 0; n < 4; n++) {
          const nx = 80 + n * 52 + Math.round(Math.sin((k + n * 5) / 3) * 6);
          const ny = 90 - ((k * 3 + n * 17) % 70);
          p.disc(nx, ny, 3, c('gold', 3)).rect(nx + 2, ny - 10, 1, 10, c('gold', 3));
        }
      }
      caption(p, pal, k < 22 ? ['Rest in peace,', 'peace and quiet.'] : ["Carl's got", 'the aux cord now.']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 52; k++) r.frame(bg, (p) => scene(p, k));
    r.fadeOut(3);
    files['won1.fli'] = r.fli(SPEED);
  }
  {
    // the man mops in gloom; Carl DJs on the lamp
    const r = new Reel(pal.pal);
    const bg = roomBackdrop(pal, 100, 180, 2);
    for (let x = 0; x < W; x += 3) for (let y = 181; y < 200; y += 4) if ((x + y) % 7 === 0) bg.set(x, y, c('water', 2));
    lampArt(bg, pal, 250, 70, 180);
    const scene = (p: Pixels, k: number) => {
      const mx = 40 + Math.round(Math.sin(k / 6) * 30);
      scaleBlit(p, M(`mopperA${(k >> 2) % 2}`), mx, 100, 2);
      scaleBlit(p, M(`mopperB${(k >> 2) % 2}`), mx, 140, 2);
      scaleBlit(p, M(`mop${(k >> 1) % 2}`), mx + 36, 140, 2);
      scaleBlit(p, sprite(cast.carl, k % 4 < 2 ? 'grin' : 'front1'), 230, 34 - (k % 4 < 2 ? 0 : 2), 2);
      if (k % 8 < 4) micro(p, 222, 26, 'WUB WUB', c('led', 1));
      caption(p, pal, k < 26 ? ['If you come over', 'and see me in gloom,'] : ["Just know... I'm sharing my", 'life with a fly in the room.']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 54; k++) r.frame(bg, (p) => scene(p, k));
    r.fadeOut(3);
    files['won2.fli'] = r.fli(SPEED);
  }
  {
    // THE END: Carl on the lamp; Loaf #13, the mustard seed and the third goat wander by
    const r = new Reel(pal.pal);
    const bg = new Pixels(W, H, c('purple', 0));
    const rr = rng(77);
    for (let i = 0; i < 70; i++) bg.set(Math.floor(rr() * W), Math.floor(rr() * 150), c('gold', i % 3));
    gradient(bg, 0, 150, W, 22, pal.r('panel'), 0, 2);
    lampArt(bg, pal, 160, 86, 160);
    const scene = (p: Pixels, k: number) => {
      outlined(p, 160 - textWidth('THE END', 3) / 2, 14, 'THE END', c('eye', 2), c('ink', 0), 3, c('eye', 0));
      scaleBlit(p, sprite(cast.carl, k % 8 < 4 ? 'grin' : 'blink'), 140, 46, 2);
      const walk = (name: string, x0: number, y: number, speed: number) => {
        const x = ((x0 + k * speed) % 380) - 40;
        scaleBlit(p, M(`${name}${(k >> 1) % 2}`), x, y, 1);
      };
      walk('loaf', 0, 146, 4);
      walk('seed', 60, 146, 4);
      walk('goat', 120, 146, 3);
      if (k >= 8) outlined(p, 160 - textWidth("IT'S WINNING.", 2) / 2, 120, "IT'S WINNING.", c('daisy', 2), c('ink', 0), 2);
      caption(p, pal, ["There's a fly in the room", "(and it's winning)."]);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 48; k++) r.frame(bg, (p) => scene(p, k));
    files['won3.fli'] = r.fli(SPEED);
  }
  return files;
}

export { T };
