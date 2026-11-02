// How far apart two versions of a game draw: each adventure scene's 100x100 map is rendered in its own
// palette, and every pixel that differs is scored in CIELAB delta E (tools/color-reduce). Used by the
// pack plan to say what its color reductions cost, and by optimize:proof to check it.
import { ADVTYPE, parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { labOf } from '@lewismoten/gamemaker-sandbox-tools/color-reduce';
import type { GameFiles } from '../../project/files';
import { scenePixels } from '../../gfx/levelPicture';

export interface SceneDelta {
  /** Mean delta E over the pixels that changed (0 when none did). */
  mean: number;
  worst: number;
  /** Pixels that draw in a different color. */
  changed: number;
}

export function sceneDelta(before: GameFiles, after: GameFiles, gam: string): SceneDelta {
  const draw = (f: GameFiles) => parseGame(f.get(gam)!).scenes.map((s) => (s.gametype === ADVTYPE ? scenePixels(f, s, 0, 0, 100, 100) : undefined));
  const [a, b] = [draw(before), draw(after)];
  let worst = 0;
  let sum = 0;
  let changed = 0;
  a.forEach((x, i) => {
    const y = b[i];
    if (!x || !y) return;
    for (let k = 0; k < x.pixels.length; k++) {
      const [u, v] = [x.pixels[k], y.pixels[k]];
      if ([0, 1, 2].every((c) => x.palette[u * 3 + c] === y.palette[v * 3 + c])) continue;
      const [l1, l2] = [labOf(x.palette, u), labOf(y.palette, v)];
      const d = Math.hypot(l1[0] - l2[0], l1[1] - l2[1], l1[2] - l2[2]);
      worst = Math.max(worst, d);
      sum += d;
      changed++;
    }
  });
  return { mean: changed ? sum / changed : 0, worst, changed };
}
