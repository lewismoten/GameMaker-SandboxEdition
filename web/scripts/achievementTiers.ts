// The nine "every game" tier badges (every-life/loss/win at 1, 3 and 10): one friendly Teddy pose each, from
// games/teddy/src/sprites/teddy.ts (hop = a life lost mid-landing, hurt = a loss, bark = a win), on a plate
// whose frame is bronze, silver or gold, with the tier shown as 1, 3 or "10" in the corner Teddy leaves free.
import { POSES } from '../../games/teddy/src/sprites/teddy';
import { P } from '../../games/teddy/src/art/pal';
import { micro } from '@lewismoten/gamemaker-sandbox-tools/kit/microText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

const CLEAR = 255;
/** Each kind's pose, and the frame color of each tier (palette indices from Teddy's ramps). */
const POSE = { life: 'hop', loss: 'hurt', win: 'bark' } as const;
const TIERS: { times: number; plate: number; edge: number }[] = [
  { times: 1, plate: P.c('dirt', 4), edge: P.c('dirt', 2) },
  { times: 3, plate: P.c('metal', 3), edge: P.c('metal', 1) },
  { times: 10, plate: P.c('gold', 2), edge: P.c('gold', 0) },
];
const INK = P.c('ink', 0);

/** The mark's box (w x 5) goes in whichever corner has the fewest Teddy pixels under it. */
function markCorner(pose: Pixels, w: number): [number, number] {
  const corners: [number, number][] = [
    [2, 2],
    [18 - w, 2],
    [2, 13],
    [18 - w, 13],
  ];
  const busy = ([x, y]: [number, number]) => {
    let n = 0;
    for (let yy = y - 1; yy < y + 6; yy++) for (let xx = x - 1; xx < x + w + 1; xx++) if (pose.get(xx, yy) !== CLEAR) n++;
    return n;
  };
  return corners.reduce((best, c) => (busy(c) < busy(best) ? c : best));
}

function tierBadge(kind: keyof typeof POSE, tier: (typeof TIERS)[number]): Pixels {
  const pose = POSES[POSE[kind]];
  const p = new Pixels(20, 20, tier.plate);
  const w = tier.times === 10 ? 7 : tier.times === 3 ? 8 : 2;
  const [mx, my] = markCorner(pose, w);
  p.blit(pose, 0, 0, CLEAR);
  p.frame(0, 0, 20, 20, tier.edge);
  for (const [x, y] of [
    [0, 0],
    [19, 0],
    [0, 19],
    [19, 19],
  ])
    p.set(x, y, INK);
  if (tier.times === 10) {
    micro(p, mx, my, '10', INK);
  } else {
    for (let i = 0; i < tier.times; i++) p.rect(mx + i * 3, my, 2, 5, INK);
  }
  return p;
}

/** Block name `every-<kind>-<times>` -> badge picture, drawn in Teddy's palette. */
export function tierBlocks(): Map<string, Pixels> {
  const out = new Map<string, Pixels>();
  for (const kind of Object.keys(POSE) as (keyof typeof POSE)[]) for (const t of TIERS) out.set(`every-${kind}-${t.times}`, tierBadge(kind, t));
  return out;
}
export const tierPalette = P.pal;
