// The HOLE-Y MOLEY disk notcher's pictures for its ad (sections/notcherAd.ts; notcherAd.css
// sizes them): the press, a black textured base tilted back with a 3½" disk in its recess
// (standing shutter down, toward the finger notch) and a white lever arm on its hinge block over
// the disk's top right corner, where the high-density hole goes; and a disk seen from the back
// before and after, one square hole and then two. Our own drawing.
import { svgArt } from './svgArt';

/** The base's flat plan (200 x 240) tilted back onto the page: x runs right and up a little, y down and right. */
const tp = (x: number, y: number): [number, number] => [24 + x + 0.55 * y, 92 - 0.18 * x + 0.5 * y];
const pts = (list: [number, number][], dy = 0) =>
  list
    .map(([x, y]) => tp(x, y))
    .map(([x, y]) => `${x.toFixed(1)},${(y + dy).toFixed(1)}`)
    .join(' ');
const rect = (x: number, y: number, w: number, h: number): [number, number][] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

function press(): string {
  const base = rect(0, 0, 200, 240);
  const recess = rect(24, 24, 152, 158);
  // the disk, label side up and shutter down, its corner cut at the bottom left
  const disk: [number, number][] = [
    [28, 28],
    [172, 28],
    [172, 178],
    [38, 178],
    [28, 168],
  ];
  // the hinge block stands on the base's right edge, over the disk's top right corner
  const block = rect(150, 22, 46, 50);
  const lift = -30;
  const [bx0, by0] = tp(150, 72);
  const [bx1, by1] = tp(196, 72);
  const [bx2, by2] = tp(196, 22);
  // the lever: hinged at the back of the block, its arm reaching down and to the left over the disk, a rounded grip at its end
  const [hx, hy] = tp(190, 32);
  const hingeY = hy + lift;
  return `<defs>
    <pattern id="nt-grain" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#232327"/><circle cx="1" cy="1" r="0.7" fill="#3a3a40"/><circle cx="3" cy="3" r="0.6" fill="#18181b"/></pattern>
    <linearGradient id="nt-arm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#ecebe4"/><stop offset="1" stop-color="#b9b7ac"/></linearGradient>
    <linearGradient id="nt-shutter" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9dce2"/><stop offset="0.5" stop-color="#ffffff"/><stop offset="1" stop-color="#a9adb6"/></linearGradient>
    <filter id="nt-soft"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <polygon points="${pts(base, 22)}" fill="#000" fill-opacity="0.45" filter="url(#nt-soft)"/>
  <polygon points="${pts(base, 12)}" fill="#0c0c0e"/>
  <polygon points="${pts(base)}" fill="url(#nt-grain)" stroke="#45454c" stroke-width="1.2"/>
  <polygon points="${pts(recess)}" fill="#141417" stroke="#050506" stroke-width="2"/>
  <ellipse cx="${tp(100, 182)[0]}" cy="${tp(100, 182)[1]}" rx="24" ry="10" fill="#0b0b0d" transform="rotate(-10 ${tp(100, 182).join(' ')})"/>
  <polygon points="${pts(disk)}" fill="#2c4a7c" stroke="#16294a" stroke-width="1"/>
  <polygon points="${pts(rect(72, 122, 70, 56))}" fill="url(#nt-shutter)"/>
  <polygon points="${pts(rect(86, 130, 18, 40))}" fill="#16294a"/>
  <polygon points="${pts(rect(52, 38, 96, 66))}" fill="#fbf6e6"/>
  <polygon points="${pts(rect(52, 46, 96, 6))}" fill="#d61f26"/>
  <polygon points="${pts(rect(34, 32, 12, 12))}" fill="#0b0b0d"/>
  <polygon points="${bx0},${by0} ${bx1},${by1} ${bx1},${by1 + lift} ${bx0},${by0 + lift}" fill="#cfcdc3"/>
  <polygon points="${bx1},${by1} ${bx2},${by2} ${bx2},${by2 + lift} ${bx1},${by1 + lift}" fill="#a7a59b"/>
  <polygon points="${pts(block, lift)}" fill="#f4f3ee"/>
  <circle cx="${(bx0 + bx1) / 2 - 10}" cy="${(by0 + by1) / 2 - 16}" r="3" fill="#8d8b82"/>
  <circle cx="${(bx0 + bx1) / 2 + 8}" cy="${(by0 + by1) / 2 - 19}" r="3" fill="#8d8b82"/>
  <g transform="translate(${hx.toFixed(1)} ${hingeY.toFixed(1)}) rotate(4)">
    <path d="M0 -9H-150Q-168 -9 -168 4Q-168 15 -150 15H0Z" fill="#000" fill-opacity="0.25" transform="translate(4 7)"/>
    <path d="M0 -9H-150Q-168 -9 -168 3Q-168 15 -150 15H0Z" fill="url(#nt-arm)" stroke="#9c9a8f" stroke-width="1"/>
    <path d="M-6 -6H-148" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="-2" cy="3" r="5" fill="#8d8b82"/>
    <circle cx="-2" cy="3" r="2" fill="#e8e6dd"/>
  </g>`;
}

/**
 * A 3½" disk from the back, standing shutter down: its hub, the shutter's edge, the corner cut
 * at the bottom right, and its square holes in the top corners (the write-protect one at the
 * right before, the high-density one punched at the left after).
 */
function diskBack(after: boolean): string {
  const hole = (x: number) => `<rect x="${x}" y="12" width="9" height="10" fill="#141210"/>`;
  return `<path d="M7 4H93a3 3 0 0 1 3 3V88L88 96H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" fill="#2c4a7c" stroke="#16294a" stroke-width="1"/>
  <rect x="30" y="70" width="40" height="26" fill="#cfd3da"/>
  <circle cx="50" cy="44" r="13" fill="#16294a"/><circle cx="50" cy="44" r="8" fill="#b8bcc4"/><rect x="48" y="44" width="5" height="5" fill="#16294a"/>
  ${hole(84)}${after ? `${hole(7)}<circle cx="11.5" cy="17" r="10" fill="none" stroke="#d61f26" stroke-width="2.4"/>` : ''}`;
}

export function notcherArt(which: 'press' | 'before' | 'after', alt: string): SVGSVGElement {
  if (which === 'press') return svgArt('14 4 350 224', press(), alt, 'mag-notcher');
  return svgArt('0 0 100 100', diskBack(which === 'after'), alt, 'mag-notch-disk');
}
