// Removing imported games together: all of them (the Imported list's "Remove all imported…"),
// those of some ratings (ticked in the same dialog: all the 1-star and unrated ones), or the
// ones one import brought in (its summary's button). Asks first, saying how many and how much
// room, with Cancel the default, then deletes each as the home page's Delete does, with
// progress and Cancel. Each leaves a record of its fingerprint, rating and note (imported/).
import { h, modal, toast } from '../core/ui';
import { deleteProject, listProjects, loadProject } from '../../project/storage';
import { forgetOrigin, isImported, setImported } from './homeOrigin';
import { forgetBatch, importedToRemove } from './importBatch';
import { working } from './importChooser';
import { forgetUsed } from '../../project/projectUse';
import { fingerprintOfFiles, type Fingerprint } from '../../imported/fingerprint';
import { allNotes, ratingOf, type Rating } from '../../imported/gameNotes';
import { noteRemoval } from '../../imported/noteMoves';
import { groupByRating, ratingName, starsText, withRatings } from '../../imported/ratings';
import '../../imported/imported.css';

/** "3.4 MB" */
function bytesText(n: number): string {
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const gamesText = (n: number) => `${n} ${n === 1 ? 'game' : 'games'}`;

type Target = Awaited<ReturnType<typeof listProjects>>[number];

/** Asks, then removes the imported games (of import `batch` only, when given); `refresh` redraws the list after. */
export async function removeImported(refresh: () => unknown, batch?: string): Promise<void> {
  const targets = importedToRemove(await listProjects().catch(() => []), isImported, batch);
  if (!targets.length) return toast('There are no imported games to remove.');
  const sizes = new Map<string, number>();
  // a game imported before fingerprints were kept is known by its .gam files
  const prints = new Map<string, Fingerprint>();
  const notes = allNotes();
  for (const p of targets) {
    const stored = await loadProject(p.id).catch(() => undefined);
    const files = stored?.record.files ?? {};
    sizes.set(
      p.id,
      Object.values(files).reduce((sum, bytes) => sum + bytes.length, 0),
    );
    if (!notes[p.id]?.fingerprint) prints.set(p.id, fingerprintOfFiles(files));
  }
  const rating = (p: Target) => ratingOf(p.id, notes);
  const groups = groupByRating(targets, rating);
  const chosen = await modal<Target[]>(batch ? 'Remove this import’s games' : 'Remove imported games', (close) => {
    const cancel = h('button', { type: 'button', autofocus: true, onclick: () => close(undefined) }, 'Cancel');
    const go = h('button', { type: 'button', class: 'danger' });
    const line = h('p', { 'aria-live': 'polite' });
    // with some rated, the ratings to remove are ticked here (all of them at first)
    const boxes: [HTMLInputElement, Rating][] =
      !batch && groups.some((g) => g.rating) ? groups.map((g) => [h('input', { type: 'checkbox', checked: true, onchange: () => tell() }), g.rating]) : [];
    const picked = () =>
      boxes.length
        ? withRatings(
            targets,
            rating,
            boxes.filter(([b]) => b.checked).map(([, r]) => r),
          )
        : targets;
    const tell = () => {
      const now = picked();
      const n = now.length;
      const size = now.reduce((sum, p) => sum + (sizes.get(p.id) ?? 0), 0);
      const all = n === targets.length;
      line.textContent = batch
        ? `Remove the ${gamesText(n)} this import brought in (${bytesText(size)}) from this browser? Games made here, and any you moved to My games, are kept. This can’t be undone.`
        : `Remove ${all ? 'all ' : ''}${gamesText(n)} ${all ? 'listed under Imported' : 'of those ratings'} (${bytesText(size)}) from this browser? Games made here, and any you moved to My games, are kept. Their ratings and notes stay in the Library. This can’t be undone.`;
      go.textContent = `Remove ${gamesText(n)}`;
      go.disabled = !n;
      go.onclick = () => close(now);
    };
    tell();
    return [
      boxes.length
        ? h(
            'fieldset',
            { class: 'ir-ratings' },
            h('legend', null, 'Which ratings'),
            ...boxes.map(([box, r]) =>
              h(
                'label',
                { class: 'ir-rating' },
                box,
                r ? h('span', { class: 'ir-stars', 'aria-hidden': 'true' }, starsText(r)) : null,
                h('span', { class: r ? 'sr-only' : undefined }, ratingName(r)),
                ` (${groups.find((g) => g.rating === r)!.items.length})`,
              ),
            ),
          )
        : null,
      line,
      h('div', { class: 'buttons' }, cancel, go),
    ];
  });
  if (!chosen?.length) return;
  const n = chosen.length;
  let done = 0;
  let job: Promise<void> | undefined;
  await working(
    'Removing games',
    `Removing ${gamesText(n)}…`,
    (signal, tell) =>
      (job = (async () => {
        for (const [i, p] of chosen.entries()) {
          if (signal.aborted) return;
          tell(i, n, `Game ${i + 1} of ${n}: ${p.name}`);
          await deleteProject(p.id);
          forgetOrigin(p.id);
          setImported(p.id, false);
          forgetBatch([p.id]);
          forgetUsed(p.id);
          noteRemoval(p, undefined, prints.get(p.id));
          done++;
        }
      })()),
  );
  // Cancel closes the dialog at once; the game being removed then is finished first
  await job;
  await refresh();
  toast(done === n ? `Removed ${gamesText(n)}.` : `Canceled: removed ${done} of ${gamesText(n)}.`);
}
