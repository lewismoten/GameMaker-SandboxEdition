// The fake 1996 pages in TURBO BUTTON's Log Off the Games article must be period HTML:
// no CSS in the page itself (only the browser's own defaults draw table and form bevels).
import { describe, expect, it } from 'vitest';
import { OLD_PAGES } from '../../../scripts/oldWebPages';

describe('old web pages', () => {
  for (const p of OLD_PAGES) {
    it(`${p.file} has no CSS or scripts`, () => {
      expect(p.html).not.toMatch(/<style|style=|<script|<div|class=|<link|font-family|box-shadow|border-radius/i);
      expect(p.html).toMatch(/<body /);
    });
  }
});
