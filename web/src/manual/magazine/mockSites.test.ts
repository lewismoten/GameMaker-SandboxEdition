// Offline guard for the made-up domains: every domain-like string in the shipped sources must be in
// mockSites.json (mockDomains, reservedDomains or realDomains). A new fictional domain goes into
// mockDomains so `npm run domains:check` keeps proving it is unregistered. Also checks each article
// site belongs to a registered mock domain.
// Stays slow: it scans every source file in the repository for domain names.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import registry from './mockSites.json';

const ROOT = join(__dirname, '../../../..');
const TEXT = /\.(ts|tsx|js|mjs|json|md|txt|html|css)$/;
const SKIP_FILE = /(\.test\.[tj]sx?|package(-lock)?\.json|walkPaths\.json|-OFL\.txt|\.build-cache\.json)$/;
const SKIP_DIR = new Set(['node_modules', 'disk', 'dist', '.git', 'tools', 'shots']);
const TLD = '(?:com|net|org|edu|gov|nz|us|io|co|biz|mil)';
const HOST = new RegExp(
  `(?:(?:https?|gopher|ftp)://|@|\\b(?:www|ftp)\\.)([a-z0-9]+(?:[.-][a-z0-9]+)*\\.[a-z]{2,})|\\b([a-z0-9][a-z0-9-]{2,}(?:\\.[a-z0-9-]+)*\\.${TLD})\\b`,
  'gi',
);

function* files(dir: string, depth = 0): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIR.has(e.name) && depth < 12) yield* files(join(dir, e.name), depth + 1);
    } else if (TEXT.test(e.name) && !SKIP_FILE.test(e.name)) yield join(dir, e.name);
  }
}

// Not domains: DOS file names the retro shell and drives list, and a map-file code.
const NOT_DOMAINS = new Set(['command.com', 'doskey.com', 'mouse.com', 'edit.com', 'name.com', 'foo.com', 'forest.mon']);
const known = [...registry.mockDomains.map((d) => d.domain), ...registry.reservedDomains, ...registry.realDomains].map((d) => d.toLowerCase());
const isKnown = (host: string): boolean => known.some((k) => host === k || host.endsWith(`.${k}`));

describe('mock domains', () => {
  it('names no domain that is not in the registry', () => {
    const roots = [join(ROOT, 'web/src'), join(ROOT, 'web/public')];
    for (const g of readdirSync(join(ROOT, 'games'), { withFileTypes: true })) {
      if (g.isDirectory()) for (const sub of ['src']) roots.push(join(ROOT, 'games', g.name, sub));
    }
    const unknown = new Map<string, string>();
    const scan = (file: string): void => {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(HOST)) {
        const host = (m[1] ?? m[2]).toLowerCase().replace(/\.+$/, '');
        if (m[2] && text.slice(m.index - 2, m.index) === '${') continue; // a code expression, not an address
        if (NOT_DOMAINS.has(host)) continue;
        if (!isKnown(host) && !unknown.has(host)) unknown.set(host, file.slice(ROOT.length + 1));
      }
    };
    for (const r of roots) {
      try {
        for (const f of files(r)) scan(f);
      } catch {
        /* a game without src/ */
      }
    }
    for (const g of readdirSync(join(ROOT, 'games'), { withFileTypes: true })) {
      if (!g.isDirectory()) continue;
      for (const f of ['about.json', 'manual.json', 'printables.json']) {
        try {
          scan(join(ROOT, 'games', g.name, f));
        } catch {
          /* optional */
        }
      }
    }
    // Secret games are never named: the failure message gives hosts only, with the file for the rest.
    expect([...unknown].map(([h, f]) => `${h} (${f.startsWith('games/') ? 'a game' : f})`)).toEqual([]);
  });

  it('keeps each article site on a registered mock domain', () => {
    const mocks = new Set(registry.mockDomains.map((d) => d.domain));
    for (const s of registry.sites) {
      expect(mocks.has(s.domain), s.id).toBe(true);
      expect(s.host === s.domain || s.host.endsWith(`.${s.domain}`), s.id).toBe(true);
    }
  });
});
