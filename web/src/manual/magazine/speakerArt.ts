// The Illogitech speakers for their hardware ad (sections/hardware.ts), drawn the way the desk
// draws them (desk/pc/speakers.ts and speakers.css, blasterSwitch.css): beige plastic, a dark
// cloth grille, the brand on the left one, and the volume knob, power light, headphone jack and
// Sound Blaster switch on the right. A picture only: nothing in it turns or switches.
import './speakerArt.css';
import { h } from '../../editor/core/ui';

const grille = () => h('span', { class: 'mag-spk-grille' });

export function speakerArt(alt: string): HTMLElement {
  return h(
    'div',
    { class: 'mag-spk-pair', role: 'img', 'aria-label': alt },
    h('span', { class: 'mag-spk' }, grille(), h('span', { class: 'mag-spk-brand' }, 'ILLOGITECH')),
    h(
      'span',
      { class: 'mag-spk' },
      grille(),
      h('span', { class: 'mag-spk-controls' }, h('span', { class: 'mag-spk-knob' }), h('span', { class: 'mag-spk-led' }), h('span', { class: 'mag-spk-jack' })),
      h('span', { class: 'mag-spk-sb' }, h('span', null, 'SOUND', h('br'), 'BLASTER'), h('span', { class: 'mag-spk-track' }, h('span'))),
    ),
  );
}
