// The Saves & scores panel's backups: take one now (with a label), and restore, rename or delete
// each one kept in this browser, newest first; a delete can be undone for a few seconds.
import { h, clear, modal } from '../editor/core/ui';
import { backupNow, deleteBackup, getBackup, putBackup, renameBackup, restoreBackup, type BackupSummary } from '../project/saveData';
import { FOUND_FILE } from '../tinHearts/tinHearts';
import type { Panel } from './panelState';
import { confirmDialog, kb } from './panelText';

export function renderBackups(p: Panel): void {
  const saves = p.saves!;
  const label = h('input', { type: 'text', id: 'sv-backup-label', placeholder: 'Label (optional)', maxlength: 60 });
  const hasSaves = saves.slots.some((s) => s.bytes) || (!!saves.highScoreFile && !saves.highScoresFromDisk);
  const rows = p.backups.map((b) => backupRow(p, b));
  clear(
    p.main,
    h(
      'header',
      { class: 'sv-head' },
      h('h3', { class: 'sv-title', tabindex: -1 }, 'Backups'),
      h('p', { class: 'sv-where' }, 'Kept in this browser, as many as you like.'),
    ),
    h(
      'form',
      {
        class: 'sv-tools sv-backup-form',
        onsubmit: async (e: Event) => {
          e.preventDefault();
          const b = await backupNow(p.target.saveId, { label: label.value, by: 'web' });
          p.toast(b ? `Backed up: ${b.label}` : 'Nothing to back up yet: play and save first.');
        },
      },
      h('label', { class: 'sv-sr', for: 'sv-backup-label' }, 'Backup label'),
      label,
      h('button', { class: 'primary', disabled: !hasSaves }, 'Back up now'),
    ),
    rows.length
      ? h('ul', { class: 'sv-backups', 'aria-label': 'Backups, newest first' }, rows)
      : h('p', { class: 'sv-empty' }, 'No backups yet. One is taken by itself before your first change here.'),
  );
}

/** One backup: its label, when and what it holds, and Restore, Rename and Delete. */
function backupRow(p: Panel, b: BackupSummary): HTMLElement {
  const when = new Date(b.when);
  const what = [
    b.slots.length ? `slot${b.slots.length === 1 ? '' : 's'} ${b.slots.map((s) => s + 1).join(', ')}` : null,
    b.names.some((n) => /\.his$/i.test(n)) ? 'high scores' : null,
    b.names.includes(FOUND_FILE) ? 'tin heart' : null,
    kb(b.bytes),
  ]
    .filter(Boolean)
    .join(' · ');
  return h(
    'li',
    { class: 'sv-backup' },
    h(
      'div',
      { class: 'sv-backup-text' },
      h(
        'span',
        { class: 'sv-backup-label' },
        b.label,
        b.auto ? h('span', { class: 'sv-badge' }, 'auto') : null,
        b.by && b.by !== 'web' ? h('span', { class: 'sv-badge' }, b.by) : null,
      ),
      h(
        'span',
        { class: 'sv-backup-meta' },
        h('time', { datetime: when.toISOString() }, when.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })),
        ` · ${what}`,
      ),
    ),
    h(
      'div',
      { class: 'sv-backup-tools' },
      h(
        'button',
        {
          type: 'button',
          'aria-label': `Restore ${b.label}`,
          onclick: async () => {
            if (
              !(await confirmDialog(
                'Restore this backup?',
                `The saves and high scores go back to “${b.label}”. What is there now is backed up first.`,
                'Restore',
              ))
            )
              return;
            await restoreBackup(b.id, { safety: true, by: 'web' });
            p.work.clear();
            p.scores = undefined;
            await p.reload();
            p.toast('Restored. In the game, F6 loads the saves.');
            p.render();
          },
        },
        'Restore',
      ),
      h(
        'button',
        {
          type: 'button',
          'aria-label': `Rename ${b.label}`,
          onclick: async () => {
            const name = await modal<string>('Rename backup', (close) => {
              const input = h('input', { type: 'text', value: b.label, maxlength: 60, 'aria-label': 'Label', autofocus: true });
              return h(
                'form',
                { method: 'dialog', onsubmit: (e: Event) => (e.preventDefault(), close(input.value)) },
                input,
                h(
                  'div',
                  { class: 'buttons' },
                  h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
                  h('button', { class: 'primary' }, 'Rename'),
                ),
              );
            });
            if (name?.trim()) await renameBackup(b.id, name);
          },
        },
        'Rename',
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'danger',
          'aria-label': `Delete ${b.label}`,
          onclick: async () => {
            const full = await getBackup(b.id);
            await deleteBackup(b.id);
            undoNote(`Deleted “${b.label}”.`, async () => full && putBackup(full));
          },
        },
        'Delete',
      ),
    ),
  );
}

/** A notice with Undo, for a few seconds. */
function undoNote(message: string, undo: () => Promise<unknown>): void {
  document.querySelector('.sv-undo')?.remove();
  const done = () => {
    clearTimeout(timer);
    note.remove();
  };
  const note = h(
    'div',
    { class: 'sv-undo', role: 'status' },
    h('span', null, message),
    h('button', { type: 'button', onclick: () => void undo().then(done) }, 'Undo'),
    h('button', { type: 'button', 'aria-label': 'Dismiss', onclick: done }, '×'),
  );
  const timer = setTimeout(done, 10000);
  (document.querySelector('dialog.sv-dialog') ?? document.body).append(note);
}
