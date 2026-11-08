// THE MOUNTAIN MOVED NEXT DOOR's levels in order, each at its time of the day (a story from dawn to the next
// sunrise). Scenes marked (watch) mostly play by themselves: walk along, read and look.
//   1. Next Door           (watch) dawn fog lifts off a mountain in the lot next door; it wakes and lifts its toe
//   2. Gate Hunt           climb the mountain's ledges for four garden gates; carry each home to its garden
//   3. Footprints          follow the prints back through the misty park; blaze every post and tree
//   4. Stepping Stones     rain; cross the stream four times on stones that sink and rise on a clock
//   5. Nutmeg's Signposts  noon; three switchbacks; a squirrel turns the arrows, the blazes tell the truth
//   6. The Empty Spot      (watch) sunset in the hollow where the mountain stood; stars come out; Wisp is missing
//   7. Windy Ridge         dusk; an updraft and a gust carry Tess up and over, following Wisp's trail of snow
//   8. The Low Tunnel      dark; light the lanterns, leave a trail of light; glow-worms; Wisp is hiding here
//   9. The Zigzag Home     moonlight; five switchbacks up the hill, a blaze on every turn, Wisp following
//  10. Summit Picnic      (watch) sunrise; the mountain home and sitting down; the neighbors climb up; the doormat
import { buildMountainPalette } from '../palette';
import type { Level } from '../level';
import { levelBack } from './back';
import { levelGates } from './gates';
import { levelPicnic } from './picnic';
import { levelPrints } from './prints';
import { levelHollow } from './hollow';
import { levelLibrary } from './library';
import { levelRidge } from './ridge';
import { levelSigns } from './signs';
import { levelStream } from './stream';
import { levelTunnel } from './tunnel';
import { levelZigzag } from './zigzag';
import { levelNext } from './next';
import { dress, type DressOptions } from '../dress';

/** How each level is dressed (dress.ts): birds in the day, distant hills where the sky is wide. */
const DRESS: Record<string, DressOptions> = {
  gates: { birds: true },
  back: { birds: true },
  books: { indoor: true },
  tunnel: { indoor: true },
  prints: { birds: true, maples: true, far: { row: 9 } },
  stream: { maples: true, far: { row: 9 } },
  signs: { birds: true },
  hollow: { far: { row: 7 } },
  ridge: { far: { row: 20 } },
  picnic: { birds: true, far: { row: 7 } },
};

/** The base palette and every level. */
export function buildLevels(): { pal: ReturnType<typeof buildMountainPalette>; levels: Level[] } {
  const pal = buildMountainPalette();
  const levels: Level[] = [
    levelNext(pal),
    levelGates(pal),
    levelBack(pal),
    levelPrints(pal),
    levelLibrary(pal),
    levelStream(pal),
    levelSigns(pal),
    levelHollow(pal),
    levelRidge(pal),
    levelTunnel(pal),
    levelZigzag(pal),
    levelPicnic(pal),
  ];
  for (const l of levels) dress(l, pal, DRESS[l.file]);
  return { pal, levels };
}
