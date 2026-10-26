// The GRAVITAS GamePad's drawn parts as SVG (gamePadArt.ts puts them together), lit like the
// desk's other props from the upper left: the peanut shell with its side wall, rounded edge,
// dished lobes, dimpled grip dots, a soft shadow under it and the printed logo on its waist;
// the purple d-pad standing up off the left lobe with its cross raised on it; and the white
// joystick shaft, lying on its side (the desk) or standing in the d-pad's socket (the ad).
// Every gradient gets the caller's id prefix: a hidden copy's gradient would leave the others
// unpainted.

/** The shell's outline in its 200 x 100 box: two round lobes pinched in at the waist, a peanut in its shell. */
const SHELL = 'M50 3C76 3 83 29 100 29S124 3 150 3a47 47 0 0 1 0 94C124 97 117 71 100 71S76 97 50 97a47 47 0 0 1 0-94Z';

/** Each button's center in the shell's box (gamePadArt.css places the buttons there, 15 across). */
const BUTTON_AT = [
  [131, 50],
  [148, 67],
  [165, 50],
  [148, 33],
] as const;

/** The rows of grip dots round each lobe's outer edge, each a little dimple: dark, its far rim catching the light. */
function gripDots(): string {
  const at: string[] = [];
  for (const [cx, from] of [
    [50, 112],
    [150, -68],
  ] as const)
    for (const r of [40, 34])
      for (let a = 0; a <= 136; a += r === 40 ? 8.5 : 10.5) {
        const t = ((from + a) * Math.PI) / 180;
        at.push(`${(cx + r * Math.cos(t)).toFixed(1)} ${(50 + r * Math.sin(t)).toFixed(1)}`);
      }
  const dots = (dx: number, dy: number, r: number) =>
    at
      .map((p) => p.split(' ').map(Number))
      .map(([x, y]) => `<circle cx="${(x + dx).toFixed(2)}" cy="${(y + dy).toFixed(2)}" r="${r}"/>`)
      .join('');
  return `<g fill="#fbfbf9" fill-opacity="0.85">${dots(0.35, 0.45, 1.15)}</g><g fill="#7f7f7b">${dots(0, 0, 1.1)}</g>`;
}

/** A shape's rounded edge, inside its own outline: light along the upper left, shade along the lower right. */
const bevel = (id: string, d: string, light: number, shade: number, w: number) =>
  `<g clip-path="url(#${id})" fill="none">
    <path d="${d}" stroke="#000" stroke-opacity="${shade}" stroke-width="${w * 1.6}" transform="translate(${-w * 0.35} ${-w * 0.5})" filter="url(#${id}-blur)"/>
    <path d="${d}" stroke="#fff" stroke-opacity="${light}" stroke-width="${w}" transform="translate(${w * 0.25} ${w * 0.35})" filter="url(#${id}-blur)"/>
  </g>`;

/** A round dish pressed into the shell: shaded inside its upper left rim, a lit lip at its lower right. */
const dish = (id: string, cx: number, cy: number, r: number, fill: string) =>
  `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="${r * 0.18}" transform="translate(${r * 0.07} ${r * 0.1})" clip-path="url(#${id})" filter="url(#${id}-blur)"/>
  <circle cx="${cx}" cy="${cy}" r="${r + 0.3}" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="0.7" stroke-dasharray="${r * 2.2} ${r * 4.1}" stroke-dashoffset="${-r * 0.1}"/>`;

/** The shell, 200 x 100, its side wall and shadow below the box. */
export const shellSvg = (id: string): string => `<svg class="gp-shell" viewBox="0 0 200 100" overflow="visible" aria-hidden="true">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#f4f4f2"/><stop offset="0.5" stop-color="#dcdcd8"/><stop offset="1" stop-color="#b9b9b5"/></linearGradient>
    <linearGradient id="${id}-wall" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="#a9a9a4"/><stop offset="0.5" stop-color="#8d8d88"/><stop offset="1" stop-color="#6b6b67"/></linearGradient>
    <radialGradient id="${id}-dish" cx="0.6" cy="0.66" r="0.75"><stop offset="0" stop-color="#d9d9d5"/><stop offset="1" stop-color="#bdbdb9"/></radialGradient>
    <radialGradient id="${id}-gloss" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <pattern id="${id}-net" width="7" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-14)"><path d="M0 3Q1.75 0.6 3.5 3T7 3M1.75 6Q3.5 3.6 5.25 6" fill="none" stroke="#5a5040" stroke-opacity="0.09" stroke-width="0.6"/></pattern>
    <filter id="${id}-soft" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter>
    <filter id="${id}-tight" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="1"/></filter>
    <filter id="${id}-l-blur"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="${id}-r-blur"><feGaussianBlur stdDeviation="1.4"/></filter>
    <clipPath id="${id}-face"><path d="${SHELL}"/></clipPath>
    <filter id="${id}-face-blur"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <g class="gp-shadow">
    <path d="${SHELL}" fill="#000" fill-opacity="0.42" transform="translate(5 13)" filter="url(#${id}-soft)"/>
    <path d="${SHELL}" fill="#000" fill-opacity="0.5" transform="translate(1.2 10.6)" filter="url(#${id}-tight)"/>
  </g>
  <g class="gp-wall" fill="url(#${id}-wall)">
    ${[2, 4, 6, 8].map((y) => `<path d="${SHELL}" transform="translate(0 ${y})"/>`).join('')}
    <path d="${SHELL}" transform="translate(0.3 9.5)" stroke="#55554f" stroke-width="0.5"/>
  </g>
  <path d="${SHELL}" fill="url(#${id})"/>
  <path d="${SHELL}" fill="url(#${id}-net)"/>
  <ellipse cx="40" cy="27" rx="30" ry="17" fill="url(#${id}-gloss)"/>
  <ellipse cx="140" cy="27" rx="30" ry="17" fill="url(#${id}-gloss)"/>
  ${bevel(`${id}-face`, SHELL, 0.95, 0.4, 5.5)}
  <path d="${SHELL}" fill="none" stroke="#7c7c78" stroke-width="0.5" stroke-opacity="0.8"/>
  <path d="M97.6 52 103 70.6" stroke="#8c8c88" stroke-width="0.8"/>
  <path d="M98.2 52 103.6 70.6" stroke="#fff" stroke-opacity="0.7" stroke-width="0.5"/>
  ${dish(`${id}-l`, 50, 50, 30, `url(#${id}-dish)`)}
  ${dish(`${id}-r`, 150, 50, 30, `url(#${id}-dish)`)}
  ${gripDots()}
  <g class="gp-dpad-shadow" fill="#000" fill-opacity="0.45" filter="url(#${id}-tight)">
    <polygon points="38,25 62,25 75,38 75,62 62,75 38,75 25,62 25,38" transform="translate(1.6 3.6)"/>
  </g>
  <g class="gp-wells">
    ${BUTTON_AT.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#a9a9a5"/><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="1.6" transform="translate(0.5 0.7)"/><circle cx="${x}" cy="${y}" r="9.3" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.6" stroke-dasharray="20 37" stroke-dashoffset="-2"/><ellipse cx="${x + 0.9}" cy="${y + 2.6}" rx="7.4" ry="7" fill="#000" fill-opacity="0.5" filter="url(#${id}-tight)"/>`).join('')}
  </g>
  <g text-anchor="middle" fill="#3b2a6e">
    <text x="100" y="41" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-style="italic" font-size="6" letter-spacing="0.15">GRAVITAS</text>
    <text x="100" y="47.6" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="4.4" fill="#55555a">PC GamePad</text>
  </g>
</svg>`;

/** The d-pad's octagon in its own 100 x 100 box. */
const OCTAGON = '30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30';
const INSET = '33,6 67,6 94,33 94,67 67,94 33,94 6,67 6,33';
/** The cross molded on top, so you can feel the four ways. */
const CROSS = 'M36 9H64V36H91V64H64V91H36V64H9V36H36Z';

/** The d-pad: its purple side wall, beveled rim and face, the raised cross and the dished well round the socket. */
export const dpadSvg = (id: string): string => `<svg class="gp-dpad-art" viewBox="0 0 100 100" overflow="visible" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-rim" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#c2acff"/><stop offset="0.5" stop-color="#7650d4"/><stop offset="1" stop-color="#3a1f8a"/></linearGradient>
    <radialGradient id="${id}-top" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stop-color="#a68ef2"/><stop offset="0.5" stop-color="#7b57d8"/><stop offset="1" stop-color="#5432b0"/></radialGradient>
    <linearGradient id="${id}-cross" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#8a68e0"/><stop offset="1" stop-color="#5230aa"/></linearGradient>
    <radialGradient id="${id}-well" cx="0.62" cy="0.7" r="0.7"><stop offset="0" stop-color="#7e5cd8"/><stop offset="1" stop-color="#2f1878"/></radialGradient>
    <clipPath id="${id}-x"><path d="${CROSS}"/></clipPath>
    <filter id="${id}-x-blur"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="${id}-drop" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.3"/></filter>
  </defs>
  <polygon points="${OCTAGON}" fill="#2e1670" transform="translate(0 7)"/>
  <polygon points="${OCTAGON}" fill="#3b1f88" transform="translate(0 3.5)"/>
  <polygon points="${OCTAGON}" fill="url(#${id}-rim)"/>
  <polygon points="${INSET}" fill="url(#${id}-top)"/>
  <path d="${CROSS}" fill="#160640" fill-opacity="0.5" transform="translate(1.6 3.2)" filter="url(#${id}-drop)"/>
  <path d="${CROSS}" fill="url(#${id}-cross)"/>
  ${bevel(`${id}-x`, CROSS, 0.5, 0.45, 5)}
  <circle cx="50" cy="50" r="12.5" fill="url(#${id}-well)"/>
  <circle cx="50" cy="50" r="12.8" fill="none" stroke="#d6c8ff" stroke-opacity="0.75" stroke-width="0.9" stroke-dasharray="28 53" stroke-dashoffset="-6"/>
</svg>`;

/** The shaft lying on its side, unscrewed: the brass thread at the left toward the pad, the rounded top at the right. */
export const shaftLyingSvg = (id: string): string => `<svg class="gp-shaft-lying" viewBox="0 0 144 24" overflow="visible" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-tube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfcfca"/><stop offset="0.16" stop-color="#fdfdfb"/><stop offset="0.34" stop-color="#ffffff"/><stop offset="0.62" stop-color="#e2e2dd"/><stop offset="0.86" stop-color="#b4b4ae"/><stop offset="1" stop-color="#8e8e88"/></linearGradient>
    <linearGradient id="${id}-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a22"/><stop offset="0.25" stop-color="#f6df8f"/><stop offset="0.55" stop-color="#c49a3c"/><stop offset="1" stop-color="#5a4313"/></linearGradient>
    <radialGradient id="${id}-cap" cx="0.35" cy="0.3" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <pattern id="${id}-turns" width="2.4" height="24" patternUnits="userSpaceOnUse" patternTransform="skewX(-14)"><rect width="0.9" height="24" fill="#3e2c08" fill-opacity="0.55"/></pattern>
    <filter id="${id}-sh" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  <path d="M6 15H130a10 8 0 0 1 0 16H6Z" fill="#000" fill-opacity="0.5" transform="translate(3 -1)" filter="url(#${id}-sh)"/>
  <rect x="1" y="6.5" width="23" height="11" fill="url(#${id}-brass)"/>
  <rect x="1" y="6.5" width="23" height="11" fill="url(#${id}-turns)"/>
  <ellipse cx="1" cy="12" rx="1.6" ry="5.5" fill="#6f531b"/>
  <ellipse cx="1" cy="12" rx="0.9" ry="3.2" fill="#2a1d08"/>
  <path d="M22 2.5H28V21.5H22Z" fill="url(#${id}-tube)"/>
  <path d="M27 1H131A11 11 0 0 1 131 23H27Z" fill="url(#${id}-tube)"/>
  <ellipse cx="27" cy="12" rx="1.8" ry="11" fill="#c9c9c4"/>
  <ellipse cx="27.6" cy="12" rx="1.2" ry="10.4" fill="#f4f4f1"/>
  <path d="M34 1V23M37 1V23" stroke="#9a9a94" stroke-width="0.6" stroke-opacity="0.7"/>
  <circle cx="129" cy="9" r="10" fill="url(#${id}-cap)"/>
  <rect x="30" y="4.2" width="96" height="2.2" rx="1.1" fill="#fff" fill-opacity="0.9"/>
</svg>`;

/** The shaft standing in the d-pad's socket, drawn upright to face the eye: its foot an ellipse in the socket, its top rounded. */
export const shaftUpSvg = (
  id: string,
): string => `<svg class="gp-stick-art" viewBox="0 0 20 100" preserveAspectRatio="xMidYMax meet" overflow="visible" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-up" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9c9c96"/><stop offset="0.18" stop-color="#dcdcd7"/><stop offset="0.36" stop-color="#ffffff"/><stop offset="0.55" stop-color="#f1f1ed"/><stop offset="0.8" stop-color="#c2c2bc"/><stop offset="1" stop-color="#85857f"/></linearGradient>
    <radialGradient id="${id}-dome" cx="0.36" cy="0.3" r="0.55"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="10" cy="100" rx="12" ry="8.4" fill="#5a4313"/>
  <ellipse cx="10" cy="100.6" rx="11" ry="7.4" fill="#d2ad52"/>
  <path d="M0 10A10 10 0 0 1 20 10V100A10 6.6 0 0 1 0 100Z" fill="url(#${id}-up)"/>
  <circle cx="10" cy="10" r="10" fill="url(#${id}-dome)"/>
  <rect x="5.4" y="14" width="2.4" height="74" rx="1.2" fill="#fff" fill-opacity="0.85"/>
</svg>`;
