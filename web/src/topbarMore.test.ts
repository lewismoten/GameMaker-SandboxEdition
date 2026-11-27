// The overflow menu needs one accessible name across responsive layouts.
import { expect, it } from 'vitest';
import main from './main.ts?raw';

it('names the More summary consistently as its destinations change', () => {
  const summary = main.match(/class: 'topbar-more show-narrow'[^]*?'summary',\s*\{([^}]*)\}/)?.[1];
  expect(summary).toContain("'aria-label': 'More pages and settings'");
});
