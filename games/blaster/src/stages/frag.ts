// Stage 4-A, "Fragmented File": the hard disk's diagonal leg, on the track builder (diagLeg.ts).
// Mom's recipe file lies in four fragments across the platter; the BLASTER follows it from its
// directory entry, round each kink onto the next fragment, 3, 2, 1, to EOF. Skulls dive down
// the track and loop across it, a Leak Slug hunts, records sit on the tracks, bad sectors
// spark and lost clusters let mites out. One gold cluster link jumps a fragment a lap early.
import { disc, keyOf, mite, skull, slug } from '../sprites/sprites';
import { buildPalette, type Pal } from '../art/pal';
import { fragArt, fragBlocks, fragEnd, fragParts, type FragMark } from '../blocks/frag';
import { mine, pics, stalker } from '../characters/enemies';
import type { Bestiary } from '../characters/mons';
import { DiagTrack } from './diagTrack';
import { diagFoes, diagLeg } from './diagLeg';
import type { Leg } from './stage';

const TRACK = new DiagTrack({ pitch: 25, lanes: 4, board: 11, kink: 75, first: 0, last: 3, startCols: [76, 77, 78], endCols: [85, 86, 87] });

/** The cluster link: [lap, first column, columns], onto the next fragment. */
const SHORTCUTS: [number, number, number][] = [[2, 36, 14]];

function virus(b: Bestiary, p: Pal): void {
  pics(b, 'skull', ...skull(keyOf(p, { main: 'virus', accent: 'red' })));
  pics(b, 'mite', ...mite(keyOf(p, { main: 'slime', accent: 'red' })));
  pics(b, 'slug', ...slug(keyOf(p, { main: 'virus', accent: 'gold' })));
  pics(b, 'disc', ...disc(p, { main: 'virus', accent: 'slime' }));
  // Skulls both dive down the track and cross it (the same picture)
  diagFoes(b, p, { diver: 'skull', swooper: 'skullX', mite: 'mite', score: 160, speed: 5, crossPic: 'skull' });
  stalker(b, 'slug', { hp: 4, speed: 1, score: 400 });
  mine(b, 'disc', { hp: 3, score: 150 });
}

export function fragLeg(): Leg {
  const pal = buildPalette('disk');
  const k = TRACK;
  const mid = 18;
  return diagLeg<FragMark>({
    file: 's4r',
    title: 'Fragmented File',
    card: ["Mom's recipes, in four bits!", 'Follow the file, 3, 2, 1,', 'to EOF. The gold link jumps', 'a fragment: hold RIGHT.'],
    seed: 441,
    pal,
    art: fragArt(pal, k),
    track: k,
    blocks: (bs) => fragBlocks(bs, pal, k),
    virus: (b) => virus(b, pal),
    ends: { prefix: 'end', start: (rows) => fragEnd(pal, rows, 'dir'), end: (rows) => fragEnd(pal, rows, 'eof') },
    parts: fragParts(pal),
    partCount: 160,
    plain: { x: 30, y: 85 },
    decorate: ({ mark }) => {
      for (let lap = 1; lap <= 3; lap++) {
        for (const x of [8, 44]) mark(lap, x, mid, `digit${4 - lap}`);
        for (const x of [20, 32, 56, 68]) mark(lap, x, mid, 'arrow');
        for (const x of lap === 3 ? [80] : [84, 94]) mark(lap, x, mid, 'arrow');
      }
      for (const x of [92, 96]) mark(0, x, mid, 'arrow');
      for (const [lap, x, o, m] of [
        [1, 24, mid, 'bad'],
        [1, 56, mid + 3, 'lost'],
        [1, 70, mid - 3, 'bad'],
        [2, 16, mid - 3, 'lost'],
        [2, 54, mid + 2, 'bad'],
        [2, 66, mid, 'lost'],
        [3, 20, mid + 3, 'bad'],
        [3, 44, mid - 3, 'lost'],
        [3, 62, mid, 'bad'],
      ] as [number, number, number, FragMark][])
        mark(lap, x, o, m);
    },
    shortcuts: SHORTCUTS,
    shortcutMark: 'link',
    pickups: [
      [0, 92, 'bit'],
      [0, 95, 'bit'],
      [1, 36, 'nova'],
      [1, 64, 'bit'],
      [2, 28, 'repair'],
      [2, 74, 'bit'],
      [3, 32, 'nova'],
      [3, 54, 'repair'],
      [3, 70, 'life'],
    ],
    pickupO: mid,
    foes: [
      [1, 12, 15, 'skull'],
      [1, 18, 13, 'skullX'],
      [1, 30, 20, 'skull'],
      [1, 40, 17, 'disc'],
      [1, 48, 13, 'skullX'],
      [1, 52, 21, 'skull'],
      [1, 64, 14, 'skull'],
      [1, 72, 13, 'skullX'],
      [2, 10, 19, 'skull'],
      [2, 20, 13, 'skullX'],
      [2, 30, 21, 'disc'],
      [2, 40, 16, 'slug'],
      [2, 50, 13, 'skullX'],
      [2, 60, 20, 'skull'],
      [2, 70, 15, 'skull'],
      [3, 10, 13, 'skullX'],
      [3, 16, 20, 'skull'],
      [3, 26, 16, 'disc'],
      [3, 36, 13, 'skullX'],
      [3, 40, 19, 'skull'],
      [3, 50, 15, 'slug'],
      [3, 58, 13, 'skullX'],
      [3, 66, 20, 'skull'],
      [3, 72, 16, 'skull'],
    ],
    start: [0, 86, mid],
    cardView: { x: 68, dy: 3 },
  });
}
