// The cartoons (FLIs drawn here, frame by frame): the title (the cover drawn for the game,
// art/cover.ts: the light warms, the rays turn, the loaf rises and steams, and the name drops
// in), the story (brothers passed hand to hand overhead, and nobody picks Loaf #13), the level
// cards, how to play, crumbling, and the endings (twelve baskets gathered at dusk and the child
// picks the loaf up; "Mama, look what I've got..." at her door; THE END: still bread). Each reel
// opens on black and fades by palette (kit/reel.ts); only what moves is stored.
import { Pixels, rng } from '../../../kit/pixels';
import { medianCutPalette, Quantizer } from '../../../kit/quantize';
import { Reel } from '../../../kit/reel';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { coverRgb } from '../art/cover';
import { buildScreenPalette, type Pal } from '../art/pal';
import { basketArt, hillBackdrop } from './screens';
import { AUTHOR, CARDS } from './text';

const W = 320;
const H = 200;
/** Clear pixels in sprites. */
const T = 255;
/** 1/70 s per frame: about 12 frames a second. */
export const SPEED = 6;

export interface Cast {
  /** The loaf's sprites (the .CBL's pictures). */
  loaf: Map<string, Pixels>;
  /** Everybody else's (the .MBL's pictures). */
  mons: Map<string, Pixels>;
  /** A background block's picture. */
  block: (name: string) => Pixels;
}

/** A four-point twinkle of size 0..3. */
function twinkle(p: Pixels, pal: Pal, x: number, y: number, size: number, ramp = 'gold'): void {
  if (size <= 0) return;
  p.set(x, y, pal.c(ramp, 3));
  for (let k = 1; k <= size; k++) {
    const col = pal.c(ramp, Math.max(0, 3 - k));
    p.set(x + k, y, col)
      .set(x - k, y, col)
      .set(x, y + k, col)
      .set(x, y - k, col);
  }
}

/** The bar along the bottom with one or two lines of the song. */
function caption(p: Pixels, pal: Pal, lines: string[]): void {
  p.rect(0, 172, W, H - 172, pal.c('ink', 0));
  lines.forEach((l, i) => centered(p, 176 + i * 12, l, pal.c(i ? 'crust' : 'white', i ? 5 : 2)));
}

/** Words said over (x, y), outlined. */
function say(p: Pixels, pal: Pal, x: number, y: number, words: string, ramp = 'crust', k = 5): void {
  outlined(p, Math.round(x - textWidth(words) / 2), y, words, pal.c(ramp, k), pal.c('ink', 0));
}

const sprite = (set: Map<string, Pixels>, name: string) => {
  const s = set.get(name);
  if (!s) throw new Error(`No sprite ${name}`);
  return s;
};

// ---- the title: the cover ---------------------------------------------------------------------

/** How many pictures of the cover the title animates through. */
const COVER_FRAMES = 10;

/** The title cartoon (cover.fli) and its last picture with the name on it (title.gif's pixels and palette). */
export function coverFli(): { fli: Uint8Array; title: Pixels; pal: Uint8Array } {
  const frames = Array.from({ length: COVER_FRAMES }, (_, k) => coverRgb(k / (COVER_FRAMES - 1)));
  // inks for the lettering first (black, the crust's gold, its shadow, a deep plum, cream), then the cover's colors
  const INKS: [number, number, number][] = [
    [0, 0, 0],
    [255, 214, 120],
    [140, 66, 16],
    [34, 14, 30],
    [255, 248, 228],
  ];
  const pal = medianCutPalette(frames, INKS);
  const q = new Quantizer(pal, 10);
  const pics = frames.map((f) => {
    const p = new Pixels(W, H);
    p.px.set(q.apply(f, W, H));
    return p;
  });
  const name = (p: Pixels, drop: number, sub: boolean) => {
    outlined(p, 160 - textWidth('LOAF #13', 3) / 2, drop, 'LOAF #13', 1, 3, 3, 2);
    if (sub) {
      outlined(p, 160 - textWidth('(LEFT IN THE BASKET)') / 2, drop + 28, '(LEFT IN THE BASKET)', 4, 3);
      p.rect(0, 186, W, 14, 3);
      centered(p, 189, `${AUTHOR} (c) 1995 Shareware`, 4);
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

// ---- the story: brothers passed hand to hand, and nobody picks Loaf #13 ---------------------------

/** The fig tree's shade at the left of a picture, a basket under it. */
function figShade(p: Pixels, pal: Pal, ground: number): void {
  const c = pal.c;
  for (let x = 0; x < 110; x++)
    for (let y = 0; y < ground; y++)
      if (y < 40 + Math.sin(x / 9) * 6 || (x < 100 && y > 60))
        p.set(x, y, y < 46 ? c('leaf', (x + y) % 5 === 0 ? 3 : 1) : (x + y) % 2 ? p.get(x, y) : c('olive', 0));
  p.rect(92, 30, 8, ground - 30, c('wood', 1)).rect(92, 30, 2, ground - 30, c('wood', 0));
}

export function storyFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = hillBackdrop(pal, 150, 4);
  figShade(bg, pal, 160);
  const L = (n: string) => sprite(cast.loaf, n);
  const lines = (k: number) =>
    k < 24
      ? ['Watched my brothers pass', 'from hand to hand...']
      : k < 46
        ? ['While I sat lonely', 'in a wicker wasteland.']
        : k < 60
          ? ['Nobody picked', 'Loaf #13.']
          : ["But I'm still bread!", "Don't count me out!"];
  const scene = (p: Pixels, k: number) => {
    // hands reach in from the top, passing brother loaves along over the crowd
    for (let h = 0; h < 4; h++) {
      const hx = 140 + h * 46;
      const reach = Math.round(Math.max(0, Math.sin((k + h * 5) / 4)) * 12);
      scaleBlit(p, sprite(cast.mons, `hand${(k >> 2) % 2}`), hx, 2 + reach, 2);
    }
    if (k < 46)
      for (let b = 0; b < 3; b++) {
        const x = 330 - ((k * 9 + b * 70) % 240);
        scaleBlit(p, sprite(cast.mons, `brother${(k + b) % 2}`), x, 54 + Math.round(Math.sin((k + b * 3) / 2) * 8), 2);
      }
    // the basket under the fig tree, and Loaf #13 in it, watching
    const sing = k >= 60;
    const pose = sing ? (k % 6 < 3 ? 'loaf.bread0' : 'loaf.bread1') : k >= 46 ? 'loaf.blink' : k % 16 === 9 ? 'loaf.blink' : 'loaf.front';
    scaleBlit(p, L(pose), 30, 122 - (sing ? 6 : 0), 2);
    basketArt(p, pal, 50, 150, 30, 18, false);
    if (sing && k % 8 < 6) say(p, pal, 92, 96, "I'M STILL BREAD!");
    caption(p, pal, lines(k));
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 4);
  for (let k = 0; k < 72; k++) r.frame(bg, (p) => scene(p, k));
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
    p.rect(0, STRIP - 1, W, 1, c('crust', 3)).rect(0, 174, W, 1, c('crust', 3));
    const drop = [-24, -14, -2, 10, 6, 8][Math.min(5, k)];
    outlined(p, 160 - textWidth(info.title, 2) / 2, drop, info.title, c('crust', 5), c('ink', 1), 2);
    if (k >= 5) centered(p, 32, info.where, c('white', 2));
    if (k >= 9) centered(p, 178, `"${info.lines[0]}`, c('white', 2));
    if (k >= 15) centered(p, 189, ` ${info.lines[1]}"`, c('white', 2));
  };
  const L = (name: string) => sprite(cast.loaf, name);
  const M = (name: string) => sprite(cast.mons, name);
  const words = (p: Pixels, x: number, y: number, w: string) => outlined(p, Math.round(x - textWidth(w) / 2), y, w, c('crust', 5), ink);
  const actors: ((p: Pixels, k: number) => void)[] = [
    // 1. the crowd: the loaf rolls along under a fish flying over
    (p, k) => {
      const x = 20 + k * 7;
      scaleBlit(p, L(`loaf.roll${k % 4}`), x, STRIP + 80, 2);
      const fx = 300 - k * 10;
      scaleBlit(p, M(`fish${k % 2}`), fx, STRIP + 10 + Math.round(((fx - 160) / 140) ** 2 * 40), 2, true);
      if (k >= 12) words(p, x + 20, STRIP + 60, 'ROLL!');
      // the one control past the arrows a first level asks for, taught before it starts
      if (k >= 16) words(p, 160, STRIP + 24, 'HOLD UP TO RISE HIGHER');
    },
    // 2. the wasteland: the loaf climbs the weave, a holy crumb above
    (p, k) => {
      const y = STRIP + 80 - Math.min(k, 20) * 3;
      scaleBlit(p, L(k % 4 < 2 ? 'loaf.rise' : 'loaf.front'), 140, y, 2);
      twinkle(p, pal, 160, STRIP + 8, 1 + (k % 3));
      if (k >= 4 && k < 18) words(p, 160, STRIP + 110, 'UP AND DOWN CLIMB');
      if (k >= 18) words(p, 160, STRIP + 22, 'SEVEN HOLY CRUMBS!');
    },
    // 3. twelve baskets: the empty baskets fill up one by one
    (p, k) => {
      for (let b = 0; b < 6; b++) basketArt(p, pal, 30 + b * 52, STRIP + 100, 18, 14, k > 6 + b * 3);
      scaleBlit(p, L('loaf.rise'), 140, STRIP + 40 - Math.round(Math.abs(Math.sin(k / 3)) * 10), 2);
      if (k >= 22) words(p, 160, STRIP + 20, 'FULL!');
    },
    // 4. the way home: the child walks, the loaf in its cloth rolls after her
    (p, k) => {
      const x = 40 + k * 5;
      scaleBlit(p, M(`girlA${(k >> 1) % 2}`), x + 60, STRIP + 40, 2);
      scaleBlit(p, M(`girlB${(k >> 1) % 2}`), x + 60, STRIP + 80, 2);
      scaleBlit(p, L(`bundle.roll${k % 4}`), x, STRIP + 80, 2);
      if (k >= 16) words(p, x + 80, STRIP + 20, 'HOME!');
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

// ---- how to play: roll, rise over the feet, ride the warm air ---------------------------------

export function howtoFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = hillBackdrop(pal, 140, 7);
  // a cooking fire at the right
  for (const [x, y] of [
    [236, 150],
    [250, 152],
    [264, 150],
  ])
    blob(bg, x, y, 7, 4, pal.r('stone'), 1, 3);
  const L = (n: string) => sprite(cast.loaf, n);
  const scene = (p: Pixels, k: number) => {
    // the flames and the warm air over them
    for (let f = 0; f < 6; f++)
      for (let y = 0; y < 14 + ((f * 5 + k * 3) % 8); y++) p.set(238 + f * 5 + Math.round(Math.sin((y + k) / 2)), 148 - y, c('fire', 3 - Math.floor(y / 6)));
    for (let w = 0; w < 3; w++)
      for (let y = 30; y < 130; y += 3) if ((y + k * 4 + w * 7) % 18 < 7) p.set(240 + w * 10 + Math.round(Math.sin((y + w) / 6) * 2), y, c('white', 1));
    // the feet stomp left; the loaf rolls right and rises over them
    const fx = k < 22 ? 150 - k * 3 : 84 - (k - 22) * 3;
    scaleBlit(p, sprite(cast.mons, `feet${(k >> 1) % 2}`), fx, 112, 2);
    let x = 10 + k * 5;
    let y = 112;
    let pose = `loaf.roll${k % 4}`;
    if (k >= 10 && k < 20) {
      y = 112 - Math.round(Math.sin(((k - 10) / 10) * Math.PI) * 50);
      pose = 'loaf.riseSide';
    }
    if (k >= 30) {
      // into the warm air: up it goes
      x = Math.min(240, 160 + (k - 30) * 8);
      y = x < 240 ? 112 : Math.max(20, 112 - (k - 40) * 6);
      pose = x < 240 ? `loaf.roll${k % 4}` : 'loaf.rise';
    }
    scaleBlit(p, L(pose), x, y, 2);
    if (k >= 12 && k < 18) say(p, pal, x + 20, y - 14, 'RISE!');
    caption(
      p,
      pal,
      k < 30 ? ['UP rises, Q and E rise sideways.', 'Rise over hungry things.'] : ['Warm air over a fire lifts you,', 'the way warm makes dough rise.'],
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

// ---- crumbling (the game is lost) -----------------------------------------------------------

export function lostFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = hillBackdrop(pal, 150, 11, ['night2', 0, 5]);
  const scene = (p: Pixels, k: number) => {
    const pose = k < 8 ? 'loaf.front' : k < 16 ? 'loaf.hurt' : k < 24 ? 'loaf.crumble0' : 'loaf.crumble1';
    if (k < 34) scaleBlit(p, sprite(cast.loaf, pose), 140, 104, 2);
    // the crumbs glow gold: some crumbs are holy
    if (k >= 30)
      for (let t = 0; t < 7; t++) {
        const x = 136 + t * 8;
        const y = 140 - Math.min(60, Math.max(0, k - 34 - t) * 3);
        twinkle(p, pal, x, y, [1, 2, 3, 2][(k + t) % 4]);
      }
    caption(p, pal, k < 30 ? ['Some crumbs are holy', 'in the silence of night.'] : ["Nothing's ever wasted.", 'Try again!']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 60; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the endings -----------------------------------------------------------------------------

/** The child (her head and robe sprites, scaled) at (x, y) of her robe's top. */
function child(p: Pixels, cast: Cast, x: number, y: number, s: number, f: number, flip = false): void {
  scaleBlit(p, sprite(cast.mons, `girlA${f}`), x, y - 20 * s, s, flip);
  scaleBlit(p, sprite(cast.mons, `girlB${f}`), x, y, s, flip);
}

/** won1.fli (twelve baskets gathered; the child picks the loaf up), won2.fli ("Mama, look what I've got..."), won3.fli (THE END). */
export function wonFlis(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const L = (n: string) => sprite(cast.loaf, n);
  {
    const r = new Reel(pal.pal);
    const bg = hillBackdrop(pal, 150, 21, ['dusk', 0, 7]);
    for (let b = 0; b < 11; b++) basketArt(bg, pal, 16 + b * 27 + (b > 5 ? 20 : 0), 120 + (b % 2) * 6, 10, 9, true);
    const scene = (p: Pixels, k: number) => {
      // the twelfth basket with the loaf in it; the child comes and lifts it out
      basketArt(p, pal, 180, 150, 22, 18, false);
      const lift = Math.max(0, k - 30) * 3;
      const cx = Math.min(196, -40 + k * 9);
      child(p, cast, cx, 110, 2, (k >> 1) % 2, true);
      scaleBlit(p, L(k >= 30 ? 'loaf.rise' : 'loaf.front'), 160 + Math.min(24, lift), 122 - Math.min(40, lift), 2);
      caption(p, pal, k < 30 ? ['He gathered me up,', 'twelve baskets full.'] : ['I traveled home', 'in the hands of a child.']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 50; k++) r.frame(bg, (p) => scene(p, k));
    r.fadeOut(3);
    files['won1.fli'] = r.fli(SPEED);
  }
  {
    // her door at night, the lamplight, Mama
    const r = new Reel(pal.pal);
    const bg = new Pixels(W, H);
    gradient(bg, 0, 0, W, 150, pal.r('night2'), 0, 3);
    const rr = rng(9);
    for (let i = 0; i < 60; i++) bg.set(Math.floor(rr() * W), Math.floor(rr() * 90), c('sun', 3));
    bg.rect(0, 150, W, 50, c('sand', 0));
    // the house and its open door
    bg.rect(150, 40, 170, 110, c('earth', 1)).rect(150, 36, 170, 4, c('wood', 1));
    bg.rect(200, 70, 60, 80, c('lamp', 1)).rect(206, 76, 48, 74, c('lamp', 2));
    for (let y = 150; y < 190; y++) for (let x = 190 - (y - 150); x < 270 + (y - 150); x++) if ((x + y) % 2) bg.set(x, y, c('lamp', 0));
    const scene = (p: Pixels, k: number) => {
      // Mama in the doorway, her veil blue
      blob(p, 230, 98, 10, 11, pal.r('skin'), 1, 3);
      blob(p, 230, 94, 14, 14, pal.r('blue'), 0, 3);
      blob(p, 230, 100, 8, 9, pal.r('skin'), 1, 3);
      p.set(227, 99, c('ink', 0)).set(233, 99, c('ink', 0)).rect(228, 104, 5, 1, c('red', 1));
      for (let y = 110; y < 150; y++) p.rect(230 - 10 - (y - 110) / 3, y, 20 + ((y - 110) * 2) / 3, 1, c('blue', y % 6 === 0 ? 1 : 2));
      // the child holds the loaf up to her
      const cx = Math.min(150, 20 + k * 6);
      child(p, cast, cx, 130, 2, (k >> 1) % 2);
      const up = k >= 22 ? Math.min(16, (k - 22) * 2) : 0;
      scaleBlit(p, L(k >= 34 ? 'bundle.bread1' : 'bundle.front'), cx + 30, 116 - up, 2);
      if (k >= 26 && k < 44) {
        say(p, pal, 140, 52, 'MAMA, LOOK WHAT', 'white', 2);
        say(p, pal, 140, 64, "I'VE GOT...", 'white', 2);
      }
      caption(p, pal, k < 26 ? ['She whispered,', '"Mama, look what I\'ve got..."'] : ['And suddenly, I mattered', 'a whole awful lot.']);
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
    // THE END: still bread
    const r = new Reel(pal.pal);
    const bg = new Pixels(W, H, c('purple', 0));
    const rr = rng(77);
    for (let i = 0; i < 70; i++) bg.set(Math.floor(rr() * W), Math.floor(rr() * 150), c('gold', i % 3));
    const scene = (p: Pixels, k: number) => {
      outlined(p, 160 - textWidth('THE END', 3) / 2, 18, 'THE END', c('crust', 5), c('ink', 0), 3, c('crust', 1));
      const up = Math.round(Math.abs(Math.sin(k / 3)) * 10);
      scaleBlit(p, L(k % 8 < 4 ? 'loaf.bread0' : 'loaf.bread1'), 140, 84 - up, 2);
      basketArt(p, pal, 160, 124, 30, 16, false);
      for (let t = 0; t < 8; t++) twinkle(p, pal, 60 + ((t * 47 + k * 5) % 200), 56 + ((t * 23 + k * 7) % 80), [0, 1, 2, 3, 2, 1][(k + t) % 6]);
      if (k >= 8) outlined(p, 160 - textWidth("I'M STILL BREAD.", 2) / 2, 156, "I'M STILL BREAD.", c('sun', 3), c('ink', 0), 2);
      caption(p, pal, ['So here I rise,', 'not famous... but fed.']);
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

export { T };
