// The screenshot and record buttons by the monitor, as they look before they are first used:
// the capture tool itself (capture.ts, with the PNG and video encoders) loads on the first
// press, takes the buttons' place and handles that press. Same markup as capture.ts draws.
import './capture.css';
import { h } from '../../editor/core/ui';

export function captureStub(load: () => Promise<HTMLElement>): HTMLElement {
  const keepFocus = { onpointerdown: (e: Event) => e.preventDefault() };
  const shotBtn = h(
    'button',
    { class: 'cap-btn', title: 'Screenshot: save what the PC shows as a PNG (720×400 text, 320×200 graphics)', 'aria-label': 'Screenshot', ...keepFocus },
    '📷',
  );
  const recBtn = h(
    'button',
    { class: 'cap-btn cap-rec', title: 'Record the screen and sound', 'aria-label': 'Record', 'aria-haspopup': 'menu', 'aria-expanded': 'false', ...keepFocus },
    '⏺',
  );
  const el = h('div', { class: 'desk-capture' }, shotBtn, recBtn);
  let loading = false;
  const press = (which: number) => async () => {
    if (loading) return;
    loading = true;
    const real = await load();
    const focused = el.contains(document.activeElement);
    el.replaceWith(real);
    const button = real.querySelectorAll<HTMLButtonElement>('button.cap-btn')[which];
    if (focused) button?.focus();
    button?.click();
  };
  shotBtn.addEventListener('click', press(0));
  recBtn.addEventListener('click', press(1));
  return el;
}
