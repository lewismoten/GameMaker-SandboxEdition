// Name inputs stage companion labels through the character editor's existing undo history.
import type { Project } from '../../core/project';
import { h } from '../../core/ui';
import { COUNTER_NAMES, counterName, readCounterNames, withCounterName, type CounterNames } from './counterNames';

export function counterNameField(project: Project, file: string, meter: number, label: string, changed: (names: CounterNames) => void): HTMLElement {
  const input = h('input', {
    type: 'text',
    maxLength: 80,
    value: counterName(project, file, meter),
    'aria-label': label,
    placeholder: 'Optional editor label',
  });
  input.addEventListener('change', () => {
    const before = readCounterNames(project.extras<unknown>(file, COUNTER_NAMES, undefined));
    const names = withCounterName(before, meter, input.value);
    input.value = names[meter] ?? '';
    if (JSON.stringify(before) !== JSON.stringify(names)) changed(names);
  });
  return h('label', { class: 'field' }, h('span', null, label), input);
}
