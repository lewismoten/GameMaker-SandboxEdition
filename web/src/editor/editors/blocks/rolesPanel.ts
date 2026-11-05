// The block editor's "Uses" tab: chips for what the selected block is for (wall, door, chair facing
// south...), saved in the companion file. Guesses from what the block does and looks like show as
// dashed chips with the reason; nothing is added until you tap one or "Accept all".
import { h, clear, selectField } from '../../core/ui';
import type { Project } from '../../core/project';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import {
  FACINGS,
  FACING_NAMES,
  MAX_PAIR,
  ROLES,
  ROLE_GROUPS,
  hasFacing,
  hasPair,
  pendingSuggestions,
  suggestRoles,
  type BlockRole,
  type Facing,
  type Role,
} from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { readRoles, writeRoles } from './blockRoles';

const ARROWS: Record<Facing, string> = { N: '↑', E: '→', S: '↓', W: '←' };

export function rolesPanel(o: { project: Project; file: string; blocks: Block[]; pal: () => Palette; current: () => number }) {
  const el = h('div', { class: 'panel stack blk-roles' });
  const map = readRoles(o.project, o.file, o.blocks.length);
  const save = () => {
    writeRoles(o.project, o.file, map);
    render();
  };
  const entry = (n: number): BlockRole => map[n] ?? { roles: [] };
  const set = (n: number, e: BlockRole) => {
    if (!hasFacing(e.roles)) delete e.facing;
    if (!hasPair(e.roles)) delete e.pair;
    if (hasPair(e.roles) && !e.pair) e.pair = 1;
    if (e.roles.length) map[n] = e;
    else delete map[n];
    save();
  };
  const toggle = (n: number, role: Role) => {
    const e = entry(n);
    set(n, { ...e, roles: e.roles.includes(role) ? e.roles.filter((r) => r !== role) : [...e.roles, role] });
  };
  function render(): void {
    const n = o.current();
    const b = o.blocks[n];
    if (!b) return;
    const e = entry(n);
    const sug = pendingSuggestions(e.roles, suggestRoles(b, n, { palette: o.pal() }));
    const chip = (role: (typeof ROLES)[number]) => {
      const on = e.roles.includes(role.id);
      const s = sug.find((x) => x.role === role.id);
      const btn = h(
        'button',
        {
          type: 'button',
          class: `blk-role-chip${s ? ' suggested' : ''}`,
          'aria-pressed': String(on),
          title: s ? `${role.hint}. Suggested: ${s.why}` : role.hint,
        },
        role.label,
        s ? h('span', { class: 'sr-only' }, `, suggested: ${s.why}`) : null,
      );
      btn.addEventListener('click', () => toggle(n, role.id));
      return btn;
    };
    const accept = h('button', { type: 'button', class: 'secondary' }, `Accept all ${sug.length} suggestion${sug.length === 1 ? '' : 's'}`);
    accept.addEventListener('click', () => {
      const first = sug.find((x) => x.pair);
      set(n, { ...e, roles: [...e.roles, ...sug.map((x) => x.role)], pair: e.pair ?? first?.pair });
    });
    clear(
      el,
      h('h2', null, `Block ${n}: uses`),
      h(
        'p',
        { class: 'hint' },
        'What this block is for, so a level generator can pick it. Saved with the project, never in the game files. Dashed chips are guesses from what the block does and looks like; tap one to keep it.',
      ),
      sug.length
        ? h(
            'div',
            { class: 'stack' },
            h('p', { class: 'hint', role: 'status' }, `Suggested: ${sug.map((s) => `${ROLES.find((r) => r.id === s.role)!.label} (${s.why})`).join('; ')}.`),
            accept,
          )
        : null,
      ...ROLE_GROUPS.map((g) =>
        h(
          'fieldset',
          { class: 'blk-role-group' },
          h('legend', null, g),
          h('div', { class: 'blk-role-chips' }, ...ROLES.filter((r) => r.group === g).map(chip)),
        ),
      ),
      hasFacing(e.roles)
        ? h(
            'fieldset',
            { class: 'blk-role-group' },
            h('legend', null, 'Faces'),
            h(
              'div',
              { class: 'blk-role-chips' },
              ...FACINGS.map((f) => {
                const btn = h(
                  'button',
                  {
                    type: 'button',
                    class: 'blk-role-chip',
                    'aria-pressed': String(e.facing === f),
                    'aria-label': `Faces ${FACING_NAMES[f]}`,
                    title: `Faces ${FACING_NAMES[f]}`,
                  },
                  ARROWS[f],
                );
                btn.addEventListener('click', () => set(n, { ...e, facing: e.facing === f ? undefined : f }));
                return btn;
              }),
            ),
          )
        : null,
      hasPair(e.roles)
        ? selectField(
            'Lock number',
            Array.from({ length: MAX_PAIR }, (_, i) => [i + 1, `Lock ${i + 1}`] as [number, string]),
            () => e.pair ?? 1,
            (v) => set(n, { ...e, pair: v }),
            'A locked door and the key that opens it share a lock number',
          )
        : null,
    );
  }
  return { el, refresh: render };
}
