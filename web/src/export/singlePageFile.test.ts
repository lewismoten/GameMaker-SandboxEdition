// "Export as one web page" must run from file:// : the player template (standalone.html) may not
// fetch, start a worker or load any other file. Chromium blocks fetch/XHR and module workers there.
import { describe, expect, it } from 'vitest';
import { buildSinglePageTemplate } from '../../scripts/singlePageBuild';

describe('standalone.html template', () => {
  it('loads nothing from outside itself', async () => {
    const html = await buildSinglePageTemplate();
    expect(html).toContain('<!--GM:GAME-->');
    expect(html).not.toMatch(/\bfetch\s*\(/);
    expect(html).not.toMatch(/XMLHttpRequest|importScripts|new Worker\s*\(|new SharedWorker\s*\(|serviceWorker\.register/);
    // no external file tags: only inline scripts and styles
    expect(html).not.toMatch(/<script[^>]*\ssrc=/i);
    expect(html).not.toMatch(/<link[^>]*rel=["']?(stylesheet|modulepreload|preload)/i);
    expect(html).not.toMatch(/<(img|iframe|source|video|audio)[^>]*\ssrc=["']?(?!data:)/i);
  }, 60_000);
});
