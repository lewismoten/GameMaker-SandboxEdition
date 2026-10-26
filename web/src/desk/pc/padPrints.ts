// The mouse pad's prints, each an SVG in the pad's own 156 x 140 pixels (padChoice.ts lists
// them): THE -= S A N D B O X =- BBS's logon screen it came with, and Square Deal Pad Co.'s THE
// CHEZ (drawn by desk/props/chezArt.ts, as everywhere), graph paper with a level pencilled on
// it, a night sky, and plain blue. The desk's pad (tray.ts) and the magazine's chooser
// (padChooser.ts) both draw from here.
import { SANDBOX_COLORS } from '../../retro/bbs/bbsName';
import { drawChez } from '../props/chezArt';
import type { PadPrint } from './padChoice';

const W = 156;
const H = 140;
const CGA = ['#000', '#00a', '#0a0', '#0aa', '#a00', '#a0a', '#a50', '#aaa', '#555', '#55f', '#5f5', '#5ff', '#f55', '#f5f', '#ff5', '#fff'];

/** Each drawing gets its own ids, since a page can show the same print twice (desk and preview). */
let serial = 0;

function sandbox(id: string): string {
  const letters = [...'SANDBOX'].map((c, i) => `<text x="${14 + i * 18.5}" y="38" fill="${CGA[SANDBOX_COLORS[i]]}">${c}</text>`).join('');
  const stars = [
    [18, 10],
    [44, 6],
    [70, 14],
    [96, 8],
    [128, 12],
    [146, 5],
    [112, 22],
    [30, 20],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9" fill="#fff" opacity="0.8"/>`)
    .join('');
  return `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f2e"/><stop offset="1" stop-color="#23407c"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#${id}-sky)"/>
    ${stars}
    <circle cx="132" cy="62" r="9" fill="#ffe7a0" opacity="0.9"/>
    <g font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="22" stroke="#000" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${letters}</g>
    <text x="78" y="54" text-anchor="middle" font-family="'Courier New', monospace" font-weight="700" font-size="11" fill="#ff5">-= B B S =-</text>
    <path d="M0 104 Q30 84 62 96 T120 92 T156 98 V140 H0 Z" fill="#b8863d"/>
    <path d="M0 116 Q40 100 84 112 T156 108 V140 H0 Z" fill="#e2bf78"/>
    <g fill="#9c6c2c"><rect x="18" y="80" width="26" height="18"/><rect x="14" y="74" width="8" height="10"/><rect x="40" y="74" width="8" height="10"/><rect x="26" y="70" width="10" height="12"/><path d="M28 98 v-8 a3 3 0 0 1 6 0 v8 z" fill="#5c3c14"/></g>
    <path d="M31 70 v-9 l7 3 -7 3" fill="#f55" stroke="#5c3c14" stroke-width="0.8"/>
    <text x="150" y="132" text-anchor="end" font-family="'Courier New', monospace" font-weight="700" font-size="9" fill="#3a2a10">1-412-555-SAND</text>`;
}

/** Doc Leo sits back from the windshield, his face and hat whole in the door window (as in the magazine). */
const DRIVER_SEAT: [number, number] = [-3, 0.5];
let chezPng: string | undefined;

/** THE CHEZ from the passenger side, drawn once on a canvas: 44 x 24 of the car's units, the ground at 22. */
function chezImage(): string {
  if (chezPng !== undefined) return chezPng;
  const k = 8;
  const c = document.createElement('canvas');
  c.width = 44 * k;
  c.height = 24 * k;
  const ctx = c.getContext('2d');
  if (ctx) drawChez(ctx, 2 * k, 22 * k, k, DRIVER_SEAT);
  chezPng = ctx ? c.toDataURL() : '';
  return chezPng;
}

function chez(id: string): string {
  // the car is 44 units wide: 136 pad pixels, so the ground (unit 22 of 24) is at 52 + 68
  const img = chezImage();
  return `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4f1f2"/><stop offset="1" stop-color="#86cfd4"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#${id}-sky)"/>
    <circle cx="128" cy="62" r="20" fill="#fff6c8" opacity="0.7"/>
    <path d="M0 104 Q36 92 78 100 T156 96 V140 H0 Z" fill="#9ccf86"/>
    <rect y="114" width="${W}" height="26" fill="#45464c"/>
    <rect y="114" width="${W}" height="1.5" fill="#2e2f33"/>
    <g fill="#f4f0d8">${[8, 40, 72, 104, 136].map((x) => `<rect x="${x}" y="128" width="14" height="2"/>`).join('')}</g>
    <g font-family="'Arial Black', Arial, sans-serif" font-weight="900" text-anchor="middle" paint-order="stroke" stroke-linejoin="round">
      <text x="78" y="30" font-size="25" fill="#e8402c" stroke="#fff" stroke-width="4">THE CHEZ</text>
      <text x="78" y="44" font-size="8" fill="#26262a" letter-spacing="1.5">1976½ CITICAR</text>
    </g>
    ${img ? `<image href="${img}" x="10" y="52" width="136" height="74"/>` : ''}`;
}

function graph(id: string): string {
  const pencil = 'fill="none" stroke="#55565e" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"';
  return `<defs>
      <pattern id="${id}-fine" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M6 0 V6 H0" fill="none" stroke="#b7d0ee" stroke-width="0.5"/></pattern>
      <pattern id="${id}-bold" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0 V30 H0" fill="none" stroke="#6f9bd6" stroke-width="0.8"/></pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="#fcfcf6"/>
    <rect width="${W}" height="${H}" fill="url(#${id}-fine)"/>
    <rect width="${W}" height="${H}" fill="url(#${id}-bold)"/>
    <g ${pencil}>
      <path d="M6 108 H54 M72 108.5 H150"/>
      <path d="M54 108 V122 M72 108.5 V122"/>
      <path d="M58 118 l3 -4 3 4 3 -4 3 4" stroke="#b03a2e"/>
      <path d="M84 84 H120 M96 60 H132 M30 72 H60"/>
      <path d="M112 84 V108 M118 84 V108 M112 90 H118 M112 96 H118 M112 102 H118"/>
      <circle cx="18" cy="100" r="3"/><path d="M18 103 V108 M15 105 H21"/>
      <path d="M26 66 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M44 66 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M90 78 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0"/>
      <path d="M124 60 V44 H136 V60"/>
      <path d="M38 98 q12 -22 30 -26 m-6 -2 l6 2 -3 5" stroke-dasharray="2 2"/>
    </g>
    <g font-family="'Comic Sans MS', 'Marker Felt', 'Chalkboard', cursive" fill="#45464e" opacity="0.9">
      <text x="10" y="22" font-size="11">LEVEL 1</text>
      <text x="10" y="33" font-size="7">jump the pit!</text>
      <text x="122" y="40" font-size="7">EXIT</text>
      <text x="56" y="132" font-size="7" fill="#b03a2e">spikes</text>
    </g>`;
}

/** A tiny repeatable scatter, so the stars are always in the same places. */
function scatter(n: number, seed: number): [number, number, number][] {
  let s = seed;
  const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  return Array.from({ length: n }, () => [r() * W, r() * H, r()] as [number, number, number]);
}

function night(id: string): string {
  const stars = scatter(70, 1994)
    .map(
      ([x, y, b]) =>
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.35 + b * 0.75).toFixed(2)}" fill="#fff" opacity="${(0.45 + b * 0.5).toFixed(2)}"/>`,
    )
    .join('');
  const twinkles = [
    [30, 26],
    [118, 108],
    [70, 120],
  ]
    .map(([x, y]) => `<path d="M${x - 4} ${y} H${x + 4} M${x} ${y - 4} V${y + 4}" stroke="#eef2ff" stroke-width="0.7"/>`)
    .join('');
  return `<defs>
      <linearGradient id="${id}-sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#03041a"/><stop offset="0.6" stop-color="#101848"/><stop offset="1" stop-color="#2a1d58"/></linearGradient>
      <mask id="${id}-moon"><circle cx="122" cy="32" r="15" fill="#fff"/><circle cx="129" cy="27" r="13" fill="#000"/></mask>
      <linearGradient id="${id}-tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0.9"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${id}-sky)"/>
    <path d="M0 96 Q40 70 80 86 T156 70 V100 Q100 118 50 108 T0 120 Z" fill="#6c5aa8" opacity="0.18"/>
    ${stars}
    ${twinkles}
    <circle cx="122" cy="32" r="15" fill="#fff1c0" mask="url(#${id}-moon)"/>
    <g transform="rotate(-18 42 92)">
      <ellipse cx="42" cy="92" rx="24" ry="6" fill="none" stroke="#e8c88c" stroke-width="2.2" opacity="0.9"/>
      <circle cx="42" cy="92" r="13" fill="#d98a4a"/>
      <path d="M30 88 Q42 85 54 88 M29.5 95 Q42 98 54.5 95" stroke="#b86a34" stroke-width="2" fill="none"/>
      <path d="M18 92 A24 6 0 0 0 66 92" fill="none" stroke="#f2dcae" stroke-width="2.2"/>
    </g>
    <path d="M70 46 L100 34" stroke="url(#${id}-tail)" stroke-width="1.4" stroke-linecap="round"/>`;
}

function blue(id: string): string {
  return `<defs><radialGradient id="${id}-sheen" cx="0.3" cy="0.3" r="0.8"><stop offset="0" stop-color="#2a5296"/><stop offset="1" stop-color="#1d3f7a"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#${id}-sheen)"/>
    <text x="148" y="133" text-anchor="end" font-family="Arial, sans-serif" font-weight="700" font-size="6" letter-spacing="1" fill="#2c5092">SQUARE DEAL</text>`;
}

const PRINTS: Record<PadPrint, (id: string) => string> = { sandbox, chez, graph, night, blue };

/** The print as an SVG element's markup, stretched to fill whatever box holds it. */
export function padSvg(print: PadPrint): string {
  const id = `pad${++serial}`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${PRINTS[print](id)}</svg>`;
}
