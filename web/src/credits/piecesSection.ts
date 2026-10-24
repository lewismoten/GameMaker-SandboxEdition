// Credits, "Engine, players and other third-party pieces": thirdParty.ts's groups, each piece
// with its license, who made it and what it does here.
import { h } from '../editor/core/ui';
import { NOTICE_URL } from '../edition';
import { section, ext, more } from './section';
import { PIECE_GROUPS, type Piece } from './thirdParty';

const piece = (p: Piece) =>
  h(
    'li',
    null,
    h('span', { class: 'dep-name' }, p.url ? ext(p.url, p.name) : p.name),
    ' ',
    h('span', { class: 'dep-meta' }, `${p.license} · ${p.by}`),
    h('span', { class: 'dep-what' }, p.what),
  );

export function piecesSection(): HTMLElement {
  return section(
    'credits-pieces',
    'Engine, players and other third-party pieces',
    'The engine, editors and players are this project’s own code. These are the few pieces from others.',
    h(
      'p',
      null,
      'The code is written from the original C source and the file formats’ published descriptions. The pieces below are listed as ',
      ext(NOTICE_URL, 'NOTICE.md'),
      ' credits them; the downloads carry the notices that apply to them as THIRD-PARTY-NOTICES.txt.',
    ),
    h(
      'div',
      { class: 'credits-more-stack' },
      ...PIECE_GROUPS.map((g) =>
        more(
          `${g.title} (${g.pieces.length}): ${g.pieces
            .map((p) => p.name)
            .slice(0, 3)
            .join(', ')}${g.pieces.length > 3 ? '…' : ''}`,
          g.note && h('p', null, g.note),
          h('ul', { class: 'credits-deps credits-deps-grid' }, ...g.pieces.map(piece)),
        ),
      ),
    ),
  );
}
