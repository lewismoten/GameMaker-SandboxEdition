// Bare 3½-inch disks for the Floppy Barn ad (sections/smallAds.ts BLANK_DISKS): bulk disks
// came without labels, so these show only the shallow recess a label would go in. Three in a
// little stack in bulk colors, standing shutter down; the front one, seen from its label side,
// has the write-protect hole with its slider at top left, the high-density hole at top right
// and the corner cut at bottom left.
import { svgArt } from './svgArt';

/** One disk, 90 x 94 like the real thing in millimetres, its top-left corner at the origin. */
function disk(body: string, edge: string, front: boolean): string {
  const shell = `<path d="M3 0 H87 a3 3 0 0 1 3 3 V91 a3 3 0 0 1 -3 3 H6 L0 88 V3 a3 3 0 0 1 3 -3 Z" fill="${body}" stroke="${edge}" stroke-width="0.8"/>`;
  // the metal shutter along the bottom, its window onto the disk, and the groove it slides in
  const shutter = `<rect x="16" y="91.5" width="56" height="2.5" fill="${edge}" opacity="0.6"/>
    <rect x="28" y="65" width="38" height="29" fill="#c9cdd4" stroke="#8d929b" stroke-width="0.6"/>
    <rect x="36" y="70" width="10" height="20" rx="1" fill="#6f747d"/>
    <path d="M29 66.5 H65" stroke="#a9aeb6" stroke-width="0.6"/>`;
  // the label's recess up top: no label in it, just a shallow step in the plastic
  const recess = `<rect x="8" y="3" width="74" height="54" rx="2.5" fill="#000" opacity="0.35"/>
    <rect x="8.8" y="3.8" width="72.4" height="52.4" rx="2" fill="${body}" opacity="0.92"/>
    <path d="M9 56 H81 V4" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.22"/>`;
  if (!front) return shell + shutter + recess;
  // the arrow points the way the disk goes in: shutter first
  const arrow = `<path d="M84 84 l-3 5 -3 -5 h2 v-5 h2 v5 z" fill="#fff" opacity="0.28"/>`;
  // write-protect: a square hole with the slider pushed across half of it
  const protect = `<rect x="4" y="5" width="6" height="7" fill="#08080a"/><rect x="4" y="5" width="6" height="3.5" fill="#9aa0a8"/>`;
  const hd = `<rect x="80" y="5" width="6" height="7" fill="#08080a"/>`;
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
