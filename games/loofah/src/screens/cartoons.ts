// The cartoons (FLIs drawn here, frame by frame): the title (the art drawn for the game,
// art/cover.ts: steam drifts, the candles flicker, the loofah sways and opens its eyes, and the
// name drops in), the story ("Don't touch the pink one. It's mine!"; he reaches for it anyway; the
// scrub; lightning, and the mirror fogs up YOU CROSSED A LINE), the act cards (drips and the
// screaming towel; owls' eyes and a wild loofah in the forest-dark aisle; a candle carried down
// the dark hall; Scrubbus Maximus as the tile turns blood red), how to play, the lost ending
// (sleeping alone with a washcloth of shame), and the endings (the pink one hung back on her rack
// as the steam clears; "Did you touch the pink one?" "...No." and the towel screams; THE END, two
// loofahs on the rack). Each reel opens on black and fades by palette (kit/reel.ts); only what
// moves is stored.
import { Pixels, rng } from '../../../kit/pixels';
import { medianCutPalette, Quantizer } from '../../../kit/quantize';
import { Reel } from '../../../kit/reel';
import { fadeOutLength } from '../../../kit/fadeOut';
import { blob } from '../../../snowbound/src/art/draw';
import { centered, micro, microWidth, outlined, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { coverRgb } from '../art/cover';
import { buildScreenPalette, type Pal } from '../art/pal';
import { bathroomBackdrop, candle, silverRack } from './screens';
import { AUTHOR, CARDS } from './text';

const W = 320;
const H = 200;
/** Clear pixels in sprites. */
const T = 255;
/** 1/70 s per frame: about 12 frames a second. */
export const SPEED = 6;

export interface Cast {
  /** The man's sprites (the .CBL's pictures). */
  man: Map<string, Pixels>;
  /** Everybody else's (the .MBL's pictures). */
  mons: Map<string, Pixels>;
  /** A background block's picture. */
  block: (name: string) => Pixels;
}

/** The palette (6-bit VGA) washed toward blood red by `t` (0..1). */
export function bloodRed(pal: Uint8Array, t: number): Uint8Array {
  const out = Uint8Array.from(pal);
  for (let i = 0; i < 256; i++) {
    const [r, g, b] = [pal[i * 3], pal[i * 3 + 1], pal[i * 3 + 2]];
    const l = (r + g + b) / 3;
    out[i * 3] = Math.round(r + (Math.min(63, l * 1.4 + 6) - r) * t);
    out[i * 3 + 1] = Math.round(g * (1 - 0.78 * t));
    out[i * 3 + 2] = Math.round(b * (1 - 0.7 * t));
  }
  return out;
}

/** The palette flashed white by `t` (a crack of lightning). */
function flashed(pal: Uint8Array, t: number): Uint8Array {
  return pal.map((v) => Math.round(v + (63 - v) * t * 0.7));
}

/** The bar along the bottom with one or two lines of the song. */
function caption(p: Pixels, pal: Pal, lines: string[]): void {
  p.rect(0, 172, W, H - 172, pal.c('ink', 0));
  lines.forEach((l, i) => centered(p, 176 + i * 12, l, pal.c(i ? 'coral' : 'white', i ? 4 : 2)));
}

/** Words said over (x, y), outlined. */
function say(p: Pixels, pal: Pal, x: number, y: number, words: string, ramp = 'coral', k = 4, scale = 1): void {
  outlined(p, Math.round(x - textWidth(words, scale) / 2), y, words, pal.c(ramp, k), pal.c('ink', 0), scale);
}

/** Everything outside a light (cx, cy, r) dimmed to the dark. */
function spotlight(p: Pixels, pal: Pal, cx: number, cy: number, r: number, top = 0, bottom = 172): void {
  const dark = pal.c('ink', 0);
  for (let y = top; y < bottom; y++)
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx, (y - cy) * 1.2);
      if (d > r + 6 || (d > r && (x + y) % 2)) p.set(x, y, dark);
    }
}

const sprite = (set: Map<string, Pixels>, name: string) => {
  const s = set.get(name);
  if (!s) throw new Error(`No sprite ${name}`);
  return s;
};

/** Steam wisps drifting up across the picture (frame k). */
function steam(p: Pixels, pal: Pal, k: number, seed = 5, n = 12, bottom = 170): void {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * W);
    const y0 = 40 + Math.floor(r() * (bottom - 40));
    const y = 40 + ((y0 - 40 - k * 3 + 400) % (bottom - 40));
    for (let j = 0; j < 14; j++) if ((x + j + y) % 3) p.set(x + j + Math.round(Math.sin((y + j + k) / 3) * 2), y, pal.c('steam', 2 + (i % 2)));
  }
}

/** A mirror at (x, y), w x h, fogged by `fog` (0..1), with `words` written in it by `write` (0..1). */
function mirror(p: Pixels, pal: Pal, x: number, y: number, w: number, h: number, fog: number, words: string, write: number): void {
  const c = pal.c;
  p.rect(x - 3, y - 3, w + 6, h + 6, c('gold', 1)).rect(x, y, w, h, c('metal', 1));
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) if ((xx * 7 + yy * 13) % 100 < fog * 100) p.set(xx, yy, c('fog', (xx + yy) % 3 ? 0 : 1));
  const shown = words.slice(0, Math.round(words.length * write));
  if (shown) micro(p, Math.round(x + w / 2 - microWidth(words, 2) / 2), Math.round(y + h / 2 - 5), shown, c('demon', 3), 2);
}

// ---- the title: the art drawn for the game ----------------------------------------------------

/** How many pictures of the cover the title animates through. */
const COVER_FRAMES = 12;

/** The title cartoon (cover.fli: the cover comes to life, an iris closes, a fade to black) and the cover with the name on it (title.gif's pixels and palette). */
export function coverFli(): { fli: Uint8Array; title: Pixels; pal: Uint8Array } {
  const frames = Array.from({ length: COVER_FRAMES }, (_, k) => coverRgb(k / (COVER_FRAMES - 1)));
  // inks for the lettering first (black, coral, the candle's gold, a deep shadow, white), then the cover's colors
  const INKS: [number, number, number][] = [
    [0, 0, 0],
    [255, 150, 120],
    [255, 196, 80],
    [24, 8, 20],
    [255, 255, 255],
  ];
  const pal = medianCutPalette(frames, INKS);
  const q = new Quantizer(pal, 10);
  const pics = frames.map((f) => {
    const p = new Pixels(W, H);
    p.px.set(q.apply(f, W, H));
    return p;
  });
  const name = (p: Pixels, drop: number, sub: boolean) => {
    outlined(p, 160 - textWidth('CLEANSE ME,', 2) / 2, drop, 'CLEANSE ME,', 4, 3, 2, 3);
    outlined(p, 160 - textWidth('O LOOFAH', 3) / 2, drop + 18, 'O LOOFAH', 1, 3, 3, 3);
    if (sub) {
      outlined(p, 160 - textWidth('BUT LEAVE MY SOUL') / 2, drop + 46, 'BUT LEAVE MY SOUL', 2, 3);
      p.rect(0, 186, W, 14, 3);
      centered(p, 189, `${AUTHOR} (c) 1995 Shareware`, 4);
    }
  };
  const r = new Reel(pal);
  r.fadeIn(pics[0], 6);
  pics.forEach((p, i) => r.add(p, i === 0 ? 4 : 2));
  const last = pics[pics.length - 1];
  // the name is the title picture's: the cartoon closes on an iris and fades to black instead
  r.irisOut(160, 138, 8).fadeOut(fadeOutLength(SPEED));
  const title = new Pixels(W, H);
  title.px.set(last.px);
  name(title, 7, true);
  return { fli: r.fli(SPEED), title, pal };
}

// ---- the story ---------------------------------------------------------------------------------

export function storyFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const M = (n: string) => sprite(cast.man, n);
  const N = (n: string) => sprite(cast.mons, n);
  const bg = bathroomBackdrop(pal, 7);
  silverRack(bg, pal, 120, 200, 60);
  // 1. The rack, the coral one hanging smug on it. "Don't touch the pink one. It's mine!"
  const rackScene = (p: Pixels, k: number) => {
    scaleBlit(p, N(k % 8 < 4 ? 'spongeA0a' : 'spongeA0b'), 140, 64, 2);
    steam(p, pal, k);
    if (k >= 4) {
      // her voice, from the doorway
      p.rect(200, 76, 116, 30, c('white', 2)).frame(200, 76, 116, 30, c('ink', 0)).line(214, 106, 206, 116, c('ink', 0));
      outlined(p, 206, 80, "DON'T TOUCH", c('pink', 3), c('ink', 0));
      outlined(p, 206, 92, 'THE PINK ONE!', c('pink', 3), c('ink', 0));
    }
    caption(p, pal, k < 14 ? ['She said, "Don\'t touch the', 'pink one. It\'s mine!"'] : ['There it hung, innocent,', 'smug on the silver rack.']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  rackScene(first, 0);
  r.fadeIn(first, 4);
  for (let k = 0; k < 28; k++) r.frame(bg, (p) => rackScene(p, k));
  // 2. He reaches for it anyway; it winks
  for (let k = 0; k < 24; k++)
    r.frame(bg, (p) => {
      scaleBlit(p, N(k >= 16 && k % 4 < 2 ? 'spongeA1a' : 'spongeA0a'), 140, 64, 2);
      scaleBlit(p, M(k < 12 ? `walk${k % 4}` : 'throw0'), 20 + Math.min(12, k) * 7, 112, 2);
      steam(p, pal, k + 28);
      if (k >= 16) say(p, pal, 180, 50, '*wink*', 'eye', 1);
      caption(p, pal, k < 12 ? ["But I, I didn't listen.", "I thought, it's just a loofah."] : ['I reached out with', 'my mortal hand...']);
    });
  // 3. The scrub. Lightning. Grapefruit and betrayal.
  for (let k = 0; k < 28; k++) {
    const flash = k === 14 || k === 16 ? 1 : k === 15 ? 0.5 : 0;
    r.frame(
      bg,
      (p) => {
        scaleBlit(p, M(k % 4 < 2 ? 'sing0' : 'sing1'), 120, 100, 3);
        scaleBlit(p, N('spongeA0a'), 150 + (k % 2) * 6, 104, 2);
        for (let i = 0; i < 10; i++) p.ring(120 + ((i * 17 + k * 5) % 90), 90 + ((i * 11 + k * 7) % 60), 2 + (i % 3), c('suds', 2));
        if (k < 14) say(p, pal, 160, 60, 'SCRUB SCRUB SCRUB', 'white', 2);
        else say(p, pal, 160, 50, 'ROUGH!', 'demon', 4, 2);
        caption(p, pal, k < 14 ? ['It was peach, or coral,', 'some evil hue.'] : ['It smelled like grapefruit', 'and betrayal.']);
      },
      1,
      1,
      flash ? flashed(pal.pal, flash) : pal.pal,
    );
  }
  // 4. The mirror fogs up, and the words are written in it
  const mirrorBg = bathroomBackdrop(pal, 9);
  for (let k = 0; k < 34; k++)
    r.frame(mirrorBg, (p) => {
      mirror(p, pal, 60, 24, 200, 110, Math.min(1, k / 10), 'YOU CROSSED A LINE', Math.max(0, Math.min(1, (k - 10) / 14)));
      scaleBlit(p, M('worry'), 140, 126, 2);
      steam(p, pal, k, 9, 16);
      caption(p, pal, ['The mirror steamed', 'a warning sign...']);
    });
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the act cards ----------------------------------------------------------------------------

export interface CardView {
  /** The act's view (16 x 6 blocks), in the act's palette. */
  map: Pixels;
  pal: Pal;
}

/** The strip of the act on a card: y 54 to 174. */
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
    p.rect(0, STRIP - 1, W, 1, c('flame', 1)).rect(0, 174, W, 1, c('flame', 1));
    const drop = [-24, -14, -2, 10, 6, 8][Math.min(5, k)];
    outlined(p, 160 - textWidth(info.title, 2) / 2, drop, info.title, c('coral', 4), c('ink', 1), 2);
    if (k >= 5) centered(p, 32, info.where, c('white', 2));
    if (k >= 9) centered(p, 178, `"${info.lines[0]}`, c('white', 2));
    if (k >= 15) centered(p, 189, ` ${info.lines[1]}"`, c('white', 2));
  };
  const M = (name: string) => sprite(cast.man, name);
  const N = (name: string) => sprite(cast.mons, name);
  const words = (p: Pixels, x: number, y: number, w: string, ramp = 'coral') =>
    outlined(p, Math.round(x - textWidth(w) / 2), y, w, c(ramp, ramp === 'coral' ? 4 : 3), ink);
  const r = new Reel(pal.pal);
  const K = 30;
  const scene: ((p: Pixels, k: number) => void)[] = [
    // 1. drips fall, he hops past the screaming towel
    (p, k) => {
      for (let d = 0; d < 3; d++) scaleBlit(p, N(`drip${k % 2}`), 40 + d * 90, STRIP + ((k * 9 + d * 37) % 100), 2);
      scaleBlit(p, N(k % 6 < 3 ? 'towel0' : 'towel1'), 220, STRIP + 80, 2);
      const x = 20 + k * 5;
      scaleBlit(
        p,
        M(k >= 14 && k < 22 ? 'hopSide' : `walk${k % 4}`),
        x,
        STRIP + 80 - (k >= 14 && k < 22 ? Math.round(Math.sin(((k - 14) / 8) * Math.PI) * 30) : 0),
        2,
      );
      if (k % 6 >= 3) words(p, 240, STRIP + 60, 'AAAAH!', 'white');
    },
    // 2. owls' eyes in the forest-dark aisle, a wild loofah hopping at him
    (p, k) => {
      spotlight(p, pal, 60 + k * 4, STRIP + 90, 50, STRIP, 174);
      for (const [x, y] of [
        [40, 20],
        [150, 10],
        [260, 30],
      ])
        if (k % 10 < 8) scaleBlit(p, N('owl0'), x, STRIP + y, 2);
      scaleBlit(p, M(`walk${k % 4}`), 40 + k * 4, STRIP + 80, 2);
      scaleBlit(p, N(`feral${(k >> 1) % 2}`), 260 - k * 3, STRIP + 80, 2);
      if (k >= 12) words(p, 260 - k * 3, STRIP + 60, 'GRRR', 'gourd');
    },
    // 3. a candle carried down the dark hall
    (p, k) => {
      const x = 20 + k * 7;
      spotlight(p, pal, x + 24, STRIP + 80, 40 + (k % 3), STRIP, 174);
      scaleBlit(p, M(`sneak${k % 2}`), x, STRIP + 80, 2);
      candle(p, pal, x + 34, STRIP + 82, 12, k);
      if (k >= 14) words(p, x + 20, STRIP + 40, 'SHHH!');
    },
    // 4. the tile turns blood red: Scrubbus Maximus
    (p, k) => {
      scaleBlit(p, N(`spongeA0${k % 4 < 2 ? 'a' : 'b'}`), 220, STRIP + 40, 2);
      scaleBlit(p, N(`spongeB0${k % 4 < 2 ? 'a' : 'b'}`), 220, STRIP + 80, 2);
      scaleBlit(p, M('hurt'), 60, STRIP + 80, 2);
      if (k >= 18) words(p, 170, STRIP + 14, 'SCRUBBUS MAXIMUS!', 'demon');
    },
  ];
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene[i](first, 0);
  frame(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < K; k++) {
    const light = i === 2 ? 0.8 : 1;
    const palK = i === 3 ? bloodRed(pal.pal, Math.min(1, k / 14)) : pal.pal;
    r.frame(bg, (p) => (scene[i](p, k), frame(p, k)), 1, light, palK);
  }
  return r.fli(SPEED);
}

// ---- how to play ------------------------------------------------------------------------------

export function howtoFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = bathroomBackdrop(pal, 11);
  const M = (n: string) => sprite(cast.man, n);
  const N = (n: string) => sprite(cast.mons, n);
  const scene = (p: Pixels, k: number) => {
    // a bar of cursed soap on the floor; he tiptoes and hops over it
    if (k < 30) scaleBlit(p, N(`grapefruit${(k >> 1) % 2}`), 104, 128, 2);
    let x = 10 + k * 5;
    let y = 120;
    let pose = `walk${k % 4}`;
    if (k >= 14 && k < 24) {
      y = 120 - Math.round(Math.sin(((k - 14) / 10) * Math.PI) * 40);
      pose = 'hopSide';
    }
    if (k >= 30) {
      x = 120;
      pose = k % 6 < 3 ? 'throw0' : 'throw1';
      // the demon sponge; the brine splashes it
      const t = k - 30;
      scaleBlit(p, N(t < 18 ? 'spongeA0a' : 'spongeA1a'), 240, 80, 2);
      scaleBlit(p, N(t < 18 ? 'spongeB0a' : 'spongeB1a'), 240, 120, 2);
      if (t >= 4 && t < 18) scaleBlit(p, N(`brine${t % 2}`), 160 + (t - 4) * 6, 110, 2);
      if (t >= 18) say(p, pal, 260, 56, 'SPLASH!', 'white', 2);
    }
    scaleBlit(p, M(pose), x, y, 2);
    if (k >= 15 && k < 22) say(p, pal, x + 20, y - 14, 'HOP!');
    caption(p, pal, k < 30 ? ['UP hops, Q and E hop sideways.', 'Hop over the cursed soap.'] : ['SPACE throws rosemary brine', '(once you have rosemary).']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 56; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(3);
  return r.fli(SPEED);
}

// ---- the lost ending: sleeping alone with a washcloth of shame ----------------------------------

/** A dark bedroom: the bed across the floor, the moon through the window. */
function bedroomBackdrop(pal: Pal): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  for (let y = 0; y < 150; y++) for (let x = 0; x < W; x++) p.set(x, y, c('night', x % 20 < 10 ? 1 : 2));
  p.rect(0, 150, W, 50, c('wood', 1));
  for (let y = 152; y < H; y += 8) p.rect(0, y, W, 1, c('wood', 0));
  p.rect(214, 20, 70, 70, c('wood', 2)).rect(218, 24, 62, 62, c('night', 0)).disc(256, 46, 11, c('moon', 1));
  p.rect(30, 110, 12, 50, c('wood', 1));
  p.rect(42, 124, 160, 30, c('quilt', 1)).rect(42, 124, 160, 4, c('quilt', 3));
  for (let x = 44; x < 200; x += 12) p.rect(x, 130, 1, 22, c('quilt', 0));
  return p;
}

export function lostFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = bedroomBackdrop(pal);
  const scene = (p: Pixels, k: number) => {
    // him under the quilt, alone, the washcloth tucked under his chin
    scaleBlit(p, sprite(cast.man, k % 20 < 16 ? 'faint1' : 'worry'), 70, 92, 2);
    p.rect(98, 120, 18, 8, c('towel', 2)).rect(98, 120, 18, 2, c('towel', 3));
    if (k >= 16) say(p, pal, 150, 70, '...', 'white', 2, 2);
    // and down the hall, the bathroom light, and her voice
    if (k >= 30) {
      p.rect(300, 60, 20, 90, c('fog', 1));
      say(p, pal, 250, 40, k % 8 < 4 ? '"Honey...?"' : '', 'pink', 3);
    }
    spotlight(p, pal, 120, 120, Math.max(10, 90 - Math.max(0, k - 40) * 4));
    caption(p, pal, k < 30 ? ["I'm sleeping alone", 'with a washcloth of shame,'] : ['while she bathes with', 'her demons. Try again!']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 60; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the endings ----------------------------------------------------------------------------

/** won1.fli (the pink one hung back, the steam clearing), won2.fli ("Did you touch the pink one?" "...No." the towel screams), won3.fli (THE END). */
export function wonFlis(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const M = (n: string) => sprite(cast.man, n);
  const N = (n: string) => sprite(cast.mons, n);
  {
    // he hangs the pink one back on her rack; the blood red drains out; the steam clears; the mirror
    const r = new Reel(pal.pal);
    const bg = bathroomBackdrop(pal, 21);
    silverRack(bg, pal, 140, 230, 70);
    const scene = (p: Pixels, k: number) => {
      const lift = Math.max(0, 20 - k);
      scaleBlit(p, N(`pink${k % 2}`), 170, 74 + lift, 2);
      scaleBlit(p, M(k < 20 ? 'throw0' : 'bliss'), 110, 112, 2);
      if (k < 30) steam(p, pal, k, 21, 20 - Math.floor(k / 2));
      mirror(p, pal, 30, 30, 90, 60, Math.max(0, 1 - Math.max(0, k - 20) / 16), 'SORRY', Math.max(0, Math.min(1, (k - 26) / 8)));
      if (k >= 36) say(p, pal, 200, 40, 'cleansed.', 'pink', 3);
      caption(p, pal, k < 24 ? ['Cleanse me, O loofah,', 'but leave my soul.'] : ['The curse lifts.', 'The steam clears.']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3, bloodRed(pal.pal, 1));
    for (let k = 0; k < 48; k++) r.frame(bg, (p) => scene(p, k), 1, 1, bloodRed(pal.pal, Math.max(0, 1 - k / 24)));
    r.fadeOut(3);
    files['won1.fli'] = r.fli(SPEED);
  }
  {
    // the next morning: "Did you touch the pink one?" "...No." The towel screams.
    const r = new Reel(pal.pal);
    const bg = bathroomBackdrop(pal, 23);
    silverRack(bg, pal, 200, 300, 60);
    blob(bg, 232, 80, 9, 10, pal.r('pink'), 1, 3);
    const lines: [number, string[]][] = [
      [0, ['The next morning.', '']],
      [12, ['"Did you touch', 'the pink one?"']],
      [30, ['"...No."', '']],
      [42, ['MY TOWEL SCREAMS:', '"YOU MADE IT WORSE!"']],
    ];
    const scene = (p: Pixels, k: number) => {
      scaleBlit(p, M(k < 30 ? 'front' : k < 42 ? 'worry' : 'hurt'), 100, 104, 3);
      if (k >= 42) {
        scaleBlit(p, N(k % 4 < 2 ? 'towel1' : 'towel0'), 260, 104, 2);
        say(p, pal, 270, 90, 'AAAAH!', 'white', 2);
      }
      if (k >= 30 && k < 42) for (let i = 0; i < 4; i++) p.set(150 + ((i * 13 + k * 3) % 30), 100 + ((i * 7 + k * 5) % 30), c('wet', 1));
      const cur = [...lines].reverse().find(([at]) => k >= at)!;
      caption(p, pal, cur[1]);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 4);
    for (let k = 0; k < 64; k++) r.frame(bg, (p) => scene(p, k));
    files['won2.fli'] = r.fli(SPEED);
  }
  {
    // THE END: two loofahs on the rack, hers and his
    const r = new Reel(pal.pal);
    const bg = bathroomBackdrop(pal, 77);
    silverRack(bg, pal, 110, 210, 70);
    const scene = (p: Pixels, k: number) => {
      outlined(p, 160 - textWidth('THE END', 3) / 2, 14, 'THE END', c('coral', 4), c('ink', 0), 3, c('demon', 0));
      scaleBlit(p, N(`pink${k % 2}`), 124, 74, 2);
      blob(p, 180, 94, 14, 16, pal.r('ink'), 0, 1);
      for (let i = 0; i < 6; i++) p.set(172 + ((i * 5) % 16), 84 + ((i * 7) % 20), c('grey', 1));
      say(p, pal, 140, 128, 'hers', 'pink', 3);
      say(p, pal, 182, 128, 'his', 'white', 1);
      caption(p, pal, ['Never touch the loofah.', 'Never touch the loofah of Lucifer.']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 40; k++) r.frame(bg, (p) => scene(p, k));
    files['won3.fli'] = r.fli(SPEED);
  }
  return files;
}

export { T };
