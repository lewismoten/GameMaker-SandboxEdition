import { describe, expect, it } from 'vitest';
import { websiteLink } from './insideGame';

describe('websiteLink', () => {
  it('links http and https', () => {
    expect(websiteLink('https://example.invalid/a')).toContain('href="https://example.invalid/a"');
    expect(websiteLink('http://example.invalid')).toContain('<a ');
  });
  it('leaves other schemes and junk as plain text', () => {
    for (const w of ['javascript:alert(1)', ' JaVaScript:alert(1)', 'data:text/html,x', 'example.invalid', 'vbscript:x']) {
      const out = websiteLink(w);
      expect(out).not.toContain('<a');
      expect(out).not.toContain('href');
    }
  });
});
