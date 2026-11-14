// The printed Module keys table supplies real column headers for the booklet paginator.
import { expect, it } from 'vitest';
import manual from '../../../../games/maximus/manual.json';

it('labels the Module keys columns without changing the ten key/module rows', () => {
  const controls = manual.pages.find((p) => p.head === 'Controls')!.html;
  const table = controls.split('<h2>Module keys</h2>')[1].match(/<table>(.*?)<\/table>/)![1];
  expect(table).toMatch(/^<tr><th(?: scope="col")?>Key<\/th><th(?: scope="col")?>Module<\/th><\/tr>/);
  expect([...table.matchAll(/<tr><td><kbd>(.*?)<\/kbd><\/td><td>(.*?)<\/td><\/tr>/g)].map((m) => [m[1], m[2]])).toEqual([
    ['Z', 'Plasma Lance'],
    ['X', 'Nova Core'],
    ['Q / E', 'Dash Boots'],
    ['C', 'Shield Emitter'],
    ['F', 'Hover Pack'],
    ['V', 'Mine Layer'],
    ['R', 'Med Kit'],
    ['W', 'Flak Cannon'],
    ['Q / E (sub)', 'Hydro Jets'],
    ['Up (rover)', 'Spring Shocks'],
  ]);
});
