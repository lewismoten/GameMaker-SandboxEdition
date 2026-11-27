// Follow the shortened Home chapter's real tab presses from the Sandbox collection.
import { expect, it } from 'vitest';
import { newChapters, whatsNew } from './whatsNew';

it('selects Imported before pointing to either import management button', () => {
  const home = newChapters(whatsNew('2026-11-04')).find((c) => c.id === 'home')!;
  let tab = 'sandbox';
  const visits = [];
  for (const step of home.steps) {
    if (step.action === 'press' && step.click && typeof step.target?.css === 'string') {
      const selected = step.target.css.match(/\[id="lib-tab-([a-z]+)"\]/);
      if (selected) tab = selected[1];
    }
    if (step.id === 'home-import-history' || step.id === 'home-recently-deleted') visits.push([step.id, tab]);
  }
  expect(visits).toEqual([
    ['home-import-history', 'imported'],
    ['home-recently-deleted', 'imported'],
  ]);
});
