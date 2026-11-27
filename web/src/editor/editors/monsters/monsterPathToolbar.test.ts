// Boundary keys on the active path tab preserve the corner being edited and the zoom.
import { afterEach, expect, it, vi } from 'vitest';
import { emptyMonster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { FakeDoc } from '../../../../test/fakeDom';
import type { PathEd } from './monsterPathState';
import { renderTabs } from './monsterPathToolbar';

afterEach(() => vi.unstubAllGlobals());

it.each([
  [0, 'Home'],
  [1, 'End'],
] as const)('preserves the editing position on tab %i after %s', (tab, key) => {
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  const tabsEl = doc.createElement('div');
  Object.assign(tabsEl, { querySelectorAll: () => tabsEl.children });
  const monster = emptyMonster();
  for (const corner of monster.march[tab].slice(0, 3)) corner.pic = 1;
  const ed = { tab, tabsEl, o: { monsters: [monster], index: () => 0 }, selected: 2, pop: {}, fitView: vi.fn(), renderAll: vi.fn() };
  renderTabs(ed as unknown as PathEd);
  const active = tabsEl.children[tab];
  Object.assign(active, { click: () => active.fire('click') });
  active.focus();
  const preventDefault = vi.fn();
  active.fire('keydown', { key, preventDefault });
  expect(preventDefault).toHaveBeenCalledOnce();
  expect(ed.selected).toBe(2);
  expect(ed.fitView).not.toHaveBeenCalled();
  expect(doc.activeElement).toBe(active);
});
