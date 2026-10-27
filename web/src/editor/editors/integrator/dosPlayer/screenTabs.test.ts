import { describe, expect, it } from 'vitest';
import { PATCHES } from '../../../../dosPlayer/patchTable';
import { SCREEN_TABS, screenSections } from './screenTabs';

describe('the DOS player dialog by screen', () => {
  it('puts every patch in exactly one tab and section', () => {
    const seen = SCREEN_TABS.flatMap((t) => screenSections(t.screen).flatMap((s) => s.entries.map((e) => e.id)));
    expect(seen.sort()).toEqual(PATCHES.map((e) => e.id).sort());
  });

  it('keeps one screen together, in kind order, with no empty sections', () => {
    const menu = screenSections('menu');
    expect(menu.map((s) => s.group)).toEqual(['words', 'positions', 'frames', 'colors', 'times']);
    for (const s of menu) {
      expect(s.entries.length).toBeGreaterThan(0);
      expect(s.entries.every((e) => e.screen === 'menu' && e.group === s.group)).toBe(true);
    }
    expect(
      screenSections('hiscores')
        .find((s) => s.group === 'positions')
        ?.entries.map((e) => e.id),
    ).toContain('layout.hiscore.title.x');
    expect(screenSections('play').map((s) => s.group)).toEqual(['colors', 'keys']);
  });

  it('has a tab for each screen once', () => {
    const screens = SCREEN_TABS.map((t) => t.screen);
    expect(new Set(screens).size).toBe(screens.length);
    expect(new Set(PATCHES.map((e) => e.screen))).toEqual(new Set(screens.filter((s) => s !== 'files')));
    expect(screenSections('files')).toEqual([]);
  });
});
