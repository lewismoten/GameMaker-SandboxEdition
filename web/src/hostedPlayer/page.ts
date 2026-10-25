// The web player's front page: the games in games.json as links (?game=<id>), or, with no
// list, how to set one up and a box to type a folder; then the saves kept in this browser,
// with export and import; then what the player is and who made it.
import { download, h, pickFiles } from '../editor/core/ui';
import { PRODUCT } from '../edition';
import { REPO_URL, SITE_URL } from '../seo/site';
import { exportSaveZip, importSaveZip, saveZipName } from './bundle';
import type { GameList } from './list';
import { allSaves, deleteSaves, loadSaves, mergeSaves, saveSummaries, savesPersist } from './saves';

/** The example list the how-to shows (docs/web-player.md has the same). */
const EXAMPLE_LIST = `{
  "title": "My old games",
  "games": [
    { "title": "Nebula Patrol", "folder": "nebula/", "gam": "NEBULA.GAM" },
    { "title": "Castle Quest", "folder": "castle/" }
  ]
}`;

/** This page's address with ?game= (keeping ?list=). */
function gameHref(id: string, listParam: string | null): string {
  const q = new URLSearchParams();
  if (listParam) q.set('list', listParam);
  q.set('game', id);
  return `?${q.toString()}`;
}

/** This page's address without ?game=: the list. */
export function listHref(listParam: string | null): string {
  return listParam ? `?${new URLSearchParams({ list: listParam }).toString()}` : '?';
}

const NOT_DOS =
  'Game-Maker’s PLAYGAME player is re-implemented here in the browser, from its released C source; no DOS or x86 code runs. A game that relies on how real DOS or a real PC behaves may act differently here. To run the original programs, use DOSBox.';

function gameCards(list: GameList, listParam: string | null, saved: Set<string>): HTMLElement {
  if (!list.games.length) return h('p', null, 'The game list has no games in it yet.');
  return h(
    'ul',
    { class: 'wp-games' },
    ...list.games.map((g) => {
      const meta = [g.author, g.year].filter(Boolean).join(', ');
      return h(
        'li',
        null,
        h(
          'a',
          { class: 'wp-game', href: gameHref(g.id, listParam) },
          h(
            'span',
            { class: 'wp-game-title' },
            g.title,
            saved.has(g.id) ? h('span', { class: 'wp-saved', title: 'Has saves or high scores in this browser' }, 'saved') : null,
          ),
          meta ? h('span', { class: 'wp-game-meta' }, meta) : null,
          g.about ? h('span', { class: 'wp-game-about' }, g.about) : null,
        ),
      );
    }),
  );
}

function howTo(listParam: string | null): HTMLElement[] {
  const input = h('input', { type: 'text', id: 'wp-folder', name: 'game', autocomplete: 'off', spellcheck: false, placeholder: 'nebula' });
  return [
    h('h2', { id: 'wp-how' }, 'Set up your games'),
    h(
      'ol',
      null,
      h('li', null, 'Put this page on a web host, in the folder that holds your Game-Maker game folders (each with its .GAM file and the files it uses).'),
      h('li', null, 'Beside it, save a ', h('code', null, 'games.json'), ' that lists the folders, like this:'),
    ),
    h('pre', { tabindex: 0, 'aria-label': 'Example games.json' }, h('code', null, EXAMPLE_LIST)),
    h(
      'p',
      null,
      'Only ',
      h('code', null, '"folder"'),
      ' is needed. ',
      h('code', null, '"gam"'),
      ' names the game file when it is not named after the folder; ',
      h('code', null, '"id"'),
      ' is what ',
      h('code', null, '?game='),
      ' calls it (the folder’s name otherwise); ',
      h('code', null, '"files"'),
      ', ',
      h('code', null, '"author"'),
      ', ',
      h('code', null, '"year"'),
      ' and ',
      h('code', null, '"about"'),
      ' are optional too. Link to ',
      h('code', null, 'player.html?game=nebula'),
      ' to start a game at once, and use ',
      h('code', null, '?list=other.json'),
      ' for another list.',
    ),
    h(
      'form',
      {
        class: 'wp-row',
        onsubmit: (e: Event) => {
          e.preventDefault();
          const v = input.value.trim();
          if (v) location.search = gameHref(v, listParam);
        },
      },
      h('label', { for: 'wp-folder' }, 'Or play a folder'),
      input,
      h('button', { type: 'submit', class: 'wp-primary' }, 'Play'),
    ),
  ];
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

/** The saves panel; `titles` names the games the list knows. */
function savesSection(titles: Map<string, string>, onChange: () => void): HTMLElement {
  const status = h('p', { class: 'wp-status wp-meta', role: 'status' });
  const listEl = h('ul', { class: 'wp-saves', 'aria-label': 'Games with saves' });
  const note = h('p', { class: 'wp-meta' });
  const say = (text: string) => (status.textContent = text);
  const exportAll = h('button', { type: 'button' }, 'Export all (.zip)');
  const refresh = async () => {
    const rows = await saveSummaries();
    note.textContent = (await savesPersist())
      ? 'High scores and saved games are kept in this browser, for this site. Export them to keep a copy or move them to another browser.'
      : 'This browser is not letting the page store anything, so saves last only until the page closes. Export them before you leave.';
    exportAll.disabled = !rows.length;
    listEl.replaceChildren(
      ...(rows.length
        ? rows.map((r) => {
            const title = titles.get(r.id) ?? r.id;
            return h(
              'li',
              null,
              h(
                'span',
                null,
                h('span', { class: 'wp-save-name' }, title),
                ' ',
                h('span', { class: 'wp-meta' }, `${plural(r.names.length, 'file')}: ${r.names.join(', ').toUpperCase()}`),
              ),
              h(
                'span',
                { class: 'wp-row' },
                h(
                  'button',
                  {
                    type: 'button',
                    'aria-label': `Export the saves of ${title}`,
                    onclick: async () => {
                      download(saveZipName(r.id), await exportSaveZip({ [r.id]: await loadSaves(r.id) }), 'application/zip');
                      say(`Exported the saves of ${title}.`);
                    },
                  },
                  'Export',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'wp-danger',
                    'aria-label': `Delete the saves of ${title}`,
                    onclick: async () => {
                      if (!confirm(`Delete every saved game and high score of ${title} in this browser?`)) return;
                      await deleteSaves(r.id);
                      say(`Deleted the saves of ${title}.`);
                      await refresh();
                      onChange();
                    },
                  },
                  'Delete',
                ),
              ),
            );
          })
        : [h('li', null, h('span', { class: 'wp-meta' }, 'No saves yet. Play a game: its high scores and saved games appear here.'))]),
    );
  };
  exportAll.addEventListener('click', () => {
    void (async () => {
      download(saveZipName(), await exportSaveZip(await allSaves()), 'application/zip');
      say('Exported every game’s saves.');
    })();
  });
  const importBtn = h(
    'button',
    {
      type: 'button',
      onclick: async () => {
        const [file] = await pickFiles({ multiple: false, accept: '.zip,application/zip' });
        if (!file) return;
        try {
          const saves = await importSaveZip(new Uint8Array(await file.arrayBuffer()));
          const ids = Object.keys(saves);
          if (!ids.length) {
            say(`${file.name} holds no saves (it needs a folder per game, as Export makes).`);
            return;
          }
          for (const id of ids) await mergeSaves(id, saves[id]);
          say(`Imported the saves of ${ids.map((id) => titles.get(id) ?? id).join(', ')}.`);
          await refresh();
          onChange();
        } catch (e) {
          say(`${file.name} could not be read: ${(e as Error).message}`);
        }
      },
    },
    'Import (.zip)…',
  );
  void refresh();
  return h(
    'section',
    { 'aria-labelledby': 'wp-saves-h' },
    h('h2', { id: 'wp-saves-h' }, 'Saves and high scores'),
    note,
    listEl,
    h('div', { class: 'wp-row' }, exportAll, importBtn),
    status,
  );
}

function about(): HTMLElement {
  return h(
    'footer',
    null,
    h(
      'details',
      null,
      h('summary', null, 'About this player'),
      h('p', null, h('strong', null, 'This is not a real DOS PC. '), NOT_DOS),
      h(
        'p',
        null,
        `The web player of ${PRODUCT}, a fork of RSD Game-Maker 3.0 (Game-Maker 3.0 by Recreational Software Designs, 1991–1995). MIT License. The games are their makers’; this page only plays the files beside it.`,
      ),
    ),
    h(
      'p',
      null,
      h('a', { href: SITE_URL, target: '_blank', rel: 'noopener' }, `Made with ${PRODUCT}`),
      ' · ',
      // the page is the whole player, so it downloads itself
      h('a', { href: location.href.replace(/[?#].*$/, ''), download: 'player.html' }, 'Download this player'),
      ' · ',
      h('a', { href: `${REPO_URL}/blob/master/docs/web-player.md`, target: '_blank', rel: 'noopener' }, 'How to host it'),
      ' · ',
      h('a', { href: REPO_URL, target: '_blank', rel: 'noopener' }, 'Source'),
    ),
  );
}

/** Draws the front page into `root`. `problem` is shown at the top (a list that would not load, a game not found). */
export function renderFront(root: HTMLElement, list: GameList | undefined, listParam: string | null, problem?: string): void {
  document.body.className = 'wp-body';
  document.title = list?.title ?? 'Game-Maker web player';
  const titles = new Map((list?.games ?? []).map((g) => [g.id, g.title]));
  const gamesSlot = h('div');
  const drawGames = async () => {
    if (!list) return;
    const saved = new Set((await saveSummaries()).map((s) => s.id));
    gamesSlot.replaceChildren(gameCards(list, listParam, saved));
  };
  void drawGames();
  root.replaceChildren(
    h(
      'main',
      { class: 'wp' },
      h('h1', null, list?.title ?? 'Game-Maker web player'),
      h('p', { class: 'wp-lead' }, 'Games made with Game-Maker for DOS, played in the browser.'),
      problem ? h('p', { class: 'wp-error', role: 'alert' }, problem) : null,
      list ? h('section', { 'aria-labelledby': 'wp-games-h' }, h('h2', { id: 'wp-games-h' }, 'Games'), gamesSlot) : null,
      ...(list ? [] : howTo(listParam)),
      savesSection(titles, () => void drawGames()),
      list ? h('details', null, h('summary', null, 'Set up your own games'), ...howTo(listParam)) : null,
      about(),
    ),
  );
}
