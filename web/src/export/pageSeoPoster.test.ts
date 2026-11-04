// The exported page's no-script view: the title picture, then a notice only where scripts don't run.
import { describe, expect, it } from 'vitest';
import { exportAbout } from './pageSeo';

describe('exportAbout without scripts', () => {
  const m = { title: 'Tune-Up', poster: 'data:image/png;base64,AAAA' };
  it('shows the title screen first, pixelated, with alt text naming the game', () => {
    const html = exportAbout(m);
    expect(html).toMatch(/<img src="data:image\/png;base64,AAAA"[^>]*alt="Tune-Up: the game&#39;s title screen"[^>]*image-rendering:pixelated/);
  });
  it('puts the notice in <noscript> so it is hidden once scripts run', () => {
    const html = exportAbout(m);
    expect(html).toMatch(/<noscript>.*can’t run the game.*<\/noscript>/);
    expect(html.indexOf('<img')).toBeLessThan(html.indexOf('<noscript>'));
  });
  it('leaves the picture out when there is none', () => {
    expect(exportAbout({ title: 'X' })).not.toContain('<img');
  });
});
