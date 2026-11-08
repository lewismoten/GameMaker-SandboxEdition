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
//   9. The Survey Line     noon; three plank decks over the gully, loose boards out of step
//  10. Hale's Orchard      the afternoon; three terraces of windfall apples, the orchard's gates swinging on a clock
//  11. The Empty Spot      (watch) sunset in the hollow where the mountain stood; Wisp is missing
//  12. The Lookout         the last of the light; seven landings, loose boards out of step, the trail seen from the top
//  13. Windy Ridge         dusk; an updraft and a gust carry Tess up and over, following Wisp's trail of snow
//  14. The Spillway        dusk; five terraces of stepping-stone pools, down by ladders
//  15. The Lamplighter's Stair  the blue hour; four terraces of lamps to light, the alleys bridged by fog steps on a clock
//  16. Rooftops            after midnight; the snow runs over the roofs; chimney smoke lifts you on a clock
//  17. The Low Tunnel      dark; light the lanterns, leave a trail of light; glow-worms; Wisp is hiding here
//  18. Excuse Me           the sleeping town; the mountain walks behind Tess on its own clock; she clears bins, sheets and gates ahead of it
//  19. The Bell Loft       three in the morning; seven floors, warm smoke lifts you, snow to pack the bell
//  20. The Records Cellar  the town hall basement, no windows; the air stays lit behind you; a dead end and the deed
//  21. The Ford            moonlight; the mountain wading in sends waves down the river, and the waves carry Tess across
//  22. The Zigzag Home     moonlight; five switchbacks up the hill, a blaze on every turn, Wisp following
//  23. The Frozen Tarn     the cold hour before dawn; two reaches of tipping ice plates and a wave
//  24. Summit Picnic       (watch) sunrise; the mountain home and sitting down; the neighbors climb up; the doormat
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
import { levelSurvey } from './survey';
import { levelClock } from './clock';
import { levelOrchard } from './orchard';
import { levelLamps } from './lamps';
import { levelTarn } from './tarn';
import { levelVault } from './vault';
import { levelSpillway } from './spillway';
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
  clock: {},
  spill: {},
  grove: { birds: true },
  lamps: {},
  tarn: {},
  vault: { indoor: true },
  ford: {},
  signs: { birds: true },
  survey: { birds: true },
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
    levelSurvey(pal),
    levelOrchard(pal),
    levelHollow(pal),
    levelTower(pal),
    levelRidge(pal),
    levelSpillway(pal),
    levelLamps(pal),
    levelRoofs(pal),
    levelTunnel(pal),
    levelExcuse(pal),
    levelClock(pal),
    levelVault(pal),
    levelFord(pal),
    levelZigzag(pal),
    levelTarn(pal),
    levelPicnic(pal),
  ];
  for (const l of levels) {
    restyle(l.book, pal, l.file === 'books' ? 'library' : l.file === 'tunnel' ? 'mouth' : 'cairn');
    dress(l, pal, DRESS[l.file]);
  }
  return { pal, levels };
}
