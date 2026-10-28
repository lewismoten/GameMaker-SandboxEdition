// "Make a walkthrough" on the home page's panel, for any game with a .gam: one of yours, an
// imported one, or a CD game (gameware, shareware, the Bard's, Sandbox) open to look at only.
// It opens the editor's Make a walkthrough (widgets/walkDialog.ts) over the home page with the
// game loaded, so nobody need go into the Integrator. A game of yours keeps the walkthrough in
// its companion file; a CD game is loaded as Look inside loads it (refusing every change, its
// files never touched) and keeps its walkthrough and plays in this browser apart from the game
// (check/walk/keptWalk.ts). Once one is made, "Walkthrough" (or "Your walkthrough", beside a
// Sandbox game's own) watches it and saves it as an MP4.
import { h, toast } from '../core/ui';
import { Project } from '../core/project';
import { makeReadOnly } from '../core/readOnly';
import { GameFiles } from '../../project/files';
import { loadProject } from '../../project/storage';
import { getSection } from '../../project/companion';
import { keepLookOnly, keptFor, WALK_SECTION, type SavedWalk } from '../check/walk/keptWalk';
import type { WalkDialogOptions } from '../widgets/walkDialog';
import type { HomeGame } from './homeCards';
import { icon } from './homeIcons';
import { lookId } from './lookId';

interface Loaded {
  project: Project;
  opt: WalkDialogOptions;
}

/** The game as a project to walk: yours from this browser, a CD game look-only. */
async function load(game: HomeGame): Promise<Loaded | undefined> {
  if (game.project) {
    const stored = await loadProject(game.project.id);
    if (!stored) return undefined;
    const project = Project.fromFiles(stored.files, stored.record.name, game.project.id, stored.record.companion);
    project.gam = stored.record.gam;
    return { project, opt: { home: true } };
  }
  const e = game.entry;
  if (!e?.gam) return undefined;
  const [files, { catalogCompanion }] = await Promise.all([game.files(), import('../../dosPlayer/catalogPatches')]);
  const project = Project.fromFiles(new GameFiles(files.entries().map(([n, b]) => [n, b.slice()])), e.title, lookId(e.id), catalogCompanion(e, e.gam));
  project.gam = e.gam;
  makeReadOnly(project, { title: e.title, attempted: (what) => toast(`${e.title} is open to look at only: ${what} was not changed.`) });
  const kept = keepLookOnly(project, e);
  return { project, opt: { home: true, entry: e, keeps: kept.keeps } };
}

/** The walkthrough the bot made of it, if one is kept. */
function madeWalk(game: HomeGame): SavedWalk | undefined {
  if (game.project) {
    const c = game.project.companion;
    return c ? getSection<SavedWalk | undefined>(c, game.project.gam, WALK_SECTION, undefined) : undefined;
  }
  return game.entry ? (keptFor(game.entry)?.[WALK_SECTION] as SavedWalk | undefined) : undefined;
}

/** A button that loads the game first, saying so meanwhile. */
function loadingButton(label: string, ico: Parameters<typeof icon>[0], o: { title: string; aria: string }, run: () => Promise<void>): HTMLButtonElement {
  const text = h('span', null, label);
  const b = h(
    'button',
    {
      type: 'button',
      class: 'with-ico',
      title: o.title,
      'aria-label': o.aria,
      onclick: async () => {
        if (b.getAttribute('aria-busy') === 'true') return;
        b.setAttribute('aria-busy', 'true');
        text.textContent = 'Loading…';
        try {
          await run();
        } catch (err) {
          toast(`Could not open it: ${(err as Error).message}`, 'error');
        } finally {
          b.removeAttribute('aria-busy');
          text.textContent = label;
        }
      },
    },
    icon(ico),
    text,
  );
  return b;
}

/** "Make a walkthrough", and "Walkthrough" once one is made: for the home page's panel (none for a game with no .gam). */
export function walkButtons(game: HomeGame): HTMLElement[] {
  if (!game.gam || (!game.project && !game.entry?.gam)) return [];
  const label = game.entry?.walkthrough ? 'Your walkthrough' : 'Walkthrough';
  let made = madeWalk(game);
  const watchBtn = loadingButton(
    label,
    'route',
    { title: 'Watch the walkthrough the bot made, as far as it got, or save it as an MP4', aria: `Watch the walkthrough you made of ${game.title}` },
    async () => {
      const l = await load(game);
      const walk = l && l.project.extras<SavedWalk | undefined>(l.project.gam, WALK_SECTION, undefined)?.walk;
      if (!l || !walk?.timeline.frames) return void toast(`${game.title} has no walkthrough yet.`);
      const { watchMade } = await import('../widgets/walkDialog');
      await watchMade(l.project, walk, l.opt.entry);
    },
  );
  const showWatch = () => (watchBtn.hidden = !made?.walk?.timeline.frames);
  showWatch();
  const makeBtn = loadingButton(
    'Make a walkthrough',
    'bot',
    {
      title: 'Let the walkthrough bot play it scene by scene, play scenes yourself, then watch it or save it as an MP4',
      aria: `Make a walkthrough of ${game.title} with the bot`,
    },
    async () => {
      const l = await load(game);
      if (!l) return void toast(`${game.title} could not be loaded.`);
      const { walkDialog } = await import('../widgets/walkDialog');
      const changed = () => {
        made = l.project.extras<SavedWalk | undefined>(l.project.gam, WALK_SECTION, undefined);
        // the panel's summary of a game of yours is read again next time the page lists it
        if (game.project && l.project.companion) game.project.companion = l.project.companion;
        showWatch();
      };
      let touched = false;
      const off = l.project.onExtrasChange(() => (touched = true));
      await walkDialog(l.project, { ...l.opt, onChange: changed });
      off();
      changed();
      // a game of yours: what the dialog kept (its walkthrough, your plays, heat maps) is saved now, not in a moment
      if (touched && !l.project.readOnly) await l.project.saveNow();
    },
  );
  return [makeBtn, watchBtn];
}
