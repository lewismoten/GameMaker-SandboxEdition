// The modem's line speed as page controls (lineSpeed.ts), for the desk and dos.html alike:
// radio buttons for the desk modem's little menu, a select for the DOS page's ⋯ menu. Both
// follow a change made anywhere.
import { h } from '../../editor/core/ui';
import { LINE_SPEEDS, lineSpeed, setLineSpeed, speedWords, type LineSpeed } from './lineSpeed';

const value = (s: LineSpeed) => String(s);
const parse = (v: string): LineSpeed => (v === 'unlimited' ? v : (Number(v) as LineSpeed));

/** One choice a line: "300 baud" … "Unlimited", the current one checked. */
export function speedRadios(): HTMLFieldSetElement {
  const name = `line-speed-${Math.random().toString(36).slice(2, 8)}`;
  const radios = LINE_SPEEDS.map((s) => {
    const input = h('input', { type: 'radio', name, value: value(s) });
    input.checked = s === lineSpeed();
    input.addEventListener('change', () => input.checked && setLineSpeed(s));
    return h('label', { class: 'speed-choice' }, input, h('span', null, speedWords(s)));
  });
  const set = h('fieldset', { class: 'speed-radios' }, h('legend', null, 'Modem speed'), ...radios);
  addEventListener('gm-line-speed', () => {
    for (const r of set.querySelectorAll('input')) r.checked = r.value === value(lineSpeed());
  });
  return set;
}

/** A labelled select of the speeds. */
export function speedSelect(id: string): { label: HTMLLabelElement; select: HTMLSelectElement } {
  const select = h('select', { id }, ...LINE_SPEEDS.map((s) => h('option', { value: value(s) }, speedWords(s))));
  select.value = value(lineSpeed());
  select.addEventListener('change', () => setLineSpeed(parse(select.value)));
  addEventListener('gm-line-speed', () => (select.value = value(lineSpeed())));
  const label = h('label', { for: id }, 'Modem speed');
  return { label, select };
}
