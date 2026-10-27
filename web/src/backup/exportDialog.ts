// The Back up dialog: one row a section, its checkbox (all ticked), name, count and size, and an
// ⓘ that opens what it holds; Everything and Nothing; in the foot, which stays in view while the
// list scrolls, the AI setup's "Include my API key" (off, with a warning) and Download backup.
// "Restore from a file…" leads to the import (importDialog.ts).
import { download, h, modal, toast } from '../editor/core/ui';
import { makeBackup, snapshot } from './file';
import type { SectionId } from './inventory';
import { sectionById } from './sections';
import { hasApiKey } from './sections/settings';
import { plural } from './sections/types';
import { readWorld } from './world';
import { formatBytes } from './formatBytes';

/** Shows the dialog; resolves 'restore' when the visitor asked to restore instead. */
export async function exportDialog(): Promise<'restore' | undefined> {
  const world = await readWorld();
  let snaps = await snapshot(world);
  const keyHere = hasApiKey(world.local);
  return modal<'restore'>('Back up or restore', (close) => {
    const boxes = new Map<SectionId, HTMLInputElement>();
    const status = h('p', { class: 'backup-status', role: 'status' });
    const withKey = h('input', { type: 'checkbox', id: 'backup-api-key' });
    const rows = snaps.map((s) => {
      const box = h('input', { type: 'checkbox', id: `backup-${s.id}`, checked: s.items > 0, disabled: !s.items });
      box.addEventListener('change', count);
      boxes.set(s.id, box);
      const details = h('div', { class: 'brow-details', id: `backup-${s.id}-about`, hidden: true }, h('p', { class: 'backup-about' }, s.description));
      const about = h(
        'button',
        {
          type: 'button',
          class: 'brow-more brow-info',
          'aria-label': `About ${s.title}`,
          'aria-expanded': 'false',
          'aria-controls': details.id,
          title: s.description,
          onclick: () => {
            details.hidden = !details.hidden;
            about.setAttribute('aria-expanded', String(!details.hidden));
          },
        },
        'ⓘ',
      );
      return h(
        'li',
        { class: 'brow' },
        h(
          'div',
          { class: 'brow-line' },
          h(
            'div',
            { class: 'brow-a' },
            h('label', { class: 'brow-name', for: box.id, title: s.description }, box, h('span', null, s.short)),
            h('span', { class: 'brow-count' }, s.items ? plural(s.items, sectionById(s.id)!.unit) : 'nothing yet'),
          ),
          h('div', { class: 'brow-b' }, h('span', { class: 'brow-size' }, s.items ? formatBytes(s.bytes) : ''), about),
        ),
        details,
      );
    });
    const keyBox = keyHere
      ? h(
          'div',
          { class: 'backup-key' },
          h('label', { class: 'backup-check', for: 'backup-api-key' }, withKey, h('span', null, 'Include my AI API key')),
          h('span', { class: 'backup-warn', id: 'backup-api-key-warn' }, 'Anyone with the file can read it and spend on your account.'),
        )
      : null;
    withKey.setAttribute('aria-describedby', 'backup-api-key-warn');
    function count() {
      const n = [...boxes.values()].filter((b) => b.checked).length;
      const of = [...boxes.values()].filter((b) => !b.disabled).length;
      const bytes = snaps.filter((x) => boxes.get(x.id)?.checked).reduce((a, x) => a + x.bytes, 0);
      status.textContent = n ? `${n} of ${of} parts chosen · about ${formatBytes(bytes)} before packing` : 'Choose at least one part to back up.';
      go.disabled = !n;
    }
    const setAll = (on: boolean) => {
      for (const b of boxes.values()) b.checked = on && !b.disabled;
      count();
    };
    withKey.addEventListener('change', async () => {
      snaps = await snapshot(world, { withApiKey: withKey.checked });
      count();
    });
    const go = h('button', { type: 'submit', class: 'primary' }, 'Download backup');
    count();
    return h(
      'form',
      {
        class: 'backup',
        onsubmit: async (e: Event) => {
          e.preventDefault();
          const ids = [...boxes].filter(([, b]) => b.checked).map(([id]) => id);
          if (!ids.length) return;
          go.disabled = true;
          try {
            const file = await makeBackup(snaps, ids);
            saveFile(file.name, file.bytes);
            toast(`Saved ${file.name}.`);
            close(undefined);
          } catch (err) {
            go.disabled = false;
            toast(`The backup could not be made: ${(err as Error).message}`, 'error');
          }
        },
      },
      h(
        'p',
        { class: 'backup-lead' },
        'Keep what this browser holds in one file, to bring back here or in another browser. Imported games stay out; their notes and ratings come along.',
      ),
      h(
        'div',
        { class: 'backup-sections', role: 'group', 'aria-labelledby': 'backup-legend' },
        h(
          'div',
          { class: 'backup-bar' },
          h('h3', { id: 'backup-legend', class: 'backup-legend' }, 'What to back up'),
          h('button', { type: 'button', onclick: () => setAll(true) }, 'Everything'),
          h('button', { type: 'button', onclick: () => setAll(false) }, 'Nothing'),
        ),
        h('div', { class: 'backup-scroll' }, h('ul', { class: 'backup-list' }, ...rows)),
      ),
      h(
        'div',
        { class: 'backup-foot' },
        keyBox,
        status,
        h(
          'div',
          { class: 'buttons backup-buttons' },
          h('button', { type: 'button', class: 'backup-restore', onclick: () => close('restore') }, 'Restore from a file…'),
          h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
          go,
        ),
      ),
    );
  });
}

/** Downloads a backup file. */
export const saveFile = (name: string, bytes: Uint8Array): void => download(name, bytes, 'application/zip');
