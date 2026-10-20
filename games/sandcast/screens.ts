// The screens between the playfields, drawn as a dial-up BBS session: the title is an
// ANSI logon screen, the stories are messages in a message base, and the intro FLI dials
// THE -= S A N D B O X =- BBS and lets the logo arrive line by line, like it did at 2400 baud.
import { FONT8X8 } from '../../web/src/gfx/font8x8';
import { encodeGif } from '../../web/src/formats/gif';
import { encodeFli } from '../../web/src/formats/fli';
import { Pixels, dither, rng } from '../kit/pixels';
import { ANSI, DAY, GRASS, OCHRE, RED, SAND, STEEL, TABBY, TEXT_MAGENTA, WATER, WOOD, YELLOW } from './palette';
import { ball, shade } from './art';

export const W = 320;
export const H = 200;
const BLACK = ANSI[0];

export function screen(c = BLACK): Pixels {
  return new Pixels(W, H, c);
}

/** 8x8 text from the PC's ROM font, optionally scaled, with an optional drop shadow. */
export function text(p: Pixels, x: number, y: number, s: string, color: number | ((gx: number, gy: number) => number), scale = 1, shadow = -1): Pixels {
  [...s].forEach((ch, i) => {
    const g = FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8);
    for (let gy = 0; gy < 8; gy++)
      for (let gx = 0; gx < 8; gx++) {
        if (!(g[gy] & (1 << gx))) continue;
        const px = x + (i * 8 + gx) * scale;
        const py = y + gy * scale;
        if (shadow >= 0) p.rect(px + scale, py + scale, scale, scale, shadow);
        for (let sy = 0; sy < scale; sy++)
          for (let sx = 0; sx < scale; sx++) p.set(px + sx, py + sy, typeof color === 'number' ? color : color(gx * scale + sx, gy * scale + sy));
      }
  });
  return p;
}

/** ANSI shade characters: 1 = light (25%), 2 = medium (50%), 3 = dark (75%), 4 = full. */
export function shadeRect(p: Pixels, x: number, y: number, w: number, h: number, fg: number, level: 1 | 2 | 3 | 4, bg = -1): Pixels {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) {
      const on = level === 4 || (level === 2 ? (xx + yy) % 2 === 0 : level === 1 ? xx % 2 === 0 && yy % 2 === 0 : !(xx % 2 === 1 && yy % 2 === 1));
      if (on) p.set(xx, yy, fg);
      else if (bg >= 0) p.set(xx, yy, bg);
    }
  return p;
}

/** A double-line box in the CP437 style. */
export function box(p: Pixels, x: number, y: number, w: number, h: number, c: number): Pixels {
  p.frame(x, y, w, h, c).frame(x + 2, y + 2, w - 4, h - 4, c);
  return p;
}

/** The big sandy logo letters: a sand gradient in each glyph, dark outline, dithered shadow. */
export function logo(p: Pixels, x: number, y: number, s: string, scale: number): Pixels {
  const h = 8 * scale;
  const grad = (_gx: number, gy: number) => {
    const t = gy / h;
    if (gy % scale === 0 && gy < h / 2) return YELLOW[4];
    return t < 0.25 ? YELLOW[3] : t < 0.5 ? SAND[8] : t < 0.75 ? SAND[6] : OCHRE[4];
  };
  // Shadow first (dithered, like a ▒ shade), then an outline, then the letters.
  const mask = new Pixels(s.length * 8 * scale + 4, h + 4, 0);
  text(mask, 2, 2, s, 1, scale);
  for (let yy = 0; yy < mask.h; yy++)
    for (let xx = 0; xx < mask.w; xx++) {
      if (mask.get(xx, yy) !== 1) continue;
      for (let k = 1; k <= Math.max(2, scale - 1); k++) if ((xx + yy + k) % 2 === 0) p.set(x + xx - 2 + k, y + yy - 2 + k, ANSI[8]);
    }
  for (let yy = 0; yy < mask.h; yy++)
    for (let xx = 0; xx < mask.w; xx++) {
      if (mask.get(xx, yy) === 1) continue;
      const near = [mask.get(xx - 1, yy), mask.get(xx + 1, yy), mask.get(xx, yy - 1), mask.get(xx, yy + 1)].includes(1);
      if (near) p.set(x + xx - 2, y + yy - 2, OCHRE[0]);
    }
  text(p, x, y, s, grad, scale);
  return p;
}

/** A sandcastle on a dune with a moat, flags flying. `s` scales it. */
export function castleArt(p: Pixels, cx: number, base: number, s = 1, seed = 5): Pixels {
  const r = rng(seed);
  const X = (v: number) => Math.round(cx + v * s);
  const Y = (v: number) => Math.round(base + v * s);
  // Dune.
  for (let yy = Y(-14); yy <= Y(6); yy++)
    for (let xx = X(-90); xx <= X(90); xx++) {
      const dx = (xx - cx) / (90 * s);
      const top = base - 14 * s * (1 - dx * dx) + 4 * s;
      if (yy < top) continue;
      const t = (yy - top) / (20 * s);
      p.set(xx, yy, dither(xx, yy, 0.65 - t + (r() - 0.5) * 0.3) ? SAND[7] : SAND[5]);
    }
  // Moat in front.
  for (let yy = Y(4); yy <= Y(10); yy++)
    for (let xx = X(-70); xx <= X(70); xx++) {
      const w = Math.sin(xx / 4 + yy) > 0.6;
      p.set(xx, yy, w ? WATER[7] : dither(xx, yy, 0.5) ? WATER[4] : WATER[3]);
    }
  const wall = (x0: number, y0: number, w: number, h: number, light: number) => {
    for (let yy = Y(y0); yy < Y(y0 + h); yy++)
      for (let xx = X(x0); xx < X(x0 + w); xx++) {
        const row = Math.floor((yy - Y(y0)) / Math.max(2, 3 * s));
        const brick = (xx - X(x0) + (row % 2) * 3 * s) % Math.max(4, 6 * s) === 0 || (yy - Y(y0)) % Math.max(2, 3 * s) === 0;
        const edge = xx - X(x0) < s * 2 ? 1 : X(x0 + w) - xx <= s * 2 ? -1 : 0;
        p.set(xx, yy, brick ? SAND[3] : shade(SAND, light + edge * 2));
      }
    // Crenellations.
    for (let k = 0; k < w; k += 4) p.rect(X(x0 + k), Y(y0 - 3), Math.max(1, 2 * s), Math.max(1, 3 * s), shade(SAND, light + 1));
  };
  const flag = (x0: number, y0: number, c: number) => {
    p.line(X(x0), Y(y0), X(x0), Y(y0 - 12), WOOD[2]);
    p.rect(X(x0) + 1, Y(y0 - 12), Math.max(2, 6 * s), Math.max(2, 4 * s), c);
    p.set(X(x0) + 1, Y(y0 - 12), YELLOW[4]);
  };
  wall(-50, -30, 100, 34, 6); // curtain wall
  wall(-62, -48, 18, 52, 7); // towers
  wall(44, -48, 18, 52, 5);
  wall(-14, -64, 28, 68, 7); // keep
  flag(-53, -51, RED[4]);
  flag(53, -51, RED[4]);
  flag(0, -67, WATER[5]);
  // Gate.
  for (let yy = Y(-14); yy <= Y(4); yy++)
    for (let xx = X(-8); xx <= X(8); xx++) {
      const dx = (xx - cx) / (8 * s);
      const dy = (yy - Y(-6)) / (8 * s);
      if (yy < Y(-6) && dx * dx + dy * dy > 1) continue;
      p.set(xx, yy, (xx - X(-8)) % Math.max(2, 3 * s) === 0 ? WOOD[3] : 0);
    }
  // Windows.
  for (const [wx, wy] of [
    [-56, -36],
    [50, -36],
    [-4, -50],
    [4, -50],
  ])
    p.rect(X(wx), Y(wy), Math.max(1, 2 * s), Math.max(2, 4 * s), 0);
  return p;
}

/** A blue terminal status bar along the bottom (Telix style). */
function statusBar(p: Pixels, s: string, y = 192): Pixels {
  p.rect(0, y, W, 8, ANSI[1]);
  return text(p, 0, y, s.padEnd(40).slice(0, 40), ANSI[15]);
}

/** The ANSI title screen. */
export function titleScreen(): Pixels {
  const p = screen();
  // Starry night of line noise in the corners.
  const r = rng(9);
  for (let k = 0; k < 90; k++) p.set(Math.floor(r() * W), Math.floor(r() * 120), [ANSI[8], ANSI[7], ANSI[1], ANSI[9]][k % 4]);
  text(p, 0, 0, 'CONNECT 14400/ARQ/V32BIS/LAPM/V42BIS', ANSI[7]);
  text(p, 52, 12, 'THE -= S A N D B O X =- BBS', (gx) => [ANSI[11], ANSI[13], ANSI[14], ANSI[10]][Math.floor(gx / 8) % 4]);
  text(p, 112, 22, 'presents', ANSI[8]);
  logo(p, 40, 36, 'SANDCASTLE', 3);
  logo(p, 64, 64, 'KNIGHT', 4);
  castleArt(p, 160, 176, 1, 5);
  // A small knight at the castle gate.
  text(p, 4, 150, 'v1.0', ANSI[8]);
  text(p, 4, 160, '(c) 1995', ANSI[8]);
  text(p, 252, 150, 'Sandbox', ANSI[8]);
  text(p, 252, 160, 'Software', ANSI[8]);
  return statusBar(p, ' ALT-Z HELP | ANSI | 14400 N81 | ONLINE');
}

/** The menu: the logo above, a framed panel where Game-Maker writes the menu. */
export function menuScreen(): Pixels {
  const p = screen();
  text(p, 52, 2, 'THE -= S A N D B O X =- BBS', (gx) => [ANSI[11], ANSI[13], ANSI[14], ANSI[10]][Math.floor(gx / 8) % 4]);
  logo(p, 40, 16, 'SANDCASTLE', 3);
  logo(p, 64, 44, 'KNIGHT', 4);
  // Menu panel (Game-Maker writes the title at 96,104 and items at 80,120..160).
  box(p, 56, 94, 192, 82, ANSI[9]);
  text(p, 60, 179, 'Up/Down + ENTER to choose', ANSI[8]);
  // Castles on either side.
  castleArt(p, 286, 186, 0.36, 7);
  castleArt(p, 26, 186, 0.36, 8);
  shadeRect(p, 0, 188, W, 12, SAND[5], 2, SAND[3]);
  return p;
}

/** A message-base page: the BBS's header bars around an empty text area (40..288, 40..168). */
export function messageScreen(subject: string, from = 'SIR GRIT', to = 'ALL'): Pixels {
  const p = screen();
  p.rect(0, 0, W, 8, ANSI[1]);
  text(p, 0, 0, ' THE -= S A N D B O X =- BBS  Msg Base', ANSI[15]);
  text(p, 8, 12, `From: ${from}`, ANSI[11]);
  text(p, 168, 12, `To: ${to}`, ANSI[11]);
  text(p, 8, 22, `Subj: ${subject}`.slice(0, 38), ANSI[14]);
  box(p, 28, 33, 266, 142, ANSI[1]);
  shadeRect(p, 0, 180, W, 8, ANSI[8], 1);
  statusBar(p, ' [N]ext  [R]eply  [Q]uit  any key...');
  return p;
}

/** The high score backdrop: a "Hall of Fame" bulletin with sand pillars at the sides. */
export function scoreScreen(): Pixels {
  const p = screen();
  for (const x0 of [0, 300]) {
    shadeRect(p, x0, 0, 20, H, SAND[6], 3, SAND[4]);
    for (let y = 0; y < H; y += 24) p.rect(x0, y, 20, 3, SAND[8]);
  }
  text(p, 24, 10, 'Bulletin #3: KNIGHTS OF THE SANDBOX', ANSI[14]);
  return p;
}

/** Load/save: the BBS file area. Names go at 80,40.. (14 apart), the marker at 60. */
export function filesScreen(title: string): Pixels {
  const p = screen();
  p.rect(0, 0, W, 8, ANSI[1]);
  text(p, 0, 0, ` FILE AREA: ${title}`.padEnd(40), ANSI[15]);
  text(p, 8, 14, 'Pick a slot, then press ENTER', ANSI[7]);
  for (let i = 0; i < 10; i++) {
    text(p, 20, 40 + i * 14, `${String(i + 1).padStart(2)}.`, ANSI[8]);
    p.rect(78, 49 + i * 14, 168, 1, ANSI[1]);
  }
  castleArt(p, 282, 196, 0.32, 9);
  return p;
}

/** Victory: the knight's flag over a finished castle, at sunrise. */
export function wonScreen(): Pixels {
  const p = screen();
  for (let y = 0; y < 150; y++)
    for (let x = 0; x < W; x++) {
      const t = y / 150;
      p.set(x, y, dither(x, y, t * 2 - Math.floor(t * 2)) ? (t < 0.5 ? WATER[2] : TABBY[5]) : t < 0.5 ? WATER[1] : TABBY[4]);
    }
  ball(p, 250, 120, 22, YELLOW, 3);
  p.rect(0, 150, W, 50, SAND[5]);
  castleArt(p, 140, 176, 1.1, 11);
  text(p, 0, 0, 'NO CARRIER'.padEnd(40), ANSI[15]);
  return p;
}

/** Defeat: a wave has flattened the castle; a lonely helmet on the sand. */
export function lostScreen(): Pixels {
  const p = screen();
  for (let y = 0; y < 120; y++) for (let x = 0; x < W; x++) p.set(x, y, dither(x, y, y / 120) ? WATER[2] : WATER[1]);
  for (let y = 120; y < H; y++)
    for (let x = 0; x < W; x++) {
      const edge = 128 + Math.sin(x / 14) * 6;
      p.set(x, y, y < edge ? (y > edge - 3 ? WATER[9] : WATER[4]) : dither(x, y, 0.4) ? OCHRE[4] : OCHRE[3]);
    }
  // Slumped sand where the castle stood.
  for (let y = 140; y < 175; y++)
    for (let x = 90; x < 230; x++) {
      const dx = (x - 160) / 70;
      const top = 175 - 30 * (1 - dx * dx);
      if (y >= top) p.set(x, y, dither(x, y, (y - top) / 30) ? SAND[4] : SAND[6]);
    }
  // The helmet with its red plume.
  ball(p, 160, 142, 8, STEEL, 4);
  p.rect(153, 143, 15, 2, STEEL[0]);
  p.line(160, 134, 164, 126, RED[4]).line(161, 134, 166, 127, RED[3]);
  text(p, 0, 0, 'NO CARRIER'.padEnd(40), ANSI[15]);
  return p;
}

export function gif(p: Pixels, pal = DAY): Uint8Array {
  return encodeGif({ width: W, height: H, pixels: Uint8Array.from(p.px), palette: pal });
}

/** The dial-up intro: type the dial string, connect, then draw the logon screen row by row. */
export function introFli(): Uint8Array {
  const frames: Uint8Array[] = [];
  const add = (p: Pixels, n = 1) => {
    for (let i = 0; i < n; i++) frames.push(Uint8Array.from(p.px));
  };
  const term = screen();
  const lines = ['ATZ', 'OK', 'ATDT 555-0142', ''];
  let y = 8;
  text(term, 0, 0, 'Telix 3.22  -  Dialing Directory', ANSI[8]);
  add(term, 2);
  for (const line of lines.slice(0, 2)) {
    text(term, 0, y, line, ANSI[7]);
    y += 8;
    add(term);
  }
  const dial = lines[2];
  for (let i = 1; i <= dial.length; i += 2) {
    text(term, 0, y, dial.slice(0, i), ANSI[7]);
    add(term);
  }
  text(term, 0, y, dial, ANSI[7]);
  y += 16;
  text(term, 0, y, '* RING *', ANSI[8]);
  add(term, 3);
  text(term, 72, y, '* RING *', ANSI[8]);
  add(term, 3);
  y += 8;
  text(term, 0, y, 'CONNECT 14400/ARQ/V32BIS/LAPM/V42BIS', ANSI[15]);
  add(term, 3);
  const title = titleScreen();
  // The logon screen arrives a band at a time.
  const shown = screen();
  for (let row = 0; row < H; row += 12) {
    for (let yy = row; yy < Math.min(H, row + 12); yy++) for (let x = 0; x < W; x++) shown.set(x, yy, title.get(x, yy));
    add(shown);
  }
  add(title, 2);
  return encodeFli(frames, DAY, { speed: 7 });
}

/** The colors Game-Maker picks for text over these screens, for checking. */
export const TEXT_COLOR = TEXT_MAGENTA;
export { GRASS };
