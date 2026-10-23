// The 320x200 pictures: the menu (the stage, with the menu on a chalkboard easel), the paper
// behind text pages (a page of the sign-up sheet), the high scores, load and save, and the
// credits (with Doc Leo and the Bard's logo). The title, story, cards and endings are cartoons
// (cartoons.ts). PLAYGAME writes its text over the paper and the board (kit/textfit.ts checks it).
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { Pixels, rng } from '../../../kit/pixels';
import { gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, scaleBlit, H, W } from '../../../snowbound/src/screens/scenery';
import { stage, type Cast } from './cartoons';
import { buildScreenPalette } from './palette';

export function buildPictures(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  // ---------------- menu: the stage, the title, a parchment board for the menu, Will and Doc Leo
  {
    const p = stage(pal, 2, false);
    outlined(p, 160 - textWidth('SHAKESPEARE', 2) / 2, 26, 'SHAKESPEARE', c('gold', 3), ink, 2, c('velvet', 0));
    outlined(p, 160 - textWidth('IN SWEATPANTS') / 2, 46, 'IN SWEATPANTS', c('sweats', 3), ink);
    p.rect(56, 92, 208, 90, c('wood', 0)).rect(58, 94, 204, 86, c('parch', 1));
    p.rect(62, 98, 196, 78, c('parch', 4)).frame(62, 98, 196, 78, c('parch', 2));
    scaleBlit(p, cast.poet.get('yorick')!, 4, 112, 2);
    scaleBlit(p, cast.mons.get('leo0')!, 274, 112, 2);
    save('menu.gif', p);
  }

  // ---------------- paper behind text pages: a page of the open mic's sign-up sheet
  const paper = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('dark'), 0, 4);
    p.rect(24, 6, 272, 190, c('parch', 4)).frame(24, 6, 272, 190, c('parch', 1));
    for (let y = 8; y < 194; y += 3) p.set(25, y, c('parch', 2)).set(294, y + 1, c('parch', 2));
    // a coffee ring in the corner
    for (let a = 0; a < Math.PI * 2; a += 0.05) p.set(276 + Math.cos(a) * 9, 180 + Math.sin(a) * 6, c('coffee', 2));
    centered(p, 14, heading, c('brown', 1), 2);
    return p;
  };
  save('howto.gif', paper('HOW TO PLAY'));
  save('credits.gif', paper('CREDITS'));
  save('storybg.gif', paper('OPEN MIC NIGHT'));
  // Load and save: PLAYGAME writes the names in yellow, so each slot is a dark strip.
  const slots = (heading: string) => {
    const p = paper(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('coffee', 0)).rect(75, 49 + i * 14, 170, 1, c('ink', 0));
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('dark'), 0, 4);
    p.rect(4, 0, 308, H, c('parch', 4)).rect(4, 0, 1, H, c('parch', 1)).rect(311, 0, 1, H, c('parch', 1));
    centered(p, 11, 'THE SIGN-UP SHEET', c('brown', 1));
    const rule = textWidth('THE SIGN-UP SHEET') + 16;
    p.rect(160 - rule / 2, 21, rule, 1, c('brown', 2));
    save('hiscore.gif', p);
  }

  {
    // credits: the Bard himself
    const p = new Pixels(W, H);
    p.rect(0, 0, W, H, c('dark', 0));
    const r = rng(51);
    for (let i = 0; i < 50; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), c('gold', i % 3));
    const leo = resample(loadScan('docleo'), 110, 0, [0.06, 0.04, 0.94, 0.96]);
    const logo = resample(loadScan('bardlogo'), 120, 0, [0.04, 0.02, 0.96, 0.98]);
    const reserved = [c('white', 2), c('gold', 3), ink, c('parch', 4), c('parch', 1), c('dark', 0)];
    polaroid(p, 26, 30, leo.w, leo.h, { paper: c('parch', 4), edge: c('parch', 1), shadow: c('dark', 0) });
    const a = pastePhoto(p, pal.pal, leo, 26, 30, { colors: 60, reserved });
    const b = pastePhoto(p, a.pal, logo, 178, 12, { colors: 60, reserved: [...reserved, ...a.slots] });
    text(p, 28, 30 + leo.h + 4, 'DOC LEO', c('brown', 1));
    outlined(p, 172, 130, 'The Bard of', c('gold', 3), ink);
    outlined(p, 172, 142, 'Bizarre', c('gold', 3), ink);
    text(p, 172, 160, 'hosts the open', c('white', 2));
    text(p, 172, 170, 'mic, writes the', c('white', 2));
    text(p, 172, 180, 'monologues.', c('white', 2));
    save('bardpic.gif', p, b.pal);
  }
  return files;
}
