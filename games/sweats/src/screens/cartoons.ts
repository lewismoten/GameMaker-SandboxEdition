// The cartoons (FLIs drawn here, frame by frame): the title (The Hive's castle front at night,
// a searchlight sweeping, the name dropping in, Will under the street lamp with his coffee), the
// story (Doc Leo at the microphone: "OPEN MIC NIGHT!"), how to play, the intermissions, each
// monologue's title card (the spotlight finds Will at the microphone; he flings out an arm; the
// epic in his head, with a line of the monologue), the snaps after each one, fainting (the game is
// lost) and the curtain call. Each reel opens on black and fades by palette (kit/reel.ts).
//
// The stage is painted in the common ramps only, so a title card can draw it in its monologue's
// own palette (where the common ramps sit at the same entries).
import { Pixels, rng } from '../../../kit/pixels';
import { Reel } from '../../../kit/reel';
import { blob, gradient, shadeAt } from '../../../snowbound/src/art/draw';
import { centered, micro, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import type { Pal } from '../art/pal';
import { SETS } from '../scenes';
import type { CardView } from './art';
import { buildScreenPalette } from './palette';

const W = 320;
const H = 200;
/** 1/70 s per frame: about 12 frames a second. */
export const SPEED = 6;

export interface Cast {
  /** Will's sprites (POET.CBL's pictures). */
  poet: Map<string, Pixels>;
  /** Everybody else's (HIVE.MBL's pictures: the common cast among them). */
  mons: Map<string, Pixels>;
}

const sprite = (set: Map<string, Pixels>, name: string) => {
  const s = set.get(name);
  if (!s) throw new Error(`No sprite ${name}`);
  return s;
};

/** The bar along the bottom with one or two lines. */
function caption(p: Pixels, pal: Pal, lines: string[]): void {
  p.rect(0, 176, W, H - 176, pal.c('ink', 0)).rect(0, 176, W, 1, pal.c('gold', 1));
  lines.forEach((l, i) => centered(p, 179 + i * 10, l, pal.c(i ? 'paper' : 'white', 2)));
}

/** Words said over (x, y), outlined. */
function say(p: Pixels, pal: Pal, x: number, y: number, words: string, ramp = 'paper', k = 2, scale = 1): void {
  outlined(p, Math.round(x - textWidth(words, scale) / 2), y, words, pal.c(ramp, k), pal.c('ink', 0), scale);
}

/** A speech balloon (parchment, a tail toward (tx, ty)) with up to three lines in it. */
function balloon(p: Pixels, pal: Pal, x: number, y: number, lines: string[], tx: number, ty: number): void {
  const c = pal.c;
  const w = Math.max(...lines.map((l) => textWidth(l))) + 12;
  const h = lines.length * 10 + 8;
  p.line(x + w / 2 - 6, y + h - 1, tx, ty, c('ink', 0)).line(x + w / 2 + 6, y + h - 1, tx, ty, c('ink', 0));
  for (let k = 0; k < 6; k++) p.line(x + w / 2 - 5 + k * 2, y + h - 2, tx, ty - 1, c('paper', 2));
  p.rect(x, y, w, h, c('paper', 2))
    .frame(x, y, w, h, c('ink', 0))
    .rect(x + 1, y + h - 2, w - 2, 1, c('paper', 1));
  lines.forEach((l, i) => text(p, x + 6, y + 5 + i * 10, l, c('velvet', 0)));
}

/** Everything outside a spotlight (cx, cy, r) dimmed to the dark of a stage. */
function spotlight(p: Pixels, pal: Pal, cx: number, cy: number, r: number, top = 0, bottom = 176): void {
  const dark = pal.c('ink', 0);
  for (let y = top; y < bottom; y++)
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx, (y - cy) * 1.2);
      if (d > r + 8 || (d > r && (x + y) % 2)) p.set(x, y, dark);
    }
}

/**
 * The stage upstairs at The Hive, in the common ramps: velvet drapes in folds, a gold-fringed
 * valance, the boards, the footlights, the microphone, and the backs of the audience's heads.
 */
export function stage(pal: Pal, seed = 1, mic = true): Pixels {
  const c = pal.c;
  const R = pal.r;
  const p = new Pixels(W, H, c('ink', 0));
  for (let y = 0; y < 150; y++)
    for (let x = 0; x < W; x++) p.set(x, y, shadeAt(R('velvet'), 0, 3, 0.45 + 0.4 * Math.sin(x / 9 + Math.sin(y / 40) * 0.6), x, y));
  // the valance and its gold fringe
  for (let x = 0; x < W; x++) {
    const sag = Math.round(Math.sin(((x % 80) / 80) * Math.PI) * 6);
    p.rect(x, 0, 1, 16 + sag, c('velvet', 1));
    p.set(x, 16 + sag, c('gold', 2));
    if (x % 3 === 0) p.rect(x, 17 + sag, 1, 3, c('gold', x % 6 ? 1 : 3));
  }
  // the boards
  for (let y = 150; y < 172; y++) for (let x = 0; x < W; x++) p.set(x, y, shadeAt(R('wood'), 1, 4, 0.3 + (y - 150) / 40 + ((x + y * 7) % 37) / 200, x, y));
  for (let y = 154; y < 172; y += 6) p.rect(0, y, W, 1, c('wood', 0));
  p.rect(0, 150, W, 1, c('wood', 4));
  // the footlights
  for (let x = 12; x < W; x += 34) p.rect(x - 5, 166, 10, 5, c('ink', 1)).disc(x, 166, 2.5, c('spot', 2));
  if (mic) {
    p.rect(159, 104, 2, 46, c('metal', 1)).rect(150, 148, 20, 3, c('metal', 0));
    p.rect(156, 96, 8, 10, c('metal', 2)).rect(157, 97, 6, 8, c('metal', 1)).line(157, 99, 162, 99, c('metal', 0)).line(157, 102, 162, 102, c('metal', 0));
  }
  // the audience, from behind: heads and shoulders along the bottom
  const r = rng(seed);
  for (let x = -6; x < W + 10; x += 22 + Math.floor(r() * 8)) {
    const hy = 160 + Math.floor(r() * 6);
    blob(p, x, hy + 16, 13, 9, R('ink'), 0, 1);
    blob(p, x, hy, 7, 8, R('hair'), 0, 1);
    if (r() < 0.25) p.rect(x - 7, hy - 7, 14, 3, c('ink', 1));
  }
  return p;
}

/** A starry night over the avenue, the castle front of The Hive, and its lit windows (screen palette). */
function castleNight(pal: Pal, seed = 3): Pixels {
  const c = pal.c;
  const R = pal.r;
  const p = new Pixels(W, H, c('night', 0));
  gradient(p, 0, 0, W, 150, R('night'), 0, 3);
  const r = rng(seed);
  for (let i = 0; i < 70; i++) p.set(Math.floor(r() * W), Math.floor(r() * 110), c('white', r() < 0.3 ? 2 : 1));
  // the city's hills and towers far off
  for (let x = 0; x < W; x++) {
    const h = 30 + Math.round(Math.sin(x / 23) * 8 + Math.sin(x / 7) * 3) + (x > 20 && x < 60 ? 30 : 0) + (x > 240 && x < 262 ? 50 : 0);
    p.rect(x, 150 - h, 1, h, c('night', 0));
    if ((x * 13) % 17 === 0) p.set(x, 150 - h + 6 + (x % 9), c('amber', 2));
  }
  // the castle: a wide front of grey stone, two turrets, battlements, the arched door, lit windows
  const stone = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const row = Math.floor((y - y0) / 7);
        const k = ((Math.floor((x - x0 + (row % 2) * 9) / 18) * 7 + row * 3) % 3) + 1;
        p.set(x, y, (y - y0) % 7 === 6 || (x - x0 + (row % 2) * 9) % 18 === 0 ? c('stone', 0) : shadeAt(R('stone'), k - 1, k, 0.6, x, y));
      }
  };
  stone(96, 64, 160, 100);
  for (let x = 96; x < 256; x += 16) stone(x, 54, 9, 10);
  for (const tx of [80, 246]) {
    stone(tx, 30, 30, 134);
    for (let x = tx - 2; x < tx + 32; x += 8) stone(x, 22, 5, 8);
    p.rect(tx + 12, 6, 2, 16, c('ink', 1)).rect(tx + 14, 6, 10, 6, c('velvet', 3));
    p.rect(tx + 11, 60, 8, 18, c('stone', 0)).rect(tx + 12, 61, 6, 16, c('amber', 2));
  }
  // the arched door, open on the warm light inside, and the sign over it
  for (let y = 110; y < 164; y++)
    for (let x = 160; x < 192; x++) {
      const inside = y > 126 || (x - 176) ** 2 / 256 + (y - 126) ** 2 / 256 <= 1;
      if (inside) p.set(x, y, c('amber', y < 120 ? 1 : 2));
    }
  p.rect(150, 92, 52, 14, c('wood', 1)).rect(152, 94, 48, 10, c('amber', 1));
  micro(p, 158, 97, 'THE HIVE', c('ink', 0));
  for (const wx of [112, 128, 210, 226])
    p.rect(wx, 78, 10, 16, c('stone', 0))
      .rect(wx + 1, 79, 8, 14, c('amber', 2))
      .rect(wx + 1, 85, 8, 1, c('stone', 0));
  for (const wx of [112, 226]) p.rect(wx, 120, 10, 16, c('stone', 0)).rect(wx + 1, 121, 8, 14, c('amber', 1));
  // the sidewalk and the avenue
  p.rect(0, 164, W, 12, c('stone', 2)).rect(0, 164, W, 1, c('stone', 3));
  p.rect(0, 176, W, 24, c('ink', 1));
  for (let x = 4; x < W; x += 40) p.rect(x, 188, 20, 2, c('yellow', 1));
  // the street lamp
  p.rect(46, 96, 3, 68, c('ink', 1));
  p.rect(40, 86, 15, 12, c('ink', 1)).rect(42, 88, 11, 8, c('lamp', 1));
  for (let y = 98; y < 164; y++) for (let x = 47 - (y - 98) / 2; x < 49 + (y - 98) / 2; x++) if ((Math.round(x) + y) % 3 === 0) p.set(x, y, c('lamp', 0));
  return p;
}

// ---- the title ------------------------------------------------------------------------------

export function coverFli(cast: Cast): { fli: Uint8Array; title: Pixels; pal: Uint8Array } {
  const pal = buildScreenPalette();
  const c = pal.c;
  const bg = castleNight(pal);
  const r = new Reel(pal.pal);
  const title = (p: Pixels, k: number) => {
    const drop = Math.min(0, -40 + k * 5);
    outlined(p, 160 - textWidth('SHAKESPEARE', 3) / 2, 8 + drop, 'SHAKESPEARE', c('gold', 3), c('velvet', 0), 3, c('ink', 0));
    if (k >= 6) outlined(p, 160 - textWidth('IN SWEATPANTS', 2) / 2, 36, 'IN SWEATPANTS', c('sweats', 3), c('ink', 0), 2, c('velvet', 0));
    if (k >= 14) say(p, pal, 160, 192 - 2, 'by The Bard of Bizarre', 'paper', 2);
  };
  const scene = (p: Pixels, k: number) => {
    // the searchlight sweeping the sky
    const a = -Math.PI / 2 + Math.sin(k / 6) * 0.7;
    for (let t = 0; t < 180; t += 1) {
      const half = t * 0.08;
      for (let s = -half; s <= half; s++) {
        const x = Math.round(176 + Math.cos(a) * t - Math.sin(a) * s);
        const y = Math.round(54 + Math.sin(a) * t + Math.cos(a) * s);
        if (y < 54 && (x + y) % 2 === 0 && p.get(x, y) !== c('stone', 0)) p.set(x, y, c('spot', 0));
      }
    }
    // Will under the street lamp with his coffee, contemplating it
    scaleBlit(p, sprite(cast.poet, k % 20 < 14 ? 'yorick' : 'smug'), 56, 116, 2);
    title(p, k);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 4);
  for (let k = 0; k < 40; k++) r.frame(bg, (p) => scene(p, k));
  const last = new Pixels(W, H);
  last.px.set(bg.px);
  scene(last, 40);
  return { fli: r.fli(SPEED), title: last, pal: pal.pal };
}

// ---- the story: Doc Leo opens the evening ----------------------------------------------------

export function storyFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = stage(pal, 5);
  const lines: [number, string[], string[]][] = [
    [0, ['Welcome to The Hive!'], ['Open mic night, upstairs.', '']],
    [18, ['OPEN MIC NIGHT!'], ['Doc Leo is hosting.', '']],
    [34, ['First up... and second,', 'and seventeenth...'], ['The sign-up sheet has one', 'name on it. Seventeen times.']],
    [54, ['...WILL!'], ['', '']],
  ];
  const scene = (p: Pixels, k: number) => {
    const cur = [...lines].reverse().find(([at]) => k >= at)!;
    const leoX = k < 54 ? 120 : Math.max(20, 120 - (k - 54) * 6);
    scaleBlit(p, sprite(cast.mons, `leo${(k >> 2) % 2}`), leoX, 92, 3);
    if (k >= 56) scaleBlit(p, sprite(cast.poet, k < 66 ? `walk${k % 4}` : 'smug'), Math.min(170, 260 - (k - 56) * 8), 92, 3, true);
    spotlight(p, pal, k < 56 ? 160 : 190, 120, 70);
    balloon(p, pal, 60, 30, cur[1], 140, 92);
    caption(p, pal, cur[2]);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 4);
  for (let k = 0; k < 76; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(3);
  return r.fli(SPEED);
}

// ---- how to play ------------------------------------------------------------------------------

export function howtoFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = stage(pal, 7, false);
  const scene = (p: Pixels, k: number) => {
    let x = 20 + k * 5;
    let y = 102;
    let pose = `walk${k % 4}`;
    if (k >= 12 && k < 22) {
      y = 102 - Math.round(Math.sin(((k - 12) / 10) * Math.PI) * 40);
      pose = 'hopSide';
    }
    if (k >= 26) {
      x = 130;
      pose = k < 30 ? 'declaim0' : 'declaim1';
      if (k >= 30) {
        const t = k - 30;
        scaleBlit(p, sprite(cast.mons, `wordR${t % 2}`), 160 + t * 8, 102, 2);
        scaleBlit(p, sprite(cast.mons, `wordL${t % 2}`), 100 - t * 8, 102, 2);
      }
    }
    scaleBlit(p, sprite(cast.poet, pose), x, y, 2);
    // a coin and a mug to pick up
    if (k < 18) p.disc(110, 140, 4, c('gold', 2)).set(109, 139, c('gold', 3));
    if (k >= 13 && k < 20) say(p, pal, x + 20, y - 14, 'HOP!');
    if (k >= 32) say(p, pal, 160, 60, 'ALAS! HARK!', 'gold', 3, 2);
    caption(
      p,
      pal,
      k < 26 ? ['UP hops; Q and E hop sideways.', 'Coins and bills are tips.'] : ['SPACE declaims: a word flies', 'out to each side. B: the line.'],
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

// ---- the intermissions --------------------------------------------------------------------------

/** inter1: arriving at The Hive; inter2..4: Doc Leo calls the next set; inter5: the curtain call. */
export function interFli(k: number, cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  if (k === 1) {
    const bg = castleNight(pal, 9);
    const scene = (p: Pixels, t: number) => {
      scaleBlit(p, sprite(cast.poet, `walk${t % 4}`), Math.min(150, 10 + t * 5), 128, 2);
      if (t >= 8) say(p, pal, 176, 64, 'OPEN MIC TONIGHT', 'gold', 3, 2);
      caption(p, pal, ['The Hive, Oakland. A coffee', 'house with a castle for a front.']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let t = 0; t < 36; t++) r.frame(bg, (p) => scene(p, t));
    r.fadeOut(3);
    return r.fli(SPEED);
  }
  const set = SETS[k - 1];
  const bg = stage(pal, 10 + k);
  const words: string[][] =
    k === 5
      ? [['That is all seventeen!'], ['Give it up for WILL!']]
      : [
          [`Intermission ${k - 1}!`, 'Get a coffee.'],
          ['Next set:', set.name.toUpperCase()],
        ];
  const scene = (p: Pixels, t: number) => {
    scaleBlit(p, sprite(cast.mons, `leo${(t >> 2) % 2}`), 130, 92, 3);
    spotlight(p, pal, 160, 120, 74);
    balloon(p, pal, 40, 26, words[t < 20 ? 0 : 1], 140, 92);
    if (k === 5 && t >= 20) for (let i = 0; i < 6; i++) micro(p, 20 + ((i * 53 + t * 7) % 280), 150 + (i % 3) * 6, 'SNAP', c('paper', 2));
    caption(p, pal, k === 5 ? ['The curtain call.', 'Take your bow.'] : ['Five tips buy a cup at the counter.', 'The curtain takes the coffee.']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let t = 0; t < 40; t++) r.frame(bg, (p) => scene(p, t));
  r.fadeOut(3);
  return r.fli(SPEED);
}

// ---- the title cards ----------------------------------------------------------------------------

/** Splits a title into lines of at most `n` columns. */
function wrap(s: string, n: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const w of s.split(' ')) {
    if (line && (line + ' ' + w).length > n) (out.push(line), (line = w));
    else line = line ? `${line} ${w}` : w;
  }
  if (line) out.push(line);
  return out;
}

/** The strip of the monologue on a card: y 56 to 176. */
const STRIP = 56;

export function cardFli(card: CardView, cast: Cast): Uint8Array {
  const pal = card.pal;
  const c = pal.c;
  const mono = card.def.monologue!;
  const r = new Reel(pal.pal);
  const titleLines = wrap(mono.title.toUpperCase(), 38);
  const head = (p: Pixels, k: number) => {
    p.rect(0, 0, W, STRIP, c('ink', 0)).rect(0, STRIP - 1, W, 1, c('gold', 1));
    centered(p, 4, `MONOLOGUE ${card.index} OF 17  -  ${card.def.group.name.toUpperCase()}`, c('gold', 2));
    const drop = Math.min(0, -30 + k * 6);
    titleLines.forEach((l, i) => outlined(p, 160 - textWidth(l) / 2, 20 + i * 12 + drop, l, c('paper', 2), c('velvet', 0)));
  };
  // part 1: the stage, the spotlight finding Will at the microphone; he flings out an arm
  const st = stage(pal, card.index);
  const stageScene = (p: Pixels, k: number) => {
    scaleBlit(p, sprite(cast.poet, k < 8 ? 'front' : k < 14 ? 'declaim0' : 'declaim1'), 130, 92, 3);
    spotlight(p, pal, 160 - Math.max(0, 10 - k) * 8, 120, Math.min(70, 20 + k * 5), STRIP, 176);
    head(p, k);
    caption(p, pal, k < 14 ? ['', ''] : [`"${mono.card[0]}`, ` ${mono.card[1]}"`]);
  };
  // part 2: the epic in his head (the monologue's own scene), the line held
  const bg2 = new Pixels(W, H, c('ink', 0));
  bg2.blit(card.map, 0, STRIP);
  const epicScene = (p: Pixels, k: number) => {
    head(p, 10);
    caption(p, pal, [`"${mono.card[0]}`, ` ${mono.card[1]}"`]);
    if (k < 6) for (let y = STRIP; y < 176; y++) if ((y + k) % 6 < 6 - k) p.rect(0, y, W, 1, c('ink', 0));
  };
  const first = new Pixels(W, H);
  first.px.set(st.px);
  stageScene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 22; k++) r.frame(st, (p) => stageScene(p, k));
  for (let k = 0; k < 18; k++) r.frame(bg2, (p) => epicScene(p, k));
  return r.fli(SPEED);
}

// ---- after each monologue: snaps ------------------------------------------------------------

export function bravoFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = stage(pal, 21);
  const scene = (p: Pixels, k: number) => {
    scaleBlit(p, sprite(cast.poet, k < 10 ? 'front' : 'bow'), 130, 92, 3);
    spotlight(p, pal, 160, 120, 66);
    for (let i = 0; i < 8; i++) if ((i + k) % 3 === 0) micro(p, 14 + i * 38, 140 + (i % 2) * 8, 'SNAP', c('paper', 2));
    if (k >= 6) say(p, pal, 160, 40, 'BRAVO!', 'gold', 3, 3);
    caption(p, pal, ['Coffee-house applause:', 'the audience snaps.']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 2);
  for (let k = 0; k < 22; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(2);
  return r.fli(SPEED);
}

// ---- fainting (the game is lost) --------------------------------------------------------------

export function lostFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = stage(pal, 31);
  const scene = (p: Pixels, k: number) => {
    const pose = k < 8 ? 'hurt' : k < 16 ? 'faint0' : 'faint1';
    scaleBlit(p, sprite(cast.poet, pose), 130, 92, 3);
    // the curtain closing from both sides
    const close = Math.max(0, k - 24) * 8;
    for (let y = 0; y < 150; y++) {
      p.rect(0, y, Math.min(160, close), 1, c('velvet', 1 + ((y >> 3) % 2)));
      p.rect(W - Math.min(160, close), y, Math.min(160, close), 1, c('velvet', 1 + ((y >> 3) % 2)));
    }
    if (k >= 8 && k < 24) say(p, pal, 160, 50, 'He has lost his composure.', 'paper', 2);
    caption(p, pal, ['CURTAIN.', 'The open mic is closed. Try again!']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 50; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the curtain call ---------------------------------------------------------------------------

/** won1.fli (Doc Leo hands Will the Golden Mug), won2.fli (the bow, everyone on stage), won3.fli (THE END, The Hive at night). */
export function wonFlis(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const P = (n: string) => sprite(cast.poet, n);
  const N = (n: string) => sprite(cast.mons, n);
  /** The Golden Mug: the open mic's trophy. */
  const trophy = (p: Pixels, x: number, y: number, s = 2) => {
    p.rect(x, y, 10 * s, 12 * s, c('gold', 2))
      .rect(x + s, y + s, 3 * s, 10 * s, c('gold', 3))
      .rect(x + 10 * s, y + 3 * s, 3 * s, 2 * s, c('gold', 1))
      .rect(x + 12 * s, y + 3 * s, s, 5 * s, c('gold', 1))
      .rect(x + 10 * s, y + 7 * s, 3 * s, s, c('gold', 1));
    p.rect(x - s, y + 12 * s, 12 * s, 2 * s, c('wood', 2));
  };
  {
    const r = new Reel(pal.pal);
    const bg = stage(pal, 41, false);
    const scene = (p: Pixels, k: number) => {
      scaleBlit(p, N(`leo${(k >> 2) % 2}`), 70, 92, 3);
      scaleBlit(p, P(k < 24 ? 'front' : 'smug'), 190, 92, 3);
      trophy(p, k < 20 ? 120 : 176, k < 20 ? 110 : 100, 2);
      if (k < 20) balloon(p, pal, 20, 24, ['For seventeen epics', 'about nothing at all...'], 100, 92);
      else balloon(p, pal, 40, 24, ['THE GOLDEN MUG!'], 110, 92);
      caption(p, pal, ['The open mic at The Hive', 'has a winner.']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 44; k++) r.frame(bg, (p) => scene(p, k));
    r.fadeOut(3);
    files['won1.fli'] = r.fli(SPEED);
  }
  {
    // the bow: everyone on stage, Teddy and Gwinn awake, Carl overhead, the goat
    const r = new Reel(pal.pal);
    const bg = stage(pal, 43, false);
    const scene = (p: Pixels, k: number) => {
      scaleBlit(p, P(k % 16 < 8 ? 'bow' : 'front'), 140, 92, 3);
      scaleBlit(p, N(`leo${(k >> 2) % 2}`), 80, 102, 2);
      scaleBlit(p, N(`goat${(k >> 2) % 2}`), 210, 110, 2);
      scaleBlit(p, N(`teddy${(k >> 3) % 2}`), 40, 120, 2);
      scaleBlit(p, N(`gwinn${(k >> 3) % 2}`), 250, 120, 2);
      scaleBlit(p, N(`carl${k % 2}`), 150 + Math.round(Math.cos(k / 3) * 60), 40 + Math.round(Math.sin(k / 3) * 14), 2);
      for (let i = 0; i < 10; i++) if ((i + k) % 3 === 0) micro(p, 8 + i * 31, 136 + (i % 2) * 10, 'SNAP', c('paper', 2));
      caption(p, pal, ['Sometimes the battle is not', 'about the slice itself.']);
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
    const r = new Reel(pal.pal);
    const bg = castleNight(pal, 47);
    const scene = (p: Pixels, k: number) => {
      outlined(p, 160 - textWidth('THE END', 3) / 2, 10, 'THE END', c('gold', 3), c('velvet', 0), 3, c('ink', 0));
      scaleBlit(p, P(`walk${k % 4}`), Math.max(-40, 150 - k * 4), 128, 2, true);
      trophy(p, Math.max(-40, 150 - k * 4) + 26, 126, 1);
      caption(p, pal, ['Take your spatula.', 'Make your move.']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 50; k++) r.frame(bg, (p) => scene(p, k));
    files['won3.fli'] = r.fli(SPEED);
  }
  return files;
}
