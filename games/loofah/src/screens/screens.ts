// The 320x200 pictures: the menu, the paper behind text pages, the high scores, load and save,
// and the credits (with Doc Leo). The title is the art drawn for the game (art/cover.ts,
// cover.fli and its last frame, title.gif); the story, the act cards and the endings are
// cartoons (cartoons.ts).
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { Pixels, rng } from '../../../kit/pixels';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';

export interface ScreenExtras {
  /** The man's sprites. */
  man: Map<string, Pixels>;
  /** Everybody else's. */
  mons: Map<string, Pixels>;
}

/** A candle at (x, y: the top of its wax), `h` tall, its flame flickering by `f`. */
export function candle(p: Pixels, pal: Pal, x: number, y: number, h: number, f = 0): void {
  const c = pal.c;
  p.rect(x - 3, y, 7, h, c('wax', 2)).rect(x - 3, y, 7, 1, c('wax', 1)).rect(x - 3, y, 1, Math.min(h, 5), c('white', 2));
  blob(p, x + (f % 2 ? 0.5 : -0.5), y - 5, 2, 4 + (f % 3) * 0.3, pal.r('flame'), 0, 3);
  p.set(x, y - 3, c('flame', 3));
}

/** The haunted bathroom by candlelight: dark tile, a ceiling trim, the floor, candles on a shelf at each side. */
export function bathroomBackdrop(pal: Pal, seed = 3, f = 0): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  for (let y = 0; y < 160; y++) for (let x = 0; x < W; x++) p.set(x, y, x % 16 === 0 || y % 16 === 0 ? c('ink', 0) : (Math.floor(x / 16) + Math.floor(y / 16)) % 2 ? c('tile', 1) : c('tile', 0));
  p.rect(0, 0, W, 8, c('wall', 0)).rect(0, 8, W, 1, c('gold', 0));
  for (let y = 160; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, (Math.floor((x - 160) / (12 + (y - 160) / 2) + 100) + Math.floor((y - 160) / 6)) % 2 ? c('white', 0) : c('ink', 1));
  for (const [x0, x1] of [[8, 70], [250, 312]]) {
    p.rect(x0, 150, x1 - x0, 4, c('wood', 3)).rect(x0, 154, x1 - x0, 2, c('wood', 1));
    for (let k = 0; k < 3; k++) candle(p, pal, x0 + 12 + k * 18, 150 - 16 - (k % 2) * 8, 16 + (k % 2) * 8, f + k);
  }
  const r = rng(seed);
  for (let i = 0; i < 8; i++) p.set(Math.floor(r() * W), 10 + Math.floor(r() * 140), c('tile', 2));
  return p;
}

/** The silver rack across (x0..x1, y) with its two brackets. */
export function silverRack(p: Pixels, pal: Pal, x0: number, x1: number, y: number): void {
  const c = pal.c;
  p.rect(x0, y, x1 - x0, 4, c('metal', 2)).rect(x0, y, x1 - x0, 1, c('metal', 3)).rect(x0, y + 3, x1 - x0, 1, c('metal', 0));
  p.rect(x0 + 2, y - 8, 4, 10, c('metal', 1)).rect(x1 - 6, y - 8, 4, 10, c('metal', 1));
}

export function buildScreens(x: ScreenExtras): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  // ---------------- menu: the bathroom, a board for the menu, the man and the smug sponge on its rack beside it
  {
    const p = bathroomBackdrop(pal, 5);
    outlined(p, 160 - textWidth('CLEANSE ME, O LOOFAH', 2) / 2, 12, 'CLEANSE ME, O LOOFAH', c('coral', 4), ink, 2, c('demon', 0));
    outlined(p, 160 - textWidth('BUT LEAVE MY SOUL') / 2, 32, 'BUT LEAVE MY SOUL', c('fog', 2), ink);
    p.rect(56, 92, 208, 90, c('wood', 0)).rect(58, 94, 204, 86, c('parch', 1));
    p.rect(62, 98, 196, 78, c('parch', 4)).frame(62, 98, 196, 78, c('parch', 2));
    scaleBlit(p, x.man.get('sing0')!, 8, 112, 2);
    silverRack(p, pal, 262, 314, 50);
    scaleBlit(p, x.mons.get('spongeA0a')!, 268, 54, 2);
    save('menu.gif', p);
  }

  // ---------------- paper behind text pages
  const paper = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('dark'), 0, 4);
    p.rect(24, 6, 272, 190, c('parch', 4)).frame(24, 6, 272, 190, c('parch', 1));
    for (let y = 8; y < 194; y += 3) p.set(25, y, c('parch', 2)).set(294, y + 1, c('parch', 2));
    // a few soap suds in the corner
    for (const [cx, cy] of [[284, 186], [288, 179], [279, 182]]) p.ring(cx, cy, 2, c('suds', 0));
    centered(p, 14, heading, c('brown', 1), 2);
    return p;
  };
  save('howto.gif', paper('HOW TO PLAY'));
  save('credits.gif', paper('CREDITS'));
  save('storybg.gif', paper("DON'T TOUCH IT"));
  // Load and save: PLAYGAME writes the names in yellow, so each slot is a dark strip.
  const slots = (heading: string) => {
    const p = paper(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('wall', 0)).rect(75, 49 + i * 14, 170, 1, c('ink', 0));
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('dark'), 0, 4);
    p.rect(4, 0, 308, H, c('parch', 4)).rect(4, 0, 1, H, c('parch', 1)).rect(311, 0, 1, H, c('parch', 1));
    centered(p, 11, 'THE CLEANSED', c('brown', 1));
    const rule = textWidth('THE CLEANSED') + 16;
    p.rect(160 - rule / 2, 21, rule, 1, c('brown', 2));
    save('hiscore.gif', p);
  }

  {
    // credits: the Bard himself
    const p = new Pixels(W, H);
    p.rect(0, 0, W, H, c('dark', 0));
    const r = rng(51);
    for (let i = 0; i < 50; i++) p.ring(Math.floor(r() * W), Math.floor(r() * H), 1 + (i % 3), c('dark', 2 + (i % 2)));
    const leo = resample(loadScan('docleo'), 110, 0, [0.06, 0.04, 0.94, 0.96]);
    const logo = resample(loadScan('bardlogo'), 120, 0, [0.04, 0.02, 0.96, 0.98]);
    const reserved = [c('white', 2), c('coral', 4), ink, c('parch', 4), c('parch', 1), c('dark', 0)];
    polaroid(p, 26, 30, leo.w, leo.h, { paper: c('parch', 4), edge: c('parch', 1), shadow: c('dark', 0) });
    const a = pastePhoto(p, pal.pal, leo, 26, 30, { colors: 60, reserved });
    const b = pastePhoto(p, a.pal, logo, 178, 12, { colors: 60, reserved: [...reserved, ...a.slots] });
    text(p, 28, 30 + leo.h + 4, 'DOC LEO', c('brown', 1));
    outlined(p, 172, 130, 'The Bard of', c('coral', 4), ink);
    outlined(p, 172, 142, 'Bizarre', c('coral', 4), ink);
    text(p, 172, 160, 'writes songs,', c('white', 2));
    text(p, 172, 170, 'makes games,', c('white', 2));
    text(p, 172, 180, 'owns a loofah.', c('white', 2));
    save('bardpic.gif', p, b.pal);
  }
  return files;
}
