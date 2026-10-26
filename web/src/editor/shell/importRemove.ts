// Removing imported games together: all of them (the Imported list's "Remove all imported…"),
// or the ones one import brought in (its summary's button). Asks first, saying how many and
// how much room, then deletes each as the home page's Delete does, with progress and Cancel.
import { h, modal, toast } from '../core/ui';
import { deleteProject, listProjects, loadProject } from '../../project/storage';
import { forgetOrigin, isImported, setImported } from './homeOrigin';
import { forgetBatch, importedToRemove } from './importBatch';
import { working } from './importChooser';

/** "3.4 MB" */
function bytesText(n: number): string {
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const gamesText = (n: number) => `${n} ${n === 1 ? 'game' : 'games'}`;

/** Asks, then removes the imported games (of import `batch` only, when given); `refresh` redraws the list after. */
export async function removeImported(refresh: () => unknown, batch?: string): Promise<void> {
  const targets = importedToRemove(await listProjects().catch(() => []), isImported, batch);
  if (!targets.length) return toast('There are no imported games to remove.');
  let size = 0;
  for (const p of targets) {
    const stored = await loadProject(p.id).catch(() => undefined);
    for (const bytes of Object.values(stored?.record.files ?? {})) size += bytes.length;
  }
  const n = targets.length;
  const sure = await modal<boolean>(batch ? 'Remove this import’s games' : 'Remove all imported games', (close) => {
    const cancel = h('button', { type: 'button', autofocus: true, onclick: () => close(false) }, 'Cancel');
    return [
      h(
        'p',
        null,
        `Remove ${batch ? 'the' : 'all'} ${gamesText(n)} ${batch ? 'this import brought in' : 'listed under Imported'} (${bytesText(size)}) from this browser? Games made here, and any you moved to My games, are kept. This can’t be undone.`,
      ),
      h('div', { class: 'buttons' }, cancel, h('button', { type: 'button', class: 'danger', onclick: () => close(true) }, `Remove ${gamesText(n)}`)),
    ];
  });
  if (!sure) return;
  let done = 0;
  let job: Promise<void> | undefined;
  await working(
    'Removing games',
    `Removing ${gamesText(n)}…`,
    (signal, tell) =>
      (job = (async () => {
        for (const [i, p] of targets.entries()) {
          if (signal.aborted) return;
          tell(i, n, `Game ${i + 1} of ${n}: ${p.name}`);
          await deleteProject(p.id);
          forgetOrigin(p.id);
          setImported(p.id, false);
          forgetBatch([p.id]);
          done++;
        }
      })()),
  );
  // Cancel closes the dialog at once; the game being removed then is finished first
  await job;
  await refresh();
  toast(done === n ? `Removed ${gamesText(n)}.` : `Canceled: removed ${done} of ${gamesText(n)}.`);
}
