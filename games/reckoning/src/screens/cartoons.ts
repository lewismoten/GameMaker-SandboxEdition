// The cartoons (FLIs drawn here, frame by frame), staged like the monologue's script, with its
// lighting cues: the title (the art drawn for the game, art/cover.ts: the fridge swings open,
// the aura turns, lightning, and the name drops in), the story (3:17 on the clock, his eyes
// open; a spotlight: "I shouldn't. I can't."; thunder as he tiptoes to the glow; the enemy-lover,
// close up), the act cards (a spotlight sweeping the bedroom, the fridge's light coming on, a
// SMASH CUT and the lights flickering, the lights turning blood red), how to play, fainting
// (the game is lost), and the endings (the thunderous flush swallows the Devil; a last spotlight
// on him: "I wasn't built for this!", one last gurgle, "...Is there Lactaid in hell?", BLACKOUT;
// THE END). Each reel opens on black and fades by palette (kit/reel.ts); only what moves is
// stored.
import { Pixels, rng } from '../../../kit/pixels';
import { medianCutPalette, Quantizer } from '../../../kit/quantize';
import { Reel } from '../../../kit/reel';
import { fadeOutLength } from '../../../kit/fadeOut';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, micro, microWidth, outlined, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { coverRgb } from '../art/cover';
import { buildScreenPalette, type Pal } from '../art/pal';
import { cheesecake, kitchenBackdrop } from './screens';
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

/** The palette (6-bit VGA) washed toward blood red by `t` (0..1): the lights turn blood red. */
export function bloodRed(pal: Uint8Array, t: number): Uint8Array {
  const out = Uint8Array.from(pal);
  for (let i = 0; i < 256; i++) {
    const [r, g, b] = [pal[i * 3], pal[i * 3 + 1], pal[i * 3 + 2]];
    const l = (r + g + b) / 3;
    out[i * 3] = Math.round(r + (Math.min(63, l * 1.4 + 6) - r) * t);
    out[i * 3 + 1] = Math.round(g * (1 - 0.78 * t));
    out[i * 3 + 2] = Math.round(b * (1 - 0.82 * t));
  }
  return out;
}

/** The palette flashed white by `t` (a crack of lightning). */
function flashed(pal: Uint8Array, t: number): Uint8Array {
  return pal.map((v) => Math.round(v + (63 - v) * t * 0.7));
}

/** The bar along the bottom with one or two lines of the monologue. */
function caption(p: Pixels, pal: Pal, lines: string[]): void {
  p.rect(0, 172, W, H - 172, pal.c('ink', 0));
  lines.forEach((l, i) => centered(p, 176 + i * 12, l, pal.c(i ? 'cream' : 'white', i ? 3 : 2)));
}

/** Words said over (x, y), outlined. */
function say(p: Pixels, pal: Pal, x: number, y: number, words: string, ramp = 'cream', k = 3, scale = 1): void {
  outlined(p, Math.round(x - textWidth(words, scale) / 2), y, words, pal.c(ramp, k), pal.c('ink', 0), scale);
}

/** Everything outside a spotlight (cx, cy, r) dimmed to the dark of a stage. */
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

/** A bedroom at night: wallpaper, the window and its moon, the bed with her asleep in it, the clock. */
function bedroomBackdrop(pal: Pal): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  for (let y = 0; y < 150; y++) for (let x = 0; x < W; x++) p.set(x, y, c('night', x % 20 < 10 ? 1 : 2));
  p.rect(0, 150, W, 50, c('wood', 1));
  for (let y = 152; y < H; y += 8) p.rect(0, y, W, 1, c('wood', 0));
  // the window
  p.rect(200, 20, 80, 70, c('wood', 2)).rect(204, 24, 72, 62, c('night', 0)).disc(250, 46, 12, c('moon', 1)).disc(246, 42, 6, c('moon', 2));
  for (let y = 28; y < 84; y += 6) p.rect(204, y, 72, 2, c('night', 3));
  // the bed: headboard, pillows, her under the quilt
  p.rect(16, 80, 12, 80, c('wood', 2));
  p.rect(28, 118, 150, 34, c('quilt', 1)).rect(28, 118, 150, 4, c('quilt', 3));
  for (let x = 30; x < 178; x += 12) p.rect(x, 124, 1, 26, c('quilt', 0));
  blob(p, 48, 114, 18, 8, pal.r('white'), 1, 2);
  blob(p, 52, 112, 9, 7, pal.r('hair'), 0, 2);
  blob(p, 110, 116, 40, 8, pal.r('quilt'), 1, 3);
  p.rect(28, 152, 150, 8, c('quilt', 0));
  // the night stand
  p.rect(184, 128, 40, 32, c('wood', 2)).rect(184, 128, 40, 3, c('wood', 4));
  return p;
}

/** The clock on the night stand: big red digits. */
function clock(p: Pixels, pal: Pal, x: number, y: number, time: string, colon: boolean): void {
  p.rect(x, y, 44, 18, pal.c('ink', 0)).frame(x, y, 44, 18, pal.c('grey', 1));
  outlined(p, x + 3, y + 5, colon ? time : time.replace(':', ' '), pal.c('digit', 1), pal.c('ink', 0));
}

// ---- the title: the art drawn for the game ----------------------------------------------------

/** How many pictures of the cover the title animates through. */
const COVER_FRAMES = 10;

/** The title cartoon (cover.fli: the cover comes to life, an iris closes, a fade to black) and the cover with the name on it (title.gif's pixels and palette). */
export function coverFli(): { fli: Uint8Array; title: Pixels; pal: Uint8Array } {
  const frames = Array.from({ length: COVER_FRAMES }, (_, k) => coverRgb(k / (COVER_FRAMES - 1)));
  // inks for the lettering first (black, cream, the aura's gold, a deep shadow, white), then the cover's colors
  const INKS: [number, number, number][] = [
    [0, 0, 0],
    [255, 236, 190],
    [255, 176, 40],
    [20, 10, 30],
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
    outlined(p, 160 - textWidth('THE GREAT DAIRY', 2) / 2, drop, 'THE GREAT DAIRY', 1, 3, 2, 3);
    outlined(p, 160 - textWidth('RECKONING', 3) / 2, drop + 18, 'RECKONING', 2, 3, 3, 3);
    if (sub) {
      outlined(p, 160 - textWidth('OF 3:17 A.M.') / 2, drop + 46, 'OF 3:17 A.M.', 4, 3);
      p.rect(0, 186, W, 14, 3);
      centered(p, 189, `${AUTHOR} (c) 1995 Shareware`, 4);
    }
  };
  const r = new Reel(pal);
  r.fadeIn(pics[0], 6);
  pics.forEach((p, i) => r.add(p, i === 0 ? 4 : 2));
  const last = pics[pics.length - 1];
  // the name is the title picture's: the cartoon closes on an iris and fades to black instead
  r.irisOut(226, 70, 8).fadeOut(fadeOutLength(SPEED));
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
  const bed = bedroomBackdrop(pal);
  const kitchen = kitchenBackdrop(pal, 200, 7);
  // 1. 3:16... 3:17. His eyes open.
  const first = new Pixels(W, H);
  first.px.set(bed.px);
  const bedScene = (p: Pixels, k: number) => {
    clock(p, pal, 182, 106, k < 8 ? '3:16' : '3:17', k % 4 < 2);
    scaleBlit(p, M(k < 10 ? 'blink' : k < 14 ? 'front' : 'worry'), 110, 70 - (k >= 16 ? Math.min(20, (k - 16) * 4) : 0), 2);
    if (k >= 10 && k < 16) say(p, pal, 130, 52, '!', 'white', 2, 2);
    caption(p, pal, k < 8 ? ['3:16 A.M.', 'She is asleep.'] : ['3:17 A.M.', 'Somewhere, a cheesecake waits.']);
  };
  bedScene(first, 0);
  r.fadeIn(first, 4);
  for (let k = 0; k < 24; k++) r.frame(bed, (p) => bedScene(p, k));
  // 2. A spotlight: "I shouldn't. I can't."
  for (let k = 0; k < 26; k++)
    r.frame(bed, (p) => {
      scaleBlit(p, M(k < 13 ? 'speak0' : 'speak1'), 130, 76, 3);
      spotlight(p, pal, 160, 106, 44 + Math.min(10, k));
      for (let i = 0; i < k % 5; i++) p.set(150 + i * 7, 84 + ((k + i * 3) % 9), c('sweat', 1));
      caption(p, pal, k < 13 ? ["I shouldn't.", "I can't."] : ['I am...', 'lactose intolerant.']);
    });
  // 3. Thunder, and he tiptoes into the kitchen, to the glow
  for (let k = 0; k < 30; k++) {
    const flash = k === 10 || k === 12 ? 1 : k === 11 ? 0.5 : 0;
    r.frame(
      kitchen,
      (p) => {
        scaleBlit(p, M(`walk${k % 4}`), 20 + k * 5, 112, 2);
        if (k >= 10 && k < 20) say(p, pal, 90, 40, 'CRACKLE!', 'white', 2, 2);
        if (k >= 18) say(p, pal, 220, 8, 'moo...', 'cream', 1);
        caption(p, pal, k < 10 ? ["Or maybe I'll just eat it", 'in the dark...'] : ['Thunder. Somewhere,', 'a cow moos ominously.']);
      },
      1,
      1,
      flash ? flashed(pal.pal, flash) : pal.pal,
    );
  }
  // 4. Close up: the enemy-lover
  const close = new Pixels(W, H);
  gradient(close, 0, 0, W, 172, pal.r('glow'), 2, 5);
  for (let k = 0; k < 28; k++)
    r.frame(close, (p) => {
      cheesecake(p, pal, 160, 96, 4, k + 1);
      caption(p, pal, k < 14 ? ['There it is.', 'The enemy.'] : ['And the lover.', 'The... enemy-lover.']);
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
  /** Where this act falls in the game (the last one says so), small under the place line. */
  const count = `${i === CARDS.length - 1 ? 'FINAL ACT:' : 'ACT'} ${i + 1} OF ${CARDS.length}${i === 0 ? ' - F5 SAVES, F6 LOADS' : ''}`;
  const bg = new Pixels(W, H, ink);
  bg.blit(card.map, 0, STRIP);
  const frame = (p: Pixels, k: number) => {
    p.rect(0, 0, W, STRIP, ink).rect(0, 174, W, 26, ink);
    p.rect(0, STRIP - 1, W, 1, c('aura', 2)).rect(0, 174, W, 1, c('aura', 2));
    const drop = [-24, -14, -2, 10, 6, 8][Math.min(5, k)];
    outlined(p, 160 - textWidth(info.title, 2) / 2, drop, info.title, c('cream', 3), c('ink', 1), 2);
    if (k >= 5) centered(p, 32, info.where, c('white', 2));
    if (k >= 5) micro(p, 160 - Math.ceil(microWidth(count) / 2), 45, count, c('white', 2));
    if (k >= 9) centered(p, 178, `"${info.lines[0]}`, c('white', 2));
    if (k >= 15) centered(p, 189, ` ${info.lines[1]}"`, c('white', 2));
  };
  const M = (name: string) => sprite(cast.man, name);
  const N = (name: string) => sprite(cast.mons, name);
  const words = (p: Pixels, x: number, y: number, w: string, ramp = 'cream') => outlined(p, Math.round(x - textWidth(w) / 2), y, w, c(ramp, 3), ink);
  const r = new Reel(pal.pal);
  const K = 30;
  const scene: ((p: Pixels, k: number) => void)[] = [
    // 1. a spotlight sweeping the dark bedroom finds him tiptoeing
    (p, k) => {
      const x = 20 + k * 6;
      scaleBlit(p, M(`sneak${k % 2}`), x, STRIP + 80, 2);
      spotlight(p, pal, x + 20, STRIP + 80, 46, STRIP, 174);
      if (k >= 14) words(p, x + 20, STRIP + 40, 'SHHH!');
    },
    // 2. the fridge's light comes on, and the cheesecake glows
    (p, k) => {
      cheesecake(p, pal, 236, STRIP + 46, 2, k);
      scaleBlit(p, M(k < 14 ? 'front' : 'bliss'), 60, STRIP + 80, 2);
      if (k >= 16) words(p, 236, STRIP + 10, 'NEW YORK STYLE...');
    },
    // 3. SMASH CUT: the lights flicker, the gurgle
    (p, k) => {
      scaleBlit(p, M(`walk${k % 4}`), 120 + k * 4, STRIP + 80, 2);
      scaleBlit(p, N(`gurgle${(k >> 1) % 2}`), 40 + k * 3, STRIP + 60, 2);
      if (k >= 6) words(p, 80 + k * 3, STRIP + 40, 'GURGLE', 'green');
    },
    // 4. the lights turn blood red: the Devil, sipping a milkshake
    (p, k) => {
      scaleBlit(p, N(`devilA0${k % 4 < 2 ? 'a' : 'b'}`), 220, STRIP + 40, 2);
      scaleBlit(p, N(`devilB0${k % 4 < 2 ? 'a' : 'b'}`), 220, STRIP + 80, 2);
      scaleBlit(p, M('hurt'), 60, STRIP + 80, 2);
      if (k >= 18) words(p, 240, STRIP + 20, 'HA HA HA!', 'devil');
    },
  ];
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene[i](first, 0);
  frame(first, 0);
  if (i === 2) {
    // SMASH CUT: straight in, no fade
    const cut = new Pixels(W, H, ink);
    outlined(cut, 160 - textWidth('SMASH CUT.', 3) / 2, 84, 'SMASH CUT.', c('white', 2), c('red', 1), 3);
    r.add(cut, 8);
  } else r.fadeIn(first, 3);
  for (let k = 0; k < K; k++) {
    // the lighting cues: the fridge's light coming on, flickering, blood red
    const light = i === 1 ? Math.min(1, 0.25 + k / 12) : i === 2 && (k % 7 === 3 || k % 11 === 5) ? 0.35 : 1;
    const palK = i === 3 ? bloodRed(pal.pal, Math.min(1, k / 14)) : pal.pal;
    r.frame(bg, (p) => (scene[i](p, k), frame(p, k)), 1, light, palK);
  }
  return r.fli(SPEED);
}

// ---- how to play ------------------------------------------------------------------------------

export function howtoFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = kitchenBackdrop(pal, 240, 9);
  const M = (n: string) => sprite(cast.man, n);
  const N = (n: string) => sprite(cast.mons, n);
  const scene = (p: Pixels, k: number) => {
    // the toy blocks on the floor; he tiptoes and hops over them
    if (k < 30)
      for (const [x, col] of [
        [100, 'red'],
        [108, 'pjs'],
        [116, 'cheese'],
      ] as const)
        p.rect(x, 148, 6, 4, c(col, 2)).rect(x, 147, 6, 1, c(col, 3));
    let x = 10 + k * 5;
    let y = 112;
    let pose = `walk${k % 4}`;
    if (k >= 14 && k < 24) {
      y = 112 - Math.round(Math.sin(((k - 14) / 10) * Math.PI) * 40);
      pose = 'hopSide';
    }
    if (k >= 30) {
      x = 160;
      pose = k % 6 < 3 ? 'throw0' : 'throw1';
      // a milkshake arcs in; the almond milk splashes it
      const t = k - 30;
      const sx = 300 - t * 6;
      if (t < 18) scaleBlit(p, N(`shake${t % 2}`), sx, 40 + Math.round(((sx - 230) / 70) ** 2 * 20), 2);
      if (t >= 6 && t < 18) scaleBlit(p, N(`splash${t % 2}`), 200 + (t - 6) * 6, 90 - (t - 6) * 3, 2);
      if (t >= 18) say(p, pal, 260, 50, 'SPLASH!', 'white', 2);
    }
    scaleBlit(p, M(pose), x, y, 2);
    if (k >= 15 && k < 22) say(p, pal, x + 20, y - 14, 'HOP!');
    caption(p, pal, k < 30 ? ['UP hops, Q and E hop sideways.', 'Hop over the noisy things.'] : ['In the reckoning, SPACE', 'throws almond milk.']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 56; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(3);
  return r.fli(SPEED);
}

// ---- fainting (the game is lost) --------------------------------------------------------------

export function lostFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = kitchenBackdrop(pal, 220, 11);
  const scene = (p: Pixels, k: number) => {
    const pose = k < 8 ? 'worry' : k < 16 ? 'hurt' : k < 22 ? 'faint0' : 'faint1';
    scaleBlit(p, sprite(cast.man, pose), 130, 104, 2);
    if (k >= 8 && k < 30) scaleBlit(p, sprite(cast.mons, `gurgle${(k >> 1) % 2}`), 170, 70, 2);
    if (k >= 30) {
      spotlight(p, pal, 150, 130, Math.max(4, 60 - (k - 30) * 3));
      if (k >= 40) say(p, pal, 160, 60, 'Honey...?', 'white', 2);
    }
    caption(p, pal, k < 30 ? ["IT'S NOT WORTH IT!", 'The cheesecake wins.'] : ['She is awake.', 'Try again!']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 56; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the endings ----------------------------------------------------------------------------

/** won1.fli (the thunderous flush swallows the Devil), won2.fli (a last spotlight; "...Is there Lactaid in hell?"; BLACKOUT), won3.fli (THE END). */
export function wonFlis(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const M = (n: string) => sprite(cast.man, n);
  const N = (n: string) => sprite(cast.mons, n);
  {
    // the flush: a whirlpool in the porcelain, the Devil spinning down into it, the red draining out
    const r = new Reel(pal.pal);
    const bg = new Pixels(W, H, c('dark', 0));
    gradient(bg, 0, 0, W, 172, pal.r('blood'), 0, 5);
    blob(bg, 160, 150, 120, 34, pal.r('tile'), 0, 2);
    blob(bg, 160, 146, 96, 24, pal.r('glow'), 1, 3);
    const scene = (p: Pixels, k: number) => {
      // the whirlpool
      for (let a = 0; a < 40; a++) {
        const ang = a * 0.5 + k * 0.6;
        const rad = 90 - a * 2.1;
        p.set(160 + Math.cos(ang) * rad, 146 + Math.sin(ang) * rad * 0.25, c('white', 2));
      }
      // the Devil spinning down into it, smaller each turn
      const s = Math.max(0, 3 - k * 0.09);
      if (s >= 1) {
        const x = 160 + Math.cos(k * 0.7) * (60 - k * 1.6) - 10 * s;
        const y = 60 + k * 2.4;
        scaleBlit(p, N(`devilA3${k % 2 ? 'a' : 'b'}`), Math.round(x), Math.round(y - 20 * s), Math.round(s), k % 4 < 2);
        scaleBlit(p, N(`devilB3${k % 2 ? 'a' : 'b'}`), Math.round(x), Math.round(y), Math.round(s), k % 4 < 2);
      }
      if (k >= 6 && k < 30) say(p, pal, 160, 20, 'NOOOOO...', 'devil', 4, 2);
      if (k >= 30) say(p, pal, 160, 20, 'FLUSSSH!', 'white', 2, 2);
      caption(p, pal, k < 30 ? ['THUNDEROUS FLUSH.', 'The Devil cackles. The man screams.'] : ['The lights come up.', 'He is still in his bathroom.']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3, bloodRed(pal.pal, 1));
    for (let k = 0; k < 48; k++) r.frame(bg, (p) => scene(p, k), 1, 1, bloodRed(pal.pal, Math.max(0, 1 - Math.max(0, k - 24) / 20)));
    r.fadeOut(3);
    files['won1.fli'] = r.fli(SPEED);
  }
  {
    // the last spotlight, the last gurgle, the last line, BLACKOUT
    const r = new Reel(pal.pal);
    const bg = new Pixels(W, H, c('ink', 0));
    for (let y = 130; y < 172; y++) for (let x = 0; x < W; x++) bg.set(x, y, (Math.floor(x / 10) + Math.floor(y / 10)) % 2 ? c('tile', 2) : c('tile', 0));
    const lines: [number, string[]][] = [
      [0, ["I WASN'T BUILT FOR THIS!!", "I'M SWEATING FROM MY SHINS!"]],
      [16, ["THERE'S DAIRY IN MY SOUL!!!", '']],
      [30, ['(Beat. Silence.', 'One last gurgle. Then...)']],
      [46, ['...Is there Lactaid', 'in hell?']],
    ];
    const scene = (p: Pixels, k: number) => {
      scaleBlit(p, M(k < 16 ? 'speak1' : k < 30 ? 'speak0' : k < 46 ? 'worry' : 'faint1'), 130, 72, 3);
      if (k < 30) for (let i = 0; i < 5; i++) p.set(150 + ((i * 13 + k * 3) % 36), 80 + ((i * 7 + k * 5) % 40), c('sweat', 1));
      if (k >= 34 && k < 42) say(p, pal, 190, 66, 'gurgle', 'green', 3);
      const rad = k < 46 ? 70 : Math.max(0, 70 - (k - 46) * 3);
      spotlight(p, pal, 160, 112, rad);
      const cur = [...lines].reverse().find(([at]) => k >= at)!;
      caption(p, pal, cur[1]);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 4);
    for (let k = 0; k < 72; k++) r.frame(bg, (p) => scene(p, k));
    // BLACKOUT.
    const black = new Pixels(W, H, c('ink', 0));
    outlined(black, 160 - textWidth('[BLACKOUT.]', 2) / 2, 90, '[BLACKOUT.]', c('white', 2), c('ink', 0), 2);
    r.add(black, 14);
    files['won2.fli'] = r.fli(SPEED);
  }
  {
    // THE END: the next morning, the fridge, the empty plate
    const r = new Reel(pal.pal);
    const bg = kitchenBackdrop(pal, 210, 77);
    const scene = (p: Pixels, k: number) => {
      outlined(p, 160 - textWidth('THE END', 3) / 2, 14, 'THE END', c('cream', 3), c('ink', 0), 3, c('crust', 0));
      // the empty plate, with crumbs
      p.rect(220, 96, 30, 3, c('white', 2));
      for (const [x, y] of [
        [226, 94],
        [233, 95],
        [241, 94],
      ])
        p.set(x, y, c('crust', 2));
      scaleBlit(p, M(k % 12 < 6 ? 'bliss' : 'worry'), 90, 112, 2);
      if (k >= 10) say(p, pal, 124, 48, '(of the cheesecake)', 'white', 2); // on the dark wall, not the white fridge
      caption(p, pal, ['Was it worth it?', 'Ask him at 3:17 tomorrow.']);
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

export { T, rng };
