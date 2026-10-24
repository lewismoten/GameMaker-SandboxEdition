// "Find more Game-Maker games": other sites that keep the games Game-Maker players made, from
// Lewis's researched list (.for-lewis/more-games-sources.md). Shown on the Credits page and in
// the Guide, which builds its HTML from the same list.
import { h } from '../editor/core/ui';
import { section, ext } from './section';

export const MORE_GAMES_TITLE = 'Find more Game-Maker games';
export const MORE_GAMES_INTRO = 'Game-Maker players made hundreds of games. These sites keep them.';
export const MORE_GAMES_NOTE = 'These are other sites; their games belong to their authors. They are not hosted here.';

/** Each site: its name, link and what it has. */
export const MORE_GAMES: [name: string, href: string, what: string][] = [
  [
    'Internet Archive: Game-Maker Archive featured games',
    'https://archive.org/search?query=subject%3A%22Game-Maker+Archive+featured+games%22',
    '59 hand-picked Game-Maker games you can play in your browser.',
  ],
  [
    'Internet Archive: every Game-Maker game',
    'https://archive.org/search?query=subject%3A%22Game-Maker+games%22',
    '274 fan-made games from the 1990s on, most playable in the browser.',
  ],
  [
    'The Game-Maker Archive wiki (archived copy)',
    'https://web.archive.org/web/2026/https://aderack.com/game-maker/index.php?title=List_of_Game-Maker_games',
    'A sortable list of about 270 games by year, author and genre.',
  ],
  ['MobyGames', 'https://www.mobygames.com/group/10554/game-engine-rsd-game-maker/', 'Catalog entries for the best-known releases.'],
  [
    'Mazeguy (Mike Perrucci)',
    'https://www.mazeguy.net/blobs1.html',
    'His own Game-Maker games, Invasion of the Blobs I and II and Wordlock, with free downloads.',
  ],
  [
    'Glorious Trainwrecks: Game-Maker Source Release Jam (2014)',
    'https://www.glorioustrainwrecks.com/node/7454',
    'Four new games made when the source was opened.',
  ],
  ['DOS Games Archive', 'https://www.dosgamesarchive.com/related-games/game-maker', 'Freeware and shareware downloads, including Jet Pack Rat (2020).'],
];

/** The list as HTML, for the Guide. */
export const moreGamesHtml = (): string =>
  `<p>${MORE_GAMES_INTRO}</p>
    <ul>${MORE_GAMES.map(([name, href, what]) => `<li><a href="${href}" target="_blank" rel="noopener">${name}</a>: ${what}</li>`).join('')}</ul>
    <p>${MORE_GAMES_NOTE}</p>`;

export function moreGamesSection(): HTMLElement {
  return section(
    'credits-more-games',
    MORE_GAMES_TITLE,
    MORE_GAMES_INTRO,
    h('ul', { class: 'credits-more-games' }, ...MORE_GAMES.map(([name, href, what]) => h('li', null, ext(href, name), `: ${what}`))),
    h('p', null, MORE_GAMES_NOTE),
  );
}
