// The opening's fields, shared by "+ Make a new game" and the start scene's "🎬 Opening sting…":
// the "Made with Game-Maker" card as an animation, a still picture or none, and an optional
// name or studio for a "<name> PRESENTS" card. Small and DOM-only, so the home page can
// show it without loading the card renderer.
import { h } from '../../core/ui';
import { NAME_MAX, nameProblem, type OpeningStyle } from './openingWire';

const STYLES: [OpeningStyle, string, string][] = [
  ['animation', 'Animation', 'About 4 seconds, fading in and out.'],
  ['still', 'Still picture', 'The same card as one picture, for 4 seconds.'],
  ['none', 'None', ''],
];

interface OpeningFields {
  el: HTMLElement;
  /** The choice, or undefined (with the problem shown) when the name can't be drawn. */
  value(): { style: OpeningStyle; name: string } | undefined;
}

let count = 0;

export function openingFields(initial: { style: OpeningStyle; name: string } = { style: 'animation', name: '' }): OpeningFields {
  const id = `opening-${++count}`;
  let style = initial.style;
  const radios = STYLES.map(([value, label, about]) =>
    h(
      'label',
      { class: 'opening-choice' },
      h('input', { type: 'radio', name: id, value, checked: value === style, onchange: () => (style = value) }),
      h('span', null, h('strong', null, label), about ? h('small', null, about) : null),
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
    h('fieldset', { class: 'opening-styles' }, h('legend', null, 'Opening: “Made with Game-Maker: Sandbox Edition”'), ...radios),
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
