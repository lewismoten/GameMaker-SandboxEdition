// Stage 1-B, "Copper Traces": the motherboard's diagonal leg, on the track builder
// (diagLeg.ts). Four wide copper traces run corner to corner from an edge pad to the chipset;
// each lap ends where its trace bends flat at the kink and carries on round the wrap as the
// next trace down, and the silkscreen counts the traces left: 3, 2, 1. It teaches the turned
// keys gently: wide lanes, slow virus, one jumper wire that hops a trace a lap early.
import { biter, cluster, keyOf, mite, moth } from '../sprites/sprites';
import { buildPalette } from '../art/pal';
import { chipEnd, edgePad, traceArt, traceBlocks, type TraceMark } from '../blocks/traces';
import { boardParts } from '../blocks/cable';
import { mine, pics } from '../characters/enemies';
import type { Bestiary } from '../characters/mons';
import type { Pal } from '../art/pal';
import { DiagTrack } from './diagTrack';
import { diagFoes, diagLeg } from './diagLeg';
import type { Leg } from './stage';

const TRACK = new DiagTrack({ pitch: 25, lanes: 4, board: 10, kink: 75, first: 0, last: 3, startCols: [76, 77, 78], endCols: [85, 86, 87] });

/** The traces' virus: the motherboard's own, turned to the slant. */
function virus(b: Bestiary, p: Pal): void {
  pics(b, 'biter', ...biter(keyOf(p, { main: 'slime', accent: 'virus' })));
  pics(b, 'moth', ...moth(keyOf(p, { main: 'pink', accent: 'virus' })));
  pics(b, 'mite', ...mite(keyOf(p, { main: 'virus', accent: 'slime' })));
  pics(b, 'cluster', ...cluster(p, { main: 'virus', accent: 'cyan' }));
  // Byte Biters dive down the trace, Glitch Moths flutter across it
  diagFoes(b, p, { diver: 'biter', swooper: 'moth', mite: 'mite' });
  mine(b, 'cluster');
}

export function tracesLeg(): Leg {
  const pal = buildPalette('cable');
  const k = TRACK;
  // the middle line of a trace, where the pickups' pads and the marks go
  const mid = 17;
  return diagLeg<TraceMark>({
    file: 's1r',
    title: 'Copper Traces',
    card: ['Corner to corner! The keys', 'turn: UP goes faster along', 'the trace. Ride 3, 2, 1 to', 'the chip. Jumper: hold RIGHT'],
    seed: 141,
    pal,
    art: traceArt(pal, k),
    track: k,
    blocks: (bs) => traceBlocks(bs, pal, k),
    virus: (b) => virus(b, pal),
    ends: { prefix: 'pad', start: (rows) => edgePad(pal, rows), end: (rows) => chipEnd(pal, rows) },
    parts: boardParts(pal).map(([name, w, h, pic]) => [name, w, h, pic, name === 'trace']),
    partCount: 150,
    // plain mask: trace 0's slant has no copper
    plain: { x: 30, y: 85 },
    decorate: ({ mark }) => {
      for (let lap = 1; lap <= 3; lap++) {
        for (const x of [8, 44]) mark(lap, x, mid, `digit${4 - lap}`);
        for (const x of [20, 32, 56, 68]) mark(lap, x, mid, 'chevron');
        for (const x of lap === 3 ? [84] : [86, 94]) mark(lap, x, mid, 'chevron');
      }
      for (const x of [92, 96]) mark(0, x, mid, 'chevron');
      // pits in the copper: vias that spark, cracks that let mites out
      // the silkscreen and bits of copper along the buses, between everything else
      const silk: TraceMark[] = ['silkR12', 'silkC7', 'silkU3', 'silkR4', 'silkC22', 'silkQ1'];
      for (let lap = 1; lap <= 3; lap++)
        for (const [i, x] of [14, 28, 38, 50, 62, 72].entries()) {
          const o = mid + (i % 2 ? 4 : -4);
          mark(lap, x, o, i % 3 === 0 ? silk[(lap * 2 + i) % silk.length] : i % 3 === 1 ? 'pad' : lap === 2 && i === 5 ? 'tp' : 'pad');
        }
      for (const [lap, x0] of [
        [1, 54],
        [3, 22],
      ])
        for (let x = x0; x < x0 + 4; x++) for (let o = mid - 2; o <= mid + 2; o++) mark(lap, x, o, 'hatch');
      for (const [lap, x, o, m] of [
        [1, 26, mid, 'via'],
        [1, 62, mid + 3, 'crack'],
        [2, 18, mid - 3, 'crack'],
        [2, 50, mid, 'via'],
        [3, 30, mid + 3, 'via'],
        [3, 58, mid - 3, 'crack'],
      ] as [number, number, number, TraceMark][])
        mark(lap, x, o, m);
    },
    shortcuts: SHORTCUTS,
    shortcutMark: 'jumper',
    pickups: [
      [0, 92, 'bit'],
      [0, 95, 'bit'],
      [1, 36, 'bit'],
      [1, 38, 'bit'],
      [1, 70, 'nova'],
      [2, 30, 'repair'],
      [2, 64, 'bit'],
      [3, 40, 'life'],
      [3, 70, 'bit'],
    ],
    pickupO: mid,
    foes: [
      [1, 12, 14, 'biter'],
      [1, 20, 12, 'moth'],
      [1, 46, 18, 'cluster'],
      [1, 52, 13, 'biter'],
      [1, 66, 12, 'moth'],
      [2, 12, 19, 'biter'],
      [2, 24, 12, 'moth'],
      [2, 36, 16, 'cluster'],
      [2, 42, 20, 'biter'],
      [2, 58, 12, 'moth'],
      [2, 70, 15, 'biter'],
      [3, 12, 13, 'moth'],
      [3, 20, 19, 'biter'],
      [3, 36, 15, 'cluster'],
      [3, 46, 12, 'moth'],
      [3, 52, 18, 'biter'],
      [3, 64, 14, 'biter'],
      [3, 74, 12, 'moth'],
    ],
    start: [0, 86, mid],
    cardView: { x: 68, dy: 3 },
  });
}

/** The jumper: [lap, first column, columns], into the next trace down. */
const SHORTCUTS: [number, number, number][] = [[2, 40, 14]];
