// The 320x200 pictures: the title (Doc Leo and Lady Regina III in front of THE CHEZ), the menu,
// the paper behind text pages, the high scores, load and save, the ending and game over. The
// banter cards (cards.ts) and the cartoons (reels.ts) are drawn from the same art (art.ts).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { centered, outlined, textWidth } from '../../../snowbound/src/art/font';
import { gif, scaleBlit } from '../../../snowbound/src/screens/scenery';
import { POSES } from '../../../teddy2/src/sprites/teddy';
import { SP, INK, REAL_PARTS, cutaway, parkChez, drawChicken, drawLeo, garage } from './art';
import { card } from './cards';
import { INTRO, OUTRO, WAKE } from './banter';

const c = SP.c;

const title = (p: Pixels, y: number) => outlined(p, 160 - textWidth('TUNE-UP', 4) / 2, y, 'TUNE-UP', c('yellow', 3), INK, 4, c('red', 0));

/** Every picture by its file name. */
export function buildScreens(): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels) => (files[name] = gif(p, SP.pal));

  // ---------------- title: the name, THE CHEZ, Doc Leo and Lady Regina III in front
  {
    const p = garage(160);
    title(p, 14);
    centered(p, 52, 'NO WRENCHES. NO PROBLEM.', c('paint', 3), 1, INK);
    parkChez(p, 120, 170, 4);
    drawLeo(p, 'grin', 40, 188, 3, false, true);
    drawChicken(p, 106, 188, 2.5, { lady: true, squawk: true }, false, true);
    save('title.gif', p);
  }
  // ---------------- menu: the name, a board for the menu, the chicken on the bench beside it
  {
    const p = garage(180);
    title(p, 14);
    p.rect(56, 82, 208, 100, c('mach', 0)).rect(58, 84, 204, 96, c('cream', 1));
    p.rect(62, 88, 196, 88, c('cream', 3)).frame(62, 88, 196, 88, c('cream', 0));
    drawLeo(p, 'front', 6, 180, 2);
    drawChicken(p, 270, 178, 2, { lady: true });
    save('menu.gif', p);
  }
  // ---------------- paper behind text pages: a clipboard's sheet on the garage wall
  const paper = (heading: string) => {
    const p = garage(190);
    p.rect(24, 6, 272, 190, c('cream', 3)).frame(24, 6, 272, 190, c('cream', 0));
    p.rect(130, 2, 60, 8, c('mach', 3)).frame(130, 2, 60, 8, INK);
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
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('mach', 0)).rect(75, 49 + i * 14, 170, 1, INK);
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  // the high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192
  {
    const p = new Pixels(320, 200, c('cream', 3));
    centered(p, 11, 'THE BEST EARS IN TOWN', c('red', 0));
    const rule = textWidth('THE BEST EARS IN TOWN') + 16;
    p.rect(160 - rule / 2, 21, rule, 1, c('red', 1));
    save('hiscore.gif', p);
  }
  // the ending (every part tuned, the radio in, the parade led) and game over; the words sit
  // above the car, clear of the parts' legend
  {
    const p = cutaway(REAL_PARTS, REAL_PARTS.length);
    centered(p, 6, 'THE CHEZ IS TUNED UP!', c('paint', 3), 1, INK);
    centered(p, 18, 'AND THE PARADE WAS A HIT.', c('yellow', 3), 1, INK);
    save('won.gif', p);
  }
  {
    const p = garage(160);
    title(p, 30);
    centered(p, 80, 'TIME FOR A NAP.', c('paint', 3), 2, INK);
    centered(p, 104, 'THE PARADE WILL WAIT.', c('paint', 3), 1, INK);
    drawLeo(p, 'die1', 120, 190, 2);
    scaleBlit(p, POSES.sit, 180, 150, 2);
    save('lost.gif', p);
  }
  // the banter cards: before each level and after
  for (const [n, k] of Object.entries(INTRO)) save(`intro${n}.gif`, card(k));
  for (const [file, k] of Object.entries(OUTRO)) save(`${file}out.gif`, card(k));
  WAKE.forEach((k, i) => save(`wake${i + 1}.gif`, card(k)));
  return files;
}
