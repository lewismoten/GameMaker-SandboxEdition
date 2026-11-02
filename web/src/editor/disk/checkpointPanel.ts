// The checkpoint list of the Optimize dialog: stamp the game (before an optimization, or any time you
// like), tag a stamp as a release, look at what changed since (the files, then the maps and blocks side
// by side: compareDialog.ts), put a stamp back, or delete it. Stamps live in the game's stored record
// as deltas (project/checkpoint.ts), never in the game's files, so no export carries them; a backup
// does, unless you choose a shallow copy.
import { diffDisks, formatDiff } from '@lewismoten/gamemaker-sandbox-tools/disk-diff';
import { deltaSize } from '@lewismoten/gamemaker-sandbox-tools/delta';
import { deleteCheckpoint, getCheckpoints, makeCheckpoint, restoreChanges, tagCheckpoint, versionAt } from '../../project/checkpoint';
import type { StoredCheckpoint } from '../../project/storage';
import { confirmDialog, h, promptText, toast } from '../core/ui';
import type { fileUndo } from '../core/fileUndo';
import type { Project } from '../core/project';
import { kb } from './diskCard';

const when = (t: number) => new Date(t).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export interface CheckpointPanel {
  el: HTMLElement;
  /** The "Make a checkpoint first" choice the person can tick (off until they do). */
  option: HTMLElement;
  /** Makes a checkpoint first when the choice is ticked, unless the game is exactly as the latest one; false (and a message) when it can't. */
  ensure(name: string): Promise<boolean>;
}

export function checkpointPanel(project: Project, hist: ReturnType<typeof fileUndo>, changed: () => void): CheckpointPanel {
  const el = h('section', { class: 'disk-checkpoint', 'aria-label': 'Checkpoints' });
  let list: StoredCheckpoint[] = [];

  const sameAsLatest = () => {
    if (!list.length) return false;
    const d = diffDisks(versionAt(list, list.length - 1), new Map(project.files.entries()));
    return !(d.changed.length + d.added.length + d.removed.length);
  };

  const stamp = async (name: string, tag?: string): Promise<boolean> => {
    try {
      await project.saveNow();
      list = await makeCheckpoint(project.id, name, project.files, project.companion, tag);
      return true;
    } catch (e) {
      toast(`Could not make a checkpoint: ${(e as Error).message}`, 'error');
      return false;
    }
  };

  const restore = async (i: number) => {
    const cp = list[i];
    if (
      !(await confirmDialog(
        'Restore the checkpoint',
        `Put every file back as it was ${when(cp.made)}? Undo takes the files back; the project’s editor notes (block names, groups, palette reservations) stay as the checkpoint had them.`,
        'Restore',
      ))
    )
      return;
    const changes = restoreChanges(project.files, versionAt(list, i));
    hist.before(...changes.keys());
    for (const [n, b] of changes) {
      if (b) project.files.set(n, b);
      else project.files.delete(n);
    }
    if (cp.companion) project.companion = structuredClone(cp.companion);
    project.forgetParsed();
    void project.saveNow();
    toast(`Restored ${changes.size} file${changes.size === 1 ? '' : 's'}.`);
    changed();
  };

  const row = (cp: StoredCheckpoint, i: number) => {
    const diff = diffDisks(versionAt(list, i), new Map(project.files.entries()));
    const n = diff.changed.length + diff.added.length + diff.removed.length;
    const act = async (fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch (e) {
        toast((e as Error).message, 'error');
      }
      render();
    };
    return h(
      'li',
      { class: 'disk-checkpoint-row' },
      h(
        'p',
        { role: 'status' },
        h('strong', null, cp.name),
        cp.tag ? h('span', { class: 'disk-tag' }, ` release ${cp.tag}`) : null,
        ` ${when(cp.made)}, ${kb(deltaSize(cp.delta))} stored. ${n ? `Since then: ${formatDiff(diff).split('\n')[0]}.` : 'Nothing has changed since.'}`,
      ),
      h(
        'div',
        { class: 'disk-checkpoint-buttons' },
        h(
          'button',
          {
            type: 'button',
            'aria-label': `Compare ${cp.name} with now`,
            onclick: () => void import('./compareDialog').then((m) => m.compareDialog(project, versionAt(list, i))),
          },
          'Compare…',
        ),
        h(
          'button',
          {
            type: 'button',
            'aria-label': `Play ${cp.name}`,
            onclick: () => void import('./playCheckpoint').then((m) => m.playCheckpoint(cp.name, versionAt(list, i), project.gam)),
          },
          'Play…',
        ),
        h('button', { type: 'button', 'aria-label': `Restore ${cp.name}`, disabled: !n, onclick: () => void act(() => restore(i)) }, 'Restore'),
        h(
          'button',
          {
            type: 'button',
            'aria-label': cp.tag ? `Change the release tag of ${cp.name}` : `Tag ${cp.name} as a release`,
            onclick: () =>
              void act(async () => {
                const t = await promptText('Release tag', 'Name this release (leave empty to remove the tag)', cp.tag ?? '');
                if (t !== undefined) list = await tagCheckpoint(project.id, cp.id, t);
              }),
          },
          cp.tag ? 'Retag…' : 'Tag release…',
        ),
        h(
          'button',
          {
            type: 'button',
            'aria-label': `Delete ${cp.name}`,
            onclick: () =>
              void act(async () => {
                if (
                  await confirmDialog(
                    cp.tag ? 'Delete a release checkpoint' : 'Delete the checkpoint',
                    cp.tag
                      ? `“${cp.name}” is tagged as the release “${cp.tag}”. Deleting it removes that release stamp for good. The game stays as it is now; the later checkpoints keep everything they had.`
                      : `Delete “${cp.name}”? The game stays as it is now; the later checkpoints keep everything they had.`,
                    cp.tag ? 'Delete the release' : 'Delete',
                  )
                )
                  list = await deleteCheckpoint(project.id, cp.id);
              }),
          },
          'Delete',
        ),
      ),
    );
  };

  const render = () => {
    el.replaceChildren(
      h('h3', null, 'Checkpoints'),
      h(
        'p',
        null,
        'A checkpoint is a stamp of the whole game as it is now. Tick “Make a checkpoint first” before an optimization to be able to put everything back; you can make one any time, tag it as a release, look around, compare, and put everything back. Each stores only what changed since the one before. They stay with this game in your browser and in a backup (unless you leave them out), and are never in a download.',
      ),
      list.length ? h('ol', { class: 'disk-checkpoint-list' }, ...list.map(row)) : h('p', { class: 'hint' }, 'No checkpoints yet.'),
      h(
        'button',
        {
          type: 'button',
          onclick: () =>
            void promptText('Make a checkpoint', 'Name it', `Checkpoint ${list.length + 1}`).then(async (name) => {
              if (name?.trim() && (await stamp(name.trim()))) (render(), changed());
            }),
        },
        'Make a checkpoint…',
      ),
    );
  };

  void getCheckpoints(project.id).then(
    (c) => {
      list = c;
      render();
    },
    () => render(),
  );
  render();
  const box = h<'input'>('input', { type: 'checkbox', id: 'disk-checkpoint-first' });
  const option = h(
    'p',
    { class: 'disk-checkpoint-first' },
    h('label', null, box, ' Make a checkpoint first (so you can put everything back). Undo works either way.'),
  );
  return {
    el,
    option,
    async ensure(name) {
      if (!box.checked || sameAsLatest()) return true;
      const ok = await stamp(name);
      if (ok) render();
      return ok;
    },
  };
}
