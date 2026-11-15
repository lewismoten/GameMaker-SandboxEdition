// The optional one-line reason beside "Mark as checked" / "That's on purpose": a labeled text
// field the author may fill in, kept with the accepted finding in the companion file
// (check/accepted.ts), and the note that shows a kept reason on an accepted finding.
import './acceptReason.css';
import { h } from '../core/ui';

/** A labeled field for the reason; Enter in it accepts (calls `submit`). */
export function reasonField(submit: () => void): { el: HTMLElement; value: () => string } {
  const input = h('input', {
    type: 'text',
    class: 'lc-why-input',
    maxlength: '160',
    placeholder: 'Why? (optional)',
    autocomplete: 'off',
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  });
  const el = h('label', { class: 'lc-why-field' }, h('span', { class: 'lc-why-label' }, 'Reason (optional)'), input);
  return { el, value: () => input.value };
}

/** The reason an accepted finding was given (nothing when there is none). */
export const reasonNote = (why: string): HTMLElement | null => (why ? h('p', { class: 'lc-why-note meta' }, `Why: ${why}`) : null);
