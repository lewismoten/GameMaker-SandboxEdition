// Credits, "The original Game-Maker": RSD's own title screen, the Stone family, Andy Stone's
// 2014 source release and 2011 look back, and who the source credits for each part (rsdParts.ts).
import { h } from '../editor/core/ui';
import { section, ext, repoFile, banner, card } from './section';
import { RSD_PARTS, RSD_SAMPLE_CREDITS } from './rsdParts';

export function originalSection(): HTMLElement {
  return section(
    'credits-original',
    'The original Game-Maker',
    'Everything here starts with RSD Game-Maker 3.0 and the family who made it.',
    h(
      'div',
      { class: 'credits-lead-row' },
      banner('rsd.webp', 'Recreational Software Designs’ Game-Maker Presents: the title screen in blue and red lettering over clouds', [
        'RSD’s title screen, from the CD’s sample games (',
        repoFile('cd/gameware/nebula/gmtitle.gif'),
        ')',
      ]),
      h(
        'div',
        { class: 'credits-cards' },
        card(
          'h3',
          'Made by',
          h(
            'p',
            null,
            'Recreational Software Designs of Amherst, New Hampshire, 1991–1995: G. Andrew (Andy) Stone with G. Oliver Stone, Oliver Stone Jr. and Joan Stone. KD Software sold it in the US.',
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
    ),
    h('h3', { id: 'credits-parts' }, 'Who made each part'),
    h(
      'p',
      null,
      'As the original source credits them, in its file headers and title screens. The headers say Andy Stone; several of the same programs’ title screens say “By Gregory Stone”. A part whose files name no one is listed as Recreational Software Designs.',
    ),
    h(
      'table',
      { class: 'credits-table credits-parts' },
      h('caption', null, 'Each part of Game-Maker, who the source credits, and where'),
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Part'), h('th', { scope: 'col' }, 'Credited'), h('th', { scope: 'col' }, 'Where it says so'))),
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
    h('h3', { id: 'credits-samples-credits' }, 'In the sample games’ own credits'),
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
  );
}
