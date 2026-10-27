// The Back up dialog: every section with a checkbox (all ticked), what it holds and its size,
// Everything and Nothing, the AI setup's "Include my API key" (off, with a warning), and Download
// backup. "Restore from a file…" leads to the import (importDialog.ts).
import { download, h, modal, toast } from '../editor/core/ui';
import { makeBackup, snapshot, type SectionSnapshot } from './file';
import type { SectionId } from './inventory';
import { sectionById } from './sections';
import { hasApiKey } from './sections/settings';
import { plural } from './sections/types';
import { readWorld } from './world';
import { formatBytes } from './formatBytes';

/** What a section holds, for its row: "3 games · 1.2 MB", or "Nothing yet". */
export function sectionFacts(s: Pick<SectionSnapshot, 'id' | 'items' | 'bytes'>): string {
  if (!s.items) return 'Nothing yet';
  return `${plural(s.items, sectionById(s.id)!.unit)} · ${formatBytes(s.bytes)}`;
}

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
      const box = h('input', { type: 'checkbox', id: `backup-${s.id}`, checked: s.items > 0, disabled: !s.items, 'aria-describedby': `backup-${s.id}-about` });
      box.addEventListener('change', count);
      boxes.set(s.id, box);
      const facts = h('span', { class: 'backup-facts' }, sectionFacts(s));
      const extra =
        s.id === 'ai' && keyHere
          ? h(
              'div',
              { class: 'backup-key' },
              h('label', { for: 'backup-api-key' }, withKey, ' Include my API key'),
              h('p', { class: 'backup-warn' }, 'Anyone with the file can read the key and spend on your account. Leave it out unless you keep the file safe.'),
            )
          : null;
      return h(
        'li',
        null,
        h(
          'label',
          { class: 'backup-row', for: box.id },
          box,
          h('span', { class: 'backup-text' }, h('strong', null, s.title), h('span', { id: `backup-${s.id}-about`, class: 'backup-about' }, s.description)),
          facts,
        ),
        extra,
      );
    });
    function count() {
      const n = [...boxes.values()].filter((b) => b.checked).length;
      const of = [...boxes.values()].filter((b) => !b.disabled).length;
      status.textContent = n ? `${n} of ${of} parts chosen.` : 'Choose at least one part to back up.';
      go.disabled = !n;
    }
    const setAll = (on: boolean) => {
      for (const b of boxes.values()) b.checked = on && !b.disabled;
      count();
    };
    withKey.addEventListener('change', async () => {
      snaps = await snapshot(world, { withApiKey: withKey.checked });
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
        'fieldset',
        { class: 'backup-sections' },
        h('legend', null, 'What to back up'),
        h(
          'div',
          { class: 'backup-quick' },
          h('button', { type: 'button', onclick: () => setAll(true) }, 'Everything'),
          h('button', { type: 'button', onclick: () => setAll(false) }, 'Nothing'),
        ),
        h('ul', { class: 'backup-list' }, ...rows),
      ),
      status,
      h(
        'div',
        { class: 'buttons backup-buttons' },
        h('button', { type: 'button', class: 'backup-restore', onclick: () => close('restore') }, 'Restore from a file…'),
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        go,
      ),
    );
  });
}

/** Downloads a backup file. */
export const saveFile = (name: string, bytes: Uint8Array): void => download(name, bytes, 'application/zip');
