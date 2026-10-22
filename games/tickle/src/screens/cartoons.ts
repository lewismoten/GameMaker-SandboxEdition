// The cartoons (FLIs drawn here, frame by frame): the title (the cover drawn for the game,
// art/cover.ts: the lightning, the Tesla coil, the needle swinging up to 50 kHz, Doc Leo
// laughing, and the name drops in), the story (Doc Leo at his PC at midnight, two hours of
// the self-paced course, the certificate rolling out of the dot-matrix printer), the parody
// certificate itself (its border drawing round, the words coming up, the seal stamped, the
// signature scribbled), the level cards, how to play (pin, then tickle; and what a tickle without
// a pin gets you), the lab going quiet (lost) and the endings (the laughing carpet bowing under
// the balcony, MWA-HA-HA, THE END). Each reel opens on black and fades by palette (kit/reel.ts);
// only what moves is stored.
import { Pixels, rng } from '../../../kit/pixels';
import { medianCutPalette, Quantizer } from '../../../kit/quantize';
import { Reel } from '../../../kit/reel';
import { gradient } from '../../../snowbound/src/art/draw';
import { centered, micro, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { coverRgb } from '../art/cover';
import { buildScreenPalette, type Pal } from '../art/pal';
import { labBackdrop } from './screens';
import { AUTHOR, CARDS } from './text';

const W = 320;
const H = 200;
/** Clear pixels in sprites. */
const T = 255;
/** 1/70 s per frame: about 12 frames a second. */
export const SPEED = 6;

export interface Cast {
  /** Doc Leo's whole poses (20 x 40). */
  leo: (pose: string) => Pixels;
  /** Everybody else's sprites (the .MBL's pictures). */
  mons: Map<string, Pixels>;
  /** The palette the sprites are drawn in (6-bit VGA). */
  pal: Uint8Array;
}

/** A four-point twinkle of size 0..3. */
function twinkle(p: Pixels, pal: Pal, x: number, y: number, size: number, ramp = 'gold'): void {
  if (size <= 0) return;
  p.set(x, y, pal.c(ramp, 3));
  for (let k = 1; k <= size; k++) {
    const col = pal.c(ramp, Math.max(0, 3 - k));
    p.set(x + k, y, col).set(x - k, y, col).set(x, y + k, col).set(x, y - k, col);
  }
}

/** The bar along the bottom with one or two lines of the song. */
function caption(p: Pixels, pal: Pal, lines: string[]): void {
  p.rect(0, 172, W, H - 172, pal.c('ink', 0));
  lines.forEach((l, i) => centered(p, 176 + i * 12, l, pal.c(i ? 'gold' : 'paint', i ? 3 : 1)));
}

/** Words said over (x, y), outlined. */
function say(p: Pixels, pal: Pal, x: number, y: number, words: string, ramp = 'gold', k = 3, scale = 1): void {
  outlined(p, Math.round(x - textWidth(words, scale) / 2), y, words, pal.c(ramp, k), pal.c('ink', 0), scale);
}

const sprite = (set: Map<string, Pixels>, name: string) => {
  const s = set.get(name);
  if (!s) throw new Error(`No sprite ${name}`);
  return s;
};

/** The bat detector's dial: blue 22 on the left, red 50 on the right, the needle at `joy` (0 dread .. 1 joy). */
function detector(p: Pixels, pal: Pal, x: number, y: number, joy: number): void {
  const c = pal.c;
  p.rect(x, y, 64, 44, c('ink', 0)).rect(x + 1, y + 1, 62, 42, c('steel', 1)).rect(x + 4, y + 4, 56, 26, c('paper', 2));
  for (let a = Math.PI; a <= Math.PI * 2; a += 0.04) for (let r = 18; r < 22; r++) p.set(x + 32 + Math.cos(a) * r, y + 28 + Math.sin(a) * r, a < Math.PI * 1.5 ? c('blue', 2) : c('red', 2));
  const a = Math.PI * (1.15 + 0.7 * joy);
  p.line(x + 32, y + 28, x + 32 + Math.cos(a) * 20, y + 28 + Math.sin(a) * 20, c('ink', 0));
  micro(p, x + 5, y + 33, '22', c('blue', 3));
  micro(p, x + 52, y + 33, '50', c('red', 3));
  micro(p, x + 26, y + 36, 'KHZ', c('paper', 2));
  p.disc(x + 58, y + 8, 2, joy > 0.5 ? c('potion', 3) : c('red', 3));
}

// ---- the title: the cover ---------------------------------------------------------------------

/** How many pictures of the cover the title animates through. */
const COVER_FRAMES = 12;

/** The title cartoon (cover.fli) and its last picture with the name on it (title.gif's pixels and palette). */
export function coverFli(cast: Cast): { fli: Uint8Array; title: Pixels; pal: Uint8Array } {
  const frames = Array.from({ length: COVER_FRAMES }, (_, k) => coverRgb(cast, k, COVER_FRAMES));
  // inks for the lettering first (black, gold, its shadow, a deep plum, cream), then the cover's colors
  const INKS: [number, number, number][] = [
    [0, 0, 0],
    [255, 214, 90],
    [140, 70, 10],
    [34, 14, 44],
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
    outlined(p, 160 - textWidth('CERTIFIED', 2) / 2, drop, 'CERTIFIED', 1, 3, 2, 2);
    outlined(p, 160 - textWidth('RAT TICKLER', 3) / 2, drop + 20, 'RAT TICKLER', 4, 3, 3, 3);
    if (sub) {
      p.rect(0, 186, W, 14, 3);
      centered(p, 189, `${AUTHOR} (c) 1995 - Shareware`, 4);
    }
  };
  const r = new Reel(pal);
  r.fadeIn(pics[0], 6);
  pics.forEach((p, i) => r.add(p, i === 0 ? 4 : 2));
  const last = pics[pics.length - 1];
  for (const [k, drop] of [-60, -40, -18, 2, 10, 5, 7].entries()) {
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

// ---- the story: two hours at the PC, and the certificate rolls out ---------------------------------

export function storyFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = new Pixels(W, H);
  gradient(bg, 0, 0, W, 130, pal.r('night'), 0, 2);
  // the wall clock: well past midnight
  bg.disc(40, 30, 14, c('wood', 1)).disc(40, 30, 12, c('paper', 2)).line(40, 30, 40, 20, c('ink', 0)).line(40, 30, 47, 33, c('ink', 0));
  // the desk
  bg.rect(0, 130, W, 70, c('wood', 1)).rect(0, 130, W, 4, c('wood', 3));
  // the PC: a beige CRT on a beige box
  bg.rect(120, 116, 110, 16, c('paper', 0)).rect(122, 118, 30, 3, c('ink', 1));
  bg.rect(130, 30, 90, 86, c('paper', 1)).rect(136, 36, 78, 62, c('ink', 0));
  bg.rect(150, 100, 50, 4, c('paper', 0));
  // the dot-matrix printer
  bg.rect(236, 106, 70, 26, c('paper', 0)).rect(240, 104, 62, 4, c('ink', 1)).rect(240, 128, 62, 2, c('ink', 1));
  const L = (n: string) => cast.leo(n);
  const lines = (k: number) =>
    k < 22 ? ['I earned a paper', 'in dorsal delight.'] : k < 44 ? ['Two hours of training', 'in how to pin right.'] : k < 62 ? ['I am a certified rat tickler.', 'Certificate in hand.'] : ['No rats yet... but I will', 'answer when fate demands!'];
  const scene = (p: Pixels, k: number) => {
    // the screen: the course, typing out
    const screen = ['RAT TICKLING', 'SELF-PACED', '', 'LESSON 3:', 'THE PIN'];
    const typed = Math.min(60, k * 2);
    let n = 0;
    screen.forEach((l, i) => {
      const s = l.slice(0, Math.max(0, typed - n));
      n += l.length;
      micro(p, 140, 40 + i * 7, s, c('crt', 2));
    });
    // the progress bar: under two hours
    const prog = Math.min(1, k / 44);
    p.rect(140, 84, 70, 6, c('crt', 0)).rect(140, 84, Math.round(70 * prog), 6, c('crt', 2));
    const mins = Math.round(prog * 118);
    micro(p, 140, 92, k < 44 ? `TIME ${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}` : 'PASSED!', c('crt', 2));
    // the certificate rolls out of the printer
    if (k >= 44) {
      const out = Math.min(60, (k - 44) * 5);
      p.rect(248, 104 - out, 46, out, c('parch', 4)).frame(248, 104 - out, 46, out, c('gold', 1));
      if (out > 20) micro(p, 252, 108 - out, 'CERTIFIED', c('brown', 1));
      for (let y = 112 - out; y < 100; y += 4) p.rect(252, y, 36, 1, c('parch', 2));
    }
    // Doc Leo at the keyboard, then up and laughing
    const pose = k < 44 ? (k % 4 < 2 ? 'tickle0' : 'tickle1') : k < 62 ? 'grin' : k % 4 < 2 ? 'laugh0' : 'laugh1';
    scaleBlit(p, L(pose), 60, 50, 2);
    if (k >= 64 && k % 8 < 6) say(p, pal, 100, 30, 'MWA-HA-HA-HA!', 'paint', 1);
    caption(p, pal, lines(k));
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 4);
  for (let k = 0; k < 78; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the certificate: a parody, drawn for the game ----------------------------------------------

/** CERT.FLI: Doc Leo's certificate, made up for the game (no real institution's). */
export function certFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = new Pixels(W, H, c('purple', 0));
  const rr = rng(5);
  for (let i = 0; i < 40; i++) bg.set(Math.floor(rr() * W), Math.floor(rr() * H), c('gold', i % 3));
  // the parchment
  for (let y = 4; y < 196; y++) for (let x = 8; x < 312; x++) bg.set(x, y, (x * 7 + y * 13) % 31 === 0 ? c('parch', 3) : c('parch', 4));
  const ink = c('brown', 0);
  // the ornate border, drawn round as the reel goes (0..1)
  const border = (p: Pixels, u: number) => {
    const path: [number, number][] = [];
    for (let x = 14; x < 306; x++) path.push([x, 10]);
    for (let y = 10; y < 190; y++) path.push([305, y]);
    for (let x = 305; x > 14; x--) path.push([x, 189]);
    for (let y = 189; y > 10; y--) path.push([14, y]);
    const n = Math.floor(path.length * u);
    for (let i = 0; i < n; i++) {
      const [x, y] = path[i];
      p.set(x, y, c('gold', 1));
      // the inner rule and a vine of little loops
      const ix = x === 14 ? 18 : x === 305 ? 301 : x;
      const iy = y === 10 ? 14 : y === 189 ? 185 : y;
      p.set(ix, iy, c('gold', 0));
      if (i % 12 === 0) p.disc(ix, iy, 1.4, c('gold', 2));
    }
  };
  const lines: { y: number; s: string; scale?: number; ramp?: string; k?: number }[] = [
    { y: 20, s: 'THE INSTITUTE OF APPLIED GIGGLES', ramp: 'brown', k: 1 },
    { y: 34, s: 'This certifies that', ramp: 'brown', k: 2 },
    { y: 46, s: 'DOC LEO', scale: 2, ramp: 'purple', k: 0 },
    { y: 66, s: 'Lewis Moten, PhD (Comedic Science)', ramp: 'brown', k: 1 },
    { y: 80, s: 'completed the self-paced course', ramp: 'brown', k: 2 },
    { y: 92, s: 'in RAT TICKLING, with honors,', ramp: 'brown', k: 2 },
    { y: 104, s: 'and is hereby a', ramp: 'brown', k: 2 },
    { y: 116, s: 'CERTIFIED', scale: 2, ramp: 'red', k: 0 },
    { y: 134, s: 'RAT TICKLER', scale: 2, ramp: 'red', k: 0 },
  ];
  const seal = (p: Pixels, cx: number, cy: number, s: number, spin: number) => {
    // ribbon tails
    p.line(cx - 6, cy + 10 * s, cx - 12, cy + 26 * s, c('red', 1)).line(cx - 5, cy + 10 * s, cx - 11, cy + 26 * s, c('red', 2));
    p.line(cx + 6, cy + 10 * s, cx + 12, cy + 26 * s, c('red', 1)).line(cx + 5, cy + 10 * s, cx + 11, cy + 26 * s, c('red', 2));
    for (let a = 0; a < Math.PI * 2; a += 0.02) {
      const rr2 = (18 + (Math.floor(a * 24 / Math.PI) % 2) * 2) * s;
      for (let d = 0; d < rr2; d += 0.7) p.set(cx + Math.cos(a) * d * Math.abs(Math.cos(spin)), cy + Math.sin(a) * d, c('gold', d > rr2 - 3 ? 3 : d > 12 * s ? 1 : 2));
    }
    if (Math.abs(Math.cos(spin)) > 0.6) {
      const rat = sprite(cast.mons, 'lab.giggle0');
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (rat.get(x, y) !== T) p.set(cx - 10 + x, cy - 11 + y, c('gold', 0));
    }
  };
  const scene = (p: Pixels, k: number) => {
    border(p, Math.min(1, k / 12));
    lines.forEach((l, i) => {
      if (k < 12 + i * 2) return;
      const scale = l.scale ?? 1;
      const x = Math.round((W - textWidth(l.s, scale)) / 2);
      if (scale > 1) outlined(p, x, l.y, l.s, c(l.ramp ?? 'brown', l.k ?? 0), c('gold', 1), scale);
      else text(p, x, l.y, l.s, c(l.ramp ?? 'brown', l.k ?? 1));
    });
    // the seal: stamped down, then it glints
    if (k >= 32) {
      const s = k < 36 ? 1 + (36 - k) * 0.25 : 1;
      seal(p, 64, 166, Math.min(1.6, s), k < 40 ? (k - 32) * 0.4 : 0);
      if (k >= 40) twinkle(p, pal, 54 + ((k * 7) % 22), 154 + ((k * 3) % 18), [1, 2, 3, 2][k % 4]);
    }
    // the signature, scribbled
    if (k >= 38) {
      const n = Math.min(60, (k - 38) * 8);
      for (let i = 0; i < n; i++) {
        const x = 196 + i * 1.6;
        p.set(x, 166 + Math.sin(i / 2.2) * 5 * Math.sin(i / 11), ink).set(x + 1, 166 + Math.sin(i / 2.2) * 5 * Math.sin(i / 11), ink);
      }
    }
    p.rect(190, 174, 104, 1, ink);
    if (k >= 40) {
      micro(p, 198, 178, 'PROF. R. TICKLES', ink);
      micro(p, 202, 184, 'DEAN OF GIGGLES', c('brown', 1));
      micro(p, 100, 160, 'DORSAL DELIGHT', c('brown', 1));
      micro(p, 116, 166, '- 1995 -', c('brown', 1));
    }
    if (k >= 48 && k % 10 < 7) say(p, pal, 250, 150, 'CERTIFIED!', 'red', 2);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  r.fadeIn(first, 3);
  for (let k = 0; k < 62; k++) r.frame(bg, (p) => scene(p, k));
  r.frame(bg, (p) => scene(p, 61), 10);
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
    p.rect(0, STRIP - 1, W, 1, c('gold', 2)).rect(0, 174, W, 1, c('gold', 2));
    const drop = [-24, -14, -2, 10, 6, 8][Math.min(5, k)];
    outlined(p, 160 - textWidth(info.title, 2) / 2, drop, info.title, c('gold', 3), c('ink', 1), 2);
    if (k >= 5) centered(p, 32, info.where, c('paint', 1));
    if (k >= 9) centered(p, 178, `"${info.lines[0]}`, c('paint', 1));
    if (k >= 15) centered(p, 189, ` ${info.lines[1]}"`, c('paint', 1));
  };
  const L = (name: string) => cast.leo(name);
  const M = (name: string) => sprite(cast.mons, name);
  const words = (p: Pixels, x: number, y: number, w: string) => outlined(p, Math.round(x - textWidth(w) / 2), y, w, c('gold', 3), ink);
  const floor = STRIP + 120 - 2;
  const actors: ((p: Pixels, k: number) => void)[] = [
    // 1. the course: Doc Leo pins a rat, then tickles it, and it giggles
    (p, k) => {
      const ratPic = k < 8 ? `lab.rat${k % 2}` : k < 14 ? `lab.pinned${k % 2}` : `lab.giggle${k % 2}`;
      scaleBlit(p, M(ratPic), 170, floor - 40 - (k >= 14 ? (k % 2) * 4 : 0), 2);
      scaleBlit(p, L(k < 6 ? 'front' : k < 12 ? 'pin' : k < 18 ? `tickle${k % 2}` : 'grin'), 110, floor - 80, 2);
      if (k >= 6 && k < 12) words(p, 150, STRIP + 4, 'PIN!');
      if (k >= 12 && k < 18) words(p, 150, STRIP + 4, 'TICKLE!');
      if (k >= 18) words(p, 200, STRIP + 4, '50 KHZ!');
    },
    // 2. the lab: rats come running to his hand, giggling
    (p, k) => {
      scaleBlit(p, L(k % 4 < 2 ? 'tickle0' : 'tickle1'), 60, floor - 80, 2);
      for (let b = 0; b < 4; b++) {
        const x = 300 - ((k * 6 + b * 50) % 220);
        scaleBlit(p, M(`lab.off${(k + b) % 2}`), x, floor - 40, 2, true);
      }
      if (k >= 12) words(p, 160, STRIP + 4, 'TICKLE FIRST!');
    },
    // 3. the sewers: the laughing carpet follows him in a line
    (p, k) => {
      const x = 40 + k * 6;
      scaleBlit(p, L(`walk${k % 4}`), x, floor - 80, 2);
      for (let b = 0; b < Math.min(6, Math.floor(k / 3)); b++) scaleBlit(p, M(`wild.off${(k + b) % 2}`), x - 30 - b * 26, floor - 40, 2);
      if (k >= 16) words(p, x + 20, STRIP + 4, 'FOLLOW ME!');
    },
    // 4. the empire: arms up, laughing, the carpet round his feet
    (p, k) => {
      scaleBlit(p, L(k % 4 < 2 ? 'laugh0' : 'laugh1'), 140, floor - 80, 2);
      for (let b = 0; b < 8; b++) scaleBlit(p, M(`${b % 2 ? 'wild' : 'lab'}.giggle${(k + b) % 2}`), 10 + b * 38 + (b >= 4 ? 40 : 0), floor - 20, 1);
      if (k >= 10 && k % 6 < 4) words(p, 160, STRIP + 4, 'MWA-HA-HA-HA!');
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

// ---- how to play: pin first, then tickle; and a tickle without a pin -------------------------------

export function howtoFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = labBackdrop(pal, 150, 7);
  const L = (n: string) => cast.leo(n);
  const M = (n: string) => sprite(cast.mons, n);
  const scene = (p: Pixels, k: number) => {
    const part = k < 34 ? 0 : 1;
    const j = part ? k - 34 : k;
    let joy = 0.5;
    if (!part) {
      // a rat walks up; PIN; TICKLE; it giggles to his hand and joins the carpet
      const rx = Math.max(150, 260 - j * 10);
      const pic = j < 12 ? `lab.rat${j % 2}` : j < 18 ? `lab.pinned${j % 2}` : `lab.giggle${j % 2}`;
      const gx = j < 22 ? rx : Math.max(120, rx - (j - 22) * 8);
      if (j < 30) scaleBlit(p, M(pic), gx, 110, 2, j < 12);
      scaleBlit(p, L(j < 11 ? 'front' : j < 17 ? 'pin' : j < 22 ? `tickle${j % 2}` : 'grin'), 90, 70, 2);
      if (j >= 11 && j < 17) scaleBlit(p, M('pin0'), 130, 110, 2);
      if (j >= 17 && j < 22) scaleBlit(p, M(`tickle${j % 2}`), 130, 110, 2);
      if (j >= 30) say(p, pal, 120, 60, '+1 RAT!');
      joy = j < 18 ? 0.45 : Math.min(1, 0.45 + (j - 18) * 0.12);
      caption(p, pal, j < 17 ? ['Z (or DOWN): PIN first.', 'It rolls over, paws up.'] : ['X (or SPACE): then TICKLE.', '50 kHz: joy! It joins you.']);
    } else {
      // a tickle with no pin goes over its head; it bumps him: dread
      const rx = Math.max(130, 260 - j * 10);
      scaleBlit(p, M(`lab.tense${j % 2}`), rx, 110, 2, true);
      scaleBlit(p, L(j < 8 ? 'front' : j < 16 ? `tickle${j % 2}` : j < 22 ? 'hurt' : 'front'), 90, 70, 2);
      if (j >= 8 && j < 16) scaleBlit(p, M(`tickle${j % 2}`), 130, 110, 2);
      joy = j < 14 ? 0.45 : Math.max(0, 0.45 - (j - 14) * 0.12);
      if (j >= 16 && j < 24) say(p, pal, 140, 60, 'EEK!', 'red', 3);
      caption(p, pal, j < 14 ? ['A tickle with no pin goes', 'right over its head...'] : ['...and a bumped rat squeals.', '22 kHz: dread. Rapport down.']);
    }
    detector(p, pal, 246, 8, joy);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 62; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(3);
  return r.fli(SPEED);
}

// ---- the lab goes quiet (the game is lost) ----------------------------------------------------

export function lostFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = labBackdrop(pal, 150, 11);
  const scene = (p: Pixels, k: number) => {
    scaleBlit(p, cast.leo(k < 10 ? 'hurt' : k < 20 ? 'die0' : 'die1'), 130, 70, 2);
    // the rats scatter
    for (let b = 0; b < 5; b++) {
      const x = 170 + b * 20 + k * (4 + b);
      if (x < W) scaleBlit(p, sprite(cast.mons, `${b % 2 ? 'wild' : 'lab'}.tense${(k + b) % 2}`), x, 130, 1);
    }
    detector(p, pal, 246, 8, Math.max(0, 0.4 - k * 0.04));
    caption(p, pal, k < 30 ? ['Twenty-two is dread.', 'The lab goes quiet...'] : ['The world is not prepared.', 'Try again!']);
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

/** won1.fli (the laughing carpet bowing under the balcony), won2.fli (MWA-HA-HA-HA!), won3.fli (THE END). */
export function wonFlis(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const M = (n: string) => sprite(cast.mons, n);
  {
    // the tower's balcony over the courtyard in the storm
    const night = (flash: boolean) => {
      const p = new Pixels(W, H);
      gradient(p, 0, 0, W, 110, pal.r('night'), flash ? 3 : 0, flash ? 5 : 2);
      // the tower
      for (let y = 10; y < 110; y++) for (let x = 120; x < 200; x++) p.set(x, y, (x % 12 === 0 || y % 10 === 0) ? c('stone', 0) : c('stone', 1));
      p.rect(110, 70, 100, 6, c('stone', 3));
      for (let x = 112; x < 208; x += 8) p.rect(x, 76, 3, 14, c('stone', 2));
      p.rect(110, 90, 100, 4, c('stone', 3));
      // banners
      for (const x of [126, 186]) p.rect(x, 20, 10, 40, c('purple', 1)).disc(x + 5, 34, 3, c('rat', 3));
      // the courtyard
      gradient(p, 0, 110, W, 62, pal.r('stone'), 0, 1);
      if (flash) p.line(40, 0, 30, 30, c('paper', 2)).line(30, 30, 46, 50, c('paper', 2)).line(46, 50, 36, 90, c('paper', 2));
      return p;
    };
    const dark = night(false);
    const lit = night(true);
    const r = new Reel(pal.pal);
    const scene = (p: Pixels, k: number) => {
      // Doc Leo on the balcony, arms up
      scaleBlit(p, cast.leo(k % 4 < 2 ? 'laugh0' : 'laugh1'), 150, 30, 1);
      // the laughing carpet: rows and rows of rats, bowing as a wave rolls through
      for (let row = 0; row < 5; row++)
        for (let col = 0; col < 16; col++) {
          const x = col * 20 + (row % 2) * 10 - 6;
          const y = 104 + row * 12;
          const phase = (col + row * 2 - k) % 12;
          const bow = phase >= 0 && phase < 3;
          const fur = (col + row) % 3 ? 'lab' : 'wild';
          scaleBlit(p, M(bow ? `${fur}.rat${(k + col) % 2}` : `${fur}.giggle${(k + col + row) % 2}`), x, y - 8, 1);
        }
      caption(p, pal, k < 30 ? ['Picture it: a laughing carpet', 'bowing under my command.'] : ['I will raise a legion squeaking', 'with hysterical morale!']);
    };
    const first = new Pixels(W, H);
    first.px.set(dark.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 60; k++) r.frame(k === 14 || k === 16 || k === 41 ? lit : dark, (p) => scene(p, k));
    r.fadeOut(3);
    files['won1.fli'] = r.fli(SPEED);
  }
  {
    // MWA-HA-HA-HA: Doc Leo up close, the laugh echoing round the tower
    const r = new Reel(pal.pal);
    const bg = labBackdrop(pal, 160, 21);
    const scene = (p: Pixels, k: number) => {
      scaleBlit(p, cast.leo(k % 4 < 2 ? 'laugh0' : 'laugh1'), 100, 2, 4);
      for (let e = 0; e < 4; e++) {
        if (k < 6 + e * 6) continue;
        const scale = e === 0 ? 2 : 1;
        say(p, pal, 160 + (e % 2 ? 90 : -90) * (e ? 1 : 0), 20 + e * 30, e ? 'ha-ha-ha...' : 'MWA-HA-HA-HA!', e ? 'purple' : 'paint', e ? 2 : 1, scale);
      }
      for (let b = 0; b < 3; b++) scaleBlit(p, M(`lab.giggle${(k + b) % 2}`), 20 + b * 110 + (b === 1 ? 160 : 0) - (b === 2 ? 30 : 0), 132, 2);
      caption(p, pal, k < 30 ? ['Yes, I am a certified', 'rat tickler!'] : ['All because I learned', 'to tickle them by hand.']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 56; k++) r.frame(bg, (p) => scene(p, k));
    r.fadeOut(3);
    files['won2.fli'] = r.fli(SPEED);
  }
  {
    // THE END
    const r = new Reel(pal.pal);
    const bg = new Pixels(W, H, c('purple', 0));
    const rr = rng(77);
    for (let i = 0; i < 70; i++) bg.set(Math.floor(rr() * W), Math.floor(rr() * 150), c('gold', i % 3));
    const scene = (p: Pixels, k: number) => {
      outlined(p, 160 - textWidth('THE END', 3) / 2, 14, 'THE END', c('gold', 3), c('ink', 0), 3, c('gold', 0));
      scaleBlit(p, cast.leo(k % 6 < 3 ? 'tickle0' : 'tickle1'), 140, 56, 2);
      for (let b = 0; b < 6; b++) {
        const a = (b / 6) * Math.PI * 2 + k * 0.15;
        scaleBlit(p, M(`${b % 2 ? 'wild' : 'lab'}.giggle${(k + b) % 2}`), 150 + Math.cos(a) * 100, 100 + Math.sin(a) * 34, 1);
      }
      for (let t = 0; t < 6; t++) twinkle(p, pal, 40 + ((t * 47 + k * 5) % 240), 50 + ((t * 23 + k * 7) % 100), [0, 1, 2, 3, 2, 1][(k + t) % 6]);
      if (k >= 8) centered(p, 156, 'No rats were harmed.', c('paint', 1));
      caption(p, pal, ['The world was not prepared.', 'MWA-HA-HA-HA!']);
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
