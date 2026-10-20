// Slide shows (.LST): pictures, animations and text screens in order.
import { registerEditor } from './index';
import { fileField } from '../filePicker';
import type { FileKind } from '../project';
import { h, clear, selectField, numberField } from '../ui';
import { parseSlideList, serializeSlideList, type SlideEntry } from '../../formats/graphicScripts';
import { GRAPHIC_EXTS } from '../../formats/game';
import { gamePreview } from './mediaShared';

// ---- slide shows ----------------------------------------------------------------

registerEditor(['lst'], (host, project, file) => {
  const entries: SlideEntry[] = parseSlideList(project.files.get(file)!);
  const save = () => project.files.set(file, serializeSlideList(entries));
  const options = (): [string, string][] =>
    project.files
      .names()
      .filter((n) => GRAPHIC_EXTS.some((e) => n.endsWith(`.${e}`)) && n !== file)
      .map((n) => [n, n]);
  const table = h('tbody');
  const preview = gamePreview(project, file);
  const render = () =>
    clear(
      table,
      ...entries.map((e, i) =>
        h(
          'tr',
          null,
          h('td', null, i + 1),
          h(
            'td',
            null,
            fileField(
              project,
              `Slide ${i + 1}`,
              GRAPHIC_EXTS as FileKind[],
              () => e.name.toLowerCase(),
              (v) => ((e.name = v), save()),
              { allowNone: false },
            ),
          ),
          h(
            'td',
            null,
            selectField(
              '',
              [
                [-1, 'Wait for a key'],
                [0, 'Don’t wait'],
                [1, 'Seconds…'],
              ] as [number, string][],
              () => (e.pause === undefined ? -1 : e.pause === 0 ? 0 : 1),
              (v) => {
                e.pause = v === -1 ? undefined : v === 0 ? 0 : 5;
                save();
                render();
              },
            ),
          ),
          h(
            'td',
            null,
            e.pause && e.pause > 0
              ? numberField(
                  '',
                  () => e.pause!,
                  (v) => ((e.pause = v), save()),
                  { min: 1, max: 32767 },
                )
              : '',
          ),
          h(
            'td',
            null,
            h('button', { onclick: () => (i > 0 && ([entries[i - 1], entries[i]] = [entries[i], entries[i - 1]]), save(), render()) }, '↑'),
            h('button', { onclick: () => (entries.splice(i, 1), save(), render()) }, '✕'),
          ),
        ),
      ),
    );
  render();
  clear(
    host,
    h('p', { class: 'hint' }, 'A slide show plays pictures, animations and text screens in order. Esc skips the rest.'),
    h(
      'table',
      { class: 'data' },
      h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Show'), h('th', null, 'Then'), h('th', null, ''), h('th', null, ''))),
      table,
    ),
    h(
      'div',
      { class: 'toolbar', style: 'margin:8px 0' },
      h('button', { onclick: () => (entries.push({ name: options()[0]?.[0] ?? '', pause: undefined }), save(), render()) }, '+ Add'),
    ),
    preview.el,
  );
  return preview.stop;
});
