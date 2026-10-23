// Credits, "Engine, players and other third-party pieces": thirdParty.ts's groups, each piece
// with its license, who made it and what it does here.
import { h } from '../editor/core/ui';
import { NOTICE_URL } from '../edition';
import { section, ext } from './section';
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
    h(
      'p',
      null,
      'The engine, editors and players are this project’s own code, written from the original C source and the file formats’ published descriptions. These are the pieces from others, as ',
      ext(NOTICE_URL, 'NOTICE.md'),
      ' credits them. The downloads carry the notices that apply to them as THIRD-PARTY-NOTICES.txt.',
    ),
    ...PIECE_GROUPS.map((g) => [h('h3', { id: g.id }, g.title), g.note && h('p', null, g.note), h('ul', { class: 'credits-deps' }, ...g.pieces.map(piece))]),
  );
}
