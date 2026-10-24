// The magazine's drawn pictures (types.ts ArtId): THE CHEZ (desk/props/chezArt.ts), the Sandbox
// Software mark (printables/sandboxMark.ts), a bar code, a floppy disk, and the desk's
// modem (modemArt.ts), speakers and disk box drawn as the desk draws them
// (speakerArt.ts, diskBoxArt.ts) and the game pad as the desk's (desk/pc/gamePadArt.ts) for the hardware ads; the Sound Boaster card and its before
// and after faces (soundCardArt.ts); and a snapshot of the 1994 desk itself
// (deskShot.ts) and screenshots of today's web (webShots.ts).
import { h } from '../../editor/core/ui';
import { drawChez } from '../../desk/props/chezArt';
import { sandboxMarkEl } from '../printables/sandboxMark';
import { hashString } from '../printables/kit';
import type { ArtId, WebShot } from './types';
import { deskShotImg } from './deskShot';
import { diskBoxArt } from './diskBoxArt';
import { gamePadArt } from '../../desk/pc/gamePadArt';
import { modemArt } from './modemArt';
import { soundCardArt } from './soundCardArt';
import { speakerArt } from './speakerArt';
import { webShotImg } from './webShots';

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
const isWebShot = (id: ArtId): id is `web-${WebShot}` => id.startsWith('web-');

/** A picture for the page; THE CHEZ is drawn on a canvas and handed over as an image (it prints). */
export function artElement(id: ArtId, alt: string): Element {
  if (isWebShot(id)) return webShotImg(id.slice(4) as WebShot, alt);
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
      return modemArt(alt);
    case 'speakers':
      return speakerArt(alt);
    case 'diskbox':
      return diskBoxArt(alt);
    case 'desk':
      return deskShotImg(alt);
    case 'gamepad':
      return gamePadArt({ shaft: true, alt });
    case 'boaster':
      return soundCardArt('card', alt);
    case 'boaster-before':
      return soundCardArt('before', alt);
    case 'boaster-after':
      return soundCardArt('after', alt);
    case 'chez': {
      const k = 8;
      const c = h('canvas', { width: 44 * k, height: 24 * k });
      drawChez(c.getContext('2d')!, 2 * k, 22 * k, k, DRIVER_SEAT);
      return h('img', { src: c.toDataURL(), alt, class: 'mag-chez' });
    }
  }
}
