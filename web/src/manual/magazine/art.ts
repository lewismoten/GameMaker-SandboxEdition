// The magazine's drawn pictures (types.ts ArtId): THE CHEZ (desk/props/chezArt.ts), the Sandbox
// Software mark (printables/sandboxMark.ts), a bar code, a floppy disk, and simple line drawings
// of the desk's modem, speakers and disk box for the hardware ads; and a snapshot of the 1994
// desk itself (deskShot.ts).
import { h } from '../../editor/core/ui';
import { drawChez } from '../../desk/props/chezArt';
import { sandboxMarkEl } from '../printables/sandboxMark';
import { hashString } from '../printables/kit';
import type { ArtId } from './types';
import { deskShotImg } from './deskShot';

const SVG = 'http://www.w3.org/2000/svg';
/** Doc Leo sits back from THE CHEZ's windshield, his face and hat whole in the door window. */
const DRIVER_SEAT: [number, number] = [-3, 0.5];

function svg(viewBox: string, markup: string, alt: string): Element {
  const el = document.createElementNS(SVG, 'svg');
  el.setAttribute('viewBox', viewBox);
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', alt);
  el.innerHTML = markup;
  return el;
}

/** UPC-style bars from the issue's name, with the price box's digits under them. */
function barcode(alt: string): Element {
  let x = 4;
  let bars = '';
  for (let i = 0; i < 44; i++) {
    const w = 1 + (hashString(`turbo${i}`) % 3);
    if (i % 2 === 0) bars += `<rect x="${x}" y="2" width="${w}" height="${i < 2 || i > 41 || i === 22 ? 34 : 30}" fill="#000"/>`;
    x += w;
  }
  return svg(
    `0 0 ${x + 4} 44`,
    `<rect width="100%" height="100%" fill="#fff"/>${bars}<text x="50%" y="42" font-size="6" font-family="monospace" text-anchor="middle">0 74470 19951 1</text>`,
    alt,
  );
}

const DISK =
  '<rect x="4" y="4" width="92" height="92" rx="4" fill="#1d4f9c"/><rect x="26" y="4" width="48" height="30" fill="#c9ccd2"/><rect x="56" y="9" width="12" height="20" fill="#1d4f9c"/><rect x="16" y="50" width="68" height="42" fill="#fff6e0"/><rect x="16" y="56" width="68" height="4" fill="#d9381e"/>';
const MODEM =
  '<rect x="6" y="30" width="108" height="34" rx="5" fill="#d8d2c2" stroke="#222" stroke-width="2"/><rect x="14" y="40" width="60" height="12" fill="#222"/><g fill="#e33">' +
  [0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${82 + i * 5}" cy="46" r="1.6"/>`).join('') +
  '</g><text x="16" y="49" font-size="8" fill="#3f3" font-family="monospace">14400</text>';
const SPEAKERS =
  '<g stroke="#222" stroke-width="2"><rect x="8" y="10" width="40" height="70" rx="4" fill="#d8d2c2"/><rect x="72" y="10" width="40" height="70" rx="4" fill="#d8d2c2"/></g><g fill="#333"><circle cx="28" cy="34" r="12"/><circle cx="92" cy="34" r="12"/><circle cx="28" cy="64" r="6"/><circle cx="92" cy="64" r="6"/></g>';
const DISKBOX =
  '<path d="M10 40 L110 40 L104 86 L16 86 Z" fill="#2b2b33" stroke="#111" stroke-width="2"/><g>' +
  ['#1d4f9c', '#d9381e', '#2f8f3a', '#e0b020', '#6a3ea1']
    .map((c, i) => `<rect x="${20 + i * 17}" y="${18 + (i % 2) * 4}" width="15" height="26" fill="${c}"/>`)
    .join('') +
  '</g><rect x="40" y="58" width="40" height="9" fill="#fff" stroke="#111"/>';

/** A picture for the page; THE CHEZ is drawn on a canvas and handed over as an image (it prints). */
export function artElement(id: ArtId, alt: string): Element {
  switch (id) {
    case 'barcode':
      return barcode(alt);
    case 'sandbox': {
      const el = sandboxMarkEl('mag-mark');
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', alt);
      return el;
    }
    case 'disk':
      return svg('0 0 100 100', DISK, alt);
    case 'modem':
      return svg('0 0 120 90', MODEM, alt);
    case 'speakers':
      return svg('0 0 120 90', SPEAKERS, alt);
    case 'diskbox':
      return svg('0 0 120 90', DISKBOX, alt);
    case 'desk':
      return deskShotImg(alt);
    case 'chez': {
      const k = 8;
      const c = h('canvas', { width: 44 * k, height: 24 * k });
      drawChez(c.getContext('2d')!, 2 * k, 22 * k, k, DRIVER_SEAT);
      return h('img', { src: c.toDataURL(), alt, class: 'mag-chez' });
    }
  }
}
