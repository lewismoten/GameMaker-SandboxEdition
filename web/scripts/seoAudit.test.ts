// Exercise the built-folder audit against good metadata and deliberate regressions.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { metaTags, OG_IMAGE, SITE_URL } from '../src/seo/site';

const script = join(__dirname, 'seoAudit.mjs');
const title = 'A public game page';
const description = 'Play a sample DOS game in your browser with a keyboard, game controller or touch controls.';
const page = () =>
  `<!doctype html><html lang="en"><head><title>${title}</title>${metaTags({ title, description, url: SITE_URL, image: OG_IMAGE, imageAlt: 'A game title screen' })}</head><body><h1>Sample game</h1></body></html>`;

function fixture(run: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'gm-seo-audit-'));
  try {
    writeFileSync(join(dir, 'index.html'), page());
    writeFileSync(join(dir, 'og-image.png'), 'image placeholder for path validation only');
    writeFileSync(join(dir, 'sitemap.xml'), `<urlset><url><loc>${SITE_URL}</loc></url></urlset>`);
    writeFileSync(join(dir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`);
    writeFileSync(join(dir, 'llms.txt'), '# Public games');
    run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('built-site SEO audit', () => {
  it('accepts complete metadata and intentionally unindexed utility pages', () => {
    fixture((dir) => {
      writeFileSync(
        join(dir, 'helper.html'),
        '<html lang="en"><head><title>Helper</title><meta name="robots" content="noindex"></head><body><h1>Helper</h1></body></html>',
      );
      writeFileSync(
        join(dir, 'standalone.html'),
        '<html lang="en"><head><meta name="robots" content="noindex" data-gm-template><title><!--GM:TITLE--></title></head><body></body></html>',
      );
      expect(execFileSync(process.execPath, [script, dir], { encoding: 'utf8' })).toContain('problems 0');
    });
  });

  it('fails on long descriptions, missing language or Twitter tags, and secret content', () => {
    fixture((dir) => {
      const games = join(__dirname, '../../games');
      const secret = readdirSync(games)
        .flatMap((id) => {
          try {
            return [JSON.parse(readFileSync(join(games, id, 'about.json'), 'utf8')) as { secret?: boolean; title: string }];
          } catch {
            return [];
          }
        })
        .find((g) => g.secret)!;
      expect(secret).toBeDefined();
      const html = page()
        .replace('lang="en"', '')
        .replace(/<meta name="twitter:title"[^>]*>/, '')
        .replace(description, 'x'.repeat(161))
        .replace('</body>', `<p>${secret.title}</p></body>`);
      writeFileSync(join(dir, 'index.html'), html);
      const result = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
      expect(result.status).toBe(1);
      for (const finding of ['description length 161', 'missing English lang', 'inconsistent twitter:title', 'secret game exposed'])
        expect(result.stdout).toContain(finding);
    });
  });
});
