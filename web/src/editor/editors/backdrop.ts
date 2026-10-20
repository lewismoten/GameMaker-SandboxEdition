// Backdrops (.BKD): a 320x200 window of a larger GIF picture.
import { registerEditor } from './index';
import { fileField } from '../filePicker';
import { h, clear, numberField } from '../ui';
import { paintIndexed } from '../draw';
import { decodeGif, isGif } from '../../formats/gif';
import { parseBackdrop, serializeBackdrop } from '../../formats/graphicScripts';
import { gamePreview } from './mediaShared';

registerEditor(['bkd'], (host, project, file) => {
  const bkd = parseBackdrop(project.files.get(file)!);
  const save = () => project.files.set(file, serializeBackdrop(bkd));
  const preview = gamePreview(project, file);
  // The whole picture, with the 320x200 window drawn on it: drag the window to move it.
  const whole = h('canvas', { class: 'pixel bkd-whole' });
  const fields = h('div', { class: 'toolbar' });
  const drawWhole = () => {
    const bytes = project.files.get(bkd.gif.toLowerCase());
    const ctx = whole.getContext('2d')!;
    if (!bytes || !isGif(bytes)) {
      whole.width = 320;
      whole.height = 40;
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, 320, 40);
      return;
    }
    const g = decodeGif(bytes);
    paintIndexed(whole, g.pixels, g.width, g.height, g.palette);
    ctx.strokeStyle = '#ffd400';
    ctx.lineWidth = Math.max(2, g.width / 300);
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(bkd.x, bkd.y, 320, 200);
  };
  const renderFields = () =>
    clear(
      fields,
      fileField(
        project,
        'Picture',
        ['gif'],
        () => bkd.gif.toLowerCase(),
        (v) => ((bkd.gif = v), save(), drawWhole()),
        { allowNone: false },
      ),
      numberField(
        'Left (x)',
        () => bkd.x,
        (v) => ((bkd.x = v), save(), drawWhole()),
        { min: 0, max: 32767 },
      ),
      numberField(
        'Top (y)',
        () => bkd.y,
        (v) => ((bkd.y = v), save(), drawWhole()),
        { min: 0, max: 32767 },
      ),
    );
  let drag: { x: number; y: number; bx: number; by: number } | undefined;
  whole.addEventListener('pointerdown', (e) => {
    whole.setPointerCapture(e.pointerId);
    const r = whole.getBoundingClientRect();
    const k = whole.width / r.width;
    drag = { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k, bx: bkd.x, by: bkd.y };
  });
  whole.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = whole.getBoundingClientRect();
    const k = whole.width / r.width;
    bkd.x = Math.max(0, Math.min(whole.width - 320, Math.round(drag.bx + (e.clientX - r.left) * k - drag.x)));
    bkd.y = Math.max(0, Math.min(whole.height - 200, Math.round(drag.by + (e.clientY - r.top) * k - drag.y)));
    drawWhole();
  });
  whole.addEventListener('pointerup', () => {
    if (!drag) return;
    drag = undefined;
    save();
    renderFields();
  });
  renderFields();
  drawWhole();
  clear(
    host,
    h('p', { class: 'hint' }, 'A backdrop shows a 320×200 window of a larger GIF picture. Drag the dashed window over the picture to choose which part.'),
    h('div', { class: 'panel stack' }, fields, whole),
    h('div', { style: 'height:12px' }),
    preview.el,
  );
  return preview.stop;
});
