// Copy a bounded color range into the open palette; the caller owns saving and undo.
import { parsePalette, type Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import type { Project } from '../../core/project';
import { h, modal } from '../../core/ui';

export function paletteCopy(project: Project, file: string, pal: Palette, selected: number, end = selected): Promise<Palette | undefined> {
  return modal<Palette>('Copy palette range', (close) => {
    const names = project.files.byExtension('pal');
    const source = h('select', { 'aria-label': 'Source palette' }, ...names.map((name) => h('option', { value: name }, name.toUpperCase())));
    source.value = names.find((name) => name !== file) ?? file;
    const field = (label: string, value: number) => {
      const input = h('input', { type: 'number', min: 0, max: 255, step: 1, value: String(value), 'aria-label': label });
      return { input, el: h('label', { class: 'field' }, h('span', null, label), input) };
    };
    const first = field('First source color', Math.min(selected, end));
    const last = field('Last source color', Math.max(selected, end));
    const target = field('First destination color', Math.min(selected, end));
    const message = h('p', { class: 'meta', role: 'status' });
    const copy = h('button', { type: 'button' }, 'Copy range');
    const range = () => [Number(first.input.value), Number(last.input.value), Number(target.input.value)];
    function validate(): void {
      const [a, b, at] = range();
      const valid = [first, last, target].every(({ input }) => input.value !== '' && input.checkValidity()) && b >= a && at + b - a < 256;
      copy.disabled = !valid;
      message.textContent = valid
        ? `${b - a + 1} colors from ${source.value.toUpperCase()} (${a}–${b}) to ${file.toUpperCase()} (${at}–${at + b - a}). Other colors stay as they are.`
        : 'Choose source colors in order from 0 to 255, and a destination with room for the whole range.';
    }
    [source, first.input, last.input, target.input].forEach((input) => input.addEventListener('input', validate));
    copy.addEventListener('click', () => {
      validate();
      if (copy.disabled) return;
      const [a, b, at] = range();
      const colors = source.value === file ? pal : parsePalette(project.files.get(source.value)!);
      const result = pal.slice();
      result.set(colors.slice(a * 3, (b + 1) * 3), at * 3);
      close(result);
    });
    validate();
    return h(
      'div',
      { class: 'stack' },
      h('label', { class: 'field' }, h('span', null, 'Source palette'), source),
      first.el,
      last.el,
      target.el,
      message,
      h('div', { class: 'toolbar' }, copy, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel')),
    );
  });
}
