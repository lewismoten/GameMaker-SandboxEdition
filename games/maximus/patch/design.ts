// Maximus's embroidered patch, drawn as vector shapes for the generic stitch generator
// (web/packages/tools/src/embroidery): the Maximus Core, the forge-star at the heart of the galaxy, as a ten-point amber star
// (one point for each star-shard) with a shard-cyan kite in every notch and a white and ruby core, on the box's midnight navy.
// COURIER runs over the top rim and MAXIMUS under the bottom. Colors are the game's own: the box's navy and amber
// (about.json "label"), and the 'visor' and 'heart' ramps of src/art/palette.ts for the cyan and the ruby.
import { circle, star } from '@lewismoten/gamemaker-sandbox-tools/embroidery/geom';
import { arcText } from '@lewismoten/gamemaker-sandbox-tools/embroidery/strokeFont';
import type { Block, Design, Item, Poly, Pt, Thread } from '@lewismoten/gamemaker-sandbox-tools/embroidery/types';

/** Radius of the finished, cut-out patch (the satin border's outer edge), mm. */
export const RADIUS = 44;

const NAVY: Thread = { name: 'midnight navy', rgb: [0x0b, 0x10, 0x30], pec: 1 };
const AMBER: Thread = { name: 'amber gold', rgb: [0xf0, 0xa0, 0x20], pec: 58 };
const CYAN: Thread = { name: 'bright cyan', rgb: [40, 200, 240], pec: 32 };
const WHITE: Thread = { name: 'white', rgb: [255, 255, 255], pec: 29 };
const RUBY: Thread = { name: 'ruby red', rgb: [235, 30, 50], pec: 28 };

const deg = (a: number) => (a * Math.PI) / 180;
const polar = (r: number, a: number): Pt => [r * Math.cos(a), r * Math.sin(a)];

/** The ten shard kites, one in each notch between the star's points. */
function kites(): Poly[] {
  return Array.from({ length: 10 }, (_, k) => {
    const a = deg(90 + 18 + 36 * k);
    return [polar(17.8, a), polar(22.6, a + deg(5)), polar(27.2, a), polar(22.6, a - deg(5))];
  });
}

/** A small diamond that divides the two words of the rim. */
const diamond = (cx: number): Poly => [
  [cx, 3.2],
  [cx + 1.9, 0],
  [cx, -3.2],
  [cx - 1.9, 0],
];

function text(): Item[] {
  const common = { cx: 0, cy: 0, height: 5.2, gap: 1.5, stretch: 1.25 };
  const strokes = [...arcText('COURIER', { ...common, baseline: 34.0, side: 'top' }), ...arcText('MAXIMUS', { ...common, baseline: 39.2, side: 'bottom' })];
  return strokes.map((path): Item => ({ kind: 'satin', path, width: 1.1 }));
}

export function maximusPatch(): Design {
  const field: Block = { thread: NAVY, items: [{ kind: 'fill', polys: [circle(0, 0, 42, 120)], angle: 20 }] };
  const amber: Block = {
    thread: AMBER,
    items: [
      { kind: 'fill', polys: [star(0, 0, 15, 28, 10)], angle: 75 },
      { kind: 'satin', path: circle(0, 0, 31.6, 120), width: 1.2, closed: true },
      { kind: 'fill', polys: [diamond(-36.6)], angle: 90 },
      { kind: 'fill', polys: [diamond(36.6)], angle: 90 },
      // the merrow border: a thick satin edge all round, to cut along
      { kind: 'satin', path: circle(0, 0, RADIUS - 1.75, 160), width: 3.5, closed: true },
    ],
  };
  const cyan: Block = { thread: CYAN, items: kites().map((p, i): Item => ({ kind: 'fill', polys: [p], angle: i % 2 ? 130 : 40 })) };
  const white: Block = { thread: WHITE, items: [{ kind: 'fill', polys: [circle(0, 0, 9.4, 64)], angle: 110 }, ...text()] };
  const ruby: Block = {
    thread: RUBY,
    items: [
      { kind: 'satin', path: circle(0, 0, 10.3, 64), width: 1.2, closed: true },
      { kind: 'fill', polys: [circle(0, 0, 4.4, 48)], angle: 160 },
    ],
  };
  return { name: 'MAXIMUS PATCH', hoop: [100, 100], blocks: [field, amber, cyan, white, ruby] };
}

