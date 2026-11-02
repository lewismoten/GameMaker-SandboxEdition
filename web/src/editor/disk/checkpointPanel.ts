// The checkpoint section of the Optimize dialog: stamp the game before an optimization, look at
// what changed (the files, then the maps and blocks side by side: compareDialog.ts), put the
// stamp back, or throw it away. The stamp lives in the game's stored record (project/checkpoint.ts),
// never in the game's files, so no export carries it.
import { diffDisks, formatDiff } from '@lewismoten/gamemaker-sandbox-tools/disk-diff';
import { discardCheckpoint, getCheckpoint, makeCheckpoint, restoreChanges } from '../../project/checkpoint';
import type { StoredCheckpoint } from '../../project/storage';
import { confirmDialog, h, toast } from '../core/ui';
import type { fileUndo } from '../core/fileUndo';
import type { Project } from '../core/project';

const when = (t: number) => new Date(t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });

export interface CheckpointPanel {
  el: HTMLElement;
  /** Makes a checkpoint first when the game has none; false (and a message) when it can't. */
  ensure(name: string): Promise<boolean>;
}

export function checkpointPanel(project: Project, hist: ReturnType<typeof fileUndo>, changed: () => void): CheckpointPanel {
  const el = h('section', { class: 'disk-checkpoint', 'aria-label': 'Checkpoint' });
  let cp: StoredCheckpoint | undefined;

  const stamp = async (name: string): Promise<boolean> => {
    try {
      await project.saveNow();
      cp = await makeCheckpoint(project.id, name, project.files, project.companion);
      return true;
    } catch (e) {
      toast(`Could not make a checkpoint: ${(e as Error).message}`, 'error');
      return false;
    }
  };

  const restore = async () => {
    if (!cp) return;
    if (!(await confirmDialog('Restore the checkpoint', `Put every file back as it was ${when(cp.made)}? Undo takes it back.`, 'Restore'))) return;
    const changes = restoreChanges(project.files, cp);
    hist.before(...changes.keys());
    for (const [n, b] of changes) {
      if (b) project.files.set(n, b);
      else project.files.delete(n);
    }
    project.companion = cp.companion ? structuredClone(cp.companion) : project.companion;
    project.forgetParsed();
    void project.saveNow();
    toast(`Restored ${changes.size} file${changes.size === 1 ? '' : 's'}.`);
    changed();
  };

  const compare = async () => {
    if (!cp) return;
    const m = await import('./compareDialog');
    await m.compareDialog(project, cp);
  };

  const render = () => {
    if (!cp) {
      el.replaceChildren(
        h('h3', null, 'Checkpoint'),
        h(
          'p',
          null,
          'A checkpoint is a stamp of the whole game as it is now. Optimizing makes one first; you can look around, compare, and put everything back. It stays with this game in your browser and is never in a download.',
        ),
        h(
          'button',
          {
            type: 'button',
            onclick: () =>
              void stamp('Before optimization').then((ok) => {
                if (ok) (render(), changed());
              }),
          },
          'Make a checkpoint',
        ),
      );
      return;
    }
    const diff = diffDisks(new Map(Object.entries(cp.files)), new Map(project.files.entries()));
    const n = diff.changed.length + diff.added.length + diff.removed.length;
    el.replaceChildren(
      h('h3', null, 'Checkpoint'),
      h(
        'p',
        { role: 'status' },
        `“${cp.name}”, made ${when(cp.made)}. ${n ? `Since then: ${formatDiff(diff).split('\n')[0]}.` : 'Nothing has changed since.'}`,
      ),
      h(
        'div',
        { class: 'disk-checkpoint-buttons' },
        h('button', { type: 'button', onclick: () => void compare() }, 'Compare…'),
        h('button', { type: 'button', disabled: !n, onclick: () => void restore().then(render) }, 'Restore'),
        h(
          'button',
          {
            type: 'button',
            onclick: () =>
              void confirmDialog('Discard the checkpoint', 'Keep the game as it is now and delete the stamp?', 'Discard')
                .then(async (ok) => {
                  if (!ok) return;
                  await discardCheckpoint(project.id);
                  cp = undefined;
                  render();
                })
                .catch((e: Error) => toast(e.message, 'error')),
          },
          'Discard',
        ),
      ),
    );
  };

  void getCheckpoint(project.id).then(
    (c) => {
      cp = c;
      render();
    },
    () => render(),
  );
  render();
  return {
    el,
    async ensure(name) {
      if (cp) return true;
      const ok = await stamp(name);
      if (ok) render();
      return ok;
    },
  };
}
