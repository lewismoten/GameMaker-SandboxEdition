// Credits, "The original Game-Maker": RSD and the Stone family, Andy Stone's 2014 source
// release and 2011 look back, and who the source credits for each part (rsdParts.ts).
import { h } from '../editor/core/ui';
import { section, ext, repoFile } from './section';
import { RSD_PARTS, RSD_SAMPLE_CREDITS } from './rsdParts';

export function originalSection(): HTMLElement {
  return section(
    'credits-original',
    'The original Game-Maker',
    h(
      'p',
      null,
      'RSD Game-Maker 1.0–3.0 (1991–1995) was made by Recreational Software Designs of Amherst, New Hampshire: G. Andrew (Andy) Stone with G. Oliver Stone, Oliver Stone Jr. and Joan Stone. KD Software sold it in the US.',
    ),
    h(
      'p',
      null,
      'On 12 July 2014 Andy Stone published its source code, the CD and an installed copy under the MIT License (',
      ext('https://github.com/gandrewstone/GameMaker', 'gandrewstone/GameMaker'),
      '). This edition is a fork of that release and keeps its license. In 2011 he looked back on ',
      ext('https://effluviaofascatteredmind.blogspot.com/2011/06/rsd-gamemaker.html', 'building it as a teenager with his family'),
      '.',
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
      h('caption', { class: 'sr-only' }, 'Who the original source credits for each part of Game-Maker'),
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
              ...p.sources.map((s) => h('span', { class: 'credits-cite' }, repoFile(s.file), s.quote ? ` “${s.quote}”` : ' (no author named)')),
            ),
          ),
        ),
      ),
    ),
    h('p', null, 'The sample games that came with it name the family in their own credits:'),
    h(
      'ul',
      { class: 'credits-list' },
      ...[...new Set(RSD_SAMPLE_CREDITS.map((s) => s.game))].map((game) => {
        const lines = RSD_SAMPLE_CREDITS.filter((s) => s.game === game);
        return h('li', null, h('i', null, game), ` (${lines[0].file.split('/').pop()}): `, lines.map((s) => `“${s.quote.replace(/\.$/, '')}”`).join(', '));
      }),
    ),
  );
}
