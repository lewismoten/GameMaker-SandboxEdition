// Credits, "The original Game-Maker": RSD's own title screen, the Stone family, Andy Stone's
// 2014 source release and 2011 look back, every distinct RSD intro screen the CD's games show
// (rsdIntros.ts), who the source credits for each part (rsdParts.ts), and the 1992 ad whose look
// the magazine's Game-Maker ad borrows.
import { h } from '../editor/core/ui';
import { section, ext, repoFile, card, thumb, more } from './section';
import { RSD_INTROS } from './rsdIntros';
import { RSD_PARTS, RSD_SAMPLE_CREDITS } from './rsdParts';

export function originalSection(): HTMLElement {
  return section(
    'credits-original',
    'The original Game-Maker',
    'Everything here starts with RSD Game-Maker 3.0 and the family who made it.',
    h(
      'div',
      { class: 'credits-cards credits-cards-3' },
      card(
        'h3',
        'Made by',
        h(
          'p',
          null,
          'Recreational Software Designs of Amherst, New Hampshire, 1991–1995: G. Andrew (Andy) Stone with G. Oliver Stone, Oliver Stone Jr. and Joan Stone.',
        ),
        h(
          'p',
          null,
          'KD Software sold it by direct mail in the US, and RSD also made a distribution deal with GameLynk. Screen Entertainment sold it in the UK as Captain GameMaker, and Microforum repackaged the 3.0 CD-ROM for a worldwide release (',
          h('a', { href: 'https://en.wikipedia.org/wiki/Game-Maker' }, 'Wikipedia'),
          ').',
        ),
      ),
      card(
        'h3',
        'Set free',
        h(
          'p',
          null,
          'On 12 July 2014 Andy Stone published the source, the CD and an installed copy under the MIT License: ',
          ext('https://github.com/gandrewstone/GameMaker', 'gandrewstone/GameMaker'),
          '. This edition is a fork of it and keeps the license.',
        ),
      ),
      card(
        'h3',
        'In his words',
        h(
          'p',
          null,
          'In 2011 Andy Stone looked back on ',
          ext('https://effluviaofascatteredmind.blogspot.com/2011/06/rsd-gamemaker.html', 'building it as a teenager with his family'),
          '.',
        ),
      ),
    ),
    h(
      'p',
      null,
      'TURBO BUTTON’s Game-Maker ad takes its look from the full-page ad RSD and KD Software ran in ',
      ext('https://archive.org/details/Computer_Gaming_World_Issue_99/page/n53/mode/2up', 'Computer Gaming World #99 (October 1992), page 55'),
      ': the hot pink page, the big serif headlines, the screenshot grid and the order coupon. Its words and pictures are new.',
    ),
    h('h3', { id: 'credits-rsd-intros' }, 'RSD’s intro screens'),
    h('p', null, 'Not every game on the CD opens with the same RSD screen. These are all the different ones, each shown once however many games use it.'),
    h(
      'div',
      { class: 'credits-gallery' },
      ...RSD_INTROS.map((r) =>
        thumb(`./credits/${r.src}`, r.alt, [
          r.caption,
          h('br'),
          repoFile(r.file),
          h('details', { class: 'credits-mini' }, h('summary', null, `Which ${r.games.length === 1 ? 'game' : `${r.games.length} games`}`), r.games.join(', ')),
        ]),
      ),
    ),
    h('h3', { id: 'credits-parts' }, 'Who made each part'),
    h(
      'p',
      null,
      'Andy Stone wrote most of it; Oliver (Ollie) Stone the monster, character and sound designers, the GIF reader and registration; Peter Savage the Sound Blaster voice and joystick routines.',
    ),
    more(
      `The ${RSD_PARTS.length} parts, who the source credits for each, and where it says so`,
      h(
        'p',
        null,
        'As the original source credits them, in its file headers and title screens. The headers say Andy Stone; several of the same programs’ title screens say “By Gregory Stone”. A part whose files name no one is listed as Recreational Software Designs.',
      ),
      h(
        'table',
        { class: 'credits-table credits-parts' },
        h('caption', null, 'Each part of Game-Maker, who the source credits, and where'),
        h(
          'thead',
          null,
          h('tr', null, h('th', { scope: 'col' }, 'Part'), h('th', { scope: 'col' }, 'Credited'), h('th', { scope: 'col' }, 'Where it says so')),
        ),
        h(
          'tbody',
          null,
          ...RSD_PARTS.map((p) =>
            h(
              'tr',
              null,
              h('th', { scope: 'row' }, p.part),
              h('td', { 'data-label': 'Credited' }, p.who),
              h(
                'td',
                { 'data-label': 'Where' },
                ...p.sources.map((s) =>
                  h('span', { class: 'credits-cite' }, repoFile(s.file), s.quote ? h('q', null, s.quote) : h('span', { class: 'muted' }, ' no author named')),
                ),
              ),
            ),
          ),
        ),
      ),
      h('h4', null, 'In the sample games’ own credits'),
      h(
        'ul',
        { class: 'credits-list' },
        ...[...new Set(RSD_SAMPLE_CREDITS.map((s) => s.game))].map((game) => {
          const lines = RSD_SAMPLE_CREDITS.filter((s) => s.game === game);
          return h(
            'li',
            null,
            h('i', null, game),
            ` (${lines[0].file.split('/').pop()}): `,
            ...lines.flatMap((s, i) => [i ? ', ' : '', h('q', null, s.quote.replace(/\.$/, ''))]),
          );
        }),
      ),
    ),
  );
}
