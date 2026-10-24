// The modem for its hardware ad (sections/hardware.ts), drawn the way the desk draws it
// (desk/pc/modem.ts, the .modem-body rules in desk/desk.css): a dark low box, DATA/FAX and its
// speed at the top left, and the eight front lights with their names, lit as on a call. A
// picture only: nothing in it dials.
import './modemArt.css';
import { h } from '../../editor/core/ui';
import { speedLabel } from '../../retro/bbs/lineSpeed';

/** The desk modem's lights, in its order; the lit ones are a call connected and talking. */
const LIGHTS = ['HS', 'AA', 'CD', 'OH', 'RD', 'SD', 'TR', 'MR'] as const;
const LIT = new Set(['HS', 'CD', 'OH', 'RD', 'TR', 'MR']);

export function modemArt(alt: string): HTMLElement {
  return h(
    'div',
    { class: 'mag-modem', role: 'img', 'aria-label': alt },
    h('span', { class: 'mag-modem-speed' }, `DATA/FAX ${speedLabel(14400)}`),
    h(
      'span',
      { class: 'mag-modem-lights' },
      ...LIGHTS.map((name) => h('span', { class: 'mag-mlight' }, h('span', { class: `mag-mled${LIT.has(name) ? ' on' : ''}` }), name)),
    ),
  );
}
