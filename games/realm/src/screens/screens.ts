// Every picture between the scenes: the title, the menu, the story, the instructions and
// credits backdrops, the high-score, load and save backgrounds, the ending, game over, and the
// felt egg's own portrait.
import { Canvas, type RGB, mix, clamp01, tnoise } from '../art/rgb';
import { Screen, type Inks } from './screen';
import { sky, stars, hills, tuit, castle, pennant } from './scenery';
import { parchment, bigSprite, INK } from './talk';
import { SLOT, STATUS } from '../../../kit/saveSlots';
import { heroPics } from '../sprites/hero';
import { PEOPLE, person, animalPics } from '../sprites/people';
import { chezPics } from '../sprites/chezCar';
import { bossPicture } from '../sprites/dungeonFoes';
import { paintEgg } from '../art/egg';

const GOLD = (t: number): RGB => mix([255, 236, 150], [196, 120, 30], t);
const SILVER = (t: number): RGB => mix([250, 252, 255], [120, 130, 160], t);
const people = (k: string) => person(PEOPLE[k])[0];
const hero = heroPics();
const animals = animalPics();

/** A sprite blown up and set down on a canvas with its feet at (x, y). */
function stand(cv: Canvas, sprite: Canvas, x: number, y: number, scale = 3): void {
  const big = bigSprite(sprite, scale);
  // a soft shadow at the feet
  cv.ellipse(x, y, big.w * 0.42, big.h * 0.07, (px, py) => mix(cv.get(Math.floor(px), Math.floor(py)), [0, 0, 0], 0.4));
  cv.draw(big, Math.round(x - big.w / 2), Math.round(y - big.h));
}

/** Dusk over Procrastia: the Round Tuit rising behind Laterburg's towers. */
function dusk(sc: Screen, tuitGlow = 1, broken = 0): void {
  const cv = sc.cv;
  sky(cv, [
    [0, [26, 22, 64]],
    [0.35, [90, 52, 110]],
    [0.62, [236, 120, 80]],
    [0.8, [255, 200, 120]],
  ]);
  stars(cv, 110, 70, 3);
  tuit(cv, 246, 84, 26, tuitGlow, broken);
  hills(cv, 132, 10, [86, 66, 110], 2, [200, 140, 140], 1.3);
  castle(cv, 115, 140, 1, [40, 28, 56], [255, 210, 110]);
  for (const [x, c] of [
    [118, [200, 50, 50]],
    [205, [60, 90, 200]],
  ] as [number, RGB][])
    pennant(cv, x, 92, 8, c, x);
  hills(cv, 156, 12, [44, 46, 60], 5, [120, 90, 100], 0.8);
  hills(cv, 182, 9, [22, 30, 30], 9, [70, 80, 60], 1.7);
}

export function titleScreen(): Screen {
  const sc = new Screen();
  dusk(sc);
  stand(sc.cv, hero.get('windup')!, 64, 197, 3);
  stand(sc.cv, animals.get('teddy0')!, 266, 196, 2);
  stand(sc.cv, animals.get('gwinn0')!, 290, 196, 2);
  sc.centered(4, 'QUEST FOR THE', (_x, y) => GOLD((y - 4) / 12), 1.5, [20, 10, 30]);
  const word = 'ROUND TUIT';
  const scale = 3.6;
  sc.fancy(Math.round(160 - (word.length * 8 * scale) / 2), 18, word, scale, GOLD);
  sc.centered(52, 'A Realm of Procrastia Adventure', [250, 236, 210], 1, [30, 16, 40]);
  sc.text(4, 190, 'SANDBOX SOFTWARE', [255, 230, 160], 1, [0, 0, 0]);
  sc.text(260, 190, '(c) 1996', [255, 230, 160], 1, [0, 0, 0]);
  return sc;
}

/** The menu: Game-Maker writes the title and the choices over the parchment, in blue. */
export const MENU_INK: RGB = [24, 40, 150];
export function menuScreen(): Screen {
  const sc = new Screen();
  dusk(sc, 0.7);
  sc.cv.tint((c) => mix(c, [20, 14, 40], 0.35));
  sc.centered(6, 'QUEST FOR THE', (_x, y) => GOLD((y - 6) / 12), 1.5, [20, 10, 30]);
  sc.fancy(Math.round(160 - (10 * 8 * 3) / 2), 20, 'ROUND TUIT', 3, GOLD);
  parchment(sc.cv, 60, 96, 260, 172, 4);
  stand(sc.cv, hero.get('down0')!, 36, 190, 2);
  stand(sc.cv, people('docleo'), 286, 190, 2);
  return sc;
}

/** A page of the story: a picture above, a few lines of words on a scroll below. */
function storyPage(paint: (cv: Canvas) => void, lines: string[], page: number): Screen {
  const sc = new Screen();
  paint(sc.cv);
  parchment(sc.cv, 14, 128, 306, 192, page);
  lines.forEach((l, i) => sc.text(160 - l.length * 4, 133 + i * 11, l, INK));
  sc.text(290, 2, `${page}/4`, [255, 240, 200], 1, [0, 0, 0]);
  return sc;
}

export function storyScreens(): Screen[] {
  return [
    storyPage(
      (cv) => {
        sky(cv, [
          [0, [110, 160, 220]],
          [0.6, [200, 220, 240]],
        ]);
        hills(cv, 96, 12, [100, 150, 90], 4, [170, 210, 120]);
        castle(cv, 115, 110, 1, [150, 140, 150], [240, 220, 160]);
        hills(cv, 126, 6, [70, 120, 60], 8, [130, 180, 90]);
        cv.rect(0, 120, 320, 80, (x, y) => mix([70, 120, 60], [40, 80, 40], clamp01((y - 120) / 40 + tnoise(x, y, 10, 320, 2) * 0.2)));
        stand(cv, people('king'), 160, 124, 2);
      },
      ['In the Kingdom of Procrastia,', 'everything gets done. Eventually.', 'The castle has waited forty years', 'for its roof. King Dillydally IX', 'has been meaning to see to it.'],
      1,
    ),
    storyPage(
      (cv) => {
        sky(cv, [
          [0, [30, 26, 70]],
          [0.6, [70, 50, 110]],
        ]);
        stars(cv, 80, 60, 9);
        cv.rect(0, 96, 320, 40, (x, y) => mix([60, 50, 70], [40, 32, 50], clamp01((y - 96) / 40 + tnoise(x, y, 5, 320, 4) * 0.2)));
        cv.rect(118, 74, 84, 40, [150, 140, 136]);
        cv.rect(112, 70, 96, 6, [190, 184, 176]);
        tuit(cv, 160, 52, 22, 1);
        stand(cv, people('king'), 236, 122, 2);
      },
      ['Every King of Procrastia got', 'around to things by the Royal', 'Round Tuit. It sat on the Tuit', 'Table in the Garden Court, and', 'things got done. Mostly.'],
      2,
    ),
    storyPage(
      (cv) => {
        sky(cv, [
          [0, [20, 8, 20]],
          [0.6, [80, 20, 40]],
        ]);
        for (let k = 0; k < 3; k++) {
          const a = -2.2 + k * 1.1;
          cv.line(160, 60, 160 + Math.cos(a) * 120, 60 + Math.sin(a) * 60 + 40, 1, [255, 200, 120]);
        }
        tuit(cv, 160, 60, 20, 0.8, 0.9);
        const d = bossPicture('deadline');
        cv.draw(bigSprite(d, 2), 120, 40);
      },
      ['Then LORD DEADLINE, who hates a', 'thing put off more than anything,', 'stole the Tuit, broke it in three', 'and hid the pieces. Now nobody', 'gets around to stopping him.'],
      3,
    ),
    storyPage(
      (cv) => {
        sky(cv, [
          [0, [130, 190, 240]],
          [0.6, [220, 236, 250]],
        ]);
        hills(cv, 104, 10, [110, 170, 90], 12, [180, 220, 130]);
        cv.rect(0, 112, 320, 88, (x, y) => mix([90, 150, 70], [60, 110, 50], clamp01((y - 112) / 30 + tnoise(x, y, 10, 320, 6) * 0.15)));
        stand(cv, people('grandma'), 120, 126, 2);
        stand(cv, hero.get('side0')!, 196, 126, 2);
      },
      ['Except Pip, the stable hand of', 'Nowish, who does things the very', 'day he is asked. His grandmother', 'is very proud. And a little', 'worried. Get to it, Pip!'],
      4,
    ),
  ];
}

/** Backdrops for the text pages (instructions, credits): a tapestry border round dark cloth. */
export function textBackdrop(kind: 'help' | 'credits'): Screen {
  const sc = new Screen();
  const cv = sc.cv;
  cv.shade((x, y) => {
    const v = Math.hypot((x - 160) / 200, (y - 100) / 140);
    return mix(kind === 'help' ? [40, 50, 90] : [70, 30, 50], [10, 10, 20], clamp01(v));
  });
  // the bottom roller clears MORE... (y 168..175)
  parchment(cv, 32, 33, 296, 184, kind === 'help' ? 7 : 8);
  sc.centered(10, kind === 'help' ? 'HOW TO PLAY' : 'CREDITS', (_x, y) => GOLD((y - 10) / 16), 2, [20, 10, 20]);
  if (kind === 'help') {
    stand(cv, hero.get('strike')!, 16, 196, 1.5);
    stand(cv, people('docleo'), 306, 196, 1.5);
  } else {
    stand(cv, animals.get('teddy0')!, 16, 196, 1.5);
    stand(cv, animals.get('gwinn0')!, 306, 196, 1.5);
  }
  return sc;
}

/** The hall of fame: Game-Maker writes the scores in blue, the heading in red. */
export function scoresScreen(): Screen {
  const sc = new Screen();
  // light enough at the bottom for the red Hit any key; the dashes clear the rows (to y 184)
  sc.cv.shade((x, y) => mix([244, 232, 200], [228, 210, 168], clamp01(y / 200 + tnoise(x, y, 10, 320, 5) * 0.2)));
  for (let x = 0; x < 320; x += 8) {
    sc.cv.rect(x, 12, 4, 1, [150, 110, 60]);
    sc.cv.rect(x + 4, 188, 4, 1, [150, 110, 60]);
  }
  stand(sc.cv, hero.get('down0')!, 300, 180, 1.5);
  return sc;
}

/** Load and save: the names go down the middle in yellow, the pointer in red. */
export function slotsScreen(saving: boolean): Screen {
  const sc = new Screen();
  sc.cv.shade((x, y) => mix([20, 24, 50], [8, 8, 20], clamp01(Math.hypot(x - 160, y - 100) / 200)));
  sc.centered(10, saving ? 'SAVE YOUR QUEST' : 'TAKE UP A QUEST', (_x, y) => GOLD((y - 10) / 16), 1.5, [0, 0, 0]);
  // dark enough under the slots for the red pointer; Game-Maker's blue message (y 185) goes on
  // a strip of parchment (kit/saveSlots.ts)
  for (let i = 0; i < 10; i++) sc.cv.rrect(SLOT.x, SLOT.y(i), SLOT.w, SLOT.h - 1, 3, [16, 18, 42]);
  sc.cv.rrect(STATUS.x, STATUS.y, STATUS.w, STATUS.h, 3, [238, 222, 184]);
  tuit(sc.cv, 290, 150, 14, 0.4);
  return sc;
}

export const SLOT_INK: RGB = [255, 236, 60];
export const RED_INK: RGB = [210, 30, 30];

/** The ending: the Round Tuit whole again on the Tuit Table; then everyone, then THE CHEZ. */
export function wonScreens(): Screen[] {
  const a = new Screen();
  dusk(a, 1.4);
  a.cv.tint((c) => mix(c, [255, 220, 160], 0.15));
  stand(a.cv, hero.get('down0')!, 110, 196, 3);
  stand(a.cv, people('king'), 210, 196, 3);
  parchment(a.cv, 30, 4, 290, 50, 11);
  ['THE ROUND TUIT IS WHOLE AGAIN!', 'King Dillydally gets around to', 'everything at once. Even the roof.'].forEach((l, i) => a.text(160 - l.length * 4, 12 + i * 12, l, INK));
  const b = new Screen();
  sky(b.cv, [
    [0, [120, 180, 240]],
    [0.6, [230, 240, 250]],
  ]);
  hills(b.cv, 110, 8, [110, 170, 90], 3, [180, 220, 130]);
  b.cv.rect(0, 120, 320, 80, (x, y) => mix([90, 150, 70], [60, 110, 50], clamp01((y - 120) / 40 + tnoise(x, y, 10, 320, 7) * 0.15)));
  const cast: [Canvas, number][] = [
    [people('grandma'), 40],
    [people('docleo'), 80],
    [hero.get('down0')!, 120],
    [animals.get('teddy0')!, 155],
    [animals.get('gwinn0')!, 185],
    [people('tinker'), 220],
    [people('harbor'), 255],
    [people('librarian'), 290],
  ];
  for (const [s, x] of cast) stand(b.cv, s, x, 168, 2);
  const car = chezPics().get('carSide0')!;
  stand(b.cv, car, 160, 196, 2);
  parchment(b.cv, 14, 4, 306, 56, 12);
  ['A feast in the Garden Court!', 'Teddy rings the bell, Gwinn eats', 'the sausages, and Doc Leo juggles', 'three rubber chickens. One real.'].forEach((l, i) => b.text(160 - l.length * 4, 10 + i * 11, l, INK));
  return [a, b];
}

export function lostScreen(): Screen {
  const sc = new Screen();
  sky(sc.cv, [
    [0, [10, 8, 20]],
    [0.7, [50, 24, 50]],
  ]);
  stars(sc.cv, 90, 120, 4);
  tuit(sc.cv, 160, 80, 26, 0.3, 0.6);
  hills(sc.cv, 170, 8, [20, 16, 30], 2);
  stand(sc.cv, hero.get('down')!, 160, 190, 3);
  sc.centered(118, 'YOUR QUEST WILL HAVE TO WAIT', [240, 210, 220], 1, [0, 0, 0]);
  sc.centered(132, 'Lord Deadline wins... for now.', [200, 180, 200], 1, [0, 0, 0]);
  return sc;
}

/** The felt egg, close up, on a velvet cushion. */
export function eggScreen(): Screen {
  const sc = new Screen();
  sc.cv.shade((x, y) => mix([60, 30, 50], [16, 8, 16], clamp01(Math.hypot(x - 160, y - 90) / 190)));
  sc.cv.ellipse(160, 160, 80, 22, (x, y) => mix([140, 40, 60], [70, 16, 30], clamp01((y - 140) / 40 + (x - 80) / 400)));
  paintEgg(sc.cv, 160, 96, 110);
  sc.centered(6, 'THE HERALDRY EGG', (_x, y) => GOLD((y - 6) / 16), 2, [10, 6, 10]);
  sc.centered(188, 'found behind the falls', [230, 210, 220], 1, [0, 0, 0]);
  return sc;
}

export function gif(sc: Screen, inks: Inks = {}): Uint8Array {
  return sc.gif(inks);
}
export { SILVER };
