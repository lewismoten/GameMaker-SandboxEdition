// The 320x200 pictures: the menu, the paper behind text pages, the high scores, load and save,
// and the credits (with Doc Leo); and the scenery the cartoons share: the haunted house's front
// at night, the fog hall inside (peeling wallpaper over the wainscot, old floorboards), the
// glowing EXIT sign and the front desk. The title is the cover drawn for the game
// (art/cover.ts, cover.fli, then title.gif with the name); the story, the level cards and the
// endings are cartoons (cartoons.ts).
import { loadScan, pastePhoto, polaroid, resample } from '../../../kit/photo';
import { Pixels, rng } from '../../../kit/pixels';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { centered, micro, outlined, text, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';

export interface ScreenExtras {
  /** Your sprites. */
  hero: Map<string, Pixels>;
  /** Everybody else's. */
  mons: Map<string, Pixels>;
}

/** The night sky with stars and the moon. */
export function nightSky(p: Pixels, pal: Pal, seed = 3, bottom = H): void {
  const c = pal.c;
  gradient(p, 0, 0, W, bottom, pal.r('night'), 0, 3);
  const r = rng(seed);
  for (let i = 0; i < 60; i++) p.set(Math.floor(r() * W), Math.floor(r() * bottom * 0.7), c('moon', i % 3));
  p.disc(268, 34, 18, c('moon', 1)).disc(262, 30, 4, c('moon', 0)).disc(274, 40, 3, c('moon', 0));
}

/** The haunted house's front at night: lawn from `ground` down, the house, a lit doorway. */
export function houseBackdrop(pal: Pal, ground = 150, k = 0): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  nightSky(p, pal, 4, ground);
  // the house
  p.rect(60, ground - 90, 170, 90, c('paper', 0));
  for (let y = ground - 90; y < ground; y += 5) p.rect(60, y, 170, 1, c('black', 1));
  for (let y = 0; y < 40; y++) p.rect(145 - y * 2.3, ground - 130 + y, y * 4.6, 1, c('black', 0));
  p.rect(70, ground - 120, 40, 120, c('paper', 0));
  for (let y = 0; y < 34; y++) p.rect(90 - y * 0.7, ground - 154 + y, y * 1.4, 1, c('black', 0));
  // the windows (flickering with k)
  for (const [x, y, w, h, ramp] of [
    [78, ground - 104, 22, 26, 'pumpkin'],
    [124, ground - 74, 24, 24, 'pumpkin'],
    [180, ground - 74, 24, 24, 'glow'],
    [80, ground - 60, 18, 20, 'glow'],
  ] as const) {
    p.rect(x - 2, y - 2, w + 4, h + 4, c('black', 0)).rect(x, y, w, h, c(ramp, (k + x) % 3 === 0 ? 1 : 2));
    p.rect(x + w / 2, y, 1, h, c('black', 0)).rect(x, y + h / 2, w, 1, c('black', 0));
  }
  // the door, fog glowing in it
  p.rect(152, ground - 40, 26, 40, c('black', 0)).rect(155, ground - 37, 20, 37, c('fog', 1));
  // the lawn and the fog
  for (let y = ground; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, (x * 7 + y * 13) % 17 === 0 ? c('grass', 1) : c('grass', 0));
  const r = rng(9 + k);
  for (let i = 0; i < 14; i++) blob(p, Math.floor(r() * W), ground + 4 + Math.floor(r() * 30), 20 + r() * 20, 4, pal.r('fog'), 0, 2);
  // tombstones and a jack-o'-lantern
  for (const x of [26, 236, 290]) p.rect(x, ground - 14, 16, 18, c('stone', 2)).disc(x + 8, ground - 14, 8, c('stone', 2));
  blob(p, 120, ground + 6, 9, 7, pal.r('orange'), 0, 2);
  p.rect(115, ground + 3, 3, 2, c('pumpkin', 2))
    .rect(122, ground + 3, 3, 2, c('pumpkin', 2))
    .rect(115, ground + 8, 10, 2, c('pumpkin', 2));
  return p;
}

/** Inside: peeling wallpaper, the wainscot, old floorboards from `floor` down. */
export function hallBackdrop(pal: Pal, floor = 150, seed = 3): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  const r = rng(seed);
  for (let y = 0; y < floor - 34; y++)
    for (let x = 0; x < W; x++) p.set(x, y, x % 24 === 12 && y % 20 === 8 ? c('paper', 2) : r() < 0.01 ? c('paper', 0) : c('paper', 1));
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(r() * 300);
    p.rect(x, 10 + Math.floor(r() * 60), 12, 8, c('paper', 0));
  }
  for (let y = floor - 34; y < floor; y++) for (let x = 0; x < W; x++) p.set(x, y, x % 30 === 0 ? c('board', 0) : c('board', 2));
  p.rect(0, floor - 35, W, 2, c('board', 3));
  for (let y = floor; y < H; y++)
    for (let x = 0; x < W; x++) p.set(x, y, (y - floor) % 7 === 0 ? c('board', 0) : (x * 3 + y) % 41 === 0 ? c('board', 3) : c('board', 1));
  // cobwebs in the corners
  for (const [cx, dir] of [
    [0, 1],
    [W - 1, -1],
  ] as const)
    for (let k = 0; k < 5; k++) p.line(cx, 0, cx + dir * (30 - k * 5), k * 6, c('web', 1));
  return p;
}

/** The emergency exit sign, glowing (`x, y` its top-left, 60 x 22). */
export function exitSignArt(p: Pixels, pal: Pal, x: number, y: number, lit = true, scale = 2): void {
  const c = pal.c;
  if (lit) for (let r = 34; r > 0; r -= 6) blob(p, x + 30, y + 11, r + 10, r * 0.6, [c('exitred', 0)], 0, 0);
  p.rect(x, y, 60, 22, c('ink', 0)).rect(x + 2, y + 2, 56, 18, lit ? c('exitred', 1) : c('exitred', 0));
  micro(p, x + 8, y + 6, 'EXIT', lit ? c('white', 2) : c('exitred', 2), scale);
  p.rect(x + 46, y + 10, 8, 2, c('white', 2)).rect(x + 51, y + 7, 2, 8, c('white', 2));
}

export function buildScreens(x: ScreenExtras): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const ink = c('ink', 0);

  // ---------------- menu: the house at night, a big paper sign for the menu (PLAYGAME writes on it)
  {
    const p = houseBackdrop(pal, 160, 1);
    outlined(p, 160 - textWidth('I SCREAMED,', 2) / 2, 4, 'I SCREAMED,', c('pumpkin', 2), ink, 2, c('velvet', 0));
    outlined(p, 160 - textWidth('SHE SMIRKED', 2) / 2, 24, 'SHE SMIRKED', c('hoodie', 3), ink, 2, c('purple', 0));
    // the menu board: a parchment sign on two posts
    p.rect(70, 170, 6, 30, c('board', 1)).rect(244, 170, 6, 30, c('board', 1));
    p.rect(52, 66, 216, 120, c('board', 1)).rect(54, 68, 212, 116, c('board', 2));
    p.rect(60, 74, 200, 104, c('sheet', 4));
    for (let y = 76; y < 178; y += 8) p.set(62, y, c('sheet', 2)).set(257, y + 4, c('sheet', 2));
    scaleBlit(p, x.hero.get('scream0')!, 268, 128, 2);
    scaleBlit(p, x.mons.get('lilySmirk')!, 4, 140, 2);
    save('menu.gif', p);
  }

  // ---------------- paper behind text pages: a program from the haunted house's front desk
  const paper = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('night'), 1, 4);
    p.rect(24, 6, 272, 190, c('sheet', 4)).frame(24, 6, 272, 190, c('sheet', 1));
    p.rect(24, 6, 272, 3, c('orange', 1));
    for (let y = 30; y < 194; y += 12) p.set(27, y, c('sheet', 2)).set(292, y + 3, c('sheet', 2));
    centered(p, 14, heading, c('velvet', 0), 2);
    return p;
  };
  save('howto.gif', paper('HOW TO PLAY'));
  save('credits.gif', paper('CREDITS'));
  save('storybg.gif', paper('THE SONG'));
  // Load and save: PLAYGAME writes the names in yellow, so each slot is a dark strip.
  const slots = (heading: string) => {
    const p = paper(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('black', 0)).rect(75, 49 + i * 14, 170, 1, ink);
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('night'), 1, 4);
    p.rect(4, 0, 308, H, c('sheet', 4)).rect(4, 0, 1, H, c('sheet', 1)).rect(311, 0, 1, H, c('sheet', 1));
    centered(p, 11, 'BRAVERY BADGES', c('velvet', 0));
    const rule = textWidth('BRAVERY BADGES') + 16;
    p.rect(160 - rule / 2, 21, rule, 1, c('velvet', 1));
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
    const reserved = [c('white', 2), c('yellow', 2), ink, c('sheet', 4), c('sheet', 1), c('purple', 0)];
    polaroid(p, 26, 30, leo.w, leo.h, { paper: c('sheet', 4), edge: c('sheet', 1), shadow: c('purple', 0) });
    const a = pastePhoto(p, pal.pal, leo, 26, 30, { colors: 60, reserved });
    const b = pastePhoto(p, a.pal, logo, 178, 12, { colors: 60, reserved: [...reserved, ...a.slots] });
    text(p, 28, 30 + leo.h + 4, 'DOC LEO', c('brown', 1));
    outlined(p, 172, 130, 'The Bard of', c('yellow', 2), ink);
    outlined(p, 172, 142, 'Bizarre', c('yellow', 2), ink);
    text(p, 172, 160, 'writes songs,', c('white', 2));
    text(p, 172, 170, 'makes games,', c('white', 2));
    text(p, 172, 180, 'screamed.', c('white', 2));
    save('bardpic.gif', p, b.pal);
  }
  return files;
}
