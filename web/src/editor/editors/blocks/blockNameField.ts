// Naming a picture changes only its companion entry; blank text restores its numbered label.
import type { Project } from '../../core/project';
import { h } from '../../core/ui';
import { blockName, setBlockName } from './blockNames';

export function blockNameField(
  project: Project,
  file: string,
  current: () => number,
  count: number,
  changed: () => void,
): { el: HTMLElement; refresh(): void } {
  const label = h('span');
  const input = h('input', { type: 'text', maxLength: 80, placeholder: 'Optional name', autocomplete: 'off' });
  const refresh = () => {
    label.textContent = `Name for block ${current()}`;
    input.value = blockName(project, file, current());
  };
  input.addEventListener('change', () => {
    setBlockName(project, file, current(), input.value, count);
    refresh();
    changed();
  });
  refresh();
  return { el: h('label', { class: 'field', style: 'flex:1 1 220px;min-width:0;max-width:420px' }, label, input), refresh };
}
