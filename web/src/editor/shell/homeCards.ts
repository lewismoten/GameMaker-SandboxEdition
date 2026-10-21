// The cards on the home page: your projects, the CD's sample games, our own games and the
// shareware, each with its picture (the first level, drawn when the card scrolls into view),
// play, keys, demo and manual buttons, and a small menu of less-used actions.
import { h, toast, promptText, confirmDialog, modal } from '../core/ui';
import { Project } from '../core/project';
import { renderShot } from '../../desk/boxes/boxArt';
import { openGameManual } from '../../manual/gameManual';
import { GameFiles, creditLine, loadHostedGame, type CatalogEntry } from '../../project/files';
import { deleteProject, listProjects, loadProject } from '../../project/storage';
import { ADVTYPE, NOSCENE, parseGame } from '../../formats/game';
import { levelShot } from '../editors/integrator/integratorArt';
import { catalogTarget, healthBadge, projectTarget } from './gameHealth';
import { showKeyMap } from '../keymap/keyMapView';
import { demoButton } from '../../media/demo';
import type { HomeNav } from './home';
import { downloadProject, exportProject, exportProjectPage, exportProjectForDos } from './projectExport';

/** “⌨ Keys”: a keyboard map of what each key does in the game, worked out from its files. */
function keysButton(title: string, files: () => Promise<GameFiles>, gam?: string | null): HTMLElement {
  return h('button', { title: 'What each key does in this game', onclick: () => void showKeyMap(files(), gam ?? undefined, title) }, '⌨ Keys');
}
/** Draws a game's first level into a card's picture when the card scrolls into view. */
export const shotObserver = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    shotObserver.unobserve(e.target);
    const el = e.target as HTMLCanvasElement & { game?: CatalogEntry; draw?: () => Promise<unknown> };
    if (el.draw) void el.draw().catch(() => undefined);
    else if (el.game) void renderShot(el.game, el, el.width / 20, el.height / 20).catch(() => undefined);
  }
});

function cardShot(g: CatalogEntry): HTMLCanvasElement {
  const c = h('canvas', { class: 'card-shot pixel', width: 160, height: 100 }) as HTMLCanvasElement & { game?: CatalogEntry };
  c.game = g;
  shotObserver.observe(c);
  return c;
}

/** A project's picture: the first level its title scene leads to, where the hero arrives. */
function projectShot(id: string): HTMLCanvasElement {
  const c = h('canvas', { class: 'card-shot pixel', width: 160, height: 100 }) as HTMLCanvasElement & { draw?: () => Promise<unknown> };
  c.draw = async () => {
    const p = await loadProject(id);
    if (!p) return;
    const game = parseGame(p.files.get(p.record.gam)!);
    const link = game.scenes[0]?.links.find((l) => l.toScene !== NOSCENE && game.scenes[l.toScene]?.gametype === ADVTYPE);
    const i = link ? link.toScene : game.scenes.findIndex((s) => s.gametype === ADVTYPE);
    if (i < 0) return;
    const shot = levelShot(p.files, game.scenes[i], link?.to ?? { x: 50, y: 50 }, 8, 5);
    if (!shot) return;
    c.width = shot.width;
    c.height = shot.height;
    c.getContext('2d')!.drawImage(shot, 0, 0);
  };
  shotObserver.observe(c);
  return c;
}
/** The small menu of less-used actions on a card. */
function moreMenu(...items: (HTMLElement | null | false | undefined)[]): HTMLElement {
  const menu = h(
    'details',
    { class: 'card-more' },
    h('summary', { title: 'More', 'aria-label': 'More actions' }, '⋯'),
    h('div', { class: 'card-more-menu' }, ...items),
  );
  // Close when something else is clicked, or after choosing an item.
  const outside = (e: Event) => {
    if (!menu.contains(e.target as Node) || (e.target as HTMLElement).closest('.card-more-menu button')) menu.open = false;
  };
  menu.addEventListener('toggle', () => {
    if (menu.open) setTimeout(() => document.addEventListener('click', outside, true));
    else document.removeEventListener('click', outside, true);
  });
  return menu;
}

function searchText(...parts: (string | number | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

export function projectCard(p: Awaited<ReturnType<typeof listProjects>>[number], nav: HomeNav, refresh: () => Promise<void>): HTMLElement {
  return h(
    'div',
    { class: 'card', dataset: { search: searchText(p.name, p.gam) } },
    projectShot(p.id),
    healthBadge(projectTarget(p.id, p.name, p.updated)),
    h(
      'div',
      { class: 'card-title' },
      h('h3', null, p.name),
      moreMenu(
        keysButton(p.name, async () => (await loadProject(p.id))!.files, p.gam),
        h('button', { onclick: () => void downloadProject(p.id) }, 'Download .zip'),
        h('button', { onclick: () => void exportProject(p.id) }, 'Export web app'),
        h('button', { onclick: () => void exportProjectPage(p.id), title: 'One .html file with the game and player inside' }, 'Export as one web page'),
        h('button', { onclick: () => void exportProjectForDos(p.id) }, 'Export for DOS'),
        h(
          'button',
          {
            class: 'danger',
            onclick: async () => {
              if (await confirmDialog('Delete game', `Delete “${p.name}” from this browser? Download it first if you want to keep it.`, 'Delete')) {
                await deleteProject(p.id);
                await refresh();
              }
            },
          },
          'Delete',
        ),
      ),
    ),
    h('div', { class: 'meta' }, `${p.gam} · edited ${new Date(p.updated).toLocaleDateString()}`),
    h(
      'div',
      { class: 'actions' },
      h('button', { class: 'primary', onclick: () => nav.openProject(p.id) }, 'Open'),
      h('a', { class: 'button', href: `./play.html?project=${encodeURIComponent(p.id)}` }, '▶ Play'),
    ),
  );
}

export function sampleCard(g: CatalogEntry, nav: HomeNav): HTMLElement {
  const copy = async (name: string) => {
    toast(`Copying ${g.title}…`);
    const files = await loadHostedGame(g);
    const p = Project.fromFiles(files, name);
    if (g.gam) p.gam = g.gam;
    await p.saveNow();
    nav.openProject(p.id);
  };
  const title = g.gam ? g.title : `${g.id} (pictures, monsters and sounds)`;
  return h(
    'div',
    { class: 'card', dataset: { search: searchText(title, g.id, g.author, g.company) } },
    g.gam ? cardShot(g) : h('div', { class: 'card-shot card-shot-none', 'aria-hidden': 'true' }, '🎨'),
    g.gam ? healthBadge(catalogTarget(g)) : null,
    h(
      'div',
      { class: 'card-title' },
      h('h3', null, title),
      g.gam &&
        moreMenu(
          keysButton(g.title, () => loadHostedGame(g), g.gam),
          demoButton(g.title, () => loadHostedGame(g), g.gam),
        ),
    ),
    h('div', { class: 'meta' }, `${rsdGame(g) ? 'By Recreational Software Designs · ' : ''}${g.files.length} files`),
    h(
      'div',
      { class: 'actions' },
      g.gam && h('a', { class: 'button primary', href: `./play.html?game=${encodeURIComponent(g.id)}`, 'aria-label': `Play ${g.title}` }, '▶ Play'),
      g.gam
        ? h('button', { onclick: () => void copy(g.title), 'aria-label': `Edit a copy of ${g.title}` }, 'Edit a copy')
        : h(
            'button',
            {
              onclick: async () => {
                const name = await promptText('New game', 'Title (shown on the menu screen)', 'My Game');
                if (name) await copy(name);
              },
            },
            'Start a game with these',
          ),
    ),
  );
}

const rsdGame = (g: CatalogEntry) => ['sample', 'pipemare', 'nebula'].includes(g.id);

/** One of our own games: playable and, unlike other shareware, open to edit. */
export function originalCard(g: CatalogEntry, nav: HomeNav): HTMLElement {
  const copy = async () => {
    toast(`Copying ${g.title}…`);
    const p = Project.fromFiles(await loadHostedGame(g), g.title);
    if (g.gam) p.gam = g.gam;
    await p.saveNow();
    nav.openProject(p.id);
  };
  return h(
    'div',
    { class: 'card', dataset: { search: searchText(g.title, g.id, g.company) } },
    cardShot(g),
    healthBadge(catalogTarget(g)),
    h(
      'div',
      { class: 'card-title' },
      h('h3', null, g.title),
      moreMenu(
        keysButton(g.title, () => loadHostedGame(g), g.gam),
        demoButton(g.title, () => loadHostedGame(g), g.gam),
        g.original?.manual ? h('button', { onclick: () => void openGameManual(g) }, '📖 Manual') : null,
      ),
    ),
    h('div', { class: 'meta' }, `${g.company ?? 'Sandbox Software'} · ${g.files.length} files`),
    h(
      'div',
      { class: 'actions' },
      h('a', { class: 'button primary', href: `./play.html?game=${encodeURIComponent(g.id)}`, 'aria-label': `Play ${g.title}` }, '▶ Play'),
      h('button', { onclick: () => void copy(), 'aria-label': `Edit a copy of ${g.title}` }, 'Edit a copy'),
    ),
  );
}

export function sharewareCard(g: CatalogEntry): HTMLElement {
  return h(
    'div',
    { class: 'card', dataset: { search: searchText(g.title, g.id, g.author, g.company, g.year) } },
    cardShot(g),
    healthBadge(catalogTarget(g)),
    h(
      'div',
      { class: 'card-title' },
      h('h3', null, g.title),
      moreMenu(
        keysButton(g.title, () => loadHostedGame(g), g.gam),
        demoButton(g.title, () => loadHostedGame(g), g.gam),
      ),
    ),
    h('div', { class: 'meta' }, creditLine(g) || 'Shareware · play only'),
    h(
      'div',
      { class: 'actions' },
      h('a', { class: 'button primary', href: `./play.html?game=${encodeURIComponent(g.id)}`, 'aria-label': `Play ${g.title}` }, '▶ Play'),
      h('button', { onclick: () => void showNotice(g) }, 'Notice'),
    ),
  );
}

export function showNotice(g: CatalogEntry): Promise<unknown> {
  return modal(`${g.title}: shareware notice`, (close) => [
    h(
      'pre',
      { style: 'white-space:pre-wrap;max-height:60vh;overflow:auto;font:13px/1.4 ui-monospace,monospace' },
      g.notice || 'This game is shareware. It is copyrighted by its author.',
    ),
    h('p', { class: 'meta' }, 'These notices are from 1993–1994; the addresses and prices may no longer be current.'),
    h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(undefined) }, 'Close')),
  ]);
}
