// Credits, "The Bard of Bizarre": one row per game, one column per tool or source, ✓ where it
// made part of that game (bardCredits.ts, checked against each game's credits by its test).
// A real table with a caption and headers; on a phone each row becomes a card (credits.css).
import { h } from '../editor/core/ui';
import { section, banner, ext, more } from './section';
import { NOTICE_URL } from '../edition';
import { BARD_COLUMNS, BARD_GAMES } from './bardCredits';

const cell = (yes: boolean, label: string) =>
  h(
    'td',
    { class: yes ? 'yes' : 'no', 'data-label': label },
    h('span', { 'aria-hidden': 'true' }, yes ? '✓' : '—'),
    h('span', { class: 'sr-only' }, yes ? 'yes' : 'no'),
  );

export function bardSection(): HTMLElement {
  return section(
    'credits-bard-table',
    'The Bard of Bizarre: who made what',
    'Every Bard game has many hands in it. Here is which tool or person made which part of each one.',
    h(
      'div',
      { class: 'credits-lead-row' },
      banner(
        'bard.webp',
        'The Bard of Bizarre logo, a rooster in spectacles, on a stage between red curtains, with a photo of Doc Leo and a lute',
        'The Bard of Bizarre’s intro, before each of his games',
      ),
      h(
        'p',
        null,
        'Each row is a game and each column a tool or source, as the game’s own credits screen and LICENSE.TXT say. Claude Opus 5.5 built every game (code, levels and sprites), directed by Lewis. The headers stay at the top of the window as you scroll the table; on a phone each game is a card.',
      ),
    ),
    h(
      'div',
      { class: 'bard-wrap' },
      h(
        'table',
        { class: 'credits-table bard-table' },
        h('caption', null, 'What each tool made in The Bard of Bizarre’s games (✓ yes, — no)'),
        h(
          'thead',
          null,
          h('tr', null, h('th', { scope: 'col' }, 'Game'), ...BARD_COLUMNS.map((c) => h('th', { scope: 'col', title: c.long }, h('span', null, c.short)))),
        ),
        h(
          'tbody',
          null,
          ...BARD_GAMES.map((g) =>
            h(
              'tr',
              null,
              h('th', { scope: 'row' }, h('a', { href: `#/game/cd:${g.id}` }, g.title)),
              ...BARD_COLUMNS.map((c) => cell(g.made.includes(c.key), c.short)),
            ),
          ),
        ),
      ),
    ),
    h(
      'p',
      { class: 'credits-callout' },
      'Every recording was made on Riffusion’s free plan, whose terms allow only “personal, non-commercial uses”, so the voice clips cut from them are not under the MIT License and are never sold. The rest of each game (code, levels, art, text and FM music) is MIT. Each game’s LICENSE.TXT names its clips, and ',
      ext(NOTICE_URL, 'NOTICE.md'),
      ' lists them all. The animated covers were made on a paid plan.',
    ),
    more(
      `What each column means, and notes on ${BARD_GAMES.filter((g) => g.note).length} games and on the names`,
      h('h3', { id: 'credits-bard-key' }, 'What the columns mean'),
      h('dl', { class: 'bard-key' }, ...BARD_COLUMNS.flatMap((c) => [h('dt', null, c.short), h('dd', null, c.long)])),
      h('h3', { id: 'credits-bard-notes' }, 'Notes'),
      h(
        'ul',
        { class: 'credits-list' },
        ...BARD_GAMES.filter((g) => g.note).map((g) => h('li', null, h('b', null, g.title), ': ', g.note)),
        h(
          'li',
          null,
          'Riffusion is one service under three names: it renamed itself Producer.ai, then Google bought it and it became Google Flow Music. The Riffusion columns count all three; each game’s credits use the name it had when its part was made.',
        ),
        h('li', null, 'Whisper’s word timings come from the clip tools in each game’s tools folder; they run on the developer’s computer.'),
      ),
    ),
  );
}
