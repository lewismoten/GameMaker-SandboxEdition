import { describe, expect, it } from 'vitest';
import { browserName, copyText, formatDetails, routeOf } from './details';
import { ignorable, refusedChange } from './watch';
import { ReadOnlyError } from '../editor/core/readOnly';

describe('error details', () => {
  it('names the browser only', () => {
    expect(browserName('Mozilla/5.0 (iPhone) AppleWebKit Version/17 Mobile Safari/604')).toBe('Safari');
    expect(browserName('Mozilla/5.0 Chrome/120 Safari/537')).toBe('Chrome');
    expect(browserName('Mozilla/5.0 Chrome/120 Edg/120')).toBe('Edge');
  });
  it('keeps the route but not the query', () => {
    expect(routeOf('https://x.test/play.html?game=a&from=b#/x')).toBe('/play.html#/x');
  });
  it('lists message, build, route, browser, screen and nothing else', () => {
    const t = formatDetails(
      { message: 'boom', at: 'main.js:1:2' },
      { commit: 'abcdef1234567', href: 'https://x.test/#/privacy?token=1', userAgent: 'Firefox/120', width: 375, height: 700 },
    );
    expect(t).toBe('Error: boom\nAt: main.js:1:2\nBuild: abcdef123\nRoute: /#/privacy?token=1\nBrowser: Firefox\nScreen: 375x700');
  });
  it('ignores resize-loop noise', () => {
    expect(ignorable('ResizeObserver loop completed')).toBe(true);
    expect(ignorable('x is undefined')).toBe(false);
  });
  it('copies, or says it could not so the notice shows a text box', async () => {
    let got = '';
    expect(await copyText('a', { writeText: (v) => ((got = v), Promise.resolve()) })).toBe(true);
    expect(got).toBe('a');
    expect(await copyText('a', { writeText: () => Promise.reject(new Error('no')) })).toBe(false);
    expect(await copyText('a', undefined)).toBe(false);
  });

  it('leaves out a look-only game refusing a change (its own dialog says so)', () => {
    expect(refusedChange(new ReadOnlyError('one.map'))).toBe(true);
    expect(refusedChange(new Error('one.map'))).toBe(false);
    expect(refusedChange('ReadOnlyError')).toBe(false);
  });
});
