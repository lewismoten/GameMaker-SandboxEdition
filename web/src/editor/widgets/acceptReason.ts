// Reason and acceptance controls shared by the map panel and the report.
import './acceptReason.css';
import { h } from '../core/ui';
import type { Project } from '../core/project';
import { acceptedFindings, reasonFor, setAccepted } from '../check/accepted';

/** Open findings keep a draft for the lifetime of the panel or report. */
export function reasonField(
  project: Project,
  drafts: Map<string, string>,
  key: string,
  accepted: boolean,
  afterToggle: () => void,
  button: HTMLButtonElement,
): [HTMLLabelElement, HTMLButtonElement] {
  const input = h('input', { type: 'text', class: 'lc-why-input', maxlength: '160', placeholder: 'Why? (optional)', autocomplete: 'off' });
  let saved = accepted ? reasonFor(acceptedFindings(project), key) : '';
  input.value = accepted ? saved : (drafts.get(key) ?? '');
  const save = (): void => {
    if (accepted && input.value.trim() !== saved) {
      saved = input.value.trim();
      setAccepted(project, key, true, saved);
    }
  };
  input.addEventListener('input', () => {
    if (!accepted) drafts.set(key, input.value);
  });
  input.addEventListener('blur', save);
  const toggle = (): void => {
    if (accepted) drafts.set(key, input.value);
    else drafts.delete(key);
    setAccepted(project, key, !accepted, input.value);
    afterToggle();
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (accepted) save();
      else toggle();
    }
  });
  button.addEventListener('click', toggle);
  return [h('label', { class: 'lc-why-field' }, h('span', { class: 'lc-why-label' }, 'Reason (optional)'), input), button];
}
