// The 320x200 screens: the intro cartoon and title poster, the menu, story, help and
// credits pages, a title card before each board, the cartoons between rooms, the endings,
// and the backdrops PLAYGAME writes its own words on (high scores, load and save). They all
// share the game palette, so PLAYGAME's blue, red and purple inks match exactly, and every
// spot where it writes text is kept light and plain.
import { encodeGif } from '../../../../web/src/formats/gif';
import { encodeFli } from '../../../../web/src/formats/fli';
import { matchColor } from '../../../../web/src/formats/palette';
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { Pixels, rng } from '../../../kit/pixels';
import { loadScan, pastePhoto, polaroid, resample, tone } from '../../../kit/photo';
import { dosText } from '../../../kit/disk';
import { SANDLOGO, sandLogoFli } from '../../../kit/sandlogo';
import { CLEAR, bevel, blob, centered, gradient, micro, outlined, scaleBlit, text, textWidth } from '../art/draw';
import { PAL, c, r } from '../art/pal';
import type { Board } from '../levels/board';
import { renderBoard } from '../art/render';
import type { BlockSet } from '../blocks/sets';
import { CREDITS, FUSEBOX, HELP, LOST, STORY, WON } from './text';
import { STYLES, eggPic } from '../blocks/tiles';

const W = 320;
const H = 200;

export function gif(p: Pixels, palette: Uint8Array = PAL.pal): Uint8Array {
  return encodeGif({ width: p.w, height: p.h, pixels: Uint8Array.from(p.px), palette });
}

export interface Art {
  watt: BlockSet;
  parts: BlockSet;
}

/** A night sky over rooftops (most screens sit on it). */
function night(seed = 1, stars = true): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, H, r('sky'), 0, 3);
  const R = rng(seed);
  if (stars) for (let i = 0; i < 70; i++) p.set(Math.floor(R() * W), Math.floor(R() * 130), R() < 0.3 ? c('yellow', 3) : c('sky', 5));
  return p;
}

/** The Bitmores' house: a two-story silhouette with lit windows, at (x, base). */
function house(p: Pixels, x: number, base: number, lit = true, seed = 3): void {
  const R = rng(seed);
  const wall = c('night', 2);
  p.rect(x, base - 70, 120, 70, wall);
  for (let i = 0; i < 64; i++) p.rect(x - 6 + i, base - 70 - Math.floor(i * 0.6), 132 - i * 2, 1, c('night', 1));
  p.rect(x + 86, base - 104, 12, 26, c('night', 1)); // chimney
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 4; col++) {
      const wx = x + 10 + col * 28;
      const wy = base - 60 + row * 30;
      p.rect(wx, wy, 16, 18, lit && R() < 0.8 ? c('yellow', 2 + Math.floor(R() * 2)) : c('night', 0));
      p.rect(wx + 7, wy, 2, 18, c('night', 2)).rect(wx, wy + 8, 16, 2, c('night', 2));
    }
  p.rect(x + 52, base - 26, 16, 26, c('wood', 1));
  // the TV antenna, ready for lightning
  p.line(x + 30, base - 89, x + 30, base - 112, c('metal', 3))
    .line(x + 22, base - 106, x + 38, base - 106, c('metal', 3))
    .line(x + 24, base - 100, x + 36, base - 100, c('metal', 3));
}

function ground(p: Pixels, y: number): void {
  for (let yy = y; yy < H; yy++) for (let x = 0; x < W; x++) p.set(x, yy, ((x >> 2) + (yy >> 1)) % 7 === 0 ? c('green', 1) : c('green', 0));
}

/** A bolt of lightning from (x0, y0) to (x1, y1). */
function bolt(p: Pixels, x0: number, y0: number, x1: number, y1: number, seed: number): void {
  const R = rng(seed);
  let x = x0;
  let y = y0;
  const steps = 9;
  for (let i = 1; i <= steps; i++) {
    const nx = i === steps ? x1 : x0 + ((x1 - x0) * i) / steps + (R() - 0.5) * 24;
    const ny = y0 + ((y1 - y0) * i) / steps;
    for (const [dx, col] of [
      [-1, c('zap', 2)],
      [1, c('zap', 2)],
      [0, c('paper', 3)],
    ] as const)
      p.line(x + dx, y, nx + dx, ny, col);
    x = nx;
    y = ny;
  }
}

/** Big chunky title letters. */
function logo(p: Pixels, y: number, scale = 4): void {
  const line = (s: string, yy: number, sc: number, fill: number, edge: number) => {
    const x = Math.round(W / 2 - textWidth(s, sc) / 2);
    for (const [dx, dy] of [
      [2, 3],
      [3, 3],
      [3, 4],
    ])
      text(p, x + dx, yy + dy, s, c('ink', 0), sc);
    outlined(p, x, yy, s, fill, edge, sc);
    // a copper highlight along the tops of the letters
    for (let xx = x; xx < x + textWidth(s, sc); xx++) if (p.get(xx, yy) === fill) p.set(xx, yy, c('paper', 3));
  };
  line('OHM SWEET', y, scale, c('copper', 3), c('ink', 0));
  line('OHM', y + 8 * scale + 4, scale + 1, c('yellow', 3), c('red', 1));
}

/** A light paper panel where PLAYGAME writes words. */
function panel(p: Pixels, x: number, y: number, w: number, h: number): void {
  p.rect(x + 3, y + 3, w, h, c('ink', 0));
  bevel(p, x, y, w, h, r('paper'), 2, 2);
  p.rect(x + 3, y + 3, w - 6, h - 6, c('paper', 3));
  // circuit-board corners
  for (const [cx, cy] of [
    [x + 6, y + 6],
    [x + w - 7, y + 6],
    [x + 6, y + h - 7],
    [x + w - 7, y + h - 7],
  ])
    p.ring(cx, cy, 2, c('copper', 2));
}

/** Copper traces wandering over a dark board, for borders. */
function traces(p: Pixels, seed: number, x0 = 0, y0 = 0, w = W, h = H): void {
  const R = rng(seed);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) p.set(x, y, ((x + y) & 3) === 0 ? c('pcb', 1) : c('pcb', 0));
  for (let k = 0; k < 26; k++) {
    let x = x0 + Math.floor(R() * w);
    let y = y0 + Math.floor(R() * h);
    for (let s = 0; s < 6; s++) {
      const horiz = R() < 0.5;
      const len = 8 + Math.floor(R() * 40);
      const nx = horiz ? Math.max(x0, Math.min(x0 + w - 1, x + (R() < 0.5 ? -len : len))) : x;
      const ny = horiz ? y : Math.max(y0, Math.min(y0 + h - 1, y + (R() < 0.5 ? -len : len)));
      p.line(x, y, nx, ny, c('copper', 2)).line(x + 1, y + 1, nx + 1, ny + 1, c('copper', 0));
      x = nx;
      y = ny;
    }
    p.disc(x, y, 2, c('gold', 2));
  }
}

function bigWatt(p: Pixels, art: Art, x: number, y: number, s: number, pose = 'down0', flip = false): void {
  scaleBlit(p, art.watt.pic(pose), x, y, s, flip);
}

// ---------------------------------------------------------------- title & menu

export function titleScreen(art: Art): Pixels {
  const p = night(5);
  ground(p, 172);
  house(p, 186, 172, true);
  bolt(p, 214, 0, 216, 62, 9);
  logo(p, 14, 4);
  bigWatt(p, art, 34, 88, 4);
  // a speech bubble
  bevel(p, 104, 112, 88, 22, r('paper'), 2);
  p.line(104, 126, 96, 132, c('paper', 1)).line(104, 127, 97, 132, c('paper', 1));
  text(p, 110, 119, 'ZZT! OW!', c('red', 2));
  outlined(p, 30, 182, 'A logic puzzle in 23 circuit boards', c('yellow', 3), c('ink', 0));
  micro(p, 4, 4, 'SANDBOX SOFTWARE PRESENTS', c('sky', 5));
  return p;
}

export function menuScreen(art: Art): Pixels {
  const p = new Pixels(W, H);
  traces(p, 11);
  logo(p, 6, 3);
  // PLAYGAME writes the game's name at (96,104) and the menu at (80,120..167) in blue
  panel(p, 58, 96, 204, 78);
  bigWatt(p, art, 12, 116, 2);
  bigWatt(p, art, 266, 116, 2, 'side0');
  outlined(p, 52, 184, 'Arrows to choose, Enter to go', c('paper', 3), c('ink', 0));
  return p;
}

/** Backdrop for text pages: PLAYGAME writes 31 columns at x=40, y=40..167 (purple). */
export function pageScreen(art: Art, title: string, seed: number, pose = 'down0'): Pixels {
  const p = new Pixels(W, H);
  traces(p, seed);
  // The paper reaches past the text on every side, so its corner rings sit clear of the letters.
  panel(p, 28, 26, 270, 158);
  outlined(p, Math.round(W / 2 - textWidth(title) / 2), 12, title, c('yellow', 3), c('ink', 0));
  bigWatt(p, art, 290, 2, 1, pose);
  bigWatt(p, art, 6, 2, 1, pose, true);
  return p;
}

/**
 * High scores: PLAYGAME writes the whole table from the top ("Top Ten Scores" at y 0, rows
 * at x 20 that reach x 284 with a 22 letter name) and "Hit any key" at y 192, so the paper
 * runs off the top and bottom of the screen and Watt waves from the top corners.
 */
export function scoresScreen(art: Art): Pixels {
  const p = new Pixels(W, H);
  traces(p, 21);
  panel(p, 10, -8, 300, 216);
  bigWatt(p, art, 22, 2, 1);
  bigWatt(p, art, 278, 2, 1, 'blink');
  return p;
}

/**
 * Load and save: PLAYGAME writes ten names in yellow at x 80, y 40 + 14i (up to 20
 * letters), its red marker at x 60, and its messages in blue at y 185 (x 40..272). Yellow
 * vanishes on paper, so the names get a dark slot board, and the messages a paper strip.
 */
export function slotsScreen(art: Art, title: string): Pixels {
  const p = new Pixels(W, H);
  traces(p, 31);
  outlined(p, Math.round(W / 2 - textWidth(title) / 2), 12, title, c('yellow', 3), c('ink', 0));
  p.rect(53, 34, 202, 146, c('ink', 0));
  bevel(p, 50, 31, 202, 146, r('ink'), 1, 2);
  p.rect(53, 34, 196, 140, c('pcb', 0));
  p.rect(33, 182, 256, 18, c('ink', 0));
  bevel(p, 30, 179, 256, 20, r('paper'), 3, 2);
  bigWatt(p, art, 4, 136, 2);
  bigWatt(p, art, 276, 136, 2, 'side0', true);
  return p;
}

// ---------------------------------------------------------------- board title cards

const ROOM_NAMES: Record<string, string> = { kitchen: 'THE KITCHEN', living: 'THE LIVING ROOM', garage: 'THE GARAGE', attic: 'THE ATTIC' };

export function cardScreen(b: Board, n: number, total: number, tiles: BlockSet, art: Art): Pixels {
  const p = new Pixels(W, H);
  traces(p, 40 + n);
  const room = ROOM_NAMES[b.spec.room];
  outlined(p, Math.round(W / 2 - textWidth(room) / 2), 6, room, c('copper', 3), c('ink', 0));
  centered(p, 20, `BOARD ${n} OF ${total}`, c('paper', 3), 1, c('ink', 0));
  const title = b.spec.title.toUpperCase();
  const sc = textWidth(title, 2) <= 300 ? 2 : 1;
  centered(p, 34, title, c('yellow', 3), sc, c('red', 1));
  // the board itself, half size, in a bezel
  const view = renderBoard(b, tiles, art.parts, art.watt.pic('down0'));
  const bx = 80;
  const by = 58;
  p.rect(bx - 4, by - 4, 168, 108, c('ink', 0));
  bevel(p, bx - 3, by - 3, 166, 106, r('metal'), 3, 2);
  for (let y = 0; y < 100; y++) for (let x = 0; x < 160; x++) p.set(bx + x, by + y, view.get(x * 2, y * 2));
  b.spec.card.forEach((line, i) => centered(p, 170 + i * 11, line, c('paper', 3), 1, c('ink', 0)));
  // the first boards also teach the keys beyond the arrows
  if (n <= 3) centered(p, 191, 'R REBOOTS THE BOARD   F1 HELP', c('copper', 3), 1, c('ink', 0));
  return p;
}

// ---------------------------------------------------------------- cartoons

function fli(frames: Pixels[], speed: number): Uint8Array {
  return encodeFli(
    frames.map((f) => Uint8Array.from(f.px)),
    PAL.pal,
    { speed },
  );
}

/** The intro: a stormy night, lightning hits the antenna, a spark races down the wiring into
 * the fuse box, and Watt is bounced clear across the house into the toaster. */
export function introFli(art: Art): Uint8Array {
  const frames: Pixels[] = [];
  const base = () => {
    const p = night(5);
    ground(p, 172);
    house(p, 100, 172, true);
    return p;
  };
  // rain
  const rain = (p: Pixels, t: number) => {
    const R = rng(t);
    for (let i = 0; i < 60; i++) {
      const x = Math.floor(R() * W);
      const y = (Math.floor(R() * H) + t * 13) % H;
      p.line(x, y, x - 2, y + 6, c('sky', 4));
    }
  };
  for (let t = 0; t < 14; t++) {
    const p = base();
    rain(p, t);
    centered(p, 12, 'A dark and stormy night...', c('paper', 3), 1, c('ink', 0));
    frames.push(p);
  }
  for (let t = 0; t < 6; t++) {
    const p = base();
    if (t < 3) p.map((_, __, v) => (v === c('sky', 0) || v === c('sky', 1) ? c('sky', 5) : v));
    bolt(p, 120 + t, 0, 130, 60, t + 1);
    rain(p, t + 14);
    centered(p, 12, 'KRA-KOOOM!', c('yellow', 3), 2, c('red', 1));
    frames.push(p);
  }
  // the spark runs down the wall to the fuse box
  for (let t = 0; t < 14; t++) {
    const p = base();
    rain(p, t + 20);
    p.line(130, 60, 130, 120, c('copper', 2)).line(130, 120, 196, 120, c('copper', 2)).line(196, 120, 196, 150, c('copper', 2));
    bevel(p, 186, 150, 22, 18, r('metal'), 3);
    micro(p, 189, 156, 'FUSE', c('ink', 0));
    const d = t / 13;
    const sx = d < 0.4 ? 130 : d < 0.8 ? 130 + ((d - 0.4) / 0.4) * 66 : 196;
    const sy = d < 0.4 ? 60 + (d / 0.4) * 60 : d < 0.8 ? 120 : 120 + ((d - 0.8) / 0.2) * 30;
    blob(p, sx, sy, 5, 5, r('spark'), 1, 4);
    centered(p, 12, 'It runs down the wires to the fuse box...', c('paper', 3), 1, c('ink', 0));
    frames.push(p);
  }
  // BOING: Watt flies out of the fuse box in an arc
  for (let t = 0; t < 20; t++) {
    const p = base();
    rain(p, t + 40);
    bevel(p, 186, 150, 22, 18, r('metal'), 3);
    const u = t / 19;
    const x = 196 - u * 150;
    const y = 150 - Math.sin(u * Math.PI) * 120;
    scaleBlit(p, art.watt.pic(t % 4 < 2 ? 'zapped' : 'down0'), Math.round(x - 20), Math.round(y - 30), 2);
    if (t < 6) centered(p, 140, 'BOING!', c('yellow', 3), 2, c('red', 1), 220);
    centered(p, 12, '...and bounces Watt out of his fuse box!', c('paper', 3), 1, c('ink', 0));
    frames.push(p);
  }
  // into the kitchen: the toaster
  for (let t = 0; t < 16; t++) {
    const p = new Pixels(W, H, c('plastic', 4));
    for (let y = 120; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, ((x >> 4) + (y >> 4)) % 2 ? c('plastic', 2) : c('plastic', 1));
    // toaster
    bevel(p, 110, 70, 100, 70, r('metal'), 4, 3);
    p.rect(126, 72, 28, 6, c('ink', 0)).rect(166, 72, 28, 6, c('ink', 0));
    p.rect(214, 100, 8, 14, c('ink', 1));
    const u = t / 15;
    if (t < 8) scaleBlit(p, art.watt.pic('zapped'), 128, Math.round(-30 + u * 2 * 100), 2);
    else {
      centered(p, 30, 'Watt landed in the TOASTER!', c('red', 2), 1, c('paper', 3));
      for (const sx of [130, 180]) p.disc(sx + (t % 3), 64 - (t % 4) * 3, 3, c('metal', 4));
    }
    frames.push(p);
  }
  return fli(frames, 6);
}

/** Between rooms: Watt zips along the house wiring to the next room. */
export function travelFli(art: Art, from: string, to: string): Uint8Array {
  const frames: Pixels[] = [];
  for (let t = 0; t < 30; t++) {
    const p = new Pixels(W, H);
    traces(p, 77);
    p.rect(0, 96, W, 12, c('ink', 0)).rect(0, 99, W, 6, c('copper', 2)).rect(0, 100, W, 2, c('copper', 4));
    const x = -40 + t * 12;
    for (let k = 1; k < 6; k++) p.disc(x - k * 9, 102, 3 - k * 0.4, c('spark', 4 - Math.min(3, k)));
    scaleBlit(p, art.watt.pic(t % 2 ? 'side0' : 'side1'), x, 62, 2, true);
    centered(p, 30, `${from}  >>>  ${to}`, c('yellow', 3), 1, c('ink', 0));
    centered(p, 150, 'Watt rides the house wiring...', c('paper', 3), 1, c('ink', 0));
    frames.push(p);
  }
  return fli(frames, 5);
}

/** The ending: Watt rolls home to his charging socket. */
export function homeFli(art: Art): Uint8Array {
  const frames: Pixels[] = [];
  for (let t = 0; t < 36; t++) {
    const p = new Pixels(W, H);
    traces(p, 90);
    bevel(p, 200, 60, 80, 90, r('metal'), 2, 3);
    micro(p, 212, 66, 'MAIN FUSE BOX', c('yellow', 3));
    bevel(p, 226, 96, 28, 34, r('paper'), 2);
    p.rect(233, 104, 3, 8, c('ink', 0)).rect(244, 104, 3, 8, c('ink', 0));
    const x = Math.min(222, -20 + t * 9);
    scaleBlit(p, art.watt.pic(x >= 222 ? (t % 6 < 3 ? 'down0' : 'blink') : t % 2 ? 'side0' : 'side1'), x, 100, 2, x < 222);
    if (x >= 222) {
      for (let k = 0; k < 5; k++) p.disc(240 + Math.cos(t / 2 + k) * 30, 90 + Math.sin(t / 2 + k) * 20, 2, c('green', 3));
      centered(p, 30, 'Home sweet Ohm!', c('yellow', 3), 2, c('red', 1));
    }
    frames.push(p);
  }
  // Once Watt is home, a snapshot on the board beside him: The Dog House, the little free
  // library out front, a real photo dithered into palette entries no frame uses.
  const lib = tone(resample(loadScan('library'), 92), (v) => v.map((x) => 255 * (x / 255) ** 0.85) as [number, number, number]);
  const [lx, ly] = [36, 62];
  const used = new Set<number>();
  for (const f of frames) for (const v of f.px) used.add(v);
  const last = frames[frames.length - 1];
  const at = polaroid(last, lx, ly, lib.w, lib.h, { paper: c('paper', 3), edge: c('ink', 0), shadow: c('ink', 0), tape: c('yellow', 3) });
  const label = 'THE DOG HOUSE';
  micro(last, Math.round(at.cx - (label.length * 4) / 2), Math.round(at.cy - 2), label, c('ink', 0));
  const { pal } = pastePhoto(last, PAL.pal, lib, lx, ly, { reserved: [...used] });
  const box = { x: lx - 10, y: ly - 10, w: lib.w + 24, h: lib.h + 30 };
  frames.forEach((f, t) => {
    if (f === last || Math.min(222, -20 + t * 9) < 222) return;
    for (let y = box.y; y < box.y + box.h; y++) for (let x = box.x; x < box.x + box.w; x++) f.set(x, y, last.get(x, y));
  });
  return encodeFli(
    frames.map((f) => Uint8Array.from(f.px)),
    pal,
    { speed: 6 },
  );
}

// ---------------------------------------------------------------- all files

export function buildScreens(art: Art, boards: { b: Board; tiles: BlockSet }[]): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  out[SANDLOGO] = sandLogoFli();
  out['intro.fli'] = introFli(art);
  out['title.gif'] = gif(titleScreen(art));
  // the Sandbox Software logo first, then the game's own intro
  out['title.lst'] = serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'intro.fli', pause: 1 },
    { name: 'title.gif', pause: 12 },
  ]);
  out['menu.gif'] = gif(menuScreen(art));
  out['story.gif'] = gif(pageScreen(art, 'THE STORY', 51));
  out['story.txt'] = dosText(STORY);
  out['story.lst'] = serializeSlideList([{ name: 'intro.fli', pause: 1 }, { name: 'story.gif', pause: 0 }, { name: 'story.txt' }]);
  out['help.gif'] = gif(pageScreen(art, 'HOW TO PLAY', 52, 'up0'));
  out['help.txt'] = dosText(HELP);
  out['help.lst'] = serializeSlideList([{ name: 'help.gif', pause: 0 }, { name: 'help.txt' }]);
  out['credits.gif'] = gif(pageScreen(art, 'CREDITS', 53, 'blink'));
  out['credits.txt'] = dosText(CREDITS);
  out['credits.lst'] = serializeSlideList([{ name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]);
  out['scores.gif'] = gif(scoresScreen(art));
  out['loadgame.gif'] = gif(slotsScreen(art, 'LOAD A GAME'));
  out['savegame.gif'] = gif(slotsScreen(art, 'SAVE THIS GAME'));
  out['home.fli'] = homeFli(art);
  out['won.gif'] = gif(pageScreen(art, 'HOME SWEET OHM!', 54, 'blink'));
  out['won.txt'] = dosText(WON);
  out['won.lst'] = serializeSlideList([{ name: 'home.fli', pause: 2 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]);
  out['lost.gif'] = gif(pageScreen(art, 'OUT OF BATTERIES', 55, 'toast'));
  out['lost.txt'] = dosText(LOST);
  out['lost.lst'] = serializeSlideList([{ name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]);
  // the page behind the fuse box (the felt egg either side of the title)
  const fuse = pageScreen(art, 'THE LIVE WIRE EGG', 56, 'blink');
  const egg = eggPic(STYLES.garage, new Pixels(20, 20, CLEAR));
  fuse.blit(egg, 64, 4, CLEAR).blit(egg, 236, 4, CLEAR);
  // The fuse box page's scene loads dark.pal (all black), so PLAYGAME's "MORE..." red
  // matches palette index 0 there; this picture doesn't use index 0, so it is made red.
  const fusePal = PAL.pal.slice();
  const red = matchColor(PAL.pal, 63, 10, 10);
  fusePal.set(PAL.pal.subarray(red * 3, red * 3 + 3), 0);
  if (fuse.px.includes(0)) throw new Error('fusebox.gif uses palette index 0');
  out['fusebox.gif'] = gif(fuse, fusePal);
  out['fusebox.txt'] = dosText(FUSEBOX);
  out['fusebox.lst'] = serializeSlideList([{ name: 'fusebox.gif', pause: 0 }, { name: 'fusebox.txt' }]);
  // Each board's card (its card scene's intro graphic); a new room starts with Watt riding
  // the house wiring to it.
  let rides = 0;
  boards.forEach(({ b, tiles }, i) => {
    out[`${b.spec.file}.gif`] = gif(cardScreen(b, i + 1, boards.length, tiles, art));
    const prev = boards[i - 1]?.b.spec.room;
    const list = [{ name: `${b.spec.file}.gif`, pause: 4 }];
    if (prev && prev !== b.spec.room) {
      const ride = `ride${++rides}.fli`;
      out[ride] = travelFli(art, ROOM_NAMES[prev], ROOM_NAMES[b.spec.room]);
      list.unshift({ name: ride, pause: 0 });
    }
    out[`${b.spec.file}.lst`] = serializeSlideList(list);
  });
  return out;
}

void CLEAR;
