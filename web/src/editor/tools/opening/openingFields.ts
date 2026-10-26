// The opening's fields, shared by "+ Make a new game" and the start scene's "🎬 Opening sting…":
// which intro plays first (openingIntros.ts: four "Made with Game-Maker: Sandbox Edition"
// intros, a still picture, the CD's classic RSD one or none), each with a ▶ to watch it on the
// fields' screen first (openingPreview.ts), and an optional name or studio for a
// "<name> PRESENTS" card. DOM only, so the home page can show it without loading the card renderer.
import { h } from '../../core/ui';
import { NAME_MAX, nameProblem } from './openingWire';
import { INTROS, type OpeningStyle } from './openingIntros';
import { openingPreview } from './openingPreview';

interface OpeningFields {
  el: HTMLElement;
  /** The choice, or undefined (with the problem shown) when the name can't be drawn. */
  value(): { style: OpeningStyle; name: string } | undefined;
}

let count = 0;

export function openingFields(initial: { style: OpeningStyle; name: string } = { style: 'animation', name: '' }): OpeningFields {
  const id = `opening-${++count}`;
  let style = initial.style;
  const preview = openingPreview();
  const rows = INTROS.map(({ style: value, label, about }) =>
    h(
      'div',
      { class: 'opening-row' },
      h(
        'label',
        { class: 'opening-choice' },
        h('input', { type: 'radio', name: id, value, checked: value === style, onchange: () => (style = value) }),
        h('span', null, h('strong', null, label), h('small', null, about)),
      ),
      preview.button(value),
    ),
  );
  const hint = h('small', { id: `${id}-hint`, class: 'hint' }, `Adds a “YOUR NAME PRESENTS” card after it. Plain letters, up to ${NAME_MAX}.`);
  const input: HTMLInputElement = h('input', {
    type: 'text',
    value: initial.name,
    maxLength: NAME_MAX,
    autocomplete: 'organization',
    'aria-describedby': `${id}-hint`,
    oninput: () => input.setCustomValidity(''),
  });
  const el = h(
    'div',
    { class: 'opening-fields stack' },
    h('div', { class: 'opening-pick' }, h('fieldset', { class: 'opening-styles' }, h('legend', null, 'Opening, before the title'), ...rows), preview.el),
    h('label', { class: 'opening-name' }, 'Your name or studio (optional)', input, hint),
  );
  return {
    el,
    value() {
      const name = input.value.trim();
      const problem = nameProblem(name) ?? '';
      input.setCustomValidity(problem);
      if (problem) return void input.reportValidity();
      return { style, name };
    },
  };
}
