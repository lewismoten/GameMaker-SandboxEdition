import { describe, expect, it } from 'vitest';
import { websiteLink } from './insideGame';

describe('websiteLink', () => {
  it('links http and https', () => {
    expect(websiteLink('https://example.invalid/a')).toContain('href="https://example.invalid/a"');
    expect(websiteLink('http://example.invalid')).toContain('<a ');
  });
  it('links a www address with HTTPS and keeps the author’s visible text', () => {
    expect(websiteLink('www.example.invalid/page')).toContain('href="https://www.example.invalid/page" rel="noopener">www.example.invalid/page</a>');
    expect(websiteLink('www.example.invalid@other.invalid')).not.toContain('href');
  });
  it('leaves other schemes and junk as plain text', () => {
    for (const w of ['javascript:alert(1)', ' JaVaScript:alert(1)', 'data:text/html,x', 'example.invalid', 'vbscript:x']) {
      const out = websiteLink(w);
      expect(out).not.toContain('<a');
      expect(out).not.toContain('href');
    }
  });
});
