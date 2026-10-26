// The 320x200 pictures: the menu, the paper behind text pages, the high scores, load and save,
// and the credits (with Doc Leo). The title is the cover drawn for the game (art/cover.ts,
// cover.fli, then title.gif with the name); the story, the level cards and the endings are
// cartoons (cartoons.ts).
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { Pixels, rng } from '../../../kit/pixels';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';

interface ScreenExtras {
  /** Carl's sprites. */
  carl: Map<string, Pixels>;
}

/** The living room: mint daisy wallpaper down to the chair rail at `rail`, the wainscot, the shag from `floor`. */
export function roomBackdrop(pal: Pal, rail = 120, floor = 180, dim = 0): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (y < rail) {
        const u = ((x + (Math.floor(y / 24) % 2) * 12) % 24) - 12;
        const v = (y % 24) - 12;
        const d = Math.hypot(u, v);
        let col = x % 24 < 1 ? c('paper', 3 - dim) : c('paper', 2 - dim);
        if (d < 1.5) col = c('daisy', 0);
        else if (d < 4.5 && Math.round(Math.atan2(v, u) * 2.5) % 2 === 0) col = c('daisy', 2 - dim);
        p.set(x, y, col);
      } else if (y < floor) p.set(x, y, x % 12 === 0 ? c('panel', 1) : c('panel', (x % 12 === 1 ? 3 : 2) - dim));
      else p.set(x, y, (x * 7 + y * 13) % 5 === 0 ? c('shag', 3) : c('shag', 2 - dim));
    }
  p.rect(0, rail, W, 3, c('panel', 4)).rect(0, rail + 3, W, 1, c('panel', 0));
  return p;
}

/** A floor lamp at x, its shade's top at y (lit or not). */
export function lampArt(p: Pixels, pal: Pal, x: number, y: number, floor: number, lit = true): void {
  const c = pal.c;
  p.rect(x - 1, y + 22, 3, floor - y - 22, c('steel', 1)).rect(x - 1, y + 22, 1, floor - y - 22, c('steel', 2));
  blob(p, x, floor + 2, 12, 3, pal.r('steel'), 0, 2);
  for (let k = 0; k < 24; k++) {
    const w = 12 + k * 0.6;
    p.rect(Math.round(x - w), y + k, Math.round(w * 2), 1, c(lit ? 'lamp' : 'daisy', lit ? (k > 18 ? 2 : 1) : 2));
  }
}

export function buildScreens(x: ScreenExtras): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  // ---------------- menu: the living room, a board for the menu, Carl on the lamp beside it
  {
    const p = roomBackdrop(pal, 150, 186);
    outlined(p, 160 - textWidth('A FLY NAMED') / 2, 6, 'A FLY NAMED', c('white', 3), ink);
    outlined(p, 160 - textWidth('CARL', 4) / 2, 18, 'CARL', c('eye', 2), ink, 4, c('eye', 0));
    p.rect(56, 92, 208, 90, c('wood', 0)).rect(58, 94, 204, 86, c('parch', 1));
    p.rect(62, 98, 196, 78, c('parch', 4)).frame(62, 98, 196, 78, c('parch', 2));
    lampArt(p, pal, 290, 110, 186);
    scaleBlit(p, x.carl.get('grin')!, 270, 72, 2);
    save('menu.gif', p);
  }

  // ---------------- paper behind text pages (a sheet on the fridge, held by a magnet)
  const paper = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('paper'), 1, 3);
    p.rect(24, 6, 272, 190, c('parch', 4)).frame(24, 6, 272, 190, c('parch', 1));
    for (let y = 8; y < 194; y += 3) p.set(25, y, c('parch', 2)).set(294, y + 1, c('parch', 2));
    p.disc(160, 7, 5, c('red', 2)).disc(159, 6, 2, c('red', 3));
    // a little fly doodle in the corner
    blob(p, 282, 184, 4, 3, pal.r('fly'), 0, 2);
    p.set(281, 183, c('eye', 2)).set(284, 183, c('eye', 2)).line(278, 180, 274, 178, c('wing', 1)).line(286, 180, 290, 178, c('wing', 1));
    centered(p, 14, heading, c('brown', 1), 2);
    return p;
  };
  save('howto.gif', paper('HOW TO PLAY'));
  save('credits.gif', paper('CREDITS'));
  save('storybg.gif', paper('THE SONG'));
  // Load and save: PLAYGAME writes the names in yellow, so each slot is a dark strip.
  const slots = (heading: string) => {
    const p = paper(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('panel', 0)).rect(75, 49 + i * 14, 170, 1, c('ink', 0));
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('paper'), 1, 3);
    p.rect(4, 0, 308, H, c('parch', 4)).rect(4, 0, 1, H, c('parch', 1)).rect(311, 0, 1, H, c('parch', 1));
    centered(p, 11, "IT'S WINNING", c('brown', 1));
    const rule = textWidth("IT'S WINNING") + 16;
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
    const reserved = [c('white', 3), c('eye', 2), ink, c('parch', 4), c('parch', 1), c('purple', 0)];
    polaroid(p, 26, 30, leo.w, leo.h, { paper: c('parch', 4), edge: c('parch', 1), shadow: c('purple', 0) });
    const a = pastePhoto(p, pal.pal, leo, 26, 30, { colors: 60, reserved });
    const b = pastePhoto(p, a.pal, logo, 178, 12, { colors: 60, reserved: [...reserved, ...a.slots] });
    text(p, 28, 30 + leo.h + 4, 'DOC LEO', c('brown', 1));
    outlined(p, 172, 130, 'The Bard of', c('eye', 2), ink);
    outlined(p, 172, 142, 'Bizarre', c('eye', 2), ink);
    text(p, 172, 160, 'writes songs,', c('white', 3));
    text(p, 172, 170, 'makes games,', c('white', 3));
    text(p, 172, 180, 'hates Carl.', c('white', 3));
    save('bardpic.gif', p, b.pal);
  }
  return files;
}
