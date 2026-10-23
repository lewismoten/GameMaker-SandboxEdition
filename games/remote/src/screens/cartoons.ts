// The cartoons (FLIs drawn here, frame by frame): the title (the cover drawn for the game,
// art/cover.ts: the swirl turns, the remote tumbles in, and the name drops), the story (you sit
// down with snacks, reach for the remote, and it's gone), the level cards, how to play, losing
// (sinking into the void), and the endings ("But wait - what's this, beneath my thigh?", the
// remote taped to your chest, THE END on channel 13). Each reel opens on black and fades by
// palette (kit/reel.ts); only what moves is stored.
import { Pixels } from '../../../kit/pixels';
import { medianCutPalette, Quantizer } from '../../../kit/quantize';
import { Reel } from '../../../kit/reel';
import { blob } from '../../../snowbound/src/art/draw';
import { centered, outlined, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { coverRgb } from '../art/cover';
import { buildScreenPalette, type Pal } from '../art/pal';
import { couchArt, remoteArt, roomBackdrop, tvArt, vcrArt } from './screens';
import { AUTHOR, CARDS } from './text';

const W = 320;
const H = 200;
/** Clear pixels in sprites. */
const T = 255;
/** 1/70 s per frame: about 12 frames a second. */
export const SPEED = 6;

export interface Cast {
  /** Your sprites (the .CBL's pictures). */
  hero: Map<string, Pixels>;
  /** Everybody else's (the .MBL's pictures). */
  mons: Map<string, Pixels>;
  /** A background block's picture. */
  block: (name: string) => Pixels;
}

/** A four-point twinkle of size 0..3. */
function twinkle(p: Pixels, pal: Pal, x: number, y: number, size: number, ramp = 'yellow'): void {
  if (size <= 0) return;
  p.set(x, y, pal.c(ramp, 2));
  for (let k = 1; k <= size; k++) {
    const col = pal.c(ramp, Math.max(0, 2 - k));
    p.set(x + k, y, col).set(x - k, y, col).set(x, y + k, col).set(x, y - k, col);
  }
}

/** The bar along the bottom with one or two lines of the song. */
function caption(p: Pixels, pal: Pal, lines: string[]): void {
  p.rect(0, 172, W, H - 172, pal.c('ink', 0));
  lines.forEach((l, i) => centered(p, 176 + i * 12, l, pal.c(i ? 'yellow' : 'white', 2)));
}

/** Words said over (x, y), outlined. */
function say(p: Pixels, pal: Pal, x: number, y: number, words: string, ramp = 'yellow', k = 2): void {
  outlined(p, Math.round(Math.max(2, Math.min(W - 2 - textWidth(words), x - textWidth(words) / 2))), y, words, pal.c(ramp, k), pal.c('ink', 0));
}

const sprite = (set: Map<string, Pixels>, name: string) => {
  const s = set.get(name);
  if (!s) throw new Error(`No sprite ${name}`);
  return s;
};

/** A sprite drawn only above row `cut` of the picture (you, sitting down behind the cushion). */
function blitAbove(p: Pixels, src: Pixels, x: number, y: number, s: number, cut: number): void {
  for (let yy = 0; yy < src.h * s; yy++)
    for (let xx = 0; xx < src.w * s; xx++) {
      const v = src.get(Math.floor(xx / s), Math.floor(yy / s));
      if (v !== T && v >= 0 && y + yy < cut) p.set(x + xx, y + yy, v);
    }
}

/** The Bermuda swirl at (cx, cy), turned by `k`. */
function swirl(p: Pixels, pal: Pal, cx: number, cy: number, rx: number, ry: number, k: number): void {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const d = Math.sqrt(nx * nx + ny * ny);
      if (d > 1) continue;
      const arm = Math.sin(Math.atan2(ny, nx) * 3 + d * 8 - k * 0.7);
      p.set(x, y, pal.c('purple', Math.max(0, Math.min(3, Math.round((arm * 0.5 + 0.5) * (1 - d) * 4 + (1 - d))))));
    }
}

// ---- the title: the cover ---------------------------------------------------------------------

/** How many pictures of the cover the title animates through. */
const COVER_FRAMES = 12;

/** The title cartoon (cover.fli) and its last picture with the name on it (title.gif's pixels and palette). */
export function coverFli(): { fli: Uint8Array; title: Pixels; pal: Uint8Array } {
  const frames = Array.from({ length: COVER_FRAMES }, (_, k) => coverRgb((k / (COVER_FRAMES - 1)) * 0.92));
  // inks for the lettering first (black, TV yellow, its shadow, a deep red, cream), then the cover's colors
  const INKS: [number, number, number][] = [
    [0, 0, 0],
    [255, 236, 90],
    [150, 30, 30],
    [26, 10, 30],
    [255, 250, 236],
  ];
  const pal = medianCutPalette(frames, INKS);
  const q = new Quantizer(pal, 10);
  const pics = frames.map((f) => {
    const p = new Pixels(W, H);
    p.px.set(q.apply(f, W, H));
    return p;
  });
  const name = (p: Pixels, drop: number, sub: boolean) => {
    outlined(p, 160 - textWidth("WHERE'S THE", 2) / 2, drop, "WHERE'S THE", 1, 3, 2, 2);
    outlined(p, 160 - textWidth('REMOTE?!', 3) / 2, drop + 20, 'REMOTE?!', 1, 3, 3, 2);
    if (sub) {
      p.rect(0, 186, W, 14, 3);
      centered(p, 189, `${AUTHOR} (c) 1995 - Shareware`, 4);
    }
  };
  const r = new Reel(pal);
  r.fadeIn(pics[0], 6);
  pics.forEach((p, i) => r.add(p, i === 0 ? 4 : 2));
  const last = pics[pics.length - 1];
  for (const [k, drop] of [-60, -36, -14, 4, 12, 7, 9].entries()) {
    const p = new Pixels(W, H);
    p.px.set(last.px);
    name(p, drop, k >= 5);
    r.add(p, k === 6 ? 10 : 1);
  }
  const title = new Pixels(W, H);
  title.px.set(last.px);
  name(title, 9, true);
  return { fli: r.fli(SPEED), title, pal };
}

// ---- the story: you sit down with snacks, and the remote vanishes -----------------------------

/** The living room seen from the front: the TV on the left, the couch, the lamp. */
function den(pal: Pal, k = 0, show: 'snow' | 'cook' | 'blue' = 'snow'): Pixels {
  const p = roomBackdrop(pal, 150, 4);
  tvArt(p, pal, 6, 98, show, k);
  vcrArt(p, pal, 14, 86, k % 8 < 5);
  couchArt(p, pal, 112, 96, 150);
  // the lamp
  const c = pal.c;
  p.rect(284, 60, 4, 60, c('silver', 1)).rect(270, 118, 34, 26, c('wood', 2));
  for (let y = 36; y < 62; y++) p.rect(286 - 10 - (y - 36) / 2, y, 20 + (y - 36), 1, c('lamp', y % 4 ? 1 : 2));
  return p;
}

export function storyFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const Hh = (n: string) => sprite(cast.hero, n);
  const lines = (k: number) =>
    k < 20 ? ['I sat down with snacks,', 'the couch is a throne,'] : k < 38 ? ["Netflix is loaded,", "I'm in the zone."] : k < 54 ? ['But fate has struck', 'with cruel delight-'] : ['The remote is gone,', 'it vanished from sight.'];
  const scene = (p: Pixels, k: number) => {
    // you walk in with a bowl of popcorn and sit down in the middle
    const sitting = k >= 16;
    const x = sitting ? 166 : 320 - k * 9;
    if (!sitting) {
      scaleBlit(p, Hh(`side${k % 3}`), x, 100, 3, true);
      blob(p, x + 6, 132, 8, 4, pal.r('red'), 1, 3);
    } else {
      const pose = k >= 56 ? (k % 6 < 3 ? 'shout0' : 'shout1') : k >= 44 ? 'palm' : k % 14 === 7 ? 'blink' : 'down0';
      blitAbove(p, Hh(pose), x, 72, 3, 128);
      if (k < 44) blob(p, x + 28, 128, 10, 4, pal.r('red'), 1, 3);
    }
    // the remote on the couch arm, until it slides into the cushions with a flash
    if (k < 42) remoteArt(p, pal, 246 - Math.max(0, k - 30) * 5, 104 + Math.max(0, k - 30) * 2, 1);
    if (k >= 38 && k < 50) swirl(p, pal, 214, 130, 14 - Math.abs(k - 44) * 2, 6 - Math.abs(k - 44), k);
    if (k >= 42 && k < 50) say(p, pal, 214, 108, 'POOF!', 'purple', 3);
    if (k >= 56 && k % 10 < 8) say(p, pal, 180, 48, "WHERE'S THE REMOTE?!", 'yellow', 2);
    caption(p, pal, lines(k));
  };
  const first = den(pal, 0);
  scene(first, 0);
  r.fadeIn(first, 4);
  for (let k = 0; k < 72; k++) {
    const bg = den(pal, k);
    r.frame(bg, (p) => scene(p, k));
  }
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
    p.rect(0, STRIP - 1, W, 1, c('yellow', 1)).rect(0, 174, W, 1, c('yellow', 1));
    const drop = [-24, -14, -2, 10, 6, 8][Math.min(5, k)];
    outlined(p, 160 - textWidth(info.title, 2) / 2, drop, info.title, c('yellow', 2), c('red', 0), 2);
    if (k >= 5) centered(p, 32, info.where, c('white', 2));
    if (k >= 9) centered(p, 178, `"${info.lines[0]}`, c('white', 2));
    if (k >= 15) centered(p, 189, ` ${info.lines[1]}"`, c('white', 2));
  };
  const Hh = (name: string) => sprite(cast.hero, name);
  const M = (name: string) => sprite(cast.mons, name);
  const words = (p: Pixels, x: number, y: number, w: string) => outlined(p, Math.round(x - textWidth(w) / 2), y, w, c('yellow', 2), ink);
  const actors: ((p: Pixels, k: number) => void)[] = [
    // 1. the living room: you walk up and lift a cushion... NOPE
    (p, k) => {
      const x = Math.min(150, 10 + k * 10);
      scaleBlit(p, Hh(k < 14 ? `side${k % 3}` : k < 20 ? 'down0' : 'palm'), x, STRIP + 50, 2);
      if (k >= 14) words(p, x + 20, STRIP + 24, k < 20 ? 'POOF!' : 'NOPE.');
    },
    // 2. the kitchen: the phone rings
    (p, k) => {
      const x = Math.min(170, 20 + k * 9);
      scaleBlit(p, Hh(k < 16 ? `side${k % 3}` : 'shout0'), x, STRIP + 50, 2);
      if (k >= 12) words(p, 250, STRIP + 10 + (k % 2) * 2, 'RING!');
    },
    // 3. the void: you tumble through the nothing among pennies
    (p, k) => {
      const x = 40 + k * 8;
      const y = STRIP + 20 + Math.round(Math.sin(k / 3) * 14);
      scaleBlit(p, Hh(['down0', 'side0', 'up0', 'side1'][k % 4]), x, y, 2);
      for (let t = 0; t < 5; t++) scaleBlit(p, M(`penny${(k + t) % 2}`), (t * 67 + k * 3) % 300, STRIP + 10 + ((t * 37) % 80), 1);
      if (k >= 16) words(p, x + 20, y - 14, 'WHOOSH!');
    },
    // 4. the ride: round and round on the spinning rug
    (p, k) => {
      const a = k / 4;
      const x = 150 + Math.round(Math.cos(a) * 110);
      const y = STRIP + 40 + Math.round(Math.sin(a) * 30);
      scaleBlit(p, Hh(['side0', 'down0', 'side1', 'up0'][k % 4]), x, y, 2, Math.cos(a + Math.PI / 2) < 0);
      if (k >= 14) words(p, 160, STRIP + 8, 'WHEEEE!');
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

// ---- how to play: search by pushing, shout at dust bunnies --------------------------------------

export function howtoFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = roomBackdrop(pal, 120, 7);
  couchArt(bg, pal, 180, 66, 130);
  const Hh = (n: string) => sprite(cast.hero, n);
  const scene = (p: Pixels, k: number) => {
    if (k < 28) {
      // walk to the couch and push into a cushion: it lifts
      const x = Math.min(150, 10 + k * 8);
      scaleBlit(p, Hh(x < 150 ? `side${k % 3}` : 'side0'), x, 96, 3);
      if (k >= 19) {
        p.rect(196, 96, 30, 6, c('couch', 4)).rect(198, 102, 26, 10, c('ink', 0));
        p.disc(204, 108, 2, c('copper', 2)).disc(214, 107, 2, c('copper', 1));
        say(p, pal, 210, 74, 'POOF! +1 SPOT');
      }
    } else {
      // a dust bunny hops at you; SPACE blows it away
      const bx = Math.max(110, 260 - (k - 28) * 10);
      if (k < 44) scaleBlit(p, sprite(cast.mons, `bunny${k % 2}`), bx, 130, 2);
      else scaleBlit(p, sprite(cast.mons, `poof${(k >> 1) % 2}`), 120, 130, 2);
      scaleBlit(p, Hh(k >= 38 && k < 46 ? 'shout0' : 'side0'), 40, 96, 3);
      if (k >= 38 && k < 46) {
        scaleBlit(p, sprite(cast.mons, `shout${k % 2}`), 80 + (k - 38) * 6, 120, 2);
        say(p, pal, 90, 70, "WHERE'S THE REMOTE?!");
      }
    }
    caption(p, pal, k < 28 ? ['Push into a thing to search it.', 'Six spots open the baby gate.'] : ['SPACE shouts. The shout blows', 'dust bunnies and lint away.']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 56; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(3);
  return r.fli(SPEED);
}

// ---- losing: into the void ----------------------------------------------------------------------

export function lostFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const scene = (p: Pixels, k: number) => {
    swirl(p, pal, 160, 112, 90, 40, k & ~1);
    const sink = Math.min(60, Math.max(0, k - 10) * 2);
    if (k < 44) blitAbove(p, sprite(cast.hero, k < 10 ? 'ouch' : 'flop0'), 130, 50 + sink, 3, 160);
    caption(p, pal, k < 30 ? ['Straight into the void', 'of eternal doom.'] : ['The remote is gone.', 'Try again!']);
  };
  const bg = () => {
    const p = roomBackdrop(pal, 150, 11);
    tvArt(p, pal, 6, 98, 'snow', 3);
    return p;
  };
  const first = bg();
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 60; k++) {
    const p = bg();
    tvArt(p, pal, 6, 98, 'snow', k);
    r.frame(p, (q) => scene(q, k));
  }
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the endings -----------------------------------------------------------------------------

/** won1.fli (sitting down: what's this, beneath my thigh?), won2.fli (taped to your chest), won3.fli (THE END). */
export function wonFlis(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const Hh = (n: string) => sprite(cast.hero, n);
  {
    const r = new Reel(pal.pal);
    const scene = (p: Pixels, k: number) => {
      // you flop down on the couch... wince... dig under your thigh... and hold it up
      let pose = k < 12 ? 'down0' : k < 22 ? 'ouch' : k < 30 ? 'palm' : 'shout1';
      if (k >= 12 && k < 22 && k % 4 < 2) pose = 'blink';
      blitAbove(p, Hh(pose), 166, k < 8 ? 60 + k * 2 : 72, 3, 128);
      if (k >= 14 && k < 30) say(p, pal, 190, 52, '?!');
      if (k >= 30) {
        const lift = Math.min(40, (k - 30) * 5);
        remoteArt(p, pal, 214, 104 - lift, 2, k >= 38 && k % 4 < 2);
        if (k >= 38) say(p, pal, 160, 20, 'THERE YOU ARE!', 'yellow', 2);
      }
      caption(p, pal, k < 30 ? ["But wait-what's this,", 'beneath my thigh?'] : ['There you are,', 'you sneaky guy.']);
    };
    const first = den(pal, 0);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 56; k++) r.frame(den(pal, k), (p) => scene(p, k));
    r.fadeOut(3);
    files['won1.fli'] = r.fli(SPEED);
  }
  {
    // taped to your chest: you, big, the remote on your robe, strips of duct tape going on
    const r = new Reel(pal.pal);
    const bg = roomBackdrop(pal, 170, 9);
    const scene = (p: Pixels, k: number) => {
      scaleBlit(p, Hh('down0'), 100, 16, 6);
      remoteArt(p, pal, 146, 70, 2);
      const strips = Math.min(4, Math.floor(k / 8));
      for (let s = 0; s < strips; s++) {
        const y = 78 + s * 12;
        for (let t = 0; t < 4; t++) p.line(132, y + t, 188, y - 8 + t, c('tape', t === 0 ? 2 : 1));
      }
      if (k >= 34 && k % 8 < 6) say(p, pal, 160, 8, 'RIIIP!', 'white', 2);
      caption(p, pal, ["Next time I'll tape you", 'to my chest-']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 48; k++) r.frame(bg, (p) => scene(p, k));
    r.fadeOut(3);
    files['won2.fli'] = r.fli(SPEED);
  }
  {
    // THE END: channel 13's cooking show at last, the VCR still blinking 12:00
    const r = new Reel(pal.pal);
    const scene = (p: Pixels, k: number) => {
      outlined(p, 160 - textWidth('THE END', 3) / 2, 14, 'THE END', c('yellow', 2), c('ink', 0), 3, c('red', 0));
      blitAbove(p, Hh(k % 10 < 5 ? 'click' : 'side0'), 166, 72, 3, 128);
      for (let t = 0; t < 6; t++) twinkle(p, pal, 40 + ((t * 47 + k * 5) % 240), 50 + ((t * 23 + k * 7) % 40), [0, 1, 2, 3, 2, 1][(k + t) % 6]);
      caption(p, pal, ["You're the worst,", 'but also the best.']);
    };
    const first = den(pal, 0, 'cook');
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 44; k++) r.frame(den(pal, k, 'cook'), (p) => scene(p, k));
    files['won3.fli'] = r.fli(SPEED);
  }
  return files;
}

export { T };
