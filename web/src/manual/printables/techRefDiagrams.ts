// The Technical Reference booklet's diagrams (techRef.ts), drawn in code as 1994 manual line art: black ink on the paper and the
// cover's blue as the one spot color. booklet1994.md places each with a `[diagram: name]` line (markdownBlocks.ts). Each is a
// <figure> with its SVG (a labeled image) and a caption; the paginator moves a figure whole, so none splits across pages.
//
// The memory map's figures come from the original source and PLAYGAME.EXE (see `MEMORY`); DOS and the mouse driver are typical
// sizes of the period, not measured.
import './techRefDiagrams.css';
import { h } from '../../editor/core/ui';
import type { Diagrams } from './markdownBlocks';

const INK = '#18150f';
const SPOT = '#14304a';
const FONT = 'font-family="Helvetica, Arial, sans-serif"';

function figure(viewBox: string, markup: string, alt: string, caption: string): HTMLElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', alt);
  svg.innerHTML = markup;
  return h('figure', { class: 'tr-fig' }, svg, h('figcaption', null, caption));
}

const text = (x: number, y: number, s: string, extra = '') => `<text x="${x}" y="${y}" ${FONT} font-size="10" fill="${INK}" ${extra}>${s}</text>`;

/**
 * PLAYGAME's memory, in K (1,024 bytes), from the bottom of memory up. The program: PLAYGAME.EXE's load image and minimum
 * data (its EXE header: 154,938 + 29,728 bytes, with the map's 20,000-byte array among them) and its 256-byte PSP. The rest
 * is what PLAYGAME.C allocates as it starts: the screen buffer (DIRTRECT.C InitDirty, 65,570 bytes), the three block arrays
 * (151, 101 and 51 blocks of 420 bytes), the monster tables (64 monsters of 300 bytes, 200 placed monsters, 50 picture
 * patches of 400 bytes) and the Sound Blaster voice driver it reads from SNDBLAST.DRV (2,493 bytes, SOUNDC.C). A scene adds
 * its song, sound list, scene list and the buffer for the largest digitized sound it plays.
 */
const MEMORY: { k: number; name: string; size: string; kind: 'out' | 'prog' | 'scene' | 'free' }[] = [
  { k: 20, name: 'DOS, with DOS=HIGH', size: 'about 20K', kind: 'out' },
  { k: 20, name: 'Mouse driver', size: '15K to 25K', kind: 'out' },
  { k: 181, name: 'PLAYGAME and its data, with the map', size: '181K', kind: 'prog' },
  { k: 64, name: 'Screen buffer', size: '64K', kind: 'prog' },
  { k: 62, name: 'Background blocks (.BBL)', size: '62K', kind: 'prog' },
  { k: 41, name: 'Monster blocks (.MBL)', size: '41K', kind: 'prog' },
  { k: 21, name: 'Hero blocks (.CBL)', size: '21K', kind: 'prog' },
  { k: 50, name: 'Monster tables', size: '50K', kind: 'prog' },
  { k: 2.5, name: 'Sound Blaster voice driver', size: '2.5K', kind: 'prog' },
  { k: 60, name: 'This scene’s song, sounds and lists', size: '20K to 120K', kind: 'scene' },
];

function memory(): HTMLElement {
  const top = 14;
  const height = 290;
  const scale = height / 640;
  const x = 128;
  const w = 64;
  const used = MEMORY.reduce((s, m) => s + m.k, 0);
  const rows = [...MEMORY, { k: 640 - used, name: 'Free memory', size: `about ${Math.round((640 - used) / 10) * 10}K`, kind: 'free' as const }];
  const fill = { out: '#d8d3c6', prog: SPOT, scene: '#ffffff', free: '#ffffff' };
  const opacity = { out: 1, prog: 0.25, scene: 1, free: 1 };
  let y = top + height; // the bottom of memory, 0K
  let labelY = Infinity; // labels are placed from the bottom up and pushed apart
  const parts: string[] = [];
  const bands: Record<string, [number, number]> = {};
  for (const r of rows) {
    const hgt = Math.max(r.k * scale, 3);
    const y0 = y - hgt;
    const dash = r.kind === 'scene' ? ' stroke-dasharray="4 3"' : '';
    parts.push(`<rect x="${x}" y="${y0}" width="${w}" height="${hgt}" fill="${fill[r.kind]}" fill-opacity="${opacity[r.kind]}" stroke="${INK}"${dash}/>`);
    const mid = y0 + hgt / 2;
    const ly = Math.min(mid + 3.5, labelY - 24);
    labelY = ly;
    parts.push(`<path d="M${x + w} ${mid} H${x + w + 8} L${x + w + 14} ${ly - 3.5} H${x + w + 18}" fill="none" stroke="${INK}" stroke-width=".6"/>`);
    parts.push(text(x + w + 21, ly - 4, r.name, 'font-weight="700"'));
    parts.push(text(x + w + 21, ly + 7, r.size));
    const band = r.kind === 'prog' || r.kind === 'scene' ? 'game' : r.kind === 'out' ? 'dos' : 'free';
    bands[band] = [Math.min(bands[band]?.[0] ?? y0, y0), Math.max(bands[band]?.[1] ?? y, y)];
    y = y0;
  }
  // brackets on the left: what PLAYGAME holds, and what is outside it
  const bracket = (b: [number, number], lines: string[], spot = false) => {
    const [a, z] = b;
    const c = spot ? SPOT : INK;
    const m = (a + z) / 2;
    return (
      `<path d="M${x - 6} ${a + 2.5} H${x - 12} V${z - 2.5} H${x - 6}" fill="none" stroke="${c}" stroke-width="1.2"/>` +
      lines
        .map((l, i) => text(x - 17, m + 4 + (i - (lines.length - 1) / 2) * 12, l, `text-anchor="end" fill="${c}"${i === 0 ? ' font-weight="700"' : ''}`))
        .join('')
    );
  };
  const markup = [
    ...parts,
    bracket(bands.dos, ['Outside', 'PLAYGAME']),
    bracket(bands.game, ['PLAYGAME:', 'about 420K,', 'then the scene'], true),
    text(x + w / 2, top - 4, '640K', 'text-anchor="middle" font-weight="700"'),
    text(x + w / 2, top + height + 12, '0K', 'text-anchor="middle" font-weight="700"'),
  ].join('');
  return figure(
    `0 0 440 ${top + height + 18}`,
    markup,
    'A memory map of 640K: DOS and a mouse driver at the bottom, then PLAYGAME with its program, screen buffer, three block files, monsters and voice driver, then a scene, and free memory at the top.',
    'Figure 1. A full-size game in 640K. The scene’s share changes from scene to scene; what is left is free.',
  );
}

function screen(): HTMLElement {
  const s = 1;
  const ox = 34;
  const oy = 30;
  const b = 20 * s;
  const lines: string[] = [];
  for (let c = 1; c < 16; c++) lines.push(`<line x1="${ox + c * b}" y1="${oy}" x2="${ox + c * b}" y2="${oy + 10 * b}"/>`);
  for (let r = 1; r < 10; r++) lines.push(`<line x1="${ox}" y1="${oy + r * b}" x2="${ox + 16 * b}" y2="${oy + r * b}"/>`);
  const W = 16 * b;
  const H = 10 * b;
  const one = { c: 11, r: 2 };
  const hero = { c: 4, r: 7 };
  const markup = [
    `<rect x="${ox + hero.c * b}" y="${oy + hero.r * b}" width="${b}" height="${2 * b}" fill="${SPOT}" fill-opacity=".35"/>`,
    `<rect x="${ox + one.c * b}" y="${oy + one.r * b}" width="${b}" height="${b}" fill="${SPOT}" fill-opacity=".35"/>`,
    `<g stroke="${INK}" stroke-width=".5">${lines.join('')}</g>`,
    `<rect x="${ox}" y="${oy}" width="${W}" height="${H}" fill="none" stroke="${INK}" stroke-width="1.5"/>`,
    // dimension lines
    `<path d="M${ox} ${oy - 12} H${ox + W} M${ox} ${oy - 16} V${oy - 8} M${ox + W} ${oy - 16} V${oy - 8}" stroke="${INK}" fill="none" stroke-width=".8"/>`,
    text(ox + W / 2, oy - 16, '320 pixels = 16 blocks', `text-anchor="middle" font-weight="700"`),
    `<path d="M${ox - 12} ${oy} V${oy + H} M${ox - 16} ${oy} H${ox - 8} M${ox - 16} ${oy + H} H${ox - 8}" stroke="${INK}" fill="none" stroke-width=".8"/>`,
    text(ox - 16, oy + H / 2, '200 pixels = 10 blocks', `text-anchor="middle" font-weight="700" transform="rotate(-90 ${ox - 16} ${oy + H / 2})"`),
    // callouts
    `<path d="M${ox + (one.c + 1) * b} ${oy + (one.r + 0.5) * b} H${ox + W + 10}" stroke="${INK}" stroke-width="1.4"/>`,
    text(ox + W + 13, oy + (one.r + 0.5) * b - 2, 'One block:', 'font-weight="700"'),
    text(ox + W + 13, oy + (one.r + 0.5) * b + 10, '20 x 20'),
    text(ox + W + 13, oy + (one.r + 0.5) * b + 21, 'pixels'),
    `<path d="M${ox + (hero.c + 1) * b} ${oy + (hero.r + 1) * b} H${ox + W + 10}" stroke="${INK}" stroke-width="1.4"/>`,
    text(ox + W + 13, oy + (hero.r + 1) * b - 2, 'The hero:', 'font-weight="700"'),
    text(ox + W + 13, oy + (hero.r + 1) * b + 10, 'two blocks,'),
    text(ox + W + 13, oy + (hero.r + 1) * b + 21, '40 pixels tall'),
  ].join('');
  return figure(
    `0 0 440 ${oy + H + 8}`,
    markup,
    'The 320 by 200 screen as a grid of 16 by 10 blocks of 20 by 20 pixels, with one block and the two-block hero marked.',
    'Figure 2. The playing screen is 16 blocks across and 10 down, with nothing left over.',
  );
}

function pieces(): HTMLElement {
  const x = 112;
  const w = 300;
  const rows = [
    { name: 'Background', n: 150 },
    { name: 'Monster', n: 100 },
    { name: 'Hero', n: 50 },
  ];
  const markup: string[] = [text(x, 12, 'One 64K piece of memory: 65,536 bytes', 'font-weight="700"')];
  rows.forEach((r, i) => {
    const y = 22 + i * 40;
    const bytes = r.n * 420;
    const fw = (bytes / 65536) * w;
    const ticks: string[] = [];
    for (let k = 10; k < r.n; k += 10) ticks.push(`<line x1="${x + ((k * 420) / 65536) * w}" y1="${y}" x2="${x + ((k * 420) / 65536) * w}" y2="${y + 18}"/>`);
    markup.push(
      `<rect x="${x}" y="${y}" width="${fw}" height="18" fill="${SPOT}" fill-opacity=".3"/>`,
      `<g stroke="${INK}" stroke-width=".4">${ticks.join('')}</g>`,
      `<rect x="${x}" y="${y}" width="${w}" height="18" fill="none" stroke="${INK}" stroke-width="1.2"/>`,
      text(x - 8, y + 9, `${r.name}`, 'text-anchor="end" font-weight="700"'),
      text(x - 8, y + 20, `${r.n} blocks`, 'text-anchor="end"'),
      text(x + 4, y + 30, `${bytes.toLocaleString('en-US')} bytes`),
    );
  });
  markup.push(text(x + w, 140, 'Each mark is 10 blocks of 420 bytes.', 'text-anchor="end"'));
  return figure(
    '0 0 440 146',
    markup.join(''),
    'Three bars, each one 64K piece of memory: 150 background blocks fill almost all of it, 100 monster blocks about two thirds, 50 hero blocks about one third.',
    'Figure 4. Each block file is held in one 64K piece; 150 background blocks fill nearly all of it.',
  );
}

function scrolling(): HTMLElement {
  const step = 14; // 4 pixels, drawn wide so the strip shows
  const W = 220;
  const H = 70;
  const x = 70;
  const rowAt = (y: number, shift: number, label: string, strip: boolean) =>
    [
      `<rect x="20" y="${y}" width="400" height="${H}" fill="#d8d3c6" stroke="${INK}" stroke-width=".6"/>`,
      `<rect x="${x + shift}" y="${y}" width="${W}" height="${H}" fill="#ffffff" stroke="${INK}" stroke-width="1.6"/>`,
      strip
        ? `<rect x="${x + shift + W - step}" y="${y}" width="${step}" height="${H}" fill="${SPOT}" fill-opacity=".45" stroke="${INK}" stroke-width=".8"/>`
        : '',
      text(x + shift + 8, y + 16, label, 'font-weight="700"'),
      shift ? `<path d="M${x} ${y} V${y + H + 4}" stroke="${INK}" stroke-width=".8" stroke-dasharray="3 2"/>` : '',
    ].join('');
  const markup = [
    rowAt(8, 0, 'The screen', false),
    rowAt(100, step, 'One step later', true),
    text(24, 8 + H + 15, 'The picture in video memory, wider than the screen'),
    `<path d="M${x} ${100 + H + 8} H${x + step} M${x} ${100 + H + 5} v6 M${x + step} ${100 + H + 5} v6" stroke="${INK}" stroke-width=".8"/>`,
    text(x + step + 5, 100 + H + 12, 'The start moves 4 pixels; the VGA pans the last 0 to 3.'),
    `<path d="M${x + step + W - step / 2} ${100 + H / 2} L${x + step + W + 28} ${100 + H / 2 - 14}" stroke="${INK}" stroke-width=".8"/>`,
    text(x + step + W + 31, 100 + H / 2 - 18, 'Only this new', 'font-weight="700"'),
    text(x + step + W + 31, 100 + H / 2 - 6, 'strip is drawn'),
  ].join('');
  return figure(
    `0 0 440 ${100 + H + 18}`,
    markup,
    'The screen as a window on a wider picture in video memory; one step later the window has moved 4 pixels and only the new strip at its edge is drawn.',
    'Figure 3. How the screen scrolls (the step is drawn wider than it is).',
  );
}

/** The booklet's diagrams by the names booklet1994.md gives them. */
export const TECHREF_DIAGRAMS: Diagrams = { memory, screen, pieces, scrolling };
