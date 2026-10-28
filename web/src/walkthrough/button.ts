// "Walkthrough" on the home page's panel, for every game with a .gam: one of yours, an imported
// one, or a CD game (gameware, shareware, the Bard's, Sandbox) open to look at only. It opens
// one dialog (editor/widgets/walkDialog.ts) that watches the game's own walkthrough (a Sandbox
// game's) and the one you made, and makes your own with the walkthrough bot: the bot plays it
// scene by scene, you can play scenes yourself (Mine or Bot), and it is watched or saved as an
// MP4 from the player (player.ts). With nothing to watch yet it opens on the making part. The
// game is loaded only when pressed (editor/shell/homeWalkOpen.ts): a game of yours keeps the
// walkthrough in its companion file; a CD game is loaded look-only, never changed, and keeps it
// in this browser apart from its files (editor/check/walk/keptWalk.ts).
import { h, toast } from '../editor/core/ui';
import { icon } from '../editor/shell/homeIcons';
import type { HomeGame } from '../editor/shell/homeCards';

export function walkthroughButton(game: HomeGame): HTMLElement | null {
  if (!game.gam || (!game.project && !game.entry?.gam)) return null;
  const shipped = game.entry?.walkthrough ? game.entry : undefined;
  const label = h('span', null, 'Walkthrough');
  const idle = () => {
    b.removeAttribute('aria-busy');
    label.textContent = 'Walkthrough';
  };
  const open = async () => {
    const [{ load }, { walkDialog }] = await Promise.all([import('../editor/shell/homeWalkOpen'), import('../editor/widgets/walkDialog')]);
    const l = await load(game);
    if (!l) return void toast(`${game.title} could not be loaded.`);
    idle();
    let touched = false;
    const off = l.project.onExtrasChange(() => (touched = true));
    await walkDialog(l.project, { ...l.opt, shipped });
    off();
    // a game of yours: what the dialog kept (its walkthrough, your plays, heat maps) is saved now, not in a moment
    if (touched && !l.project.readOnly) {
      if (game.project && l.project.companion) game.project.companion = l.project.companion;
      await l.project.saveNow();
    }
  };
  const b = h(
    'button',
    {
      type: 'button',
      class: 'with-ico',
      title: shipped
        ? 'Watch the whole game played from start to finish, save it as an MP4, or let the bot make your own'
        : 'Watch it played by the walkthrough bot, or let the bot make one: play scenes yourself too, then save it as an MP4',
      'aria-label': `Walkthrough of ${game.title}: watch it, or make one with the bot`,
      onclick: async () => {
        if (b.getAttribute('aria-busy') === 'true') return;
        b.setAttribute('aria-busy', 'true');
        label.textContent = 'Loading…';
        try {
          await open();
        } catch (err) {
          toast(`Could not open it: ${(err as Error).message}`, 'error');
        } finally {
          idle();
        }
      },
    },
    icon('route'),
    label,
  );
  return b;
}
