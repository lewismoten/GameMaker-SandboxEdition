// HOME.BBL: the station blocks with eleven furnishings the training deck never shows traded for the
// pod bay's clearance gate (STATION.BBL is full to its 150 blocks): three hatches, each wearing a
// clearance code from the Star Wheel (wheel/wheel.ts), the open doorway the right one leaves, and
// the clerk's window.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { SOLID, TOP, type SetBuilder } from './blockset';
import { stationSet } from './station';
import { panel } from './stationArt';
import { R } from './common';
import { OUTLINE, S, WHITE } from '../art/palette';
import { GLYPHS, HATCHES, HATCH_OPEN } from '../wheel/wheel';

/** A hatch 20 by 40: steel, rivets, hazard stripes, and a dark plate with its code in glowing ink. */
export function hatchPicture(code: string): Pixels {
  const t = R('tech');
  const g = R('glow');
  const hz = R('hazard');
  const p = new Pixels(20, 40, t[3]);
  for (let y = 0; y < 40; y++)
    for (let x = 0; x < 20; x++) p.set(x, y, x === 0 || y === 0 ? t[5] : x === 19 || y === 39 ? t[1] : (x * 3 + y * 5) % 11 === 0 ? t[2] : t[3]);
  for (let x = 0; x < 20; x++) {
    p.set(x, 1, (x + 1) % 6 < 3 ? hz[3] : OUTLINE);
    p.set(x, 2, (x + 1) % 6 < 3 ? hz[3] : OUTLINE);
    p.set(x, 37, (x + 3) % 6 < 3 ? hz[3] : OUTLINE);
    p.set(x, 38, (x + 3) % 6 < 3 ? hz[3] : OUTLINE);
  }
  p.rect(1, 9, 18, 22, OUTLINE);
  p.frame(0, 8, 20, 24, t[5]);
  // the code, nine squares of two pixels
  const rows = GLYPHS[code];
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '#') p.rect(1 + x * 2, 11 + y * 2, 2, 2, g[4]);
    }),
  );
  for (const [x, y] of [
    [3, 5],
    [16, 5],
    [3, 34],
    [16, 34],
  ] as const)
    p.set(x, y, WHITE);
  return p;
}

/** The doorway the right hatch leaves: the hatch slid into the wall, a strip of light along its edge. */
function openPicture(): Pixels {
  const t = R('tech');
  const g = R('glow');
  const p = new Pixels(20, 40, 0);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 20; x++) p.set(x, y, panel(88).get(x, y % 20));
  for (let y = 0; y < 40; y++) {
    p.rect(0, y, 4, 1, y % 4 === 0 ? t[1] : t[4]);
    p.set(4, y, g[3]);
  }
  return p;
}

/** The clerk's window: a lit pane, a clerk in a visor, a counter and a bell. */
function windowPicture(): Pixels {
  const t = R('tech');
  const g = R('glow');
  const p = new Pixels(20, 40, 0);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 20; x++) p.set(x, y, panel(89).get(x, y % 20));
  p.rect(1, 3, 18, 28, OUTLINE);
  p.rect(2, 4, 16, 26, g[1]);
  p.rect(2, 4, 16, 8, g[2]);
  p.disc(10, 14, 4, 0);
  p.disc(10, 14, 3, S('suit', 3));
  p.rect(7, 13, 6, 2, OUTLINE);
  p.rect(5, 19, 10, 10, t[3]);
  p.rect(3, 26, 14, 5, t[5]);
  p.rect(3, 26, 14, 1, WHITE);
  p.rect(14, 24, 3, 2, g[4]);
  p.frame(1, 3, 18, 28, t[5]);
  p.rect(0, 31, 20, 2, t[1]);
  return p;
}

/** Slices a 20 by 40 picture into its top and bottom blocks. */
const halves = (p: Pixels): [Pixels, Pixels] => [p.crop(0, 0, 20, 20), p.crop(0, 20, 20, 20)];

export function homeSet(): SetBuilder {
  const s = stationSet();
  const spare = ['bunk', 'locker', 'table', 'robotarm', 'cables', 'catwalk', 'tank', 'girder:v', 'plant:2', 'sign:exit', 'sign:up'];
  const take = () => spare.shift()!;
  HATCHES.forEach((code, k) => {
    const [top, bot] = halves(hatchPicture(code));
    // only the right hatch is a wall until touched (it opens as Max leans on it); a wrong one is not
    // solid, so Max walks into it, and that touch is a link to its page
    const right = k === HATCH_OPEN;
    // (the bottom one's upper half is a sill, solid from above, so Max stands on it as he goes through the middle one)
    s.swap(take(), `hatch:${k}:t`, top, right ? { solid: SOLID, touch: 'hatch:open:t' } : k === 0 ? { solid: TOP } : {});
    s.swap(take(), `hatch:${k}:b`, bot, right ? { solid: SOLID, touch: 'hatch:open:b' } : {});
  });
  const [ot, ob] = halves(openPicture());
  s.swap(take(), 'hatch:open:t', ot);
  s.swap(take(), 'hatch:open:b', ob);
  const [wt, wb] = halves(windowPicture());
  s.swap(take(), 'clerk:t', wt);
  s.swap(take(), 'clerk:b', wb);
  return s;
}
