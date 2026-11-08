// The pages of Maxima Station's clearance gate (the Star Wheel's puzzle): the clerk's form with
// its three stamps, and what each wrong hatch says. Each is a picture with a strip of stamps along
// the top and a text page under it, shown as a slide show by a scene the pod bay's links lead to.
import { encodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { serializeSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { dosText } from '@lewismoten/gamemaker-sandbox-tools/kit/disk';
import { Canvas } from '../art/canvas';
import { shared } from '../art/palette';
import { CLEARANCE, GLYPHS, HATCHES } from '../wheel/wheel';
import { SCREEN, spaceBg } from './screens';

const C = (n: string) => SCREEN.ramps.get(n) ?? shared.get(n)!;

/** Wraps for Game-Maker's text pages (30 columns), and fails when a page will not fit its 16 lines. */
function page(text: string): string {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    if (!para.trim()) {
      out.push('');
      continue;
    }
    let line = '';
    for (const w of para.split(/\s+/)) {
      if ((line ? `${line} ${w}` : w).length > 30) {
        out.push(line);
        line = w;
      } else line = line ? `${line} ${w}` : w;
    }
    if (line) out.push(line);
  }
  if (out.length > 16) throw new Error(`a clearance page runs to ${out.length} lines`);
  return out.join('\n') + '\n';
}

export const FORM_TEXT = page(`DEPARTURE CLEARANCE 27-B
Maxima Station, in triplicate

The stamps above are your dock, your world of origin and your courier badge. Set them on the Star Wheel from your box, read its two windows in order, then press the hatch that wears those two pictures.

No wheel? Press a hatch. The wrong ones only sigh, and Clerk Pim has all day.`);

/** What each wrong hatch says: bottom to top (the right one, between them, has no page). */
export const WRONG_TEXT = [
  page(`HATCH ONE SIGHS

"That code is for the staff lunch," says Clerk Pim, stamping something sadly. "You are not on the menu. Check the form, or try another hatch."`),
  page(`HATCH THREE SIGHS

"That code is for cargo," says Clerk Pim. "You are a courier. It is a different form." He taps the middle hatch with his stamp. "Nobody ever tries the middle one first."`),
];

/** A glyph's rows drawn as squares of k pixels. */
function stamp(c: Canvas, rows: string[], x: number, y: number, k: number, color: number): void {
  rows.forEach((row, gy) => [...row].forEach((ch, gx) => ch === '#' && c.rect(x + gx * k, y + gy * k, k, k, color)));
}

type Stamp = [label: string, draw: (c: Canvas, x: number, y: number) => void];

/** A picture with a strip of boxed stamps (30 pixels square, a label beside each) above the text page. */
function formPicture(stamps: Stamp[]): Uint8Array {
  const c = new Canvas();
  spaceBg(c, 97, false);
  c.panel(30, 34, 262, 148, C('space')[1], C('violet')[3], C('violet')[1]);
  stamps.forEach(([label, draw], i) => {
    // a label, then its box, side by side (the text page below starts at row 40)
    const width = label.length * 8 + 4 + 30;
    const x = Math.round(160 + (i - (stamps.length - 1) / 2) * 104 - width / 2);
    c.text(x, 14, label, C('yellow')[4]);
    c.panel(x + label.length * 8 + 4, 2, 30, 30, C('space')[0], C('violet')[3], C('violet')[1]);
    draw(c, x + label.length * 8 + 4 + 2, 3);
  });
  return encodeGif({ width: c.w, height: c.h, pixels: c.px, palette: SCREEN.pal });
}

const INK = () => C('yellow')[5];
const glyph =
  (name: string): Stamp[1] =>
  (c, x, y) =>
    stamp(c, GLYPHS[name], x, y, 3, INK());

/** The pages (a picture, a text page and a slide list for each), by file name. */
export function clearancePages(): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  // the form: dock letter, world, courier badge
  out.set(
    'clear.gif',
    formPicture([
      ['DOCK', (c, x, y) => c.text(x + 3, y + 3, CLEARANCE.dock, INK(), { scale: 3 })],
      ['WORLD', glyph(CLEARANCE.world)],
      ['BADGE', glyph(CLEARANCE.mark)],
    ]),
  );
  out.set('clear.txt', dosText(FORM_TEXT));
  out.set('clear.lst', serializeSlideList([{ name: 'clear.gif', pause: 0 }, { name: 'clear.txt' }]));
  [0, 2].forEach((hatch, i) => {
    const n = `wrong${i + 1}`;
    out.set(
      `${n}.gif`,
      formPicture([
        ['CODE', glyph(HATCHES[hatch][0])],
        ['THEN', glyph(HATCHES[hatch][1])],
      ]),
    );
    out.set(`${n}.txt`, dosText(WRONG_TEXT[i]));
    out.set(`${n}.lst`, serializeSlideList([{ name: `${n}.gif`, pause: 0 }, { name: `${n}.txt` }]));
  });
  return out;
}
