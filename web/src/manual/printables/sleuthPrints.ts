// Final Curtain's two sheets: the spyglass to cut out, and the evidence sheet of fingerprints
// (a card per suspect and the print lifted from the trick dagger). The prints are hidden the
// way the hint book hides its answers (redFilm.ts redPicture): ridges in the pale cyan among
// white decoy strokes and dense red lines, so only red film (the spyglass) shows them.
import './sleuthPrints.css';
import { h } from '../../editor/core/ui';
import { sheet, type Sheet } from './kit';
import { redPicture } from './redFilm';
import { printMask, type Lift } from './fingerprint';
import { spyglassSvg } from './spyglass';
import type { PrintsItem, SpyglassItem, SuspectPrint } from './sleuthTypes';

/** A print's canvas, in pixels. */
const SIZE = 360;

/** The suspect the lifted print matches. */
const liftedOwner = (it: PrintsItem): SuspectPrint => it.suspects[it.lifted.suspect];

/** One print hidden in noise: the ridges are painted from a mask in whatever ink the picture uses. */
function hiddenPrint(s: SuspectPrint, lift: Lift | undefined, alt: string): HTMLElement {
  let mask: Float32Array | undefined;
  const paint = (c: CanvasRenderingContext2D, ink: string) => {
    mask ??= printMask(s, SIZE, lift);
    const [r, g, b] = ink.match(/\d+/g)!.map(Number);
    const off = document.createElement('canvas');
    off.width = off.height = SIZE;
    const o = off.getContext('2d')!;
    const img = o.createImageData(SIZE, SIZE);
    for (let i = 0; i < mask.length; i++) img.data.set([r, g, b, Math.round(mask[i] * 255)], i * 4);
    o.putImageData(img, 0, 0);
    c.drawImage(off, 0, 0);
  };
  // the decoy strokes are as thick as a ridge, about half the ridges' spacing
  const pen = (SIZE / s.ridges) * 0.5;
  return redPicture(SIZE, SIZE, s.seed + (lift ? lift.seed : 0), pen, paint, alt);
}

/** The evidence sheet. */
export async function printsSheets(it: PrintsItem): Promise<Sheet[]> {
  const owner = liftedOwner(it);
  const cell = (label: string, sub: string, pic: HTMLElement, cls = '') =>
    h('figure', { class: `sgp-cell ${cls}` }, pic, h('figcaption', null, h('b', null, label), h('span', null, sub)));
  const answer = h('p', { class: 'sgp-answer', hidden: true, 'aria-live': 'polite' });
  const tell = h(
    'button',
    {
      class: 'sgp-tell',
      type: 'button',
      onclick: () => {
        answer.hidden = !answer.hidden;
        answer.textContent = it.tell.replace('{name}', owner.name);
      },
    },
    'Tell me the answer',
  );
  const lift: Lift = { turn: it.lifted.turn, shift: it.lifted.shift, seed: it.lifted.seed };
  return [
    sheet(
      8.5,
      11,
      'sgp',
      h('header', { class: 'sgp-head' }, h('b', null, 'PORT ELLERY POLICE'), h('span', null, 'Latent print sheet 36-1031')),
      h('h2', null, it.heading ?? it.title),
      it.intro ? h('p', { class: 'sgp-intro' }, it.intro) : null,
      h(
        'div',
        { class: 'sgp-grid' },
        ...it.suspects.map((s, i) =>
          cell(`Card ${String.fromCharCode(65 + i)}: ${s.name}`, s.role, hiddenPrint(s, undefined, `${s.name}'s print, hidden: look through the spyglass`)),
        ),
        cell(
          it.lifted.label,
          'Lifted from the trick dagger, powdered',
          hiddenPrint(owner, lift, 'The print lifted from the dagger, hidden: look through the spyglass'),
          'sgp-lifted',
        ),
      ),
      h(
        'p',
        { class: 'sgp-foot' },
        'Developed under red light. Hold the spyglass over a card to bring up the ridges, then find the card the lifted print matches. Look at the pattern first, then at where the lines turn.',
      ),
      h('div', { class: 'sgp-screen' }, tell, answer),
    ),
  ];
}

/** The spyglass to cut out. */
export async function spyglassSheets(it: SpyglassItem): Promise<Sheet[]> {
  return [
    sheet(
      8.5,
      11,
      'sgs',
      h('header', { class: 'sgp-head' }, h('b', null, 'THE PARAGON PROP DEPARTMENT'), h('span', null, 'Inspector’s spyglass')),
      h('h2', null, it.heading ?? it.title),
      h(
        'div',
        { class: 'sgs-body' },
        h('div', { class: 'sgs-art' }, spyglassSvg(true)),
        h('ol', { class: 'sgs-steps' }, ...it.steps.map((s) => h('li', null, s))),
      ),
      it.caption ? h('p', { class: 'sgp-foot' }, it.caption) : null,
    ),
  ];
}
