// A giant wristwatch hung on the wall as a clock, as everybody's big sister had in the 90s:
// a black sport strap hanging from a nail, a chrome case and a white face, keeping the
// room's time (ticking each second, the date in its window): the visitor's own, unless DOS's
// TIME or DATE set it (retro/dos/deskClock.ts), and then its tooltip and name say so.
// It hangs on the wall left of the desk, so it only shows when the window is wide enough to
// have wall there (stage.ts sets .wide-wall).
import './wallClock.css';
import { h } from '../../editor/core/ui';
import { deskClockSet, deskNow } from '../../retro/dos/deskClock';

const CX = 90;
const CY = 262;

const hand = (cls: string, len: number, back: number, width: number, color: string) =>
  `<g class="${cls}"><rect x="${CX - width / 2}" y="${CY - len}" width="${width}" height="${len + back}" rx="${width / 2}" fill="${color}"/></g>`;

export function wallClock(): HTMLElement {
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const big = i % 5 === 0;
    const a = (i * Math.PI) / 30;
    const r1 = big ? 58 : 62;
    const x = (r: number) => (CX + Math.sin(a) * r).toFixed(1);
    const y = (r: number) => (CY - Math.cos(a) * r).toFixed(1);
    return `<line x1="${x(r1)}" y1="${y(r1)}" x2="${x(66)}" y2="${y(66)}" stroke="#222" stroke-width="${big ? 3 : 1}"/>`;
  }).join('');
  const numbers = [12, 3, 6, 9]
    .map((n) => {
      const a = (n * Math.PI) / 6;
      return `<text x="${CX + Math.sin(a) * 46}" y="${CY - Math.cos(a) * 46 + 7}" text-anchor="middle" font-size="20" font-weight="800" font-family="Arial Black, Arial, sans-serif" fill="#222">${n}</text>`;
    })
    .join('');
  const holes = Array.from({ length: 6 }, (_, i) => `<ellipse cx="${CX}" cy="${372 + i * 22}" rx="4" ry="5" fill="#050506"/>`).join('');
  const el = h('div', { class: 'wall-clock', role: 'img' });
  el.innerHTML = `<svg viewBox="0 0 180 540" aria-hidden="true">
    <defs>
      <linearGradient id="wc-strap" x1="0" x2="1"><stop offset="0" stop-color="#141517"/><stop offset="0.45" stop-color="#3a3d42"/><stop offset="1" stop-color="#101113"/></linearGradient>
      <linearGradient id="wc-chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfbfb"/><stop offset="0.45" stop-color="#a8adb4"/><stop offset="0.55" stop-color="#e6e8ea"/><stop offset="1" stop-color="#7d838a"/></linearGradient>
      <radialGradient id="wc-face" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e9e4"/></radialGradient>
    </defs>
    <!-- the nail, and the buckle hung on it -->
    <circle cx="${CX}" cy="14" r="3" fill="#555"/>
    <rect x="${CX - 34}" y="10" width="68" height="34" rx="8" fill="none" stroke="url(#wc-chrome)" stroke-width="6"/>
    <rect x="${CX - 2}" y="12" width="4" height="30" rx="2" fill="url(#wc-chrome)"/>
    <!-- the strap above the case, with its keeper loop -->
    <rect x="${CX - 28}" y="30" width="56" height="170" rx="6" fill="url(#wc-strap)"/>
    <rect x="${CX - 31}" y="62" width="62" height="12" rx="3" fill="#1b1c1f"/>
    <!-- and below, with its holes and a rounded tip -->
    <path d="M${CX - 28} 320 h56 v180 q0 28 -28 28 q-28 0 -28 -28 z" fill="url(#wc-strap)"/>
    ${holes}
    <!-- stitching down both straps -->
    <g stroke="#6b6f76" stroke-width="1.2" stroke-dasharray="4 4" fill="none">
      <path d="M${CX - 22} 48 v150 M${CX + 22} 48 v150"/>
      <path d="M${CX - 22} 322 v178 M${CX + 22} 322 v178"/>
    </g>
    <!-- the lugs, the crown, the chrome case and the face -->
    <rect x="${CX - 32}" y="178" width="64" height="20" rx="4" fill="url(#wc-chrome)"/>
    <rect x="${CX - 32}" y="326" width="64" height="20" rx="4" fill="url(#wc-chrome)"/>
    <rect x="${CX + 80}" y="${CY - 9}" width="10" height="18" rx="3" fill="url(#wc-chrome)"/>
    <circle cx="${CX}" cy="${CY}" r="84" fill="url(#wc-chrome)"/>
    <circle cx="${CX}" cy="${CY}" r="72" fill="url(#wc-face)" stroke="#8a8f96" stroke-width="1.5"/>
    ${ticks}
    ${numbers}
    <text x="${CX}" y="${CY - 20}" text-anchor="middle" font-size="7" font-weight="700" letter-spacing="2" font-family="Arial, sans-serif" fill="#139c93">QUARTZ</text>
    <text x="${CX}" y="${CY + 30}" text-anchor="middle" font-size="5.5" letter-spacing="1" font-family="Arial, sans-serif" fill="#777">WATER RESISTANT</text>
    <!-- the date window, clear of the 3 -->
    <rect x="${CX + 15}" y="${CY - 7}" width="18" height="14" fill="#fff" stroke="#888" stroke-width="1"/>
    <text class="wc-date" x="${CX + 24}" y="${CY + 4}" text-anchor="middle" font-size="10" font-weight="700" font-family="Arial, sans-serif" fill="#222"></text>
    ${hand('wc-hour', 36, 8, 7, '#222')}
    ${hand('wc-min', 56, 10, 4.5, '#222')}
    ${hand('wc-sec', 62, 16, 1.6, '#d3141c')}
    <circle cx="${CX}" cy="${CY}" r="4.5" fill="#d3141c"/>
    <!-- glare on the crystal -->
    <ellipse cx="${CX - 24}" cy="${CY - 34}" rx="34" ry="16" fill="#fff" opacity="0.25" transform="rotate(-30 ${CX - 24} ${CY - 34})"/>
  </svg>`;

  const turn = (cls: string, deg: number) => el.querySelector(`.${cls}`)?.setAttribute('transform', `rotate(${deg} ${CX} ${CY})`);
  const date = el.querySelector('.wc-date')!;
  let shown = '';
  const tick = () => {
    const now = deskNow();
    const set = deskClockSet();
    const s = now.getSeconds();
    const m = now.getMinutes() + s / 60;
    turn('wc-sec', s * 6);
    turn('wc-min', m * 6);
    turn('wc-hour', ((now.getHours() % 12) + m / 60) * 30);
    date.textContent = String(now.getDate());
    const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (`${time}${set}` !== shown) {
      shown = `${time}${set}`;
      el.setAttribute('aria-label', `A giant wristwatch hung on the wall as a clock: ${time}${set ? ' (set at the DOS prompt, not the real time)' : ''}`);
      // and a tooltip on the watch saying how to put it back
      const svg = el.querySelector('svg')!;
      svg.querySelector(':scope > title')?.remove();
      if (set) {
        const tip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        tip.textContent = 'Set with TIME at the DOS prompt, not the real time (TIME /LOCAL puts it back)';
        svg.prepend(tip);
      }
    }
  };
  tick();
  // quartz: the second hand jumps once a second
  const timer = setInterval(() => (el.isConnected ? tick() : clearInterval(timer)), 1000);
  return el;
}
