// "Missing roles": what a chosen generator needs from the block set and which of those roles are set,
// with a link to the block editor's Uses tab. Words and a tick or cross, never color alone.
import { h } from '../../../core/ui';
import { checkNeeds, kindInfo, type GenKind } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';

export function missingRoles(o: { kind: GenKind; roles: RoleMap; usesHref: string }): HTMLElement {
  const n = checkNeeds(o.kind, o.roles);
  const row = (i: (typeof n.items)[number]) =>
    h(
      'li',
      { class: i.count ? 'set' : 'missing' },
      h('span', { 'aria-hidden': 'true' }, i.count ? '✓ ' : '✗ '),
      h('strong', null, i.label),
      ` ${i.must ? 'needed' : 'optional'}: `,
      i.count ? `${i.count} ${i.count === 1 ? 'block' : 'blocks'} set` : i.must ? 'not set yet' : `not set, ${i.without}`,
    );
  // the optional roles share two lines (set, and not set with what is skipped), so the panel stays short on a phone
  const opt = n.items.filter((i) => !i.must);
  const have = opt.filter((i) => i.count).map((i) => i.label);
  const lack = opt.filter((i) => !i.count).map((i) => i.label);
  const list = h(
    'ul',
    { class: 'mt-need-list' },
    ...n.items.filter((i) => i.must).map(row),
    have.length ? h('li', { class: 'set' }, h('span', { 'aria-hidden': 'true' }, '✓ '), h('strong', null, 'Optional set: '), have.join(', ')) : null,
    lack.length
      ? h(
          'li',
          { class: 'missing' },
          h('span', { 'aria-hidden': 'true' }, '✗ '),
          h('strong', null, 'Optional, not set: '),
          `${lack.join(', ')} (those parts are left out)`,
        )
      : null,
  );
  const link = h('a', { href: o.usesHref }, 'Open the block editor’s Uses tab');
  const summary = n.ok ? `${kindInfo(o.kind).label}: every needed role is set` : n.message;
  // open when something needed is missing; a set with every need met folds away to save room on a phone
  return h('details', { class: 'mt-needs', open: !n.ok }, h('summary', null, summary), list, h('p', { class: 'meta' }, link));
}
