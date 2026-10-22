// The 320x200 pictures: the menu, the paper behind text pages, the high scores, load and save,
// and the credits (with Doc Leo). The title is the cover drawn for the game (art/cover.ts,
// cover.fli and its last frame, title.gif); the story, the certificate, the level cards and the
// endings are cartoons (cartoons.ts).
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { Pixels, rng } from '../../../kit/pixels';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';

export interface ScreenExtras {
  /** Doc Leo's whole poses (20 x 40). */
  leo: (pose: string) => Pixels;
  /** Everybody else's sprites. */
  mons: Map<string, Pixels>;
}

/** The mad lab at night: tiled walls in the dark, a storm in the arched window, a bench along the back. */
export function labBackdrop(pal: Pal, floor = 160, seed = 3, flash = false): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, floor, pal.r('night'), 1, 3);
  // tiles
  for (let y = 0; y < floor; y++) for (let x = 0; x < W; x++) if (x % 16 === 0 || y % 16 === 0) p.set(x, y, c('night', 0));
  // the arched window and the storm
  const wx = 214;
  for (let y = 18; y < 110; y++)
    for (let x = wx; x < wx + 72; x++) {
      const inArch = y > 54 || (x - (wx + 36)) ** 2 / 36 ** 2 + (y - 54) ** 2 / 36 ** 2 < 1;
      if (inArch) p.set(x, y, flash ? c('paper', 2) : c('night', y < 60 ? 2 : 1));
    }
  if (!flash) {
    const r = rng(seed);
    for (let i = 0; i < 14; i++) p.set(wx + 4 + Math.floor(r() * 64), 30 + Math.floor(r() * 70), c('paper', 1));
  } else {
    let x = wx + 40;
    for (let y = 22; y < 106; y += 6) {
      const nx = x + ((y * 7) % 13) - 6;
      p.line(x, y, nx, y + 6, c('spark', 3));
      x = nx;
    }
  }
  p.rect(wx + 34, 18, 4, 92, c('stone', 1)).rect(wx, 82, 72, 3, c('stone', 1)).rect(wx - 4, 108, 80, 4, c('stone', 2));
  // the floor
  for (let y = floor; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, (Math.floor(x / 20) + Math.floor((y - floor) / 10)) % 2 ? c('tile', 1) : c('grey', 0));
  // shelves of flasks along the back
  p.rect(10, 70, 120, 3, c('wood', 1));
  for (let k = 0; k < 7; k++) {
    const x = 18 + k * 16;
    blob(p, x, 62, 5, 6, pal.r(k % 2 ? 'potion' : 'spark'), 0, 3);
    p.rect(x - 1, 50, 3, 6, c('glass', 1));
  }
  return p;
}

export function buildScreens(x: ScreenExtras): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  // ---------------- menu: the lab, a board for the menu, Doc Leo beside it with a rat
  {
    const p = labBackdrop(pal, 168, 5);
    outlined(p, 160 - textWidth('CERTIFIED', 2) / 2, 8, 'CERTIFIED', c('gold', 3), ink, 2, c('gold', 0));
    outlined(p, 160 - textWidth('RAT TICKLER', 3) / 2, 30, 'RAT TICKLER', c('paint', 1), ink, 3, c('purple', 0));
    p.rect(56, 92, 208, 90, c('wood', 0)).rect(58, 94, 204, 86, c('parch', 1));
    p.rect(62, 98, 196, 78, c('parch', 4)).frame(62, 98, 196, 78, c('parch', 2));
    scaleBlit(p, x.leo('grin'), 268, 96, 2);
    scaleBlit(p, x.mons.get('lab.giggle0')!, 12, 136, 2);
    save('menu.gif', p);
  }

  // ---------------- paper behind text pages: lab notebook paper on the bench
  const paper = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('night'), 1, 4);
    p.rect(24, 6, 272, 190, c('parch', 4)).frame(24, 6, 272, 190, c('parch', 1));
    for (let y = 8; y < 194; y += 3) p.set(25, y, c('parch', 2)).set(294, y + 1, c('parch', 2));
    // a margin rule, and a tiny rat in the corner
    p.rect(30, 8, 1, 186, c('red', 3));
    scaleBlit(p, x.mons.get('lab.rat0')!, 272, 176, 1);
    centered(p, 14, heading, c('brown', 1), 2);
    return p;
  };
  save('howto.gif', paper('HOW TO PLAY'));
  save('credits.gif', paper('CREDITS'));
  save('storybg.gif', paper('THE SONG'));
  // Load and save: PLAYGAME writes the names in yellow, so each slot is a dark strip.
  const slots = (heading: string) => {
    const p = paper(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('night', 0)).rect(75, 49 + i * 14, 170, 1, ink);
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('night'), 1, 4);
    p.rect(4, 0, 308, H, c('parch', 4)).rect(4, 0, 1, H, c('parch', 1)).rect(311, 0, 1, H, c('parch', 1));
    centered(p, 11, 'THE LAUGHING CARPET', c('brown', 1));
    const rule = textWidth('THE LAUGHING CARPET') + 16;
    p.rect(160 - rule / 2, 21, rule, 1, c('brown', 2));
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
    const reserved = [c('paint', 1), c('gold', 3), ink, c('parch', 4), c('parch', 1), c('purple', 0)];
    polaroid(p, 26, 30, leo.w, leo.h, { paper: c('parch', 4), edge: c('parch', 1), shadow: c('purple', 0) });
    const a = pastePhoto(p, pal.pal, leo, 26, 30, { colors: 60, reserved });
    const b = pastePhoto(p, a.pal, logo, 178, 12, { colors: 60, reserved: [...reserved, ...a.slots] });
    text(p, 28, 30 + leo.h + 4, 'DOC LEO, PHD', c('brown', 1));
    outlined(p, 172, 130, 'The Bard of', c('gold', 3), ink);
    outlined(p, 172, 142, 'Bizarre', c('gold', 3), ink);
    text(p, 172, 160, 'writes songs,', c('paint', 1));
    text(p, 172, 170, 'makes games,', c('paint', 1));
    text(p, 172, 180, 'tickles rats.', c('paint', 1));
    save('bardpic.gif', p, b.pal);
  }
  return files;
}
