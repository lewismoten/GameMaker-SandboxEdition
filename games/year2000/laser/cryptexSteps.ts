// "In The Year 2000!" cryptex assembly sheet: ordered cards drawn from the real cut outlines, then the lock itself (the
// ridge in a washer's notch, aligned and turned) and how to change the combination. Not a cutting template.
import { CORE, COMBO, STEP, coreShape, washerHole, decagon, WASHER } from './cryptexDims';
import { rotate } from '@lewismoten/gamemaker-sandbox-tools/kit/laserJoints';
import type { Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { makeParts } from './cryptexParts';

const cards = [
  {
    title: '1. Base',
    parts: ['BASE', 'PK'],
    lines: ['Glue the four PK plates on BASE, one on', 'another, their ridge slots lined up and', 'on the side of the marker (right).'],
  },
  {
    title: '2. Core',
    parts: ['CORE0', 'CORER', 'COREC'],
    lines: ['Glue 12 slices: the closed one at the bottom,', 'then the two ridge slices (ridges lined up),', 'then nine round ones. No glue in the hole.'],
  },
  {
    title: '3. Washers',
    parts: ['WASH'],
    lines: ['Glue the eight washers in pairs: four,', 'each 6 mm thick. Keep glue out of the bore', 'and the notch. They stay loose in the rings.'],
  },
  {
    title: '4. Rings',
    parts: ['R1T', 'R1B', 'R4T'],
    lines: ['Glue each ring: the T slice (digits) over', 'its plain B slice, the holes lined up.', 'Ring 1 is the smallest. No glue on the washers.'],
  },
  {
    title: '5. Stack',
    parts: ['PK', 'R4T', 'R1T'],
    lines: ['Stand the core in the base, ridge to the', 'marker. Slide on ring 4, then 3, 2, 1. For each,', 'seat its washer (next card), then the next ring.'],
  },
  {
    title: '6. Head and lid',
    parts: ['HEAD', 'LID', 'LIDP'],
    lines: ['Glue the head on the core, on top of the', 'rings. Glue two plugs under the lid. Roll a note', 'and slip it in the core; press the lid in.'],
  },
];

function cardsSvg(kerf: number): string {
  const parts = makeParts(kerf);
  return cards
    .map((c, i) => {
      const x = 20 + (i % 2) * 375;
      const y = 62 + Math.floor(i / 2) * 190;
      const width = 330 / c.parts.length;
      const shapes = c.parts
        .map((name, j) => {
          const p = parts[name].part;
          const svg = p.sheet
            .svg(name)
            .replace(/<\?xml[^>]*>/g, '')
            .replace(/#FF0000/gi, '#644321')
            .replace(/stroke-width="0\.1"/g, 'stroke-width="1.2"')
            .replace(/ id="[^"]*"/g, '')
            .trim();
          return `<svg x="${j * width}" y="12" width="${width - 5}" height="82" viewBox="0 0 ${p.sheet.w} ${p.sheet.h}" preserveAspectRatio="xMidYMid meet">${svg.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg><text x="${(j + 0.5) * width}" y="110" text-anchor="middle" font-size="11">${name}</text>`;
        })
        .join('');
      return `<g transform="translate(${x} ${y})"><text font-size="15" font-weight="bold">${c.title}</text>${shapes}${c.lines.map((l, j) => `<text y="${133 + j * 15}" font-size="11">${l}</text>`).join('')}</g>`;
    })
    .join('');
}

const path = (pts: readonly Pt[], s: number, ox: number, oy: number) =>
  'M' + pts.map(([x, y]) => `${(ox + x * s).toFixed(1)} ${(oy + y * s).toFixed(1)}`).join('L') + 'Z';

/** A washer at 5 px per mm with the core's ridge (red) in it, the washer turned by `deg`. */
function gateSvg(deg: number, label: string): string {
  const s = 5;
  const o = 100;
  const turn = (pts: readonly Pt[]) => pts.map((p) => rotate(p, [0, 0], deg));
  return `<g><text x="${o}" y="14" text-anchor="middle" font-size="11">${label}</text>
<path d="${path(turn(decagon(WASHER.apothem)), s, o, o + 10)}${path(turn(washerHole()), s, o, o + 10)}" fill="#e9dcc3" fill-rule="evenodd" stroke="#644321" stroke-width="1"/>
<path d="${path(coreShape(), s, o, o + 10)}" fill="#c0301f" fill-opacity="0.85"/>
<polygon points="${o + 92},${o + 10} ${o + 104},${o + 4} ${o + 104},${o + 16}" fill="#e07a10" transform="translate(0 0)"/></g>`;
}

export function assemblySvg(kerf = 0.2): string {
  const w = 900;
  const h = 900;
  const code = COMBO.join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="sans-serif" fill="#222" role="img" aria-label="Cryptex assembly steps and lock">
<rect width="${w}" height="${h}" fill="#fff"/>
<text x="20" y="24" font-size="18" font-weight="bold">In The Year 2000! cryptex: assembly and lock</text>
<text x="20" y="42" font-size="11">Part outlines match the cut sheets. Glue only what the cards say; the rings, washers and core stay loose. Not cutting templates.</text>
${cardsSvg(kerf)}
<g transform="translate(20 640)"><text font-size="15" font-weight="bold">The lock: the ridge and a washer's notch (to scale)</text>
<text y="16" font-size="11">Red: the core's ridge, at the marker. The washer is a ring's inner part.</text>
<g transform="translate(0 24)">${gateSvg(0, 'Notch at the marker: the ridge passes')}</g>
<g transform="translate(200 24)">${gateSvg(STEP, 'One digit off: the washer stops it')}</g></g>
<g transform="translate(430 640)"><text font-size="15" font-weight="bold">Setting and changing the combination</text>
<text y="18" font-size="11">Seat each washer so its notch lies under the ring's digit you want.</text>
<text y="33" font-size="11">Ring 1 (the smallest, on top) is the first digit and ring 4 the last,</text>
<text y="48" font-size="11">read outward along the marker. It is set to ${code}: ring 1 at 2, the rest at 0.</text>
<text y="68" font-size="11">To change it: pull the core (dial ${code}), lift ring 1 off, lift the washer out of ring 2,</text>
<text y="83" font-size="11">turn it to the new digit, drop it back; work down to ring 4. Put the rings back</text>
<text y="98" font-size="11">in order. Each washer can sit ten ways, one per digit: 10,000 combinations.</text>
<text y="122" font-size="11">The ridge is ${CORE.ridgeHw * 2} mm wide, the notch ${WASHER.notchHw * 2} mm: a ring only has to be near its digit</text>
<text y="137" font-size="11">(about 5 degrees), not exact. There are no detents, so look at the marker.</text></g>
<text x="20" y="${h - 14}" font-size="10">Stack height 36 mm: four pocket plates (12), four rings of two slices (24). The core is 12 slices; the head sits on top.</text>
</svg>`;
}
