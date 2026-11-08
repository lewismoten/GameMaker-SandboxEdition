// THE MOUNTAIN MOVED NEXT DOOR's levels in order, each at its time of the day (a story from dawn to the next
// sunrise). Scenes marked (watch) mostly play by themselves: walk along, read and look.
//   1. Next Door           (watch) dawn fog lifts off a mountain in the lot next door; it wakes and lifts its toe
//   2. Gate Hunt           climb the mountain's ledges for four garden gates; carry each home to its garden
//   3. Up Mossback's Back  six terraces, wobbly rocks on a clock; at the top no cloud, only a damp dent
//   4. Footprints          follow the prints back through the misty park; blaze every post and tree
//   5. The Library         four floors of shelves, overdue books put back, the almanac on mountains and clouds
//   6. Stepping Stones     rain; cross the stream four times on stones that sink and rise on a clock
//   7. Gathering Mist      a damp morning; three dells where Wisp's mist has pooled in beads; the mist stacks itself into steps on a clock
//   8. Nutmeg's Signposts  noon; three switchbacks; a squirrel turns the arrows, the blazes tell the truth
//   9. The Empty Spot      (watch) sunset in the hollow where the mountain stood; Wisp is missing
//  10. The Lookout         the last of the light; seven landings, loose boards out of step, the trail seen from the top
//  11. Windy Ridge         dusk; an updraft and a gust carry Tess up and over, following Wisp's trail of snow
//  12. Rooftops            after midnight; the snow runs over the roofs; chimney smoke lifts you on a clock
//  13. The Low Tunnel      dark; light the lanterns, leave a trail of light; glow-worms; Wisp is hiding here
//  14. Excuse Me           the sleeping town; the mountain walks behind Tess on its own clock; she clears bins, sheets and gates ahead of it
//  15. The Ford            moonlight; the mountain wading in sends waves down the river, and the waves carry Tess across
//  16. The Zigzag Home     moonlight; five switchbacks up the hill, a blaze on every turn, Wisp following
//  17. Summit Picnic       (watch) sunrise; the mountain home and sitting down; the neighbors climb up; the doormat
import { buildMountainPalette } from '../palette';
import type { Level } from '../level';
import { levelBack } from './back';
import { levelGates } from './gates';
import { levelPicnic } from './picnic';
import { levelPrints } from './prints';
import { levelHollow } from './hollow';
import { levelLibrary } from './library';
import { levelMist } from './mist';
import { levelExcuse } from './excuse';
import { levelFord } from './ford';
import { levelRidge } from './ridge';
import { levelSigns } from './signs';
import { levelStream } from './stream';
import { levelRoofs } from './roofs';
import { levelTower } from './tower';
import { levelTunnel } from './tunnel';
import { levelZigzag } from './zigzag';
import { levelNext } from './next';
import { restyle } from '../art/style';
import { dress, type DressOptions } from '../dress';

/** How each level is dressed (dress.ts): birds in the day, distant hills where the sky is wide. */
const DRESS: Record<string, DressOptions> = {
  gates: { birds: true },
  back: { birds: true },
  books: { indoor: true },
  tunnel: { indoor: true },
  roofs: {},
  prints: { birds: true, maples: true, far: { row: 9 } },
  stream: { maples: true, far: { row: 9 } },
  mist: { far: { row: 5 } },
  excuse: {},
  ford: {},
  signs: { birds: true },
  hollow: { far: { row: 7 } },
  tower: { far: { row: 59 } },
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
    levelMist(pal),
    levelSigns(pal),
    levelHollow(pal),
    levelTower(pal),
    levelRidge(pal),
    levelRoofs(pal),
    levelTunnel(pal),
    levelExcuse(pal),
    levelFord(pal),
    levelZigzag(pal),
    levelPicnic(pal),
  ];
  for (const l of levels) {
    restyle(l.book, pal, l.file === 'books' ? 'library' : l.file === 'tunnel' ? 'mouth' : 'cairn');
    dress(l, pal, DRESS[l.file]);
  }
  return { pal, levels };
}
