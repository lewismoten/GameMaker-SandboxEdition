// The 320x200 pictures: the title, the menu, the paper behind text pages, the high scores,
// load and save. A stage curtain and a bandstand's worth of instruments (the preset pictures,
// twice size) run through all of them.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '../../../snowbound/src/art/draw';
import { centered, outlined, textWidth } from '../../../snowbound/src/art/font';
import { gif, H, scaleBlit, W } from '../../../snowbound/src/screens/scenery';
import { POSES } from '../../../teddy2/src/sprites/teddy';
import { GWINN } from '../../../teddy2/src/sprites/gwinn';
import { LEO } from '../../../teddy3/src/sprites/leo';
import { iconPic } from '../art/icons';
import { buildScreenPalette } from '../art/pal';

/** The instruments strewn across the title and the menu, one from each family. */
const STREWN = [
  'piano-bright',
  'violin',
  'aah',
  'upright-bass',
  'lead-square',
  'accordion',
  'trumpet',
  'flute',
  'glockenspiel',
  'cowbell',
  'snare-tight',
  'piano',
];

export function buildScreens(): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels) => (files[name] = gif(p, pal.pal));
  const ink = c('ink', 0);

  /** A red stage curtain backdrop with a wooden floor from `floor` down. */
  const stage = (floor = 168) => {
    const p = new Pixels(W, H);
    for (let x = 0; x < W; x++) {
      const fold = Math.sin(x / 9) * 0.5 + 0.5;
      for (let y = 0; y < floor; y++) p.set(x, y, c('red', Math.min(3, Math.round(fold * 2.6 + (y % 7 === 0 && x % 2 ? 0.4 : 0)))));
    }
    gradient(p, 0, floor, W, H - floor, pal.r('wood'), 1, 3);
    for (let x = 0; x < W; x += 40) p.rect(x, floor, 1, H - floor, c('wood', 0));
    // the valance across the top, gold-fringed
    p.rect(0, 0, W, 10, c('red', 0));
    for (let x = 0; x < W; x += 4) p.rect(x, 10, 2, 3, c('gold', 2));
    return p;
  };
  const strew = (p: Pixels, y0: number, seed: number) => {
    const r = rng(seed);
    STREWN.forEach((id, i) => {
      const x = 6 + i * 26 + Math.floor(r() * 6);
      const y = y0 + Math.floor(r() * 10);
      const icon = iconPic(id);
      for (let yy = 0; yy < 20; yy++) for (let xx = 0; xx < 20; xx++) if (icon.get(xx, yy) !== 255 && x + xx < W) p.set(x + xx, y + yy, icon.get(xx, yy));
    });
  };
  const title = (p: Pixels, y: number) => {
    outlined(p, 160 - textWidth('TUNE-UP', 4) / 2, y, 'TUNE-UP', c('yellow', 3), ink, 4, c('gold', 0));
  };

  // ---------------- title: the curtain, the name, the band's things on the floor, the cast
  {
    const p = stage();
    title(p, 40);
    centered(p, 80, 'THE NIGHT BEFORE THE PARADE', c('cream', 3));
    strew(p, 172, 7);
    scaleBlit(p, POSES.stand, 70, 120, 2);
    scaleBlit(p, GWINN.gwinn1, 210, 120, 2);
    scaleBlit(p, LEO.wave, 140, 92, 2);
    save('title.gif', p);
  }

  // ---------------- menu: the curtain, the name, a board for the menu, Teddy beside it
  {
    const p = stage(180);
    title(p, 22);
    p.rect(56, 82, 208, 100, c('wood', 0)).rect(58, 84, 204, 96, c('cream', 1));
    p.rect(62, 88, 196, 88, c('cream', 3)).frame(62, 88, 196, 88, c('cream', 0));
    strew(p, 182, 3);
    scaleBlit(p, POSES.sit, 272, 136, 2);
    save('menu.gif', p);
  }

  // ---------------- paper behind text pages: a sheet of music paper on the stage
  const paper = (heading: string) => {
    const p = stage(190);
    p.rect(24, 6, 272, 190, c('cream', 3)).frame(24, 6, 272, 190, c('cream', 0));
    for (let x = 30; x < 290; x += 2) p.set(x, 30, c('cream', 1));
    centered(p, 14, heading, c('red', 0), 2);
    return p;
  };
  save('howto.gif', paper('HOW TO PLAY'));
  save('credits.gif', paper('CREDITS'));
  save('storybg.gif', paper('THE STORY'));
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
    p.rect(0, 0, W, H, c('cream', 3));
    centered(p, 11, 'THE BEST BAND HELPERS', c('red', 0));
    const rule = textWidth('THE BEST BAND HELPERS') + 16;
    p.rect(160 - rule / 2, 21, rule, 1, c('red', 1));
    save('hiscore.gif', p);
  }
  // the ending and game over: words over the stage (their own lists show them)
  {
    const p = stage();
    title(p, 30);
    centered(p, 74, 'THE BAND IS HOME!', c('cream', 3), 2);
    centered(p, 96, 'MORE NEIGHBORHOODS SOON', c('cream', 2));
    scaleBlit(p, LEO.wave, 100, 110, 2);
    scaleBlit(p, POSES.bark, 180, 136, 2);
    strew(p, 172, 11);
    save('won.gif', p);
  }
  {
    const p = stage();
    title(p, 30);
    centered(p, 80, 'TEDDY NEEDS A NAP.', c('cream', 3), 2);
    centered(p, 104, 'THE BAND WILL WAIT.', c('cream', 2));
    scaleBlit(p, POSES.sleep, 140, 136, 2);
    save('lost.gif', p);
  }
  return files;
}
