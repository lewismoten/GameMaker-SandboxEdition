// The 320x200 pictures: the title (the song's cover art), the menu, the parchment behind
// text pages, the high scores and the credits (with Doc Leo). Photos and art are dithered
// into each picture's free palette entries (kit/photo.ts). The cartoons (the story, the
// level cards, the endings) are in cartoons.ts.
import { Pixels } from '../../../kit/pixels';
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette } from '../art/pal';
import { bigStar as star, skyline as town, stars as nightStars } from './night';
import { AUTHOR } from './text';

export interface ScreenExtras {
  /** The goat's sprites. */
  goat: Map<string, Pixels>;
}

export function buildScreens(x: ScreenExtras): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  const stars = (p: Pixels, seed: number, h: number, n = 120) => nightStars(p, pal, seed, h, n);
  const bigStar = (p: Pixels, cx: number, cy: number, s: number) => star(p, pal, cx, cy, s);
  const skyline = (p: Pixels, ground: number) => town(p, pal, ground);

  // ---------------- title: the song's cover, with the name over its sky
  {
    const p = new Pixels(W, H, c('dusk', 6));
    const cover = resample(loadScan('goatcover'), W, H, [0, 0.07, 1, 0.07 + 0.75]);
    const reserved = [c('gold', 3), c('gold', 1), ink, c('cloth', 3), c('night', 0)];
    const { pal: own } = pastePhoto(p, pal.pal, cover, 0, 0, { colors: 120, reserved, share: false });
    outlined(p, 160 - textWidth('THIRD GOAT', 3) / 2, 6, 'THIRD GOAT', c('gold', 3), ink, 3, c('gold', 1));
    outlined(p, 160 - textWidth('FROM THE LEFT', 2) / 2, 34, 'FROM THE LEFT', c('gold', 3), ink, 2, c('gold', 1));
    p.rect(0, 186, W, 14, c('night', 0));
    centered(p, 189, `${AUTHOR} (c) 1995 - Shareware`, c('cloth', 3));
    save('title.gif', p, own);
  }

  // ---------------- menu: a night sky, the star over the stable, a parchment for the menu
  const side = x.goat.get('side0')!;
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, 150, pal.r('night'), 0, 6);
    stars(p, 3, 140);
    bigStar(p, 250, 26, 5);
    skyline(p, 150);
    outlined(p, 160 - textWidth('THIRD GOAT', 2) / 2, 10, 'THIRD GOAT', c('gold', 3), ink, 2);
    outlined(p, 160 - textWidth('FROM THE LEFT') / 2, 30, 'FROM THE LEFT', c('gold', 3), ink);
    p.rect(56, 92, 208, 90, c('wood', 0)).rect(58, 94, 204, 86, c('parch', 1));
    p.rect(62, 98, 196, 78, c('parch', 4)).frame(62, 98, 196, 78, c('parch', 2));
    scaleBlit(p, side, 272, 150, 2, true);
    save('menu.gif', p);
  }

  // ---------------- parchment behind text pages
  const parchment = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('night'), 0, 5);
    stars(p, heading.length, H, 60);
    p.rect(24, 6, 272, 190, c('parch', 4)).frame(24, 6, 272, 190, c('parch', 1));
    for (let y = 8; y < 194; y += 3) p.set(25, y, c('parch', 2)).set(294, y + 1, c('parch', 2));
    centered(p, 14, heading, c('brown', 1), 2);
    return p;
  };
  save('howto.gif', parchment('HOW TO PLAY'));
  save('credits.gif', parchment('CREDITS'));
  save('storybg.gif', parchment('THAT NIGHT'));
  // Load and save: PLAYGAME writes the names in yellow, so each slot is a dark strip.
  const slots = (heading: string) => {
    const p = parchment(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('night', 1)).rect(75, 49 + i * 14, 170, 1, c('night', 0));
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('night'), 0, 5);
    p.rect(4, 0, 308, H, c('parch', 4)).rect(4, 0, 1, H, c('parch', 1)).rect(311, 0, 1, H, c('parch', 1));
    centered(p, 11, 'THE FRONT-STALL PEW', c('brown', 1));
    const rule = textWidth('THE FRONT-STALL PEW') + 16;
    p.rect(160 - rule / 2, 21, rule, 1, c('brown', 2));
    save('hiscore.gif', p);
  }

  {
    // credits: the Bard himself
    const p = new Pixels(W, H);
    p.rect(0, 0, W, H, c('purple', 0));
    stars(p, 51, H, 50);
    const leo = resample(loadScan('docleo'), 110, 0, [0.06, 0.04, 0.94, 0.96]);
    const logo = resample(loadScan('bardlogo'), 120, 0, [0.04, 0.02, 0.96, 0.98]);
    const reserved = [c('cloth', 3), c('gold', 3), ink, c('parch', 4), c('parch', 1), c('purple', 0)];
    polaroid(p, 26, 30, leo.w, leo.h, { paper: c('parch', 4), edge: c('parch', 1), shadow: c('purple', 0) });
    const a = pastePhoto(p, pal.pal, leo, 26, 30, { colors: 60, reserved });
    const b = pastePhoto(p, a.pal, logo, 178, 12, { colors: 60, reserved: [...reserved, ...a.slots] });
    text(p, 28, 30 + leo.h + 4, 'DOC LEO', c('brown', 1));
    outlined(p, 172, 130, 'The Bard of', c('gold', 3), ink);
    outlined(p, 172, 142, 'Bizarre', c('gold', 3), ink);
    text(p, 172, 160, 'writes songs,', c('cloth', 3));
    text(p, 172, 170, 'makes games,', c('cloth', 3));
    text(p, 172, 180, 'loves goats.', c('cloth', 3));
    save('bardpic.gif', p, b.pal);
  }
  return files;
}
