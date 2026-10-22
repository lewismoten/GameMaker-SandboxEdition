// The 320x200 pictures: the menu, the paper behind text pages, the high scores, load and save,
// and the credits (with Doc Leo). The title is the song's animated cover (cartoons.ts,
// cover.fli) and its last frame (title.gif); the story, the level cards and the endings are
// cartoons too.
import { Pixels, rng } from '../../../kit/pixels';
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';

export interface ScreenExtras {
  /** The camel, posed (each a 20x40 picture: his top block over his bottom). */
  camel: (pose: string) => Pixels;
}

/** The desert by the city at `light` (0 dawn .. 1 noon): sky, far walls and a dome, dunes, sand from `ground` down. */
export function desertBackdrop(pal: Pal, ground = 150, seed = 3, city = true): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, ground, pal.r('sky'), 1, 5);
  const r = rng(seed);
  if (city) {
    // the city walls on the left, a golden dome behind them
    blob(p, 70, ground - 34, 16, 14, pal.r('gold'), 1, 4);
    for (let x = 0; x < 150; x++) {
      const top = ground - 26 - (x % 40 < 8 ? 8 : 0) - (x > 100 ? Math.round((x - 100) / 3) : 0);
      for (let y = Math.max(0, top); y < ground; y++) p.set(x, y, c('stone', (x + y) % 9 === 0 ? 2 : 3));
    }
  }
  for (let x = 0; x < W; x++) {
    const h = ground - 10 - Math.round(Math.sin(x / 37) * 5 + Math.sin(x / 11) * 2);
    for (let y = h; y < H; y++) p.set(x, y, c('sand', y < ground ? 4 : y - ground < 3 ? 4 : 3));
  }
  for (let i = 0; i < 260; i++) p.set(Math.floor(r() * W), ground + Math.floor(r() * (H - ground)), c('sand', r() < 0.5 ? 2 : 5));
  return p;
}

/** A palm tree from (x, base) up `h` pixels. */
export function palm(p: Pixels, pal: Pal, x: number, base: number, h = 70): void {
  const c = pal.c;
  for (let y = 0; y < h; y++) p.rect(x + Math.round(Math.sin(y / 18) * 4), base - y, 4, 1, c('wood', y % 6 === 0 ? 1 : 2));
  const tx = x + Math.round(Math.sin(h / 18) * 4) + 2;
  const ty = base - h;
  for (let a = 0; a < 8; a++) {
    const ang = Math.PI * (0.95 + (a / 7) * 1.1);
    for (let t = 0; t < 26; t++) p.rect(Math.round(tx + Math.cos(ang) * t), Math.round(ty + Math.sin(ang) * t * 0.6 + t * t * 0.03), 2, 2, c('leaf', 1 + (t % 3)));
  }
}

export function buildScreens(x: ScreenExtras): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  // ---------------- menu: the desert by the city, a board for the menu, the camel beside it
  {
    const p = desertBackdrop(pal, 170);
    palm(p, pal, 22, 180, 90);
    outlined(p, 160 - textWidth('THREAD THE NEEDLE,', 2) / 2, 8, 'THREAD THE NEEDLE,', c('gold', 4), ink, 2, c('gold', 1));
    outlined(p, 160 - textWidth('BROTHER CAMEL', 2) / 2, 28, 'BROTHER CAMEL', c('gold', 4), ink, 2, c('gold', 1));
    p.rect(56, 92, 208, 90, c('wood', 0)).rect(58, 94, 204, 86, c('parch', 1));
    p.rect(62, 98, 196, 78, c('parch', 4)).frame(62, 98, 196, 78, c('parch', 2));
    scaleBlit(p, x.camel('stand'), 270, 100, 2);
    save('menu.gif', p);
  }

  // ---------------- paper behind text pages
  const paper = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('sand'), 2, 5);
    p.rect(24, 6, 272, 190, c('parch', 4)).frame(24, 6, 272, 190, c('parch', 1));
    for (let y = 8; y < 194; y += 3) p.set(25, y, c('parch', 2)).set(294, y + 1, c('parch', 2));
    // a needle and a loop of red thread in the corner
    p.line(276, 192, 292, 172, c('steel', 2)).line(277, 192, 293, 172, c('steel', 3));
    p.ring(286, 179, 2, c('ink', 1));
    for (let a = 0; a < 40; a++) p.set(285 - a * 0.3 + Math.sin(a / 4) * 4, 180 + a * 0.3, c('red', 2));
    centered(p, 14, heading, c('brown', 1), 2);
    return p;
  };
  save('howto.gif', paper('HOW TO PLAY'));
  save('credits.gif', paper('CREDITS'));
  save('storybg.gif', paper('THE SONG'));
  // Load and save: PLAYGAME writes the names in yellow, so each slot is a dark strip.
  const slots = (heading: string) => {
    const p = paper(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('wood', 0)).rect(75, 49 + i * 14, 170, 1, c('ink', 0));
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('sand'), 2, 5);
    p.rect(4, 0, 308, H, c('parch', 4)).rect(4, 0, 1, H, c('parch', 1)).rect(311, 0, 1, H, c('parch', 1));
    centered(p, 11, 'THE NARROWEST CAMELS', c('brown', 1));
    const rule = textWidth('THE NARROWEST CAMELS') + 16;
    p.rect(160 - rule / 2, 21, rule, 1, c('brown', 2));
    save('hiscore.gif', p);
  }

  {
    // credits: the Bard himself
    const p = new Pixels(W, H);
    p.rect(0, 0, W, H, c('purple', 0));
    const r = rng(51);
    for (let i = 0; i < 50; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), c('star', i % 3));
    const leo = resample(loadScan('docleo'), 110, 0, [0.06, 0.04, 0.94, 0.96]);
    const logo = resample(loadScan('bardlogo'), 120, 0, [0.04, 0.02, 0.96, 0.98]);
    const reserved = [c('white', 2), c('gold', 4), ink, c('parch', 4), c('parch', 1), c('purple', 0)];
    polaroid(p, 26, 30, leo.w, leo.h, { paper: c('parch', 4), edge: c('parch', 1), shadow: c('purple', 0) });
    const a = pastePhoto(p, pal.pal, leo, 26, 30, { colors: 60, reserved });
    const b = pastePhoto(p, a.pal, logo, 178, 12, { colors: 60, reserved: [...reserved, ...a.slots] });
    text(p, 28, 30 + leo.h + 4, 'DOC LEO', c('brown', 1));
    outlined(p, 172, 130, 'The Bard of', c('gold', 4), ink);
    outlined(p, 172, 142, 'Bizarre', c('gold', 4), ink);
    text(p, 172, 160, 'writes songs,', c('white', 2));
    text(p, 172, 170, 'makes games,', c('white', 2));
    text(p, 172, 180, 'humps down.', c('white', 2));
    save('bardpic.gif', p, b.pal);
  }
  return files;
}
