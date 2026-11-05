// Draws the pictures the manual's "How this level is made" pages show (the five brightnesses of air, rock and floor, the
// palette's three ramps, a block that lights when touched, a dark twin and its bulbs) into manual.json, in the figures
// marked <figure data-frames="name">. Run it again whenever the art changes (it replaces what the figures hold), then
// format the file.
//   cd web && npx vite-node ../games/lights-out/tools/manual.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { fillFigures, framesFigure } from '../../kit/starter/framesSvg';
import { BULB_TICKS, LIGHTS_AT, buildLevels } from '../src/levels';

const { levels } = buildLevels();
const [lanterns, tunnel, hall] = levels;
const pal = lanterns.pal;
const pic = (l: (typeof levels)[number], name: string): Pixels => {
  const p = l.book.pics.get(name);
  if (!p) throw new Error(`No block ${name} in ${l.file}`);
  return p;
};
/** The five brightnesses of a kind of block (of its first layout this level uses at that brightness). */
const shades = (prefix: string) =>
  framesFigure(
    pal,
    [0, 1, 2, 3, 4].flatMap((k) => {
      const name = [`${prefix}.${k}`, `${prefix}.${k}.0`, `${prefix}.${k}.1`].find((n) => lanterns.book.pics.has(n));
      return name ? [{ pic: pic(lanterns, name), label: name }] : []; // a floor is never closer than two blocks to a lamp: no brightness 4
    }),
    3,
  );
/** The three ramps as swatches, each 20 pixels square with its name and number under it. */
const ramps = () =>
  framesFigure(
    pal,
    ['cair', 'crock', 'cfloor'].flatMap((name) => pal.r(name).map((c, k) => ({ pic: new Pixels(20, 20, c), label: `${name} ${k}` }))),
    2,
  );
const twin = hall.timed.find((t) => /^floor\.3\.\d\.dark$/.test(t.name));
if (!twin) throw new Error('no floor twin in the hall');
const figures = {
  airShades: shades('air'),
  rockShades: shades('rock'),
  floorShades: shades('floor'),
  ramps: ramps(),
  touch: framesFigure(
    tunnel.pal,
    [
      { pic: pic(tunnel, 'tdark.4'), label: 'tdark.4: touch it' },
      { pic: pic(tunnel, 'tlit.4'), label: 'tlit.4: lit' },
    ],
    4,
  ),
  twins: framesFigure(
    hall.pal,
    [
      { pic: pic(hall, twin.name), label: `${twin.name}, ${twin.ticks} ticks` },
      { pic: pic(hall, twin.next), label: twin.next },
      { pic: pic(hall, 'lantern.dark'), label: `lantern.dark, ${LIGHTS_AT} ticks` },
      { pic: pic(hall, 'lantern'), label: 'lantern' },
    ],
    3,
  ),
  bulbs: framesFigure(
    hall.pal,
    [0, 1, 2, 3, 4, 5].flatMap((k) => [
      { pic: pic(hall, `bulb.${k}.off`), label: `bulb.${k}.off, ${BULB_TICKS * (k + 1)} ticks` },
      { pic: pic(hall, `bulb.${k}`), label: `bulb.${k}` },
    ]),
    2,
  ),
};
const file = new URL('../manual.json', import.meta.url);
const manual = JSON.parse(readFileSync(file, 'utf8')) as { pages: { html: string }[] };
for (const page of manual.pages) page.html = fillFigures(page.html, figures);
writeFileSync(file, JSON.stringify(manual, null, 2) + '\n');
console.log('manual.json: pictures drawn');
