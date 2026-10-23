// The 320x200 pictures: the menu, the paper behind text pages, the high scores, load and save,
// and the credits (with Doc Leo); and the scenery the cartoons share: the living room at night
// (wallpaper, wood paneling, carpet), the couch from the front, the console TV, the VCR and the
// remote itself. The title is the cover drawn for the game (art/cover.ts, cover.fli and its
// last frame, title.gif); the story, the level cards and the endings are cartoons
// (cartoons.ts).
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { Pixels, rng } from '../../../kit/pixels';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, micro, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';

export interface ScreenExtras {
  /** Your sprites. */
  hero: Map<string, Pixels>;
}

/** The living room at night: wallpaper over wood paneling, the carpet from `floor` down. */
export function roomBackdrop(pal: Pal, floor = 150, seed = 3): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  const r = rng(seed);
  for (let y = 0; y < floor - 40; y++) for (let x = 0; x < W; x++) p.set(x, y, x % 14 < 2 ? c('wall', 1) : (x % 14 === 8 && y % 16 === 5) || r() < 0.01 ? c('flora', 1) : c('wall', 2));
  p.rect(0, 0, W, 5, c('wood', 1));
  for (let y = floor - 40; y < floor; y++) for (let x = 0; x < W; x++) p.set(x, y, x % 28 === 0 ? c('wood', 0) : (x * 7 + y * 3) % 23 === 0 ? c('wood', 3) : c('wood', 2));
  p.rect(0, floor - 41, W, 2, c('wood', 1)).rect(0, floor - 4, W, 4, c('wood', 1));
  for (let y = floor; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, r() < 0.2 ? c('carpet', 2) : c('carpet', 3));
  return p;
}

/** The couch from the front: `x` its left, `y` its back's top, `w` wide. Seat cushions at y + 30. */
export function couchArt(p: Pixels, pal: Pal, x: number, y: number, w: number): void {
  const c = pal.c;
  const fabric = (xx: number, yy: number, k: number) => ((xx % 12 === 4 && yy % 10 === 3) || (xx % 12 === 10 && yy % 10 === 8) ? c('flora', 2) : c('couch', k));
  for (let yy = y; yy < y + 34; yy++) for (let xx = x + 10; xx < x + w - 10; xx++) p.set(xx, yy, fabric(xx, yy, yy < y + 4 ? 4 : yy < y + 26 ? 3 : 2));
  // seat cushions
  const n = 3;
  const cw = (w - 28) / n;
  for (let k = 0; k < n; k++) {
    const cx = Math.round(x + 14 + k * cw);
    for (let yy = y + 30; yy < y + 48; yy++) for (let xx = cx; xx < cx + cw - 2; xx++) p.set(xx, yy, fabric(xx, yy, yy < y + 33 ? 4 : yy > y + 44 ? 1 : 3));
  }
  // arms
  for (const ax of [x, x + w - 16]) for (let yy = y + 16; yy < y + 54; yy++) for (let xx = ax; xx < ax + 16; xx++) p.set(xx, yy, fabric(xx, yy, yy < y + 20 ? 4 : xx === ax || xx === ax + 15 ? 1 : 3));
  p.rect(x + 10, y + 48, w - 20, 6, c('couch', 1));
  p.rect(x + 6, y + 54, 4, 4, c('wood', 0)).rect(x + w - 10, y + 54, 4, 4, c('wood', 0));
}

/** The console TV: `x, y` its top-left (92 x 64); the screen shows snow, blue, or channel 13's cooking show. */
export function tvArt(p: Pixels, pal: Pal, x: number, y: number, show: 'snow' | 'blue' | 'cook' | 'off', k = 0): void {
  const c = pal.c;
  p.rect(x, y, 92, 64, c('wood', 2)).rect(x, y, 92, 3, c('wood', 4)).rect(x, y + 60, 92, 4, c('wood', 0));
  p.rect(x + 5, y + 6, 62, 50, c('crt', 0));
  const r = rng(k * 101 + 7);
  for (let yy = 0; yy < 42; yy++)
    for (let xx = 0; xx < 54; xx++) {
      const corner = (xx < 3 || xx > 50) && (yy < 3 || yy > 38);
      if (corner) continue;
      let col = c('screen', 1);
      if (show === 'snow') col = r() < 0.5 ? c('static', 5) : c('static', Math.floor(r() * 4));
      if (show === 'off') col = c('crt', 0);
      if (show === 'cook') col = yy > 30 ? c('wood', 2) : c('screen', 2);
      p.set(x + 9 + xx, y + 10 + yy, col);
    }
  if (show === 'cook') {
    // the chef in a tall white hat over a steaming pot: channel 13
    blob(p, x + 26, y + 38, 10, 5, pal.r('silver'), 0, 2);
    p.rect(x + 40, y + 22, 12, 18, c('white', 2)).rect(x + 42, y + 12, 8, 8, c('white', 2)).rect(x + 42, y + 20, 8, 5, c('skin', 2));
    for (let s = 0; s < 4; s++) p.set(x + 22 + s * 3, y + 30 - ((s + k) % 3) * 2, c('white', 1));
    text(p, x + 11, y + 12, '13', c('yellow', 2));
  }
  for (const ky of [16, 32]) p.disc(x + 79, y + ky, 4, c('crt', 2)).disc(x + 79, y + ky - 1, 2, c('crt', 3));
  for (let yy = 44; yy < 56; yy += 3) p.rect(x + 72, y + yy, 15, 1, c('wood', 0));
}

/** The VCR (`x, y` top-left, 70 x 12), its clock blinking 12:00 (or a > for PLAY). */
export function vcrArt(p: Pixels, pal: Pal, x: number, y: number, lit: boolean, playing = false): void {
  const c = pal.c;
  p.rect(x, y, 70, 12, c('crt', 0)).rect(x, y, 70, 2, c('crt', 2));
  p.rect(x + 6, y + 4, 24, 4, c('ink', 0));
  p.rect(x + 44, y + 3, 22, 7, c('ink', 0));
  if (playing) micro(p, x + 52, y + 4, '>', c('led', 1));
  else if (lit) micro(p, x + 46, y + 4, '12:00', c('led', 1));
}

/** The remote: a big chunky grey 1995 clicker, upright, `s` pixels a unit (12 x 30 units). */
export function remoteArt(p: Pixels, pal: Pal, x: number, y: number, s = 1, glow = false): void {
  const c = pal.c;
  const R = (u: number, v: number, w: number, h: number, col: number) => p.rect(x + u * s, y + v * s, w * s, h * s, col);
  if (glow) for (let a = 0; a < 6.28; a += 0.4) p.line(x + 6 * s, y + 15 * s, x + 6 * s + Math.cos(a) * 20 * s, y + 15 * s + Math.sin(a) * 22 * s, c('yellow', 2));
  R(0, 0, 12, 30, c('ink', 0));
  R(1, 1, 10, 28, c('crt', 2));
  R(1, 1, 10, 2, c('crt', 3));
  R(2, 3, 3, 2, c('red', 2));
  for (let k = 0; k < 9; k++) R(2 + (k % 3) * 3, 8 + Math.floor(k / 3) * 3, 2, 2, c('white', 1));
  R(4, 18, 4, 7, c('blue', 2));
  R(5, 21, 2, 1, c('white', 2));
  R(3, 26, 6, 1, c('crt', 1));
}

export function buildScreens(x: ScreenExtras): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  // ---------------- menu: the living room, the TV for the menu (PLAYGAME writes on it), the couch
  {
    const p = roomBackdrop(pal, 160, 5);
    outlined(p, 160 - textWidth("WHERE'S THE", 2) / 2, 6, "WHERE'S THE", c('yellow', 2), ink, 2, c('red', 0));
    outlined(p, 160 - textWidth('REMOTE?!', 3) / 2, 26, 'REMOTE?!', c('yellow', 2), ink, 3, c('red', 0));
    // the menu board: a big blank TV screen
    // (the VCR's light blue screen, so PLAYGAME's blue menu reads on it)
    p.rect(52, 66, 216, 120, c('wood', 1)).rect(54, 68, 212, 116, c('wood', 2));
    p.rect(60, 74, 200, 104, c('crt', 0)).rect(64, 78, 192, 96, c('glow', 5));
    for (let y = 80; y < 174; y += 4) p.rect(64, y, 192, 1, c('glow', 4));
    remoteArt(p, pal, 280, 120, 2);
    scaleBlit(p, x.hero.get('shout0')!, 10, 130, 2);
    save('menu.gif', p);
  }

  // ---------------- paper behind text pages: a TV listings page
  const paper = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('night'), 1, 4);
    p.rect(24, 6, 272, 190, c('paper', 4)).frame(24, 6, 272, 190, c('paper', 1));
    p.rect(24, 6, 272, 3, c('red', 2));
    for (let y = 30; y < 194; y += 12) p.set(27, y, c('paper', 2)).set(292, y + 3, c('paper', 2));
    centered(p, 14, heading, c('red', 0), 2);
    return p;
  };
  save('howto.gif', paper('HOW TO PLAY'));
  save('credits.gif', paper('CREDITS'));
  save('storybg.gif', paper('THE SONG'));
  // Load and save: PLAYGAME writes the names in yellow, so each slot is a dark strip.
  const slots = (heading: string) => {
    const p = paper(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('crt', 0)).rect(75, 49 + i * 14, 170, 1, ink);
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('night'), 1, 4);
    p.rect(4, 0, 308, H, c('paper', 4)).rect(4, 0, 1, H, c('paper', 1)).rect(311, 0, 1, H, c('paper', 1));
    centered(p, 11, 'FOUND IT!', c('red', 0));
    const rule = textWidth('FOUND IT!') + 16;
    p.rect(160 - rule / 2, 21, rule, 1, c('red', 1));
    save('hiscore.gif', p);
  }

  {
    // credits: the Bard himself
    const p = new Pixels(W, H);
    p.rect(0, 0, W, H, c('purple', 0));
    const r = rng(51);
    for (let i = 0; i < 50; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), c('gold', i % 3));
    const leo = resample(loadScan('docleo'), 110, 0, [0.06, 0.04, 0.94, 0.96]);
    const logo = resample(loadScan('bardlogo'), 120, 0, [0.04, 0.02, 0.96, 0.98]);
    const reserved = [c('white', 2), c('yellow', 2), ink, c('paper', 4), c('paper', 1), c('purple', 0)];
    polaroid(p, 26, 30, leo.w, leo.h, { paper: c('paper', 4), edge: c('paper', 1), shadow: c('purple', 0) });
    const a = pastePhoto(p, pal.pal, leo, 26, 30, { colors: 60, reserved });
    const b = pastePhoto(p, a.pal, logo, 178, 12, { colors: 60, reserved: [...reserved, ...a.slots] });
    text(p, 28, 30 + leo.h + 4, 'DOC LEO', c('brown', 1));
    outlined(p, 172, 130, 'The Bard of', c('yellow', 2), ink);
    outlined(p, 172, 142, 'Bizarre', c('yellow', 2), ink);
    text(p, 172, 160, 'writes songs,', c('white', 2));
    text(p, 172, 170, 'makes games,', c('white', 2));
    text(p, 172, 180, 'lost a remote.', c('white', 2));
    save('bardpic.gif', p, b.pal);
  }
  return files;
}
