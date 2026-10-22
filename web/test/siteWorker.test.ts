import { describe, expect, it } from 'vitest';
import { groupOf, siteWorkerSource, WORKER_GROUP_OF } from '../src/siteWorker';

const PATHS = [
  'assets/desk-CtzsCBvT.js',
  'index.html',
  'play.html',
  'play-teddy.html',
  'manifest.webmanifest',
  'games/catalog.json',
  'games/details/teddy.json',
  'games/originals/teddy/teddy.gam',
  'games/originals/teddy/teddy.gam.gz',
  'games/gameware/nebula/nebula.gam',
  'desk/moten-snow-to-software-256.avif',
  'extras/demos/glub.rec',
  'gm/index.json',
];

describe('site service worker', () => {
  it('versions a game by its folder, a folder of pictures as one, and pages and catalogs on their own', () => {
    expect(groupOf('assets/desk-CtzsCBvT.js')).toBeUndefined();
    expect(groupOf('games/originals/teddy/teddy.gam')).toBe('games/originals/teddy/');
    expect(groupOf('games/originals/teddy/teddy.gam.gz')).toBe('games/originals/teddy/');
    expect(groupOf('games/catalog.json')).toBe('games/catalog.json');
    expect(groupOf('games/details/teddy.json')).toBe('games/details/teddy.json');
    expect(groupOf('play-teddy.html')).toBe('play-teddy.html');
    expect(groupOf('desk/moten-snow-to-software-256.avif')).toBe('desk/');
    expect(groupOf('extras/demos/glub.rec')).toBe('extras/');
  });

  it('runs the same grouping in the worker', () => {
    const worker = new Function(`${WORKER_GROUP_OF}; return groupOf;`)() as (p: string) => string | undefined;
    for (const p of PATHS) expect(worker(p)).toBe(groupOf(p));
  });

  it('writes a worker that parses, with the shell, groups and hashed files in it', () => {
    const src = siteWorkerSource({ version: 'v1', precache: ['./', 'index.html', 'assets/main-abc.js'], groups: { 'index.html': 'h1' }, assets: ['assets/main-abc.js'] });
    expect(() => new Function(src)).not.toThrow();
    expect(src).toContain('const PRECACHE = ["","index.html","assets/main-abc.js"]');
    expect(src).toContain('"index.html":"h1"');
  });
});
