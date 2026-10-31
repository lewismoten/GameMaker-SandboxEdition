// The Fort Locks toy safe, drawn in SVG: a green metal cube with rounded corners, a door on two
// hinges of the same green at its right, a red combination dial (numbers 0 to 55 by fives, 60 ticks, a chrome
// ring), a coin slot on top at the right and a red plate with chrome letters under the door.
// Drawn by Claude Sonnet 5.5 from Lewis's description of his childhood bank.
import { TICKS } from './dial';

const CX = 70; // the dial sits on the left side of the door; the hinges are on the right
const CY = 120;

function dialFace(): string {
  const polar = (r: number, tick: number) => {
    const a = (-tick * 2 * Math.PI) / TICKS; // numbers go up counterclockwise, so turning right raises them
    return [CX + r * Math.sin(a), CY - r * Math.cos(a)] as const;
  };
  let s = `<circle r="33" cx="${CX}" cy="${CY}" fill="#c4161c"/>`;
  for (let t = 0; t < TICKS; t++) {
    const five = t % 5 === 0;
    const [x1, y1] = polar(33, t);
    const [x2, y2] = polar(five ? 27.5 : 29.8, t);
    s += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#fff3e0" stroke-width="${five ? 0.9 : 0.5}"/>`;
  }
  for (let n = 0; n < 60; n += 5) {
    const [x, y] = polar(21.5, n);
    const a = (-n * 360) / TICKS;
    s += `<text x="${x.toFixed(2)}" y="${(y + 2.3).toFixed(2)}" transform="rotate(${a} ${x.toFixed(2)} ${y.toFixed(2)})" text-anchor="middle" font-size="6.2" font-weight="700" font-family="Arial,Helvetica,sans-serif" fill="#fff3e0">${n}</text>`;
  }
  return `${s}<circle r="7.5" cx="${CX}" cy="${CY}" fill="url(#kn-chrome)" stroke="#6b7078" stroke-width="0.8"/>`;
}

/** The safe; `open` swings the door aside and shows the dark inside, `pos` is the dial's tick. */
export function safeSvg(open: boolean, pos = 0): string {
  const door = open
    ? `<rect x="24" y="72" width="152" height="100" rx="6" fill="#1b1410"/>
       <rect x="28" y="76" width="144" height="92" rx="4" fill="#2b2118"/>
       <path d="M30 150h140" stroke="#5a4632" stroke-width="3"/><path d="M30 120h140" stroke="#5a4632" stroke-width="3"/>
       <path d="M176 72 L146 80 L146 164 L176 172 Z" fill="#2a7f3a" stroke="#0c3515" stroke-width="2" stroke-linejoin="round"/>
       <g stroke="#6b3a0e" stroke-width="1.2" fill="#e8c27a" transform="translate(-20 0)"><rect x="70" y="134" width="26" height="9" rx="4.5"/><circle cx="70" cy="136" r="4"/><circle cx="70" cy="141" r="4"/><circle cx="96" cy="136" r="4"/><circle cx="96" cy="141" r="4"/><circle cx="130" cy="138" r="8" fill="#f6e6a8"/><circle cx="130" cy="138" r="3" fill="#2b2118"/><circle cx="150" cy="138" r="8" fill="#f6e6a8"/><circle cx="150" cy="138" r="3" fill="#2b2118"/><path d="M80 106l22-4 3 10-22 4z" fill="#a8602a"/><path d="M120 108h40l-4 12h-32z" fill="#f4eed6"/></g>
       <circle cx="162" cy="122" r="9" fill="#c4161c" stroke="#d8dde2" stroke-width="2"/>`
    : `<rect x="24" y="72" width="152" height="100" rx="7" fill="#2a7f3a" stroke="#0c3515" stroke-width="2"/>
       <rect x="29" y="77" width="142" height="90" rx="4" fill="none" stroke="#1d5f2b" stroke-width="2"/>
       <circle cx="${CX}" cy="${CY}" r="40" fill="url(#kn-chrome)" stroke="#5c6168" stroke-width="1.2"/>
       <circle cx="${CX}" cy="${CY}" r="35" fill="#8e1317"/>
       <g class="kn-dial-turn" style="transform-origin:${CX}px ${CY}px;transform:rotate(${(pos * 360) / TICKS}deg)">${dialFace()}</g>
       <path d="M${CX - 4} ${CY - 44} h8 l-4 7 z" fill="#c4161c" stroke="#5c6168" stroke-width="0.8"/>`;
  const hinges = [84, 148]
    .map(
      (y) =>
        `<rect x="168" y="${y}" width="18" height="14" rx="3" fill="#2a7f3a" stroke="#0c3515" stroke-width="2"/><circle cx="181" cy="${y + 7}" r="1.8" fill="#0c3515"/>`,
    )
    .join('');
  return `<svg viewBox="0 0 200 212" xmlns="http://www.w3.org/2000/svg" class="kn-svg">
    <defs>
      <linearGradient id="kn-chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdfdfe"/><stop offset=".45" stop-color="#aab0b8"/><stop offset=".7" stop-color="#eef0f3"/><stop offset="1" stop-color="#7d838b"/></linearGradient>
    </defs>
    <path d="M30 30h140q10 0 14 10l8 22H8l8-22q4-10 14-10z" fill="#3c9a4e" stroke="#0c3515" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="124" y="42" width="34" height="6" rx="3" fill="#0e2a14"/>
    <path d="M8 65q0-3 3-3h178q3 0 3 3v125q0 14-14 14H22q-14 0-14-14z" fill="#216b30" stroke="#0c3515" stroke-width="2.5"/>
    ${hinges}${door}
    <rect x="48" y="179" width="104" height="19" rx="2" fill="#c4161c" stroke="url(#kn-chrome)" stroke-width="2.6"/>
    <text x="100" y="193" text-anchor="middle" font-size="12.5" font-weight="900" letter-spacing="1.1" font-family="Arial Black,Arial,Helvetica,sans-serif" fill="url(#kn-chrome)" stroke="#5c6168" stroke-width=".35">FORT LOCKS</text>
  </svg>`;
}
