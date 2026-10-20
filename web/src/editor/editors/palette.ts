// Palette editor (PALCHOS.EXE): 256 VGA colors with 0..63 red/green/blue.
import { registerEditor } from './index';
import { fileField } from '../filePicker';
import { h, clear } from '../ui';
import { parsePalette, paletteCss, serializePalette, defaultPalette } from '../../formats/palette';
import { decodeGif, isGif } from '../../formats/gif';

registerEditor(['pal'], (host, project, file) => {
  const pal = parsePalette(project.files.get(file)!);
  let selected = 1;
  let rangeEnd: number | undefined;
  const save = () => project.files.set(file, serializePalette(pal));

  const swatches = h('div', { class: 'swatches', role: 'grid', 'aria-label': 'Palette colors' });
  const preview = h('div', { style: 'width:64px;height:64px;border:1px solid var(--border);border-radius:6px' });
  const label = h('div', { class: 'meta' });
  const sliders = ['Red', 'Green', 'Blue'].map((name, c) => {
    const range = h('input', { type: 'range', min: 0, max: 63, step: 1, 'aria-label': name });
    const num = h('input', { type: 'number', min: 0, max: 63 });
    const set = (v: number) => {
      pal[selected * 3 + c] = Math.max(0, Math.min(63, v | 0));
      save();
      refresh();
    };
    range.addEventListener('input', () => set(Number(range.value)));
    num.addEventListener('change', () => set(Number(num.value)));
    return { range, num, row: h('label', { class: 'field' }, h('span', null, name), h('div', { class: 'row', style: 'align-items:center;gap:6px' }, range, num)) };
  });

  const buttons: HTMLButtonElement[] = [];
  for (let i = 0; i < 256; i++) {
    const b = h('button', {
      title: `Color ${i}`,
      'aria-label': `Color ${i}`,
      onclick: (e: MouseEvent) => {
        if (e.shiftKey) rangeEnd = i;
        else {
          selected = i;
          rangeEnd = undefined;
        }
        refresh();
      },
    });
    buttons.push(b);
    swatches.append(b);
  }

  function refresh(): void {
    buttons.forEach((b, i) => {
      b.style.background = paletteCss(pal, i);
      const inRange = rangeEnd !== undefined && i >= Math.min(selected, rangeEnd) && i <= Math.max(selected, rangeEnd);
      b.classList.toggle('selected', i === selected || inRange);
    });
    preview.style.background = paletteCss(pal, selected);
    label.textContent = `Color ${selected}${rangeEnd !== undefined ? ` to ${rangeEnd}` : ''}`;
    sliders.forEach((s, c) => {
      s.range.value = String(pal[selected * 3 + c]);
      s.num.value = String(pal[selected * 3 + c]);
    });
  }

  const spread = () => {
    if (rangeEnd === undefined) return;
    const [a, b] = [Math.min(selected, rangeEnd), Math.max(selected, rangeEnd)];
    for (let i = a + 1; i < b; i++)
      for (let c = 0; c < 3; c++) pal[i * 3 + c] = Math.round(pal[a * 3 + c] + ((pal[b * 3 + c] - pal[a * 3 + c]) * (i - a)) / (b - a));
    save();
    refresh();
  };

  const gifs = project.files.byExtension('gif').filter((g) => isGif(project.files.get(g)!));
  let gifChoice = gifs[0] ?? '';
  clear(
    host,
    h('p', { class: 'hint' }, 'Click a color to edit it. Shift-click a second color to select a range, then “Spread” to blend between them. Color 255 is drawn as transparent in monster and character blocks.'),
    h(
      'div',
      { class: 'row' },
      h('div', { class: 'panel', style: 'flex:1 1 320px;max-width:360px' }, swatches),
      h(
        'div',
        { class: 'panel stack', style: 'flex:1 1 260px' },
        h('div', { class: 'row', style: 'align-items:center' }, preview, label),
        ...sliders.map((s) => s.row),
        h('div', { class: 'toolbar' }, h('button', { onclick: spread }, 'Spread range')),
        gifs.length
          ? h(
              'div',
              { class: 'toolbar' },
              fileField(project, 'Copy colors from picture', ['gif'], () => gifChoice, (v) => v && (gifChoice = v), { allowNone: false }),
              h(
                'button',
                {
                  onclick: () => {
                    pal.set(decodeGif(project.files.get(gifChoice)!).palette);
                    save();
                    refresh();
                  },
                },
                'Copy',
              ),
            )
          : null,
        h(
          'button',
          {
            onclick: () => {
              pal.set(defaultPalette());
              save();
              refresh();
            },
          },
          'Reset to default colors',
        ),
      ),
    ),
  );
  refresh();
});
