// A staged HSV color choice: pointer or keyboard edits become native VGA colors on confirmation.
import { hsvToRgb, rgbToHsv, type RGB } from '@lewismoten/gamemaker-sandbox-tools/colors';
import { h, modal } from '../../core/ui';
import './colorPicker.css';

export function pickColor(initial: RGB): Promise<RGB | undefined> {
  return modal<RGB>('Choose color', (close) => {
    const hsv = rgbToHsv(initial);
    const marker = h('span', { class: 'pal-hsv-marker', 'aria-hidden': 'true' });
    const square = h(
      'button',
      {
        type: 'button',
        class: 'pal-hsv-square',
        'aria-describedby': 'pal-hsv-help',
        'aria-keyshortcuts': 'ArrowLeft ArrowRight ArrowUp ArrowDown',
      },
      marker,
    );
    const hue = h('input', { type: 'range', min: 0, max: 360, step: 1, class: 'pal-hsv-hue', 'aria-label': 'Hue', orient: 'vertical' });
    const saturation = h('input', { type: 'range', min: 0, max: 100, step: 1, 'aria-label': 'Saturation' });
    const brightness = h('input', { type: 'range', min: 0, max: 100, step: 1, 'aria-label': 'Brightness' });
    const chip = h('span', { class: 'pal-hsv-chip', 'aria-hidden': 'true' });
    const values = h('output', { 'aria-label': 'VGA color', 'aria-live': 'polite' });
    const result = (): RGB => hsvToRgb(hsv).map((c) => (Math.round((c * 63) / 255) * 255) / 63) as [number, number, number];
    function refresh(): void {
      square.style.background = `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${hsv[0]} 100% 50%))`;
      square.setAttribute('aria-label', `Saturation and brightness: ${Math.round(hsv[1] * 100)}%, ${Math.round(hsv[2] * 100)}%`);
      marker.style.left = `${hsv[1] * 100}%`;
      marker.style.top = `${(1 - hsv[2]) * 100}%`;
      hue.value = String(hsv[0]);
      saturation.value = String(Math.round(hsv[1] * 100));
      brightness.value = String(Math.round(hsv[2] * 100));
      const rgb = result();
      chip.style.background = `rgb(${rgb.join(',')})`;
      values.textContent = `VGA: ${rgb.map((c) => Math.round((c * 63) / 255)).join(', ')}`;
    }
    const point = (event: PointerEvent) => {
      const rect = square.getBoundingClientRect();
      hsv[1] = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      hsv[2] = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      refresh();
    };
    square.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      square.focus();
      square.setPointerCapture(event.pointerId);
      point(event);
    });
    square.addEventListener('pointermove', (event) => {
      if (square.hasPointerCapture(event.pointerId)) point(event);
    });
    square.addEventListener('keydown', (event) => {
      const delta = event.shiftKey ? 0.1 : 0.01;
      if (event.key === 'ArrowLeft') hsv[1] -= delta;
      else if (event.key === 'ArrowRight') hsv[1] += delta;
      else if (event.key === 'ArrowUp') hsv[2] += delta;
      else if (event.key === 'ArrowDown') hsv[2] -= delta;
      else return;
      event.preventDefault();
      hsv[1] = Math.max(0, Math.min(1, hsv[1]));
      hsv[2] = Math.max(0, Math.min(1, hsv[2]));
      refresh();
    });
    [hue, saturation, brightness].forEach((input, index) =>
      input.addEventListener('input', () => {
        hsv[index] = Number(input.value) / (index === 0 ? 1 : 100);
        refresh();
      }),
    );
    refresh();
    return h(
      'div',
      { class: 'pal-hsv stack' },
      h(
        'p',
        { id: 'pal-hsv-help', class: 'meta' },
        'Drag in the square for saturation and brightness; drag the hue bar to change color. Arrow keys adjust the square; Shift makes larger steps.',
      ),
      h('div', { class: 'pal-hsv-controls' }, square, hue),
      h('label', { class: 'field' }, h('span', null, 'Saturation'), saturation),
      h('label', { class: 'field' }, h('span', null, 'Brightness'), brightness),
      h('div', { class: 'row', style: 'align-items:center' }, chip, values),
      h(
        'div',
        { class: 'toolbar' },
        h('button', { type: 'button', onclick: () => close(result()) }, 'Confirm color'),
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
      ),
    );
  });
}
