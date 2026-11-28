// "Damaged copies…" on My games: the saves kept whole when the editor opened a damaged game
// (project/damagedCopies.ts). They are not games in the list; here each can become one again
// (Keep as a game) or go to Recently deleted (Delete), one by one or all at once.
import { confirmDialog, h, modal, toast } from '../core/ui';
import { deleteProject, listDamagedCopies, listProjects, restoreDamagedCopy } from '../../project/storage';
import { originalOf } from '../../project/damagedCopies';
import { shelve } from './deletedShelf';

/** Sends a kept copy to Recently deleted; it is only deleted once the shelf holds it, and throws otherwise. */
async function letGo(copyId: string): Promise<void> {
  if (!(await shelve(copyId))) throw new Error('The copy could not be put in Recently deleted.');
  await deleteProject(copyId);
}

/** Shows the kept copies; `refresh` redraws the home page's lists after one changes. */
export async function showDamagedCopies(refresh: () => unknown): Promise<void> {
  await modal<void>('Damaged copies', (close) => {
    const body = h('div', { class: 'rd-list dc-list' });
    const info = h('p', { 'aria-live': 'polite' });
    const all = h('button', { type: 'button', class: 'danger' }, 'Delete all');
    const draw = async () => {
      const [copies, games] = await Promise.all([listDamagedCopies(), listProjects()]);
      info.textContent = copies.length
        ? 'When a game opened with a damaged part, its save was kept here as it was. Keep one as a game to look inside it, or delete it (it stays in Recently deleted for 7 days).'
        : 'There are no damaged copies.';
      all.disabled = !copies.length;
      body.replaceChildren(
        ...copies.map((c) => {
          const from = games.find((g) => g.id === originalOf(c.id));
          let pending = false;
          const act = (label: string, aria: string, run: () => Promise<string>) =>
            h(
              'button',
              {
                type: 'button',
                'aria-label': aria,
                onclick: async () => {
                  if (pending) return;
                  pending = true;
                  try {
                    toast(await run().catch(() => 'That did not work. The copy is still here.'));
                    await refresh();
                    await draw();
                  } finally {
                    pending = false;
                  }
                },
              },
              label,
            );
          return h(
            'div',
            { class: 'rd-item' },
            h(
              'div',
              { class: 'rd-what' },
              h('strong', null, c.name),
              h('small', null, `Saved ${new Date(c.updated).toLocaleDateString()} · ${from ? `from “${from.name}”` : 'its game is no longer here'}`),
            ),
            h(
              'div',
              { class: 'dc-acts' },
              act('Keep as a game', `Keep as a game: ${c.name}`, async () =>
                (await restoreDamagedCopy(c.id)) ? `“${c.name}” is now under My games.` : 'That copy is gone.',
              ),
              act('Delete', `Delete ${c.name}`, async () => (await letGo(c.id), `Deleted “${c.name}”.`)),
            ),
          );
        }),
      );
    };
    all.onclick = async () => {
      if (!(await confirmDialog('Delete all damaged copies', 'They go to Recently deleted, where each stays for 7 days.', 'Delete all'))) return;
      let kept = 0;
      for (const c of await listDamagedCopies()) await letGo(c.id).catch(() => kept++);
      toast(
        kept
          ? `${kept === 1 ? 'One copy' : `${kept} copies`} could not be deleted and ${kept === 1 ? 'is' : 'are'} still here.`
          : 'Deleted the damaged copies.',
      );
      await refresh();
      await draw();
    };
    void draw();
    return [
      info,
      body,
      h('div', { class: 'buttons' }, all, h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => close(undefined) }, 'Close')),
    ];
  });
}
