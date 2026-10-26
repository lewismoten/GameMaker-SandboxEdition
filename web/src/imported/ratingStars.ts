// An imported game's rating as a radio group: Unrated, then 1 to 5 stars. The arrow keys move
// between them as in any radio group; each star lights the ones before it.
import './imported.css';
import { h } from '../editor/core/ui';
import type { Rating } from './gameNotes';
import { ratingName } from './ratings';

let groups = 0;

/** The group; `onChange` hears each pick. `label` names it to screen readers ("Rating of Zark"). */
export function ratingStars(value: Rating, onChange: (r: Rating) => void, label = 'Rating'): HTMLFieldSetElement {
  const name = `rating-${++groups}`;
  const marks: HTMLElement[] = [];
  const light = (r: Rating) => marks.forEach((m, i) => m.classList.toggle('on', i > 0 && i <= r));
  const options = ([0, 1, 2, 3, 4, 5] as Rating[]).map((r) => {
    const input = h('input', {
      type: 'radio',
      name,
      value: String(r),
      checked: r === value,
      'aria-label': ratingName(r),
      onchange: () => (light(r), onChange(r)),
    });
    const mark = h('span', { class: r ? 'rs-star' : 'rs-none', 'aria-hidden': 'true' }, r ? '★' : 'Unrated');
    marks.push(mark);
    return h('label', { class: 'rs-opt', title: ratingName(r) }, input, mark);
  });
  light(value);
  return h('fieldset', { class: 'rating-stars' }, h('legend', { class: 'sr-only' }, label), ...options);
}
