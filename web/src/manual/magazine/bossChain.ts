// The Design Workshop's diagram of a boss with hit points (sections/masters.ts): a chain of
// monster copies. Each hittable boss, when hit, turns into a flashing copy that can't be hurt,
// which turns back after 50 ticks into the next hittable one; the big points are on the last.
import { svgArt } from './svgArt';

const W = 300;
const H = 132;
/** The hittable bosses across the top, and where each flashing copy sits between two of them. */
const BOSS_X = [24, 76, 128, 222, 274];
const FLASH_X = [50, 102, 154, 248];
const TOP = 34;
/** Where the chain skips ahead (the fourth link), and the flashing copy whose arrow leads into the skip. */
const DOTS = 175;
const GAP = 2;
const LOW = 92;

const ink = '#2b241c';

function boss(x: number, label: string, last: boolean): string {
  return `<g transform="translate(${x} ${TOP})">
    <rect x="-19" y="-15" width="38" height="30" rx="7" fill="${last ? '#f2c14e' : '#e8f3e4'}" stroke="${ink}" stroke-width="1.6"/>
    <circle cx="-7" cy="-3" r="2.4" fill="${ink}"/><circle cx="7" cy="-3" r="2.4" fill="${ink}"/>
    <path d="M-7 6 q7 5 14 0" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
    <text y="-20" text-anchor="middle" font-size="10" font-weight="700" fill="${ink}">${label}</text>
  </g>`;
}

function flash(x: number): string {
  // the copy that can't be hurt: the same face, dashed and flashing (rays)
  const rays = [30, 90, 150, 210, 270, 330]
    .map((a) => {
      const r = (a * Math.PI) / 180;
      return `<line x1="${(Math.cos(r) * 20).toFixed(1)}" y1="${(Math.sin(r) * 17).toFixed(1)}" x2="${(Math.cos(r) * 25).toFixed(1)}" y2="${(Math.sin(r) * 22).toFixed(1)}" stroke="#d9381e" stroke-width="1.4" stroke-linecap="round"/>`;
    })
    .join('');
  return `<g transform="translate(${x} ${LOW})">${rays}
    <rect x="-15" y="-12" width="30" height="24" rx="6" fill="#fff" stroke="${ink}" stroke-width="1.4" stroke-dasharray="3 2"/>
    <circle cx="-5" cy="-2" r="2" fill="${ink}"/><circle cx="5" cy="-2" r="2" fill="${ink}"/>
    <path d="M-5 5 h10" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>
  </g>`;
}

const arrow = (x1: number, y1: number, x2: number, y2: number) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="1.3" marker-end="url(#bc-head)"/>`;

const MARKUP = `<g font-family="Arial, Helvetica, sans-serif">
  <defs><marker id="bc-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${ink}"/></marker></defs>
  <rect width="${W}" height="${H}" fill="#fffdf7"/>
  ${BOSS_X.map((x, i) => boss(x, i === BOSS_X.length - 1 ? '' : ['1', '2', '3', '5'][i], i === BOSS_X.length - 1)).join('')}
  <text x="${DOTS}" y="${TOP + 4}" text-anchor="middle" font-size="16" font-weight="700" fill="${ink}">· · ·</text>
  ${FLASH_X.map((x) => flash(x)).join('')}
  ${FLASH_X.map((x, i) => arrow(BOSS_X[i] + 6, TOP + 17, x - 7, LOW - 15) + (i === GAP ? arrow(x + 7, LOW - 15, DOTS - 8, TOP + 8) : arrow(x + 7, LOW - 15, BOSS_X[i + 1] - 6, TOP + 17))).join('')}
  <text x="${W - 4}" y="${TOP - 20}" text-anchor="end" font-size="8.5" font-weight="700" fill="#b3261e">BIG POINTS ★</text>
  <text x="${W / 2}" y="${H - 6}" text-anchor="middle" font-size="9" fill="${ink}">↘ hit: a copy that can’t be hurt flashes · ↗ 50 ticks: the next one</text></g>`;

/** The chain of boss states, as an image labeled `alt`. */
export function bossChainArt(alt: string): SVGSVGElement {
  return svgArt(`0 0 ${W} ${H}`, MARKUP, alt, 'mag-diagram');
}
