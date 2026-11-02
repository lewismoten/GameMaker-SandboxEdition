// Reduce actual GIF pixels to a chosen budget, then stage only the selected palette entries.
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { paletteCss, vga8, type Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { medianCutRgba } from '@lewismoten/gamemaker-sandbox-tools/images';
import { clear, h, modal } from '../../core/ui';

export function pictureColors(bytes: Uint8Array, name: string, palette: Palette, first: number, last: number): Promise<Palette | undefined> {
  const image = decodeGif(bytes);
  if (!image.pixels.length) throw new Error('The picture has no pixels');
  const data = new Uint8Array(image.pixels.length * 4);
  image.pixels.forEach((index, i) => {
    for (let channel = 0; channel < 3; channel++) data[i * 4 + channel] = vga8(image.palette[index * 3 + channel]);
    data[i * 4 + 3] = 255;
  });
  const capacity = last - first + 1;
  return modal<Palette>('Colors from picture', (close) => {
    const count = h('input', { type: 'number', min: 1, max: capacity, step: 1, value: String(Math.min(16, capacity)), 'aria-label': 'Maximum colors' });
    const chips = h('div', { class: 'row', style: 'gap:2px;flex-wrap:wrap', 'aria-label': 'Chosen colors' });
    const status = h('p', { class: 'meta', role: 'status' });
    const apply = h('button', { type: 'button' }, 'Apply colors');
    const cache = new Map<number, Palette>();
    let result: Palette | undefined;
    function preview(): void {
      const budget = Number(count.value);
      const valid = count.value !== '' && count.checkValidity();
      apply.disabled = !valid;
      if (!valid) {
        result = undefined;
        clear(chips);
        status.textContent = `Choose 1–${capacity} colors to fit the selected range.`;
        return;
      }
      let colors = cache.get(budget);
      if (!colors) {
        colors = Uint8Array.from(medianCutRgba([{ width: image.width, height: image.height, data }], budget).flatMap((rgb) => rgb.map((value) => value >> 2)));
        cache.set(budget, colors);
      }
      result = palette.slice();
      result.set(colors, first * 3);
      clear(
        chips,
        ...Array.from({ length: colors.length / 3 }, (_, i) =>
          h('span', {
            style: `display:block;width:24px;height:24px;background:${paletteCss(result!, first + i)};border:1px solid var(--border)`,
            title: `Color ${first + i}: ${Array.from(colors.subarray(i * 3, i * 3 + 3)).join(', ')}`,
          }),
        ),
      );
      status.textContent = `${colors.length / 3} colors from ${name.toUpperCase()} will replace colors ${first}–${first + colors.length / 3 - 1}. All other entries stay as they are.`;
    }
    count.addEventListener('input', preview);
    apply.addEventListener('click', () => {
      if (result && !apply.disabled) close(result);
    });
    preview();
    return h(
      'div',
      { class: 'stack' },
      h(
        'p',
        { class: 'meta' },
        `Selected range: ${first}–${last} (${capacity} slots). Colors are reduced from the picture's used pixels, weighted by their frequency.`,
      ),
      h('label', { class: 'field' }, h('span', null, 'Maximum colors'), count),
      chips,
      status,
      h('div', { class: 'toolbar' }, apply, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel')),
    );
  });
}
