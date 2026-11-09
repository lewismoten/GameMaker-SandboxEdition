// Plowed Street assembly sheet: six ordered cards drawn from the actual cut outlines, then the lock: the street map with
// the way to LaVale Mall marked, and the plate above the drawer's lug when locked and when the plow reaches the mall.
import { MALL, PITCH, START, STREET, STREETS, cellX, cellY, channelX, lug, maze, plate, streetRects } from './plowedDims';
import { makeParts } from './plowedParts';

const cards = [
  { title: '1. Box', parts: ['P', 'K', 'L', 'R', 'B'], lines: ['Glue P, K, L, R to B (finger joints).', 'Leave the lid off. P is the front, with', 'the drawer opening; T goes on last.'] },
  { title: '2. Shelf and plate', parts: ['F', 'PL'], lines: ['Drop F into the wall slots (no glue yet).', 'PL rests loose on F: never glue it.', 'The channel in PL faces the front.'] },
  { title: '3. Knobs', parts: ['STEM', 'CAP'], lines: ['Glue two STEM discs on each dot on PL,', 'one on top of the other. Put a CAP on', 'each, but only after the lid is on (step 6).'] },
  { title: '4. Drawer', parts: ['DB', 'DF', 'DK', 'DL', 'DR'], lines: ['Glue the five panels. DK, the one with the', 'tab on top, goes at the back, tab up.', 'Glue the two RAILs on the base under the sides.'] },
  { title: '5. Check', parts: ['DK', 'F'], lines: ['Slide the drawer in. The tab must pass through', "F's slot and stand inside PL's bay.", 'Pull it out and in; it should move freely.'] },
  { title: '6. Lid', parts: ['T', 'STEM', 'CAP'], lines: ['Set T on, with both stems in their streets.', 'Glue CAPs on the stems above T. Then glue T.', 'Slide the plow to HOME, then to LaVale Mall.'] },
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

/** The street map to scale (2 px per mm), the way to the mall marked in orange. */
function mapSvg(): string {
  const s = 3.4;
  const x0 = cellX(0) - 8;
  const y0 = cellY(0) - 8;
  const w = (cellX(6) + 8 - x0) * s;
  const h = (cellY(2) + 8 - y0) * s;
  const slots = streetRects()
    .map(([a, b, c, d]) => `<rect x="${(a - x0) * s}" y="${(b - y0) * s}" width="${(c - a) * s}" height="${(d - b) * s}" fill="#fff"/>`)
    .join('');
  const way: [number, number][] = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [3, 2], [4, 2], [4, 1], [4, 0], [5, 0], [5, 1], [5, 2], [6, 2]];
  const line = way.map(([c, r]) => `${(cellX(c) - x0) * s},${(cellY(r) - y0) * s}`).join(' ');
  return `<g><rect width="${w}" height="${h}" fill="#e9dcc3"/>${slots}<polyline points="${line}" fill="none" stroke="#e07a10" stroke-width="2.2" stroke-linejoin="round" stroke-dasharray="5 3"/>
<circle cx="${(cellX(START[0]) - x0) * s}" cy="${(cellY(START[1]) - y0) * s}" r="4" fill="#e07a10"/><text x="${(cellX(0) - x0) * s - 6}" y="${(cellY(0) - y0) * s - 8}" font-size="10">HOME</text>
<circle cx="${(cellX(MALL[0]) - x0) * s}" cy="${(cellY(MALL[1]) - y0) * s}" r="4" fill="#c0301f"/><text x="${(cellX(6) - x0) * s - 30}" y="${(cellY(2) - y0) * s + 18}" font-size="10">LAVALE MALL</text></g>`;
}

/** The plate over the lug, to scale (2 px per mm): the bay, the channel and the lug at one place of the plow. */
function gateSvg(kx: number, ky: number): string {
  const s = 2;
  const [bx0, by0, bx1, by1] = plate.bay;
  const lx = lug.x + plate.q1[0] - kx;
  const ly = lug.y + plate.q1[1] - ky;
  const ch = (channelX - plate.channelHalf) * s;
  const body = `M0 0H${plate.w * s}V${plate.d * s}H${(channelX + plate.channelHalf) * s}V${by1 * s}H${bx1 * s}V${by0 * s}H${bx0 * s}V${by1 * s}H${ch}V${plate.d * s}H0Z`;
  return `<g><path d="${body}" fill="#e9dcc3" fill-rule="evenodd" stroke="#644321" stroke-width="1"/>
<rect x="${(lx - lug.w / 2) * s}" y="${(ly - 1.5) * s}" width="${lug.w * s}" height="${3 * s}" fill="#c0301f"/></g>`;
}

export function assemblySvg(kerf = 0.2): string {
  const w = 760;
  const h = 1020;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="sans-serif" fill="#222" role="img" aria-label="Plowed Street box assembly steps and lock">
<rect width="${w}" height="${h}" fill="#fff"/>
<text x="20" y="24" font-size="18" font-weight="bold">Plowed Street box: assembly and lock</text>
<text x="20" y="42" font-size="11">Part outlines match the cut sheets. Keep the plate, the shelf and the drawer free of glue where they slide. Not cutting templates.</text>
${cardsSvg(kerf)}
<g transform="translate(20 650)"><text font-size="15" font-weight="bold">The way to LaVale Mall (the lid's streets, to scale)</text>
<g transform="translate(0 14)">${mapSvg()}</g></g>
<g transform="translate(400 650)"><text font-size="15" font-weight="bold">Under the lid: the plate over the drawer's lug</text>
<text y="16" font-size="11">Red: the lug (the drawer's tab). Plow at HOME (left): the lip stops it.</text>
<text y="30" font-size="11">Plow at LAVALE MALL (right): the channel is over it. The drawer opens.</text>
<g transform="translate(0 44)">${gateSvg(cellX(0), cellY(0))}</g>
<g transform="translate(184 44)">${gateSvg(cellX(MALL[0]), cellY(MALL[1]))}</g></g>
<text x="20" y="${h - 14}" font-size="10">Streets ${STREETS.length} segments, ${PITCH} mm apart, ${STREET} mm wide; the two maps are identical (${maze.dyTwin} mm apart) so the plate cannot turn.</text>
</svg>`;
}
