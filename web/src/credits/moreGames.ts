// "Find more Game-Maker games": other sites that keep the games Game-Maker players made, from
// Lewis's researched list (moreGamesList.ts), as the Credits page shows it. The Guide builds its
// HTML from the same list.
import { h } from '../editor/core/ui';
import { section, ext } from './section';
import { MORE_GAMES, MORE_GAMES_INTRO, MORE_GAMES_NOTE, MORE_GAMES_TITLE } from './moreGamesList';

export function moreGamesSection(): HTMLElement {
  return section(
    'credits-more-games',
    MORE_GAMES_TITLE,
    MORE_GAMES_INTRO,
    h('ul', { class: 'credits-more-games' }, ...MORE_GAMES.map(([name, href, what]) => h('li', null, ext(href, name), `: ${what}`))),
    h('p', null, MORE_GAMES_NOTE),
  );
}
