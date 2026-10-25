// Bare 3½-inch disks for the Floppy Barn ad (sections/smallAds.ts BLANK_DISKS): bulk disks
// came without labels, so these show only the shallow recess a label would go in. Three in a
// little stack in bulk colors; the front one, seen from its label side with the metal shutter
// up, has the corner cut at top right, the write-protect hole with its slider at bottom right
// and the high-density hole at bottom left.
import { svgArt } from './svgArt';

/** One disk, 90 x 94 like the real thing in millimetres, its top-left corner at the origin. */
function disk(body: string, edge: string, front: boolean): string {
  const shell = `<path d="M3 0 H84 L90 6 V91 a3 3 0 0 1 -3 3 H3 a3 3 0 0 1 -3 -3 V3 a3 3 0 0 1 3 -3 Z" fill="${body}" stroke="${edge}" stroke-width="0.8"/>`;
  // the metal shutter, its window onto the disk, and the groove it slides in
  const shutter = `<rect x="18" y="0" width="56" height="2.5" fill="${edge}" opacity="0.6"/>
    <rect x="24" y="0" width="38" height="29" fill="#c9cdd4" stroke="#8d929b" stroke-width="0.6"/>
    <rect x="44" y="4" width="10" height="20" rx="1" fill="#6f747d"/>
    <path d="M25 27.5 H61" stroke="#a9aeb6" stroke-width="0.6"/>`;
  // the label's recess: no label in it, just a shallow step in the plastic
  const recess = `<rect x="8" y="37" width="74" height="54" rx="2.5" fill="#000" opacity="0.35"/>
    <rect x="8.8" y="37.8" width="72.4" height="52.4" rx="2" fill="${body}" opacity="0.92"/>
    <path d="M9 90 H81 V38" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.22"/>`;
  if (!front) return shell + shutter + recess;
  const arrow = `<path d="M6 10 l3 -5 3 5 h-2 v5 h-2 v-5 z" fill="#fff" opacity="0.28"/>`;
  // write-protect: a square hole with the slider pushed across half of it
  const protect = `<rect x="80" y="82" width="6" height="7" fill="#08080a"/><rect x="80" y="85.5" width="6" height="3.5" fill="#9aa0a8"/>`;
  const hd = `<rect x="4" y="82" width="6" height="7" fill="#08080a"/>`;
  return shell + shutter + recess + arrow + protect + hd;
}

/** The stack of three unlabelled disks, as an image named by `alt`. */
export function blankDiskArt(alt: string): Element {
  return svgArt(
    '0 0 128 116',
    `<g transform="translate(34 6) rotate(9 45 47)">${disk('#3f7fbf', '#24507e', false)}</g>
    <g transform="translate(22 12) rotate(-6 45 47)">${disk('#8a8f98', '#5e636b', false)}</g>
    <g transform="translate(6 18)">${disk('#26272c', '#0e0e11', true)}</g>`,
    alt,
  );
}
