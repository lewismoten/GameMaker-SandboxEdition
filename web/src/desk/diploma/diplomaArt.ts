// The framed certificate on the desk's wall, as an SVG string: a hanging wire on a nail, a metal frame in the
// level's color (frameLevel.ts), a cream certificate with ruled lines for its words and a red rosette seal,
// and for the diploma a blue ribbon across the top corner. Small on purpose: about the size of the phone's
// keypad beside it.
import type { FrameLook, Metal } from './frameLevel';

export const ART_W = 88;
export const ART_H = 84;

const METALS: Record<Metal, [dark: string, light: string]> = {
  bronze: ['#7a4a24', '#d39a63'],
  silver: ['#7d8691', '#e6ebf0'],
  gold: ['#9a7120', '#f4d36a'],
};

/** The picture for a frame look. */
export function diplomaSvg(look: Pick<FrameLook, 'metal' | 'ribbon'>): string {
  const [dark, light] = METALS[look.metal];
  const id = `dpl-${look.metal}`;
  // the frame hangs from y 20 (the wire's nail at the top), 88 x 64
  const lines = [36, 42, 48, 54]
    .map(
      (y, i) =>
        `<rect x="${i === 0 ? 24 : 18}" y="${y}" width="${i === 0 ? 40 : i === 3 ? 22 : 52}" height="${i === 0 ? 3 : 1.6}" rx="0.8" fill="${i === 0 ? '#5b4630' : '#9c8a70'}"/>`,
    )
    .join('');
  // the seal: a scalloped rosette with two short tails, bottom right
  const petals = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return `<circle cx="${(64 + Math.cos(a) * 5).toFixed(2)}" cy="${(64 + Math.sin(a) * 5).toFixed(2)}" r="2.6" fill="#b3261e"/>`;
  }).join('');
  const ribbon = look.ribbon ? `<path d="M4 38 L4 28 L28 20 L38 20 Z" fill="#1f5fae"/><path d="M4 38 L38 20" stroke="#8fb8ec" stroke-width="1.2"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ART_W} ${ART_H}" width="${ART_W}" height="${ART_H}">
<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="0.55" stop-color="${dark}"/><stop offset="1" stop-color="${light}"/></linearGradient></defs>
<path d="M10 22 L44 4 L78 22" fill="none" stroke="#8a8478" stroke-width="1"/>
<circle cx="44" cy="4" r="2.2" fill="#6b6b6b"/>
<rect x="0" y="20" width="88" height="64" rx="2" fill="url(#${id})"/>
<rect x="5" y="25" width="78" height="54" fill="${dark}" opacity="0.55"/>
<rect x="7" y="27" width="74" height="50" fill="#f6eed8"/>
<rect x="10" y="30" width="68" height="44" fill="none" stroke="#c9a85a" stroke-width="1"/>
${lines}
<path d="M61 66 L58 76 L61.5 74 L63 77 Z M67 66 L70 76 L66.5 74 L65 77 Z" fill="#8c1d17"/>
${petals}<circle cx="64" cy="64" r="4.6" fill="#d8443a"/><circle cx="64" cy="64" r="2.4" fill="#f2c94c"/>
${ribbon}
</svg>`;
}
