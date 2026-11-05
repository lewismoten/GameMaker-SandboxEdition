// The map editor's block palette filter: show only blocks that hold a role ("show only walls"), from
// the roles set in the block editor's Uses tab (companion data). Touch friendly: one labeled select.
import { h } from '../../core/ui';
import type { Project } from '../../core/project';
import { ROLES, type Role, type RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { readRoles } from '../blocks/blockRoles';

export const ALL = 'all';
export const NONE = 'none';
export type RoleChoice = typeof ALL | typeof NONE | Role;

/** Whether block `n` shows under a choice. */
export function showsBlock(roles: RoleMap, choice: RoleChoice, n: number): boolean {
  if (choice === ALL) return true;
  const have = roles[n]?.roles ?? [];
  return choice === NONE ? !have.length : have.includes(choice);
}

/** The choices that make sense: all, each role at least one block holds, and "no role set" when some have none. */
export function roleChoices(roles: RoleMap, count: number): [RoleChoice, string][] {
  const used = new Set<Role>();
  let bare = 0;
  for (let n = 0; n < count; n++) {
    const have = roles[n]?.roles ?? [];
    if (!have.length) bare++;
    have.forEach((r) => used.add(r));
  }
  const out: [RoleChoice, string][] = [[ALL, 'All blocks']];
  for (const r of ROLES) if (used.has(r.id)) out.push([r.id, `${r.label} (${Object.values(roles).filter((e) => e.roles.includes(r.id)).length})`]);
  if (used.size && bare) out.push([NONE, `No role set (${bare})`]);
  return out;
}

/** The filter control. `onChange` redraws the palette; `refresh` re-reads the roles (after the Uses tab changed them). */
export function roleFilter(o: { project: Project; file: () => string; count: () => number; onChange: () => void }) {
  let choice: RoleChoice = ALL;
  let roles: RoleMap = {};
  const sel = h('select', { 'aria-label': 'Show blocks used as' });
  const el = h(
    'label',
    { class: 'field mt-role-filter', title: 'Show only blocks marked as a wall, door, key... in the block editor' },
    h('span', null, 'Show'),
    sel,
  );
  sel.addEventListener('change', () => {
    choice = sel.value as RoleChoice;
    o.onChange();
  });
  function refresh(): void {
    roles = o.file() ? readRoles(o.project, o.file(), o.count()) : {};
    const options = roleChoices(roles, o.count());
    if (!options.some(([v]) => v === choice)) choice = ALL;
    sel.replaceChildren(...options.map(([v, text]) => h('option', { value: v, selected: v === choice }, text)));
    // a set with no roles has nothing to filter by: keep the control out of the way
    el.hidden = options.length < 2;
  }
  refresh();
  return {
    el,
    refresh,
    roles: () => roles,
    shows: (n: number) => showsBlock(roles, choice, n),
  };
}
