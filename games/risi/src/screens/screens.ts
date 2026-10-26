// The 320x200 pictures: the menu, the paper behind text pages, the high scores, load and save,
// and the credits (Doc Leo's photo and the Bard's logo: Veni, Vidi, Risi! sits with the Bard of
// Bizarre on The Sofa BBS). The title is the art drawn for the game (art/cover.ts, cover.fli and
// then title.gif with the name); the story, the level cards and the endings are cartoons
// (cartoons.ts).
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { Pixels, rng } from '../../../kit/pixels';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';

interface ScreenExtras {
  /** Marcus's sprites. */
  man: Map<string, Pixels>;
  /** Everybody else's. */
  mons: Map<string, Pixels>;
}

/** A fluted marble column from y0 to y1 centered on x, `r` wide each side. */
export function column(p: Pixels, pal: Pal, x: number, y0: number, y1: number, r = 12): void {
  const c = pal.c;
  for (let y = y0; y < y1; y++)
    for (let xx = x - r; xx <= x + r; xx++) {
      const u = (xx - x) / r;
      const flute = (xx - x + 40) % 5 === 0;
      p.set(xx, y, flute ? c('marble', 1) : c('marble', u < -0.3 ? 3 : u < 0.4 ? 2 : 1));
    }
  p.rect(x - r - 4, y0 - 6, r * 2 + 9, 6, c('marble', 3)).rect(x - r - 4, y0 - 1, r * 2 + 9, 1, c('vein', 0));
  p.rect(x - r - 3, y1, r * 2 + 7, 5, c('marble', 2)).rect(x - r - 3, y1, r * 2 + 7, 1, c('marble', 3));
}

/** A portico: a warm sky, the hills, marble columns, an entablature, a checkered floor. */
export function portico(pal: Pal, seed = 3): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 150, pal.r('dusk'), 0, 5);
  const r = rng(seed);
  for (let x = 0; x < W; x++) {
    const h = 128 + Math.round(Math.sin(x / 31 + seed) * 6 + Math.sin(x / 13) * 3);
    p.rect(x, h, 1, 150 - h, c('grape', 0));
  }
  for (let y = 150; y < H; y++)
    for (let x = 0; x < W; x++)
      p.set(x, y, (Math.floor((x - 160) / (14 + (y - 150) / 2) + 100) + Math.floor((y - 150) / 7)) % 2 ? c('marble', 3) : c('ink', 1));
  for (const x of [26, 294]) column(p, pal, x, 30, 150);
  p.rect(0, 0, W, 24, c('marble', 2)).rect(0, 24, W, 2, c('marble', 3)).rect(0, 26, W, 1, c('vein', 0));
  for (let x = 4; x < W; x += 14) p.rect(x, 27, 6, 3, c('marble', 1));
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * W), 34 + Math.floor(r() * 60), c('marble', 3));
  return p;
}

export function buildScreens(x: ScreenExtras): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  // ---------------- menu: the portico, the title on the entablature, a tablet for the menu, Marcus and a stone face
  {
    const p = portico(pal, 5);
    outlined(p, 160 - textWidth('VENI, VIDI, RISI!', 2) / 2, 4, 'VENI, VIDI, RISI!', c('pompeii', 2), ink, 2, c('gold', 0));
    centered(p, 34, 'I CAME, I SAW, I LAUGHED', c('marble', 3));
    p.rect(56, 92, 208, 90, c('wood', 0)).rect(58, 94, 204, 86, c('parch', 1));
    p.rect(62, 98, 196, 78, c('parch', 4)).frame(62, 98, 196, 78, c('parch', 2));
    scaleBlit(p, x.man.get('sing1')!, 6, 110, 2);
    scaleBlit(p, x.mons.get('stony0')!, 274, 112, 2);
    save('menu.gif', p);
  }

  // ---------------- paper behind text pages: a wax-tablet frame of wood
  const paper = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('dark'), 0, 4);
    p.rect(20, 3, 280, 195, c('wood', 1)).rect(24, 6, 272, 190, c('parch', 4)).frame(24, 6, 272, 190, c('parch', 1));
    for (let y = 8; y < 194; y += 3) p.set(25, y, c('parch', 2)).set(294, y + 1, c('parch', 2));
    // a laurel sprig in the corner
    for (let k = 0; k < 5; k++) blob(p, 280 - k * 4, 186 - k * 2, 2.4, 1.2, pal.r('laurel'), 1, 3);
    centered(p, 14, heading, c('brown', 1), 2);
    return p;
  };
  save('howto.gif', paper('QUOMODO LUDITUR'));
  save('credits.gif', paper('GRATIAE'));
  save('storybg.gif', paper('FABULA'));
  // Load and save: PLAYGAME writes the names in yellow, so each slot is a dark strip.
  const slots = (heading: string) => {
    const p = paper(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('pompeii', 0)).rect(75, 49 + i * 14, 170, 1, c('ink', 0));
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('dark'), 0, 4);
    p.rect(4, 0, 308, H, c('parch', 4)).rect(4, 0, 1, H, c('parch', 1)).rect(311, 0, 1, H, c('parch', 1));
    centered(p, 11, 'LAUREATI', c('brown', 1));
    const rule = textWidth('LAUREATI') + 16;
    p.rect(160 - rule / 2, 21, rule, 1, c('brown', 2));
    save('hiscore.gif', p);
  }

  {
    // credits: Doc Leo, and the Bard's logo: Veni, Vidi, Risi! sits with him on The Sofa
    const p = new Pixels(W, H);
    p.rect(0, 0, W, H, c('dark', 0));
    const r = rng(51);
    for (let i = 0; i < 40; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), c('dark', 2 + (i % 2)));
    const leo = resample(loadScan('docleo'), 110, 0, [0.06, 0.04, 0.94, 0.96]);
    const logo = resample(loadScan('bardlogo'), 120, 0, [0.04, 0.02, 0.96, 0.98]);
    const reserved = [c('marble', 3), c('pompeii', 2), ink, c('parch', 4), c('parch', 1), c('dark', 0), c('gold', 2)];
    polaroid(p, 26, 30, leo.w, leo.h, { paper: c('parch', 4), edge: c('parch', 1), shadow: c('dark', 0) });
    const a = pastePhoto(p, pal.pal, leo, 26, 30, { colors: 60, reserved });
    const b = pastePhoto(p, a.pal, logo, 178, 12, { colors: 60, reserved: [...reserved, ...a.slots] });
    text(p, 28, 30 + leo.h + 4, 'DOC LEO', c('brown', 1));
    outlined(p, 166, 130, 'Veni, Vidi,', c('pompeii', 2), ink);
    outlined(p, 166, 142, 'Risi!', c('pompeii', 2), ink);
    text(p, 166, 160, "Lewis's group,", c('marble', 3));
    text(p, 166, 170, 'with the Bard', c('marble', 3));
    text(p, 166, 180, 'of Bizarre.', c('marble', 3));
    save('bardpic.gif', p, b.pal);
  }
  return files;
}
