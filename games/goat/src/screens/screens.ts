// The 320x200 pictures: the title (the song's cover art), the menu, the story's night over Bethlehem, the level cards, the parchment behind text pages,
// the high scores, the endings and the credits (with Doc Leo). Photos and art are dithered
// into each picture's free palette entries (kit/photo.ts).
import { Pixels, rng } from '../../../kit/pixels';
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { blob, gradient, shadeAt } from '../../../snowbound/src/art/draw';
import { centered, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';
import { AUTHOR, CARDS } from './text';

export interface ScreenExtras {
  /** Level views for the cards (16 x 6 blocks) in their own palettes. */
  cards: { map: Pixels; pal: Pal }[];
  /** The goat's sprites. */
  goat: Map<string, Pixels>;
  /** The line at the manger, with the goat in her place (8 x 3 blocks), in the stable's palette. */
  line: { map: Pixels; pal: Pal };
}

export function buildScreens(x: ScreenExtras): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  const stars = (p: Pixels, seed: number, h: number, n = 120) => {
    const r = rng(seed);
    for (let k = 0; k < n; k++) p.set(Math.floor(r() * W), Math.floor(r() * h), c('star', r() < 0.2 ? 2 : r() < 0.6 ? 1 : 0));
  };
  /** The star of Bethlehem: a bright cross of light. */
  const bigStar = (p: Pixels, cx: number, cy: number, s: number) => {
    for (let k = -s * 3; k <= s * 3; k++) {
      const v = 1 - Math.abs(k) / (s * 3);
      p.set(cx + k, cy, c('star', v > 0.6 ? 2 : v > 0.3 ? 1 : 0)).set(cx, cy + k, c('star', v > 0.6 ? 2 : v > 0.3 ? 1 : 0));
    }
    for (let k = -s; k <= s; k++) p.set(cx + k, cy + k, c('star', 1)).set(cx + k, cy - k, c('star', 1));
    p.disc(cx, cy, s * 0.6, c('star', 2));
  };
  /** Bethlehem asleep on its hill, and the stable below with lamplight in the door. */
  const skyline = (p: Pixels, ground: number) => {
    for (let x = 0; x < W; x++) {
      const h = ground - 18 - Math.round(Math.sin(x / 37) * 8 + Math.sin(x / 11) * 2);
      for (let y = h; y < ground; y++) p.set(x, y, c('night', 1));
    }
    const r = rng(9);
    for (let k = 0; k < 14; k++) {
      const bx = 10 + Math.floor(r() * 290);
      const bw = 12 + Math.floor(r() * 16);
      const bh = 10 + Math.floor(r() * 14);
      p.rect(bx, ground - 20 - bh, bw, bh + 4, c('night', 2));
      if (r() < 0.6) p.rect(bx + 3 + Math.floor(r() * (bw - 6)), ground - 16 - bh + 4, 2, 3, c('glow', 2));
    }
    p.rect(0, ground, W, H - ground, c('night', 0));
  };

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

  // ---------------- the story: that night over Bethlehem
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, 150, pal.r('night'), 0, 7);
    stars(p, 5, 150, 160);
    bigStar(p, 160, 34, 7);
    for (let y = 40; y < 150; y++) {
      const half = (y - 40) * 0.35;
      for (let xx = Math.round(160 - half); xx <= 160 + half; xx++) if ((xx + y) % 3 === 0) p.set(xx, y, c('night', 7));
    }
    skyline(p, 150);
    // the stable: a lean-to of beams, light spilling from it
    p.rect(132, 122, 56, 28, c('wood', 0)).rect(126, 118, 68, 6, c('wood', 1));
    p.rect(146, 128, 28, 22, c('glow', 1)).rect(150, 132, 20, 18, c('glow', 2)).rect(156, 138, 8, 6, c('glow', 3));
    scaleBlit(p, side, 60, 134, 2);
    p.rect(0, 172, W, 28, c('night', 0));
    centered(p, 176, 'BETHLEHEM.  A NIGHT LIKE NO OTHER.', c('cloth', 3));
    centered(p, 188, 'And a goat nobody painted.', c('gold', 3));
    save('story1.gif', p);
  }

  // ---------------- level cards: the place, and its lines of the song
  x.cards.forEach((card, i) => {
    const info = CARDS[i];
    const p = new Pixels(W, H, card.pal.c('ink', 0));
    p.blit(card.map, 0, 54);
    p.rect(0, 0, W, 54, card.pal.c('ink', 0)).rect(0, 174, W, 26, card.pal.c('ink', 0));
    p.rect(0, 53, W, 1, card.pal.c('gold', 2)).rect(0, 174, W, 1, card.pal.c('gold', 2));
    outlined(p, 160 - textWidth(info.title, 2) / 2, 8, info.title, card.pal.c('gold', 3), card.pal.c('ink', 1), 2);
    centered(p, 32, info.where, card.pal.c('cloth', 3));
    centered(p, 178, `"${info.lines[0]}`, card.pal.c('cloth', 3));
    centered(p, 189, ` ${info.lines[1]}"`, card.pal.c('cloth', 3));
    save(`card${i + 1}.gif`, p, card.pal.pal);
  });

  // ---------------- endings
  {
    // the line at the manger, and you in it
    const lp = x.line.pal;
    const p = new Pixels(W, H, lp.c('ink', 0));
    for (let y = 0; y < 60; y++) for (let xx = 0; xx < W; xx++) p.set(xx, y, shadeAt(lp.r('glow'), 0, 2, 1 - Math.hypot(xx - 160, y - 60) / 160, xx, y));
    scaleBlit(p, x.line.map, 0, 52, 2);
    p.rect(0, 172, W, 28, lp.c('ink', 0));
    // the arrow: third from the left
    const ax = 4 * 40 + 20;
    for (let k = 0; k < 6; k++) p.rect(ax - k, 42 - k, 1 + k * 2, 1, lp.c('gold', 3));
    p.rect(ax - 1, 30, 3, 8, lp.c('gold', 3));
    outlined(p, 160 - textWidth('THIRD GOAT FROM THE LEFT!') / 2, 10, 'THIRD GOAT FROM THE LEFT!', lp.c('gold', 3), lp.c('ink', 0));
    centered(p, 177, '"I claim my space!', lp.c('cloth', 3));
    centered(p, 188, 'In the gospel barnyard..."', lp.c('cloth', 3));
    save('won1.gif', p, lp.pal);
  }
  {
    // He sees you: the cover goat beneath the star
    const p = new Pixels(W, H, c('night', 0));
    gradient(p, 0, 0, W, H, pal.r('night'), 0, 4);
    stars(p, 21, H, 90);
    bigStar(p, 230, 30, 6);
    const goat = resample(loadScan('goatcover'), 120, 0, [0.12, 0.08, 0.88, 0.95]);
    const reserved = [c('cloth', 3), c('gold', 3), ink, c('parch', 4), c('parch', 1), c('night', 0)];
    polaroid(p, 24, 22, goat.w, goat.h, { paper: c('parch', 4), edge: c('parch', 1), shadow: c('night', 0) });
    const { pal: own } = pastePhoto(p, pal.pal, goat, 24, 22, { colors: 100, reserved });
    const lines = ['He sees you.', '', "Even if you're...", '', 'the third goat', 'from the left.'];
    lines.forEach((l, i) => outlined(p, 170, 70 + i * 14, l, i >= 4 ? c('gold', 3) : c('cloth', 3), ink));
    save('won2.gif', p, own);
  }
  {
    // the end, all night long
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, 150, pal.r('night'), 0, 6);
    stars(p, 33, 150);
    bigStar(p, 160, 30, 6);
    skyline(p, 150);
    scaleBlit(p, x.goat.get('chew0')!, 130, 110, 3);
    outlined(p, 160 - textWidth('THE END', 3) / 2, 52, 'THE END', c('gold', 3), ink, 3);
    centered(p, 176, 'Some just chew quietly...', c('cloth', 3));
    centered(p, 188, 'all night long.', c('cloth', 3));
    save('won3.gif', p);
  }
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, 150, pal.r('night'), 0, 4);
    stars(p, 41, 150, 80);
    p.rect(0, 140, W, 60, c('night', 0));
    blob(p, 160, 150, 120, 14, pal.r('hay'), 0, 2);
    scaleBlit(p, x.goat.get('faint1')!, 130, 84, 3);
    outlined(p, 160 - textWidth('YOU FAINTED', 3) / 2, 24, 'YOU FAINTED', c('cloth', 3), ink, 3);
    centered(p, 172, 'Legs up. Stiff as a board.', c('cloth', 3));
    centered(p, 184, 'Even fainting goats get back up!', c('gold', 3));
    save('lost.gif', p);
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
