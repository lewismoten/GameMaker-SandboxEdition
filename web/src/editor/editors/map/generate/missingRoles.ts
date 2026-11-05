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
  const list = h('ul', { class: 'mt-need-list' }, ...n.items.map(row));
  const link = h('a', { href: o.usesHref }, 'Open the block editor’s Uses tab');
  const summary = n.ok ? `${kindInfo(o.kind).label}: every needed role is set` : n.message;
  // open when something needed is missing; a set with every need met folds away to save room on a phone
  return h('details', { class: 'mt-needs', open: !n.ok }, h('summary', null, summary), list, h('p', { class: 'meta' }, link));
}
