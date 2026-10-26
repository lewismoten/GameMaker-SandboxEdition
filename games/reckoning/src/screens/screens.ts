// The 320x200 pictures: the menu, the paper behind text pages, the high scores, load and save,
// and the credits (with Doc Leo). The title is the art drawn for the game (art/cover.ts,
// cover.fli, then title.gif with the name); the story, the act cards and the endings are
// cartoons (cartoons.ts).
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { Pixels, rng } from '../../../kit/pixels';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';

interface ScreenExtras {
  /** The man's sprites. */
  man: Map<string, Pixels>;
}

/** The dark kitchen at 3:17 a.m. with the fridge standing open at (fx, top), its glow on the floor. */
export function kitchenBackdrop(pal: Pal, fx = 210, seed = 3, open = 1): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 150, pal.r('dark'), 0, 3);
  for (let y = 0; y < 150; y += 14) p.rect(0, y, W, 1, c('dark', 0));
  for (let x = 0; x < W; x += 14) p.rect(x, 0, 1, 150, c('dark', 0));
  // the floor
  for (let y = 150; y < H; y++)
    for (let x = 0; x < W; x++) p.set(x, y, (Math.floor((x - 160) / (12 + (y - 150) / 2) + 100) + Math.floor((y - 150) / 6)) % 2 ? c('dark', 3) : c('dark', 1));
  // the fridge and its glow
  if (open > 0) {
    for (let y = 150; y < H; y++) {
      const spread = (y - 150) * 2 + 30;
      for (let x = Math.round(fx - spread * 1.6); x < fx + 70; x++) if ((x + y) % 2 === 0) p.set(x, y, c('glow', 2));
    }
    p.rect(fx, 24, 70, 136, c('white', 0))
      .rect(fx + 4, 28, 62, 128, c('glow', 4))
      .rect(fx + 4, 28, 62, 30, c('glow', 5));
    for (const y of [64, 96, 128]) p.rect(fx + 4, y, 62, 2, c('glow', 3));
    p.rect(fx + 70, 18, 22, 148, c('glow', 3))
      .rect(fx + 72, 40, 18, 2, c('white', 2))
      .rect(fx + 72, 90, 18, 2, c('white', 2));
  }
  const r = rng(seed);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * W), Math.floor(r() * 140), c('dark', 4));
  return p;
}

/** A slice of New York cheesecake on its plate at (cx, cy), `s` pixels a unit, glowing. */
export function cheesecake(p: Pixels, pal: Pal, cx: number, cy: number, s = 1, aura = 0): void {
  const c = pal.c;
  if (aura)
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2 + aura * 0.3;
      for (let r = 9 * s; r < (16 + (k % 2) * 6) * s; r++)
        if (r % 2 === 0) p.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.75, c('aura', (k + aura) % 2 ? 2 : 3));
    }
  for (let x = -12 * s; x <= 12 * s; x++) p.rect(cx + x, cy + 6 * s, 1, Math.max(1, Math.round(s)), c('white', 2));
  for (let y = -5 * s; y < 6 * s; y++) {
    const w = Math.round((4 + ((y + 5 * s) / (11 * s)) * 6) * s);
    for (let x = -w; x < w; x++) p.set(cx + x, cy + y, y > 3 * s ? c('crust', 2) : y < -3 * s ? c('berry', 2) : c('cream', x < 0 ? 2 : 3));
  }
  p.disc(cx - 2 * s, cy - 7 * s, 1.6 * s, c('berry', 3));
}

export function buildScreens(x: ScreenExtras): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  // ---------------- menu: the dark kitchen, a board for the menu, the man and the cheesecake beside it
  {
    const p = kitchenBackdrop(pal, 236, 5);
    outlined(p, 160 - textWidth('THE GREAT DAIRY', 2) / 2, 6, 'THE GREAT DAIRY', c('cream', 3), ink, 2, c('crust', 0));
    outlined(p, 160 - textWidth('RECKONING OF 3:17 A.M.') / 2, 26, 'RECKONING OF 3:17 A.M.', c('aura', 2), ink);
    p.rect(56, 92, 208, 90, c('wood', 0)).rect(58, 94, 204, 86, c('parch', 1));
    p.rect(62, 98, 196, 78, c('parch', 4)).frame(62, 98, 196, 78, c('parch', 2));
    scaleBlit(p, x.man.get('speak0')!, 6, 120, 2);
    cheesecake(p, pal, 270, 64, 1, 1);
    save('menu.gif', p);
  }

  // ---------------- paper behind text pages
  const paper = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('dark'), 0, 4);
    p.rect(24, 6, 272, 190, c('parch', 4)).frame(24, 6, 272, 190, c('parch', 1));
    for (let y = 8; y < 194; y += 3) p.set(25, y, c('parch', 2)).set(294, y + 1, c('parch', 2));
    // a few graham crumbs in the corner
    for (const [cx, cy] of [
      [284, 186],
      [288, 180],
      [280, 182],
    ])
      blob(p, cx, cy, 2, 1.6, pal.r('crust'), 1, 3);
    centered(p, 14, heading, c('brown', 1), 2);
    return p;
  };
  save('howto.gif', paper('HOW TO PLAY'));
  save('credits.gif', paper('CREDITS'));
  save('storybg.gif', paper('3:17 A.M.'));
  // Load and save: PLAYGAME writes the names in yellow, so each slot is a dark strip.
  const slots = (heading: string) => {
    const p = paper(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('choc', 0)).rect(75, 49 + i * 14, 170, 1, c('ink', 0));
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('dark'), 0, 4);
    p.rect(4, 0, 308, H, c('parch', 4)).rect(4, 0, 1, H, c('parch', 1)).rect(311, 0, 1, H, c('parch', 1));
    centered(p, 11, 'MIDNIGHT SNACKERS', c('brown', 1));
    const rule = textWidth('MIDNIGHT SNACKERS') + 16;
    p.rect(160 - rule / 2, 21, rule, 1, c('brown', 2));
    save('hiscore.gif', p);
  }

  {
    // credits: the Bard himself
    const p = new Pixels(W, H);
    p.rect(0, 0, W, H, c('dark', 0));
    const r = rng(51);
    for (let i = 0; i < 50; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), c('aura', i % 3));
    const leo = resample(loadScan('docleo'), 110, 0, [0.06, 0.04, 0.94, 0.96]);
    const logo = resample(loadScan('bardlogo'), 120, 0, [0.04, 0.02, 0.96, 0.98]);
    const reserved = [c('white', 2), c('cream', 3), ink, c('parch', 4), c('parch', 1), c('dark', 0)];
    polaroid(p, 26, 30, leo.w, leo.h, { paper: c('parch', 4), edge: c('parch', 1), shadow: c('dark', 0) });
    const a = pastePhoto(p, pal.pal, leo, 26, 30, { colors: 60, reserved });
    const b = pastePhoto(p, a.pal, logo, 178, 12, { colors: 60, reserved: [...reserved, ...a.slots] });
    text(p, 28, 30 + leo.h + 4, 'DOC LEO', c('brown', 1));
    outlined(p, 172, 130, 'The Bard of', c('cream', 3), ink);
    outlined(p, 172, 142, 'Bizarre', c('cream', 3), ink);
    text(p, 172, 160, 'writes songs,', c('white', 2));
    text(p, 172, 170, 'makes games,', c('white', 2));
    text(p, 172, 180, 'loves cheesecake.', c('white', 2));
    save('bardpic.gif', p, b.pal);
  }
  return files;
}
