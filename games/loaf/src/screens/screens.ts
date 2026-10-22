// The 320x200 pictures: the menu, the paper behind text pages, the high scores, load and save,
// and the credits (with Doc Leo). The title is the cover drawn for the game (art/cover.ts,
// cover.fli and its last frame, title.gif); the story, the level cards and the endings are
// cartoons (cartoons.ts).
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { Pixels, rng } from '../../../kit/pixels';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';

export interface ScreenExtras {
  /** The loaf's sprites. */
  loaf: Map<string, Pixels>;
}

/** The hillside by the Sea of Galilee: a sky (ramp and shades), the far hills and the sea, the grass. */
export function hillBackdrop(pal: Pal, ground = 150, seed = 3, sky: [string, number, number] = ['sky', 1, 5]): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  const horizon = ground - 40;
  gradient(p, 0, 0, W, horizon, pal.r(sky[0]), sky[1], sky[2]);
  // the far hills over the water
  for (let x = 0; x < W; x++) {
    const top = horizon - 10 - Math.round(Math.sin(x / 37) * 5 + Math.sin(x / 11) * 2);
    for (let y = top; y < horizon; y++) p.set(x, y, c('purple', y - top < 2 ? 2 : 1));
  }
  // the sea
  for (let y = horizon; y < horizon + 10; y++) for (let x = 0; x < W; x++) p.set(x, y, c('water', (x * 7 + y * 13) % 23 === 0 ? 3 : y === horizon ? 2 : 1));
  // the near hillside
  const r = rng(seed);
  for (let x = 0; x < W; x++) {
    const top = horizon + 8 + Math.round(((x - 200) / 160) ** 2 * 10);
    for (let y = top; y < H; y++) p.set(x, y, c('grass', y - top < 2 ? 4 : y > ground + 20 ? 1 : 2 + ((x + y) % 7 === 0 ? 1 : 0)));
  }
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(r() * W);
    const y = ground - 6 + Math.floor(r() * 30);
    p.line(x, y + 4, x, y, c('leaf', 1)).set(x, y - 1, c(r() < 0.5 ? 'white' : 'purple', 2));
  }
  return p;
}

/** A wicker basket (its rim at (cx, top), rx wide, h tall), full of loaves or empty. */
export function basketArt(p: Pixels, pal: Pal, cx: number, top: number, rx: number, h: number, full: boolean): void {
  const c = pal.c;
  for (let y = 0; y < h; y++) {
    const w = rx - (y / h) * rx * 0.18;
    for (let x = Math.round(cx - w); x <= cx + w; x++) {
      const row = Math.floor(y / 3);
      const over = (Math.floor((x - cx + row * 2) / 3) + row) % 2;
      p.set(x, top + y, c('wicker', y < 2 ? 4 : over ? 3 : x < cx - w * 0.5 ? 1 : 2));
    }
  }
  p.rect(Math.round(cx - rx), top, Math.round(rx * 2) + 1, 2, c('wicker', 4)).rect(Math.round(cx - rx), top + 2, Math.round(rx * 2) + 1, 1, c('wicker', 0));
  if (full) for (let k = -1; k <= 1; k++) blob(p, cx + k * rx * 0.55, top - rx * 0.12, rx * 0.42, rx * 0.26, pal.r('crust'), 1, 5);
}

export function buildScreens(x: ScreenExtras): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  // ---------------- menu: the hillside, a board for the menu, the loaf in its basket beside it
  {
    const p = hillBackdrop(pal, 160, 5, ['dusk', 1, 7]);
    outlined(p, 160 - textWidth('LOAF #13', 3) / 2, 8, 'LOAF #13', c('crust', 5), ink, 3, c('crust', 1));
    outlined(p, 160 - textWidth('(LEFT IN THE BASKET)') / 2, 36, '(LEFT IN THE BASKET)', c('crumb', 2), ink);
    p.rect(56, 92, 208, 90, c('wood', 0)).rect(58, 94, 204, 86, c('parch', 1));
    p.rect(62, 98, 196, 78, c('parch', 4)).frame(62, 98, 196, 78, c('parch', 2));
    scaleBlit(p, x.loaf.get('loaf.front')!, 270, 132, 2);
    basketArt(p, pal, 290, 160, 24, 22, false);
    save('menu.gif', p);
  }

  // ---------------- paper behind text pages
  const paper = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('dusk'), 1, 6);
    p.rect(24, 6, 272, 190, c('parch', 4)).frame(24, 6, 272, 190, c('parch', 1));
    for (let y = 8; y < 194; y += 3) p.set(25, y, c('parch', 2)).set(294, y + 1, c('parch', 2));
    // a few crumbs in the corner
    for (const [cx, cy] of [[284, 186], [288, 180], [280, 182]]) blob(p, cx, cy, 2, 1.6, pal.r('crust'), 2, 5);
    centered(p, 14, heading, c('brown', 1), 2);
    return p;
  };
  save('howto.gif', paper('HOW TO PLAY'));
  save('credits.gif', paper('CREDITS'));
  save('storybg.gif', paper('THE SONG'));
  // Load and save: PLAYGAME writes the names in yellow, so each slot is a dark strip.
  const slots = (heading: string) => {
    const p = paper(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('earth', 0)).rect(75, 49 + i * 14, 170, 1, c('ink', 0));
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('dusk'), 1, 6);
    p.rect(4, 0, 308, H, c('parch', 4)).rect(4, 0, 1, H, c('parch', 1)).rect(311, 0, 1, H, c('parch', 1));
    centered(p, 11, 'TWELVE BASKETS FULL', c('brown', 1));
    const rule = textWidth('TWELVE BASKETS FULL') + 16;
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
    const reserved = [c('white', 2), c('crust', 5), ink, c('parch', 4), c('parch', 1), c('purple', 0)];
    polaroid(p, 26, 30, leo.w, leo.h, { paper: c('parch', 4), edge: c('parch', 1), shadow: c('purple', 0) });
    const a = pastePhoto(p, pal.pal, leo, 26, 30, { colors: 60, reserved });
    const b = pastePhoto(p, a.pal, logo, 178, 12, { colors: 60, reserved: [...reserved, ...a.slots] });
    text(p, 28, 30 + leo.h + 4, 'DOC LEO', c('brown', 1));
    outlined(p, 172, 130, 'The Bard of', c('crust', 5), ink);
    outlined(p, 172, 142, 'Bizarre', c('crust', 5), ink);
    text(p, 172, 160, 'writes songs,', c('white', 2));
    text(p, 172, 170, 'makes games,', c('white', 2));
    text(p, 172, 180, 'still bread.', c('white', 2));
    save('bardpic.gif', p, b.pal);
  }
  return files;
}
