// The post office's address bar code (POSTNET), printed under the address on the business reply
// cards in the magazine (replyMail.ts), the postcards mailed in free; order cards have none: tall and short bars between two
// tall frame bars, five a digit (two of them tall), then a check digit. It spells the ZIP+4 of
// the made-up box the cards go to; nothing here is ever mailed.
import './postnet.css';
import { h } from '../../editor/core/ui';

const SVG = 'http://www.w3.org/2000/svg';
/** Each digit's five bars, 1 tall and 0 short (weights 7, 4, 2, 1, 0; 0 is 11000). */
const DIGITS = ['11000', '00011', '00101', '00110', '01001', '01010', '01100', '10001', '10010', '10100'];
/** The cards' box: Pittsburgh, PA 15213-0000. */
const ZIP = '152130000';

/** The bars, tall (true) or short, frame bars included. */
export function postnetBars(zip = ZIP): boolean[] {
  const sum = [...zip].reduce((n, d) => n + Number(d), 0);
  const digits = zip + String((10 - (sum % 10)) % 10);
  return [true, ...[...digits].flatMap((d) => [...DIGITS[Number(d)]].map((b) => b === '1')), true];
}

/** The bar code as a picture, sized by postnet.css. Decoration only: the address above it is the words. */
export function postnetCode(): HTMLElement {
  const bars = postnetBars();
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', `0 0 ${bars.length * 2.4} 7`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.innerHTML = bars.map((tall, i) => `<rect x="${i * 2.4}" y="${tall ? 0 : 4}" width="1.1" height="${tall ? 7 : 3}"/>`).join('');
  return h('span', { class: 'mag-postnet', 'aria-hidden': 'true' }, svg);
}
