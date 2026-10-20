// Text screens (.TXT): 31 characters a line, 16 lines a page.
import { registerEditor } from './index';
import { h, clear, debounce } from '../ui';
import { textLines } from '../../formats/graphicScripts';
import { latin1Text, textBytes } from '../../formats/binary';
import { gamePreview } from './mediaShared';

// ---- text screens ---------------------------------------------------------------

registerEditor(['txt'], (host, project, file) => {
  const area = h('textarea', { rows: 22, spellcheck: true, style: 'width:100%;max-width:34ch;font:14px/1.3 ui-monospace,monospace' });
  area.value = latin1Text(project.files.get(file)!)
    .replace(/\x1a.*$/s, '')
    .replace(/\r\n/g, '\n');
  const note = h('div', { class: 'meta' });
  const save = debounce(() => {
    project.files.set(file, textBytes(area.value.replace(/\n/g, '\r\n')));
  }, 300);
  const update = () => {
    const lines = textLines(textBytes(area.value));
    note.textContent = `${lines.length} lines → ${Math.max(1, Math.ceil(lines.length / 16))} page(s) of 16 lines. Lines longer than 31 characters wrap.`;
  };
  area.addEventListener('input', () => {
    update();
    save();
  });
  const preview = gamePreview(project, file);
  update();
  clear(
    host,
    h('p', { class: 'hint' }, 'Text screens are shown over the current picture, 31 characters per line and 16 lines per page.'),
    h('div', { class: 'row' }, h('div', { class: 'stack', style: 'flex:0 0 auto' }, area, note), h('div', { style: 'flex:1 1 420px' }, preview.el)),
  );
  return preview.stop;
});
