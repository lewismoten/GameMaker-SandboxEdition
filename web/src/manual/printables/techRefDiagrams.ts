// The Technical Reference booklet's diagrams (techRef.ts), drawn in code as 1994 manual line art: black ink on the paper and the
// cover's blue as the one spot color. booklet1994.md places each with a `[diagram: name]` line (markdownBlocks.ts). Each is a
// <figure> with its SVG (a labeled image) and a caption; the paginator moves a figure whole, so none splits across pages.
//
// The memory map's figures come from the original source and PLAYGAME.EXE (see `MEMORY`); DOS and the mouse driver are typical
// sizes of the period, not measured.
import './techRefDiagrams.css';
import { h } from '../../editor/core/ui';
import type { Diagrams } from './markdownBlocks';
import { FORMAT_DIAGRAMS } from './techRefFormats';

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
const MEMORY: { k: number; name: string; size: string; kind: 'out' | 'prog' | 'scene'; side: 'left' | 'right'; one?: boolean }[] = [
  { k: 20, name: 'DOS (DOS=HIGH)', size: 'about 20K', kind: 'out', side: 'right', one: true },
  { k: 20, name: 'Mouse driver', size: '15K to 25K', kind: 'out', side: 'right', one: true },
  { k: 181, name: 'PLAYGAME program', size: '181K, with the map', kind: 'prog', side: 'right' },
  { k: 64, name: 'Screen buffer', size: '64K', kind: 'prog', side: 'left' },
  { k: 62, name: 'Background blocks', size: '62K (.BBL)', kind: 'prog', side: 'right' },
  { k: 41, name: 'Monster blocks', size: '41K (.MBL)', kind: 'prog', side: 'left' },
  { k: 21, name: 'Hero blocks', size: '21K (.CBL)', kind: 'prog', side: 'right' },
  { k: 50, name: 'Monster tables', size: '50K', kind: 'prog', side: 'left' },
  { k: 2.5, name: 'Voice driver', size: '2.5K (Sound Blaster)', kind: 'prog', side: 'left' },
  { k: 60, name: 'This scene', size: 'song, sounds, lists: 20K to 120K', kind: 'scene', side: 'right' },
];

/**
 * The memory map: three sections with a gap between them (DOS and drivers, PLAYGAME, free memory), each with a bracket and
 * a title on the far left. Heights are to scale within the 640K (the gaps are not memory). Labels alternate sides of the bar,
 * placed from the bottom up and pushed apart; a pushed label gets a short slanted leader, never one that crosses another.
 */
function memory(): HTMLElement {
  const scale = 330 / 640;
  const gap = 10;
  const top = 26;
  const bx = 200; // the bar
  const bw = 56;
  const tall = (k: number) => Math.max(k * scale, 3); // the voice driver's 2.5K would be a hairline
  const used = MEMORY.reduce((t, m) => t + m.k, 0);
  const free = 640 - used;
  const freeH = free * scale;
  const outH = MEMORY.filter((m) => m.kind === 'out').reduce((t, m) => t + tall(m.k), 0);
  const gameH = MEMORY.filter((m) => m.kind !== 'out').reduce((t, m) => t + tall(m.k), 0);
  const freeTop = top;
  const gameTop = freeTop + freeH + gap;
  const outTop = gameTop + gameH + gap;
  const base = outTop + outH;
  const fill = { out: '#d8d3c6', prog: SPOT, scene: '#ffffff' };
  const opacity = { out: 1, prog: 0.25, scene: 1 };
  const parts: string[] = [];
  const next = { left: Infinity, right: Infinity }; // the highest label baseline so far on each side
  let y = base;
  for (const r of MEMORY) {
    if (r.kind !== 'out' && y > gameTop + gameH) y = gameTop + gameH; // step over the gap
    const hgt = tall(r.k);
    const y0 = y - hgt;
    const dash = r.kind === 'scene' ? ' stroke-dasharray="4 3"' : '';
    parts.push(
      `<rect x="${bx}" y="${y0}" width="${bw}" height="${hgt}" fill="${fill[r.kind]}" fill-opacity="${opacity[r.kind]}" stroke="${INK}" stroke-width=".8"${dash}/>`,
    );
    const mid = y0 + hgt / 2;
    const ly = Math.min(mid + 3.5, next[r.side] - (r.one ? 14 : 25)); // the name's baseline
    next[r.side] = ly;
    const left = r.side === 'left';
    const edge = left ? bx : bx + bw;
    const out = left ? -1 : 1;
    const end = edge + out * 9;
    parts.push(`<path d="M${edge} ${mid} L${end} ${ly - 3.5} H${end + out * 3}" fill="none" stroke="${INK}" stroke-width=".7"/>`);
    const tx = end + out * 6;
    const anchor = left ? ' text-anchor="end"' : '';
    if (r.one) parts.push(text(tx, ly, `<tspan font-weight="700">${r.name}</tspan>, ${r.size}`, anchor));
    else parts.push(text(tx, ly, r.name, `font-weight="700"${anchor}`), text(tx, ly + 11, r.size, anchor));
    y = y0;
  }
  // free memory: its own box, its size inside
  parts.push(`<rect x="${bx}" y="${freeTop}" width="${bw}" height="${freeH}" fill="#ffffff" stroke="${INK}" stroke-width=".8"/>`);
  parts.push(text(bx + bw / 2, freeTop + freeH / 2 + 4, `${Math.round(free / 10) * 10}K`, 'text-anchor="middle"'));
  // each section's outline, bracket and title
  const bracket = (a: number, z: number, lines: string[], spot = false) => {
    const c = spot ? SPOT : INK;
    const m = (a + z) / 2;
    return (
      `<rect x="${bx}" y="${a}" width="${bw}" height="${z - a}" fill="none" stroke="${c}" stroke-width="1.8"/>` +
      `<path d="M84 ${a + 1} H78 V${z - 1} H84" fill="none" stroke="${c}" stroke-width="1.4"/>` +
      lines
        .map((l, i) => text(72, m + 4 + (i - (lines.length - 1) / 2) * 12, l, `text-anchor="end" fill="${c}"${i === 0 ? ' font-weight="700"' : ''}`))
        .join('')
    );
  };
  const markup = [
    ...parts,
    bracket(freeTop, freeTop + freeH, ['Free memory']),
    bracket(gameTop, gameTop + gameH, ['PLAYGAME', 'about 420K,', 'then the scene'], true),
    bracket(outTop, base, ['DOS and', 'drivers']),
    text(bx + bw / 2, top - 8, '640K: the top of conventional memory', 'text-anchor="middle" font-weight="700"'),
    text(bx + bw / 2, base + 14, 'the start of memory', 'text-anchor="middle"'),
  ].join('');
  return figure(
    `0 0 450 ${base + 20}`,
    markup,
    'A memory map of 640K in three parts: DOS and a mouse driver at the start of memory; PLAYGAME with its program, screen buffer, three block files, monster tables, voice driver and the scene; and free memory at the top.',
    'Figure 1. A full-size game in 640K. The scene’s share changes from scene to scene; what is left is free.',
  );
}

function screen(): HTMLElement {
  // To scale, one unit per pixel. PLAYGAME.C CropScreen hides the right 8 pixels and bottom 4 rows while you play.
  const ox = 50;
  const oy = 30;
  const b = 20;
  const lines: string[] = [];
  for (let c = 1; c < 16; c++) lines.push(`<line x1="${ox + c * b}" y1="${oy}" x2="${ox + c * b}" y2="${oy + 10 * b}"/>`);
  for (let r = 1; r < 10; r++) lines.push(`<line x1="${ox}" y1="${oy + r * b}" x2="${ox + 16 * b}" y2="${oy + r * b}"/>`);
  const W = 16 * b;
  const H = 10 * b;
  const SW = 312;
  const SH = 196;
  const one = { c: 11, r: 2 };
  const hero = { c: 4, r: 7 };
  const hy = oy + 9 * b + 4; // the hidden strip's callout, below the hero's
  const hidden = `M${ox + SW} ${oy} H${ox + W} V${oy + H} H${ox} V${oy + SH} H${ox + SW} Z`;
  const markup = [
    `<defs><pattern id="tr-hidden" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="#d8d3c6"/><line x1="0" y1="0" x2="0" y2="4" stroke="${INK}" stroke-width="1.4"/></pattern></defs>`,
    `<rect x="${ox + hero.c * b}" y="${oy + hero.r * b}" width="${b}" height="${2 * b}" fill="${SPOT}" fill-opacity=".35"/>`,
    `<rect x="${ox + one.c * b}" y="${oy + one.r * b}" width="${b}" height="${b}" fill="${SPOT}" fill-opacity=".35"/>`,
    `<g stroke="${INK}" stroke-width=".5">${lines.join('')}</g>`,
    `<path d="${hidden}" fill="url(#tr-hidden)" stroke="${INK}" stroke-width=".6"/>`,
    `<rect x="${ox}" y="${oy}" width="${W}" height="${H}" fill="none" stroke="${INK}" stroke-width="1.5"/>`,
    // dimension lines: the whole screen above and outside, what is shown while playing below and inside
    `<path d="M${ox} ${oy - 12} H${ox + W} M${ox} ${oy - 16} V${oy - 8} M${ox + W} ${oy - 16} V${oy - 8}" stroke="${INK}" fill="none" stroke-width=".8"/>`,
    text(ox + W / 2, oy - 16, '320 pixels = 16 blocks', `text-anchor="middle" font-weight="700"`),
    `<path d="M${ox - 30} ${oy} V${oy + H} M${ox - 34} ${oy} H${ox - 26} M${ox - 34} ${oy + H} H${ox - 26}" stroke="${INK}" fill="none" stroke-width=".8"/>`,
    text(ox - 34, oy + H / 2, '200 pixels = 10 blocks', `text-anchor="middle" font-weight="700" transform="rotate(-90 ${ox - 34} ${oy + H / 2})"`),
    `<path d="M${ox - 10} ${oy} V${oy + SH} M${ox - 14} ${oy} H${ox - 6} M${ox - 14} ${oy + SH} H${ox - 6}" stroke="${INK}" fill="none" stroke-width=".8"/>`,
    text(ox - 13, oy + SH / 2, '196 shown', `text-anchor="middle" transform="rotate(-90 ${ox - 13} ${oy + SH / 2})"`),
    `<path d="M${ox} ${oy + H + 10} H${ox + SW} M${ox} ${oy + H + 6} V${oy + H + 14} M${ox + SW} ${oy + H + 6} V${oy + H + 14}" stroke="${INK}" fill="none" stroke-width=".8"/>`,
    text(ox + SW / 2, oy + H + 23, '312 pixels shown while playing', 'text-anchor="middle"'),
    // callouts
    `<path d="M${ox + (one.c + 1) * b} ${oy + (one.r + 0.5) * b} H${ox + W + 10}" stroke="${INK}" stroke-width="1.4"/>`,
    text(ox + W + 13, oy + (one.r + 0.5) * b - 2, 'One block:', 'font-weight="700"'),
    text(ox + W + 13, oy + (one.r + 0.5) * b + 10, '20 x 20'),
    text(ox + W + 13, oy + (one.r + 0.5) * b + 21, 'pixels'),
    `<path d="M${ox + SW + 4} ${hy - 4} H${ox + W + 10}" stroke="${INK}" stroke-width="1.4"/>`,
    `<path d="M${ox + SW - 24} ${oy + SH + 2} L${ox + W + 10} ${hy + 2}" stroke="${INK}" stroke-width="1.4"/>`,
    text(ox + W + 13, hy - 2, 'Not shown', 'font-weight="700"'),
    text(ox + W + 13, hy + 10, 'while playing:', 'font-weight="700"'),
    text(ox + W + 13, hy + 22, 'border,'),
    text(ox + W + 13, hy + 34, 'color 0'),
    `<path d="M${ox + (hero.c + 1) * b} ${oy + hero.r * b} H${ox + W + 10}" stroke="${INK}" stroke-width="1.4"/>`,
    text(ox + W + 13, oy + hero.r * b - 2, 'The hero:', 'font-weight="700"'),
    text(ox + W + 13, oy + hero.r * b + 10, 'two blocks,'),
    text(ox + W + 13, oy + hero.r * b + 21, '40 pixels tall'),
  ].join('');
  return figure(
    `0 0 450 ${oy + H + 28}`,
    markup,
    'The 320 by 200 screen as a grid of 16 by 10 blocks of 20 by 20 pixels, with one block and the two-block hero marked. A strip 8 pixels wide at the right and 4 pixels tall at the bottom is hatched: while playing it is not shown and takes the border color, color 0, so 312 by 196 pixels show.',
    'Figure 2. The screen is 16 blocks across and 10 down; while you play, the hatched edges are border and 312 x 196 pixels show.',
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
    text(x + step + W + 31, 100 + H / 2 - 6, 'strip is drawn,'),
    text(x + step + W + 31, 100 + H / 2 + 6, 'out of sight'),
  ].join('');
  return figure(
    `0 0 440 ${100 + H + 18}`,
    markup,
    'The screen as a window on a wider picture in video memory; one step later the window has moved 4 pixels and only the new strip at its edge is drawn, in the hidden border where it is out of sight.',
    'Figure 3. How the screen scrolls (the step is drawn wider than it is).',
  );
}

/** GM remains resident while one child runs; its return code selects the next child. */
function architecture(): HTMLElement {
  const box = (y: number, title: string, detail: string) =>
    `<rect x="65" y="${y}" width="320" height="43" fill="#fff" stroke="${INK}"/>` +
    text(225, y + 17, title, 'text-anchor="middle" font-weight="700"') +
    text(225, y + 32, detail, 'text-anchor="middle"');
  return figure(
    '0 0 450 254',
    [
      box(8, 'DOS starts GM.EXE', 'Small launcher keeps the program-name table'),
      box(72, 'GM runs MENU.EXE', 'Command tail: cOoL + previous selection letter'),
      box(136, 'MENU returns a utility number', 'DOS exit code selects one child program'),
      box(200, 'GM runs the selected utility', 'Utility returns 11 for menu, 0 for quit'),
      `<path d="M225 51 V72 m-4 -6 l4 6 4 -6 M225 115 V136 m-4 -6 l4 6 4 -6 M225 179 V200 m-4 -6 l4 6 4 -6 M385 221 H422 V93 H385 m6 -4 l-6 4 6 4" fill="none" stroke="${INK}" stroke-width="1.2"/>`,
      text(416, 158, '11', 'text-anchor="end" font-weight="700"'),
    ].join(''),
    'DOS starts GM, which executes MENU with cOoL and a selection letter. The menu exits with a utility number; GM runs that utility. Return code 11 loops to MENU; zero quits to DOS.',
    'The launcher owns the loop. The cOoL token identifies a managed launch; return codes choose what runs next.',
  );
}

/** The booklet's diagrams by the names booklet1994.md gives them. */
export const TECHREF_DIAGRAMS: Diagrams = { memory, screen, pieces, scrolling, architecture, ...FORMAT_DIAGRAMS };
