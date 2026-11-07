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
  svg.style.background = '#fff';
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
    'A full-size game in 640K. The scene’s share changes from scene to scene; what is left is free.',
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
    'The screen is 16 blocks across and 10 down; while you play, the hatched edges are border and 312 x 196 pixels show.',
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
    'Each block file is held in one 64K piece; 150 background blocks fill nearly all of it.',
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
    'How the screen scrolls (the step is drawn wider than it is).',
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

/** A bit row: bit 7 at the left; labels describe fields, not proportional byte offsets. */
function bitRow(y: number, label: string, bits: string[]): string {
  return (
    text(8, y + 14, label, 'font-weight="700"') +
    bits
      .map(
        (bit, i) =>
          `<rect x="${152 + i * 36}" y="${y}" width="36" height="22" fill="#fff" stroke="${INK}" stroke-width=".6"/>` +
          text(170 + i * 36, y + 15, bit, 'text-anchor="middle"') +
          text(170 + i * 36, y - 3, String(7 - i), 'text-anchor="middle"'),
      )
      .join('')
  );
}

function palettebits(): HTMLElement {
  return figure(
    '0 0 450 150',
    [
      bitRow(20, '3c: red', ['0', '0', 'R', 'R', 'R', 'R', 'R', 'R']),
      bitRow(62, '3c + 1: green', ['0', '0', 'G', 'G', 'G', 'G', 'G', 'G']),
      bitRow(104, '3c + 2: blue', ['0', '0', 'B', 'B', 'B', 'B', 'B', 'B']),
    ].join(''),
    'Each PAL entry has three bytes with six low color bits and two zero high bits. Repeat for 256 entries.',
    'PAL offsets: c = 0 through 255. [RRRRRR GGGGGG BBBBBB] × 256 = 18 meaningful bits per color, 768 bytes on disk.',
  );
}

function mapcells(): HTMLElement {
  const parts = [text(8, 14, 'A corner of the 100 × 100 grid (x across, y down)', 'font-weight="700"')];
  for (let y = 0; y < 3; y++)
    for (let x = 0; x < 4; x++) {
      parts.push(
        `<rect x="${30 + x * 90}" y="${30 + y * 26}" width="90" height="26" fill="#fff" stroke="${INK}"/>`,
        text(75 + x * 90, 47 + y * 26, `(${x},${y}) @ ${2 * (100 * y + x)}`, 'text-anchor="middle"'),
      );
    }
  parts.push(
    text(8, 128, 'Each cell: +0 block byte; +1 placement byte (not MON type).'),
    bitRow(150, 'Example block 10', ['0', '0', '0', '0', '1', '0', '1', '0']),
    bitRow(194, 'No placement: 200', ['1', '1', '0', '0', '1', '0', '0', '0']),
    text(8, 240, 'Placement m: base 20,000 + 10m; type, status lo/hi, reserved,'),
    text(8, 254, 'x lo/hi, y lo/hi, reserved lo/hi. Each word holds 16 integer bits.'),
  );
  return figure(
    '0 0 450 265',
    parts.join(''),
    'Mini map grid with cell offsets, followed by the two cell byte bit patterns and placement word order.',
    'MAP has two record kinds. Coordinates live in the placement record; they are not packed into a cell byte.',
  );
}

function wrapmap(): HTMLElement {
  const lines: string[] = [];
  for (let i = 0; i <= 100; i++) lines.push(`<path d="M${80 + i * 2} 28 V228 M80 ${28 + i * 2} H280"/>`);
  return figure(
    '0 0 450 274',
    [
      `<rect x="80" y="28" width="200" height="200" fill="#fff"/>`,
      `<g stroke="${SPOT}" stroke-width=".2">${lines.join('')}</g>`,
      `<rect x="80" y="28" width="200" height="200" fill="none" stroke="${INK}"/>`,
      text(168, 18, '100 columns: x = 0 … 99', 'text-anchor="end" font-weight="700"'),
      text(8, 92, '100 rows'),
      text(8, 108, 'y = 0 … 99'),
      `<path d="M280 128 H310 V246 H50 V128 H80 m-7 -4 l7 4 -7 4 M180 228 V260 H330 V5 H180 V28 m-4 -7 l4 7 4 -7" fill="none" stroke="${INK}" stroke-width="1.2"/>`,
      text(337, 85, 'Right → left'),
      text(337, 101, '(99,y) → (0,y)'),
      text(337, 160, 'Bottom → top'),
      text(337, 176, '(x,99) → (x,0)'),
      text(8, 271, 'The reverse crossings wrap too: left → right and top → bottom.'),
    ].join(''),
    'A 100 by 100 map grid, with horizontal and vertical wrap paths connecting opposite edges.',
    'The map wraps in both directions on both axes; it does not have an outside border.',
  );
}

function fadetime(): HTMLElement {
  const parts = [text(8, 16, '0 → 63 component: level(k) = floor(63k / 65)', 'font-weight="700"')];
  for (let k = 0; k <= 65; k++) {
    const level = Math.floor((63 * k) / 65);
    parts.push(`<rect x="${12 + k * 6.5}" y="${100 - level}" width="5.5" height="${level + 1}" fill="${SPOT}"/>`);
  }
  parts.push(
    text(12, 120, 'Step 0'),
    text(220, 120, '33', 'text-anchor="middle"'),
    text(435, 120, '65', 'text-anchor="end"'),
    text(8, 143, '65 updates, 63 level changes; unchanged steps are distributed.'),
    text(8, 159, 'If one update per 70 Hz refresh: 65 / 70 ≈ 0.93 second (estimate).'),
  );
  return figure(
    '0 0 450 168',
    parts.join(''),
    'Static staircase from level 0 to 63 across 65 palette iterations; duration conditional on separate refreshes.',
    'The accumulator spreads 63 level changes across 65 updates. No extra levels 64 or 65 exist.',
  );
}

function blockbits(): HTMLElement {
  return figure(
    '0 0 450 176',
    [
      bitRow(20, '+405 solid', ['–', '–', '–', '–', 'L', 'B', 'R', 'T']),
      bitRow(64, '+406 hurt (unused)', ['–', '–', '–', '–', 'L', 'B', 'R', 'T']),
      bitRow(108, '+415 gravity', ['–', '–', '–', '–', 'L', 'D', 'R', 'U']),
      text(8, 153, 'Masks 1, 2, 4, 8 select top/up, right, bottom/down, left.'),
      text(8, 168, 'Other tail fields are whole byte or little-endian word values.'),
    ].join(''),
    'Block side and gravity low-nibble flags. High bits have no side assignment.',
    'The 20-byte property tail follows all 400 pixels; the layout plate gives every field offset.',
  );
}

function framebits(): HTMLElement {
  return figure(
    '0 0 450 116',
    [
      bitRow(20, 'Frame +4 (low byte)', ['b', 'b', 'b', 'b', 't', 't', 't', 't']),
      text(8, 61, 'Low nibble: top orientation. High nibble: bottom orientation.'),
      text(8, 77, 'Each orientation is 0 … 7; frame +5 is the upper word byte.'),
      text(8, 93, 'Sequence +170: ASCII byte; +171: scan-code byte.'),
      text(8, 109, 'Frame +6/+7 top picture; +8/+9 bottom picture (lo then hi).'),
    ].join(''),
    'Frame orientation nibbles, picture word order and sequence key bytes.',
    'Nibbles are four bits. Picture fields are indexes with special values, not image bytes.',
  );
}

function vocbits(): HTMLElement {
  return figure(
    '0 0 450 78',
    [
      text(8, 16, 'VOC nonzero block: [type] [length low] [middle] [high]', 'font-weight="700"'),
      text(8, 35, 'Length = low + 256 × middle + 65,536 × high (24 bits).'),
      text(8, 53, 'Then exactly length payload bytes. Type 0 is a lone terminator.'),
      text(8, 71, 'WOOF.VOC: 7C 09 00 → 124 + 9 × 256 = 2,428.'),
    ].join(''),
    'VOC 24-bit payload length decoded little endian.',
    'The length excludes the four bytes that identify the block and its size.',
  );
}

function musicbits(): HTMLElement {
  return figure(
    '0 0 450 120',
    [
      bitRow(20, 'CMF delay byte', ['C', 'd', 'd', 'd', 'd', 'd', 'd', 'd']),
      text(8, 59, 'C = 1: another delay byte follows; C = 0: last group.'),
      text(8, 76, 'Seven-bit groups are most significant first: 81 12 = 146.'),
      text(8, 93, 'Then status: high nibble command, low nibble channel 0 … 15.'),
      text(8, 110, 'Example: 90 3C 40 → note on, channel 0, pitch 60, velocity 64.'),
    ].join(''),
    'CMF variable length delay bit layout and MIDI command nibbles.',
    'A delay of zero groups simultaneous events; logical channels share the FM voices.',
  );
}

function recbits(): HTMLElement {
  return figure(
    '0 0 450 85',
    [
      bitRow(20, 'REC key byte', ['R', 's', 's', 's', 's', 's', 's', 's']),
      text(8, 60, 'R = 0 press, R = 1 release; s = seven-bit scan code.'),
      text(8, 77, 'Event bytes: delta low, delta high, key. 4D → CD releases Right.'),
    ].join(''),
    'REC scan-code byte with release bit 7 and seven scan-code bits.',
    'The two-byte delta counts game ticks since the previous event.',
  );
}

// Pixel indexes and six-bit RGB triples read from non-secret TEDDY game assets.
const GRID_PALETTE =
  '0000002121212b00001c00001c1c1c1717171212123500000830180704030f0a091623371c2738222b39272f3b2d333a3335373838343e3b323232313938343f3e36091505111d0819240b202c0f283412060e060a15090f1b0b13220d110903180e0620130a27190d2f1e10130a041c110826180c2f1f10382614282624302e2a3836303f3e351707041f0c0828110b30160e381b111311111c191724211d2c28233530280b0909110f0e1614131c1a191207071b0b0a240e0c2d120f10161c181e22202629282e301e0b022613062f1b0b37230f3f2b13342d253a352d3f3d340d0602150b051d100825150a2d1a0d2003042b0908350f0d3f1512281a00302407382f0d3f3a14070a190d1423141d2d1a273607190a1027121a35191105131c0d1e271528321d332d0f1733191f3924273f2e2f20110a2b1d1335281d3f34260e0e0e1918172423202f2d293a3732081120121d271d292f283536320f113f20202d1b0633261239321e3f3d2b3f0f1e3f2a1532371d16353628190234280d3f3817000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const GRID_BLOCK =
  '1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1919191a191a1919191919191919191a191a191a191819191919191819181918191819191919191918181818171918181818181818181819171818191816181716181816181618161816181816181818162117162118162216221720161f1618211617182121162220162021201f16222021211621211616212121212021212121212121212121222122212020222122212121212221212221212120212121212121212221212121212122222221212021222121212022202121212120202021212021202122222221212122212122232120212221212121212122212121212122211f212021212220212121202121212121212121222121212121212121222121212020212121222121222121212121212121212121222120212121222222212121212121212122212221222121222121212121222121212121212121212121212121212022212121202121212021212221222021212122202021222121212021202021222221212121212222212121202220212121212121212120';
const GRID_HERO =
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff43ffffffffffffffffffff43ffffffffffffff436543ffffffffffffffff436543ffffffffffff43654643ffffffffffff43466543ffffffffffff434646464343434343434646464343ffffffffffff43464746464646464647464643ffffffffffffff434646094646464609464643ffffffffffffff434646464a4a4a4a4a4a46464643ffffffffffff4346464a4a4a09094a4a4a464643ffffffffffffff434a4a4a4a75754a4a4a4a43ffffffffffffffffff434a4a4a75754a4a4a43ffffffffffffffffff43464a4a4a4a4a4a4a4a4643ffffffffffffff434646464a4a4a4a4a4a46464643ffffffffffff434646464a4a4a4a4a4a46464643ffffffffffff4346464a4a4a4a4a4a4a4a464643ffffffffffff434a4a434a4a4a4a4a434a4a43ffffffffffffffff4343ff434343434343ff4343ffffffffff';
const GRID_MONSTER =
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff5757ffffffffffffffffffffffffffffffffffffff5757ffffffffff57ffffffffffffffffffffffffff57ffffffffffff57ffffffffffffffffff09ffff5757ffffffffffff57ffffffffffffff090909ffff57ffffffffffffff57ffffffffffff090909ffff57ffffffffffffff57ffffffffffffff09ffff5757ffffffffffff57ffffffffffffffffffffff57ffffffffffff57ffffffffffffffffffffff5757ffffffffff57ffffffffffffffffffffff5757ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

function pixelGrid(x: number, y: number, hex: string, transparent: boolean): string {
  let out = '';
  for (let i = 0; i < 400; i++) {
    const c = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    const rgb = [0, 1, 2].map((k) => Math.round((parseInt(GRID_PALETTE.slice(c * 6 + k * 2, c * 6 + k * 2 + 2), 16) * 255) / 63));
    const fill = transparent && c === 255 ? '#fff' : `rgb(${rgb.join(',')})`;
    out += `<rect x="${x + (i % 20) * 6}" y="${y + Math.floor(i / 20) * 6}" width="6" height="6" fill="${fill}" stroke="#777" stroke-width=".2"/>`;
  }
  return out;
}

function blockgrid(): HTMLElement {
  return figure(
    '0 0 450 165',
    pixelGrid(12, 20, GRID_BLOCK, false) +
      [
        text(150, 30, 'PARK.BBL block 10: 20 × 20 pixel bytes', 'font-weight="700"'),
        text(150, 52, '(0,0) = +0; (19,0) = +19'),
        text(150, 70, '(0,1) = +20; (19,19) = +399'),
        text(150, 88, 'Pixel (x,y) = base + 20y + x'),
        text(150, 110, 'Then +400 … +419: twenty property bytes'),
        text(150, 128, 'Next record begins at base +420'),
        `<path d="M132 140 H145 V109 H148" fill="none" stroke="${INK}"/>`,
      ].join(''),
    'A real 20 by 20 PARK.BBL block grid with pixel byte addresses and a leader to the property tail.',
    'One pixel = one palette-index byte. The following plates unpack the property tail.',
  );
}

function spritegrid(): HTMLElement {
  return figure(
    '0 0 450 196',
    [
      text(12, 14, 'TEDDY.CBL picture 8', 'font-weight="700"'),
      text(235, 14, 'PARK.MBL picture 0', 'font-weight="700"'),
      pixelGrid(12, 28, GRID_HERO, true),
      pixelGrid(235, 28, GRID_MONSTER, true),
      text(12, 168, 'Each grid: 400 pixel bytes, then the same 20 property bytes.'),
      text(12, 184, 'CHR / MON behavior records are separate from these picture files.'),
    ].join(''),
    'Real 20 by 20 character and monster picture grids. Transparent index 255 is white paper with grid lines.',
    'Sprites use the scene palette; white paper marks transparent pixels. MON and CHR plates describe their separate behavior bytes.',
  );
}

/** The booklet's diagrams by the names booklet1994.md gives them. */
export const TECHREF_DIAGRAMS: Diagrams = {
  memory,
  screen,
  pieces,
  scrolling,
  architecture,
  palettebits,
  mapcells,
  wrapmap,
  fadetime,
  blockbits,
  framebits,
  vocbits,
  musicbits,
  recbits,
  blockgrid,
  spritegrid,
  ...FORMAT_DIAGRAMS,
};
