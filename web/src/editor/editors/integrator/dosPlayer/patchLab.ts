// The DOS player panel's Patch Lab: a read-only byte strip for the setting being edited. Per run of
// bytes it writes: the file offset in XFERPLAY.EXE, the CD's own bytes and the new bytes, the changed
// ones in bold, underlined and tinted (never color alone) with a count in words. The table scrolls
// sideways inside its own box, which takes the keyboard, so a phone never scrolls the page.
import { h, clear } from '../../../core/ui';
import type { PatchEntry } from '@lewismoten/gamemaker-sandbox-engine/player/patchTable';
import type { PatchValue } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';
import { byteRuns, hex2, hexOffset, type ByteRun } from './patchBytes';

const bytesCell = (bytes: number[], changed: boolean[], text?: string) => {
  const cell = h('td', { class: 'pl-bytes' });
  bytes.forEach((b, i) => {
    cell.append(changed[i] ? h('b', { class: 'pl-changed' }, hex2(b)) : h('span', null, hex2(b)), ' ');
  });
  if (text !== undefined) cell.append(h('div', { class: 'pl-text' }, `“${text}”`));
  return cell;
};

const summary = (r: ByteRun) => {
  const n = r.changed.filter(Boolean).length;
  return n ? `${n} of ${r.changed.length} changed` : 'unchanged';
};

/** The strip: `update` shows another setting or value. */
export function patchLab(id: string): { el: HTMLElement; update: (entry: PatchEntry, value: PatchValue) => void } {
  const title = h('span', { class: 'pl-title' });
  const note = h('p', { class: 'pl-note' });
  const table = h('table', { class: 'pl-table' });
  const box = h('div', { class: 'pl-scroll', role: 'region', tabindex: '0', id: `${id}-labbox` }, table);
  const wide = typeof matchMedia === 'function' && matchMedia('(min-width: 761px)').matches;
  const el = h(
    'details',
    { class: 'dp-lab', open: wide },
    h('summary', null, 'Patch Lab: ', title),
    h(
      'p',
      { class: 'pl-intro' },
      'The bytes this setting writes into XFERPLAY.EXE, as a hex editor would show them. Read-only: change the setting in its field and the strip follows.',
    ),
    note,
    box,
  );
  const update = (e: PatchEntry, value: PatchValue) => {
    const runs = byteRuns(e, value);
    const total = runs.reduce((n, r) => n + r.changed.filter(Boolean).length, 0);
    title.textContent = `${e.label} (${e.id})`;
    box.setAttribute('aria-label', `Bytes of ${e.label}: ${total ? `${total} changed` : 'unchanged'}. Scrolls sideways.`);
    note.textContent =
      (e.kind === 'text' || e.kind === 'format'
        ? `The 00 after the last byte ends the string and is never written. `
        : e.kind === 'rgb'
          ? 'Red, green and blue levels, 0 to 63, each in its own instruction. '
          : e.kind === 'fkey'
            ? 'One word in the jump table: the key’s own handler, or the “does nothing” target when it is off. '
            : '') + (total ? `${total} byte${total === 1 ? '' : 's'} differ from the CD’s player.` : 'Every byte is the CD’s own.');
    clear(
      table,
      h('caption', { class: 'pl-caption' }, `Offsets count from the first byte of the CD’s XFERPLAY.EXE; bytes are hexadecimal.`),
      h(
        'thead',
        null,
        h(
          'tr',
          null,
          h('th', { scope: 'col' }, 'File offset'),
          h('th', { scope: 'col' }, 'CD (stock)'),
          h('th', { scope: 'col' }, 'New'),
          h('th', { scope: 'col' }, 'Changed'),
        ),
      ),
      h(
        'tbody',
        null,
        ...runs.map((r) =>
          h(
            'tr',
            null,
            h('th', { scope: 'row', class: 'pl-offset' }, hexOffset(r.offset)),
            bytesCell(
              r.stock,
              r.changed.map(() => false),
              r.stockText,
            ),
            bytesCell(r.now, r.changed, r.nowText),
            h('td', { class: 'pl-sum' }, r.changed.some(Boolean) ? h('b', null, `▲ ${summary(r)}`) : summary(r)),
          ),
        ),
      ),
    );
  };
  return { el, update };
}
