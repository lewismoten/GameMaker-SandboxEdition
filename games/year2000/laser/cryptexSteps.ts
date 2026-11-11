// "In The Year 2000!" cryptex assembly sheet: ordered cards drawn from the real cut outlines, then the lock itself (the
// ridge in a washer's notch, aligned and turned) and how to change the combination. Not a cutting template.
import { CORE, COMBO, STEP, T, coreShape, washerHole, decagon, WASHER } from './cryptexDims';
import { rotate } from '@lewismoten/gamemaker-sandbox-tools/kit/laserJoints';
import type { Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { makeParts } from './cryptexParts';
import { CODE_STEPS, FIT_ORDER, GROUPS } from './cryptexGroups';

/** Words wrapped to `n` characters a line, as SVG text lines starting at y; returns the markup and the next y. */
function wrap(text: string, x: number, y: number, n = 60, size = 11): [string, number] {
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if ((cur + ' ' + w).trim().length > n) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return [lines.map((l, i) => `<text x="${x}" y="${y + i * (size + 3)}" font-size="${size}">${l}</text>`).join(''), y + lines.length * (size + 3)];
}

/** A row of part outlines (from the real cut shapes) with each part's key under it. */
function shapes(keys: string[], x: number, y: number, width: number, kerf: number): string {
  const parts = makeParts(kerf);
  const w = width / keys.length;
  return keys
    .map((name, j) => {
      const p = parts[name].part;
      const svg = p.sheet
        .svg(name)
        .replace(/<\?xml[^>]*>/g, '')
        .replace(/#FF0000/gi, '#644321')
        .replace(/stroke-width="0\.1"/g, 'stroke-width="1.2"')
        .replace(/ id="[^"]*"/g, '')
        .trim();
      return `<svg x="${x + j * w}" y="${y}" width="${w - 5}" height="70" viewBox="0 0 ${p.sheet.w} ${p.sheet.h}" preserveAspectRatio="xMidYMid meet">${svg.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg><text x="${x + (j + 0.5) * w}" y="${y + 84}" text-anchor="middle" font-size="11">${name}</text>`;
    })
    .join('');
}

/** What the legend says about each part family: the ID and the face it is on (or why there is none). */
export function legend(kerf: number): { id: string; what: string; where: string; qty: number }[] {
  const parts = makeParts(kerf);
  const rows = Object.entries(parts).map(([key, m]) => {
    const marked = m.part.texts.some((t) => t.text === key);
    return {
      id: marked ? key : `(${key})`,
      what: m.note,
      where: marked ? WHERE(key) : m.hidden.length ? `${m.face} face: hidden artwork, no ID` : 'unmarked: glue face or no hidden space for an ID',
      qty: m.qty,
    };
  });
  return rows;
}
const WHERE = (key: string) =>
  key === 'A1'
    ? 'center of the floor, under the core'
    : /^A\dR$/.test(key)
      ? 'top of the rim, under the loose ring'
      : /^A\dC$/.test(key)
        ? 'top of the collar, under the loose washers'
        : /^G/.test(key)
          ? 'top of the upper washer; blank reverse takes glue'
          : key.endsWith('1')
            ? 'underside of the rim; blank reverse takes glue'
            : 'under the next ring up';

interface Card {
  title: string;
  keys: string[];
  text: string[];
}
const cardList = (): Card[] => {
  const g = (id: string) => GROUPS.find((x) => x.id === id)!;
  const ring = (id: string) => `${g(id).build} ${g(id).done}`;
  return [
    { title: 'Stack A: the base', keys: ['A1', 'A2R', 'A2C'], text: [g('A').build, g('A').why, g('A').done] },
    { title: 'Stacks B, C, D, E: the four rings', keys: ['B1', 'B2', 'E1', 'E2'], text: [ring('B'), ring('C'), ring('D'), ring('E'), g('B').why] },
    { title: 'Stack F: the core', keys: ['CORE0', 'CORER', 'COREC'], text: [g('F').build, g('F').why, g('F').done] },
    { title: 'G1 to G4: the washer pairs', keys: ['G1', 'G2'], text: [1, 2, 3, 4].map((n) => `${g(`G${n}`).build} ${g(`G${n}`).done}`).concat(g('G1').why) },
    { title: 'H the head and I the lid', keys: ['HEAD', 'LID', 'LIDP'], text: [g('H').build, g('H').done, g('H').why, g('I').build, g('I').done, g('I').why] },
  ];
};

/** Two columns of cards; returns the markup and the y below them. */
function cardsSvg(kerf: number, y0: number): [string, number] {
  const cards = cardList().map((c) => {
    let yy = 0;
    let body = '';
    for (const t of c.text) {
      const [m, ny] = wrap(t, 0, 128 + yy, 62);
      body += m;
      yy = ny - 128 + 6;
    }
    return { c, body, h: 132 + yy };
  });
  let out = '';
  let y = y0;
  for (let i = 0; i < cards.length; i += 2) {
    const row = cards.slice(i, i + 2);
    row.forEach(({ c, body }, j) => {
      out += `<g transform="translate(${20 + j * 435} ${y})"><text font-size="15" font-weight="bold">${c.title}</text>${shapes(c.keys, 0, 10, 400, kerf)}${body}</g>`;
    });
    y += Math.max(...row.map((r) => r.h)) + 12;
  }
  return [out, y];
}

/** One list of numbered lines (the final assembly, or setting a code), wrapped. */
function listSvg(title: string, items: string[], x: number, y: number, n: number): [string, number] {
  let out = `<text x="${x}" y="${y}" font-size="15" font-weight="bold">${title}</text>`;
  let yy = y + 18;
  items.forEach((t, i) => {
    const [m, ny] = wrap(`${i + 1}. ${t}`, x, yy, n);
    out += m;
    yy = ny + 3;
  });
  return [out, yy];
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
  const code = COMBO.join('');
  const g = (id: string) => GROUPS.find((x) => x.id === id)!;
  let y = 60;
  // the legend: every ID, the face it is engraved on, how many
  let leg = `<text x="20" y="${y}" font-size="15" font-weight="bold">Part IDs (the letter is the sub-assembly, the number, R (ring) or C (collar) is the layer from the bottom)</text>`;
  y += 16;
  legend(kerf).forEach((r, i) => {
    leg += `<text x="${20 + (i % 2) * 435}" y="${y + Math.floor(i / 2) * 14}" font-size="10"><tspan font-weight="bold">${r.id}</tspan> x${r.qty}: ${r.where}</text>`;
  });
  y += Math.ceil(legend(kerf).length / 2) * 14 + 8;
  const [note, ny] = wrap(
    'IDs and hidden pictures use only unglued faces. Cut and engrave face up in one pass. During assembly orient ring bottoms, head and lid artwork down; other art faces up. Unmarked parts are in (brackets). Leave glue faces blank.',
    20,
    y,
    150,
    10,
  );
  leg += note;
  y = ny + 10;
  const [cards, y2] = cardsSvg(kerf, y);
  const [fit, y3] = listSvg(
    'Final assembly: put the finished sub-assemblies together',
    FIT_ORDER.map((id) => g(id).fit),
    20,
    y2 + 14,
    62,
  );
  const [setCode, y4] = listSvg('Set your own code', CODE_STEPS, 450, y2 + 14, 62);
  const lockY = Math.max(y3, y4) + 24;
  const h = lockY + 275;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="sans-serif" fill="#222" role="img" aria-label="Cryptex assembly steps and lock">
<rect width="${w}" height="${h}" fill="#fff"/>
<text x="20" y="24" font-size="18" font-weight="bold">In The Year 2000! cryptex: assembly and lock</text>
<text x="20" y="42" font-size="11">Part outlines match the cut sheets. Build each sub-assembly apart, then put them together. Rings, washers and core stay loose. Not cutting templates.</text>
${leg}${cards}${fit}${setCode}
<g transform="translate(20 ${lockY})"><text font-size="15" font-weight="bold">The lock: the ridge and a washer's notch (to scale)</text>
<text y="16" font-size="11">Red: the core's ridge, at the marker. The washer is a ring's inner part.</text>
<g transform="translate(0 24)">${gateSvg(0, 'Notch at the marker: the ridge passes')}</g>
<g transform="translate(200 24)">${gateSvg(STEP, 'One digit off: the washer stops it')}</g></g>
<g transform="translate(430 ${lockY})"><text font-size="15" font-weight="bold">Setting and changing the combination</text>
<text y="18" font-size="11">Seat each washer so its notch lies under the ring's digit you want.</text>
<text y="33" font-size="11">Ring 1 (the smallest, on top) is the first digit and ring 4 the last,</text>
<text y="48" font-size="11">read outward along the marker. It is set to ${code}: ring 1 at 2, the rest at 0.</text>
<text y="68" font-size="11">Each washer can sit ten ways, one per digit: 10,000 combinations.</text>
<text y="92" font-size="11">The ridge is ${CORE.ridgeHw * 2} mm wide, the notch ${WASHER.notchHw * 2} mm: a ring only has to be near its digit</text>
<text y="107" font-size="11">(about 5 degrees), not exact. There are no detents, so look at the marker.</text></g>
<text x="20" y="${h - 14}" font-size="10">Stack height ${(12 * T).toFixed(2)} mm: four pocket layers (${(4 * T).toFixed(2)}), eight ring slices (${(8 * T).toFixed(2)}). Stock ${T} mm; the head sits on top.</text>
</svg>`;
}
