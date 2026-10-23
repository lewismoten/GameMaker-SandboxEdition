// The 320x200 pictures: the menu, the paper behind text pages, the high scores, load and save,
// and the credits (with Doc Leo). The title is the song's animated cover (cartoons.ts,
// cover.fli) and its last frame (title.gif); the story, the level cards and the endings are
// cartoons too.
import { Pixels, rng } from '../../../kit/pixels';
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';

export interface ScreenExtras {
  /** The seed's sprites. */
  seed: Map<string, Pixels>;
}

/** A garden at dawn: the cover's rose sky, a soft hill, flowers and a mound of dirt. */
export function gardenBackdrop(pal: Pal, ground = 150, seed = 3): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, ground, pal.r('rose'), 2, 6);
  const r = rng(seed);
  for (let x = 0; x < W; x++) {
    const h = ground - 14 - Math.round(Math.sin(x / 41) * 6 + Math.sin(x / 13) * 2);
    for (let y = h; y < ground; y++) p.set(x, y, c('grass', y - h < 2 ? 3 : 2));
  }
  p.rect(0, ground, W, H - ground, c('soil', 1));
  for (let i = 0; i < 260; i++) p.set(Math.floor(r() * W), ground + Math.floor(r() * (H - ground)), c('soil', r() < 0.5 ? 0 : 2));
  for (let i = 0; i < 18; i++) {
    const x = Math.floor(r() * W);
    const y = ground - 4 - Math.floor(r() * 8);
    p.line(x, y + 6, x, y, c('leaf', 1))
      .set(x, y - 1, c(r() < 0.5 ? 'pink' : 'sun', 2))
      .set(x - 1, y, c('pink', 3))
      .set(x + 1, y, c('pink', 3));
  }
  return p;
}

/** A mound of dirt, the cover's, centered on (cx, base). */
export function mound(p: Pixels, pal: Pal, cx: number, base: number, rx = 34, ry = 22): void {
  const c = pal.c;
  for (let y = base - ry; y <= base; y++)
    for (let x = cx - rx; x <= cx + rx; x++) {
      const u = (x - cx) / rx;
      const top = base - ry * (1 - u * u);
      if (y >= top) p.set(x, y, c('soil', (x * 7 + y * 13) % 9 === 0 ? 3 : (x + y) % 5 === 0 ? 0 : 1 + (y - top < 2 ? 1 : 0)));
    }
}

export function buildScreens(x: ScreenExtras): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  // ---------------- menu: the garden, the mound, a board for the menu, the seed beside it
  {
    const p = gardenBackdrop(pal, 160);
    outlined(p, 160 - textWidth('MUSTARD SEED', 2) / 2, 8, 'MUSTARD SEED', c('seed', 4), ink, 2, c('seed', 1));
    outlined(p, 160 - textWidth('HUSTLE', 2) / 2, 28, 'HUSTLE', c('seed', 4), ink, 2, c('seed', 1));
    p.rect(56, 92, 208, 90, c('wood', 0)).rect(58, 94, 204, 86, c('parch', 1));
    p.rect(62, 98, 196, 78, c('parch', 4)).frame(62, 98, 196, 78, c('parch', 2));
    mound(p, pal, 290, 170, 26, 16);
    scaleBlit(p, x.seed.get('seed.front')!, 270, 118, 2);
    save('menu.gif', p);
  }

  // ---------------- paper behind text pages
  const paper = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('rose'), 1, 5);
    p.rect(24, 6, 272, 190, c('parch', 4)).frame(24, 6, 272, 190, c('parch', 1));
    for (let y = 8; y < 194; y += 3) p.set(25, y, c('parch', 2)).set(294, y + 1, c('parch', 2));
    // a sprig in the corner
    p.line(282, 190, 288, 176, c('leaf', 1));
    for (const [lx, ly] of [
      [284, 184],
      [289, 179],
    ])
      p.disc(lx, ly, 2, c('leaf', 3));
    p.disc(288, 174, 2, c('seed', 3));
    centered(p, 14, heading, c('brown', 1), 2);
    return p;
  };
  save('howto.gif', paper('HOW TO PLAY'));
  save('credits.gif', paper('CREDITS'));
  save('storybg.gif', paper('THE SONG'));
  // Load and save: PLAYGAME writes the names in yellow, so each slot is a dark strip.
  const slots = (heading: string) => {
    const p = paper(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('soil', 0)).rect(75, 49 + i * 14, 170, 1, c('ink', 0));
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('rose'), 1, 5);
    p.rect(4, 0, 308, H, c('parch', 4)).rect(4, 0, 1, H, c('parch', 1)).rect(311, 0, 1, H, c('parch', 1));
    centered(p, 11, 'THE TALLEST IN THE GARDEN', c('brown', 1));
    const rule = textWidth('THE TALLEST IN THE GARDEN') + 16;
    p.rect(160 - rule / 2, 21, rule, 1, c('brown', 2));
    save('hiscore.gif', p);
  }

  {
    // credits: the Bard himself
    const p = new Pixels(W, H);
    p.rect(0, 0, W, H, c('purple', 0));
    const r = rng(51);
    for (let i = 0; i < 50; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), c('faith', i % 3));
    const leo = resample(loadScan('docleo'), 110, 0, [0.06, 0.04, 0.94, 0.96]);
    const logo = resample(loadScan('bardlogo'), 120, 0, [0.04, 0.02, 0.96, 0.98]);
    const reserved = [c('white', 2), c('seed', 4), ink, c('parch', 4), c('parch', 1), c('purple', 0)];
    polaroid(p, 26, 30, leo.w, leo.h, { paper: c('parch', 4), edge: c('parch', 1), shadow: c('purple', 0) });
    const a = pastePhoto(p, pal.pal, leo, 26, 30, { colors: 60, reserved });
    const b = pastePhoto(p, a.pal, logo, 178, 12, { colors: 60, reserved: [...reserved, ...a.slots] });
    text(p, 28, 30 + leo.h + 4, 'DOC LEO', c('brown', 1));
    outlined(p, 172, 130, 'The Bard of', c('seed', 4), ink);
    outlined(p, 172, 142, 'Bizarre', c('seed', 4), ink);
    text(p, 172, 160, 'writes songs,', c('white', 2));
    text(p, 172, 170, 'makes games,', c('white', 2));
    text(p, 172, 180, "keeps hustlin'.", c('white', 2));
    save('bardpic.gif', p, b.pal);
  }
  return files;
}
