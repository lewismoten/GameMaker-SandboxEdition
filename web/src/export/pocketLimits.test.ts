// Pocket's playable-scene boundary and all 20 DOS link slots, through real GAM bytes and CLI output.
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { testGame } from '../editor/check/testGame';
import { readBundle } from './pocketFile';
import { newCards, packPocketGame } from './pocketPack';

const deflate = (bytes: Uint8Array) => new Uint8Array(deflateRawSync(bytes, { level: 9 }));
function playableGame(levels: number, links = 1) {
  const fixture = testGame(['########################', '#S....................E#', '########################']);
  const template = fixture.game.scenes[2];
  template.files[0] = 'test.pal';
  fixture.files.set('test.pal', new Uint8Array(768));
  fixture.game.scenes.length = 2; // Keep the menu and ending separate from the playable records.
  for (let n = 0; n < levels; n++) {
    const scene = structuredClone(template);
    for (let slot = 0; slot < links; slot++)
      scene.links[slot] = {
        toScene: n + 1 < levels ? n + 3 : 1,
        from: { x: 22 - slot, y: 1 },
        to: { x: 1, y: 1 },
      };
    fixture.game.scenes.push(scene);
  }
  fixture.files.set('test.gam', serializeGame(fixture.game));
  return new GameFiles(fixture.files);
}
const pack = (files: GameFiles) => packPocketGame({ title: 'Pocket limits', files }, new Map(), newCards(), deflate, false);
const levelLines = (lines: string[]) => lines.filter((line) => line.startsWith('level '));

describe('Pocket playable-scene and DOS link limits', () => {
  it('packs exactly 128 playable scenes without counting the menu or ending', async () => {
    const packed = await pack(playableGame(128));
    expect(packed.why).toEqual([]);
    expect(packed.levels).toBe(128);
    expect(levelLines(packed.lines)).toHaveLength(128);
    expect(packed.lines).toContain('link 127 22 1 -1 1 1');
  });

  it('reports 129 playable scenes as incompatible instead of silently truncating them', async () => {
    const packed = await pack(playableGame(129));
    expect(packed.why).toEqual(['too many levels']);
    expect(packed.levels).toBe(129);
    expect(levelLines(packed.lines)).toHaveLength(129);
  });

  it('packs every populated slot when a scene uses all 20 GAM links', async () => {
    const packed = await pack(playableGame(1, 20));
    expect(packed.why).toEqual([]);
    expect(packed.levels).toBe(1);
    expect(levelLines(packed.lines)).toHaveLength(1);
    expect(packed.lines.filter((line) => line.startsWith('link '))).toEqual(Array.from({ length: 20 }, (_, slot) => `link 0 ${22 - slot} 1 -1 1 1`));
  });

  it('retains the 128-level game but leaves the 129-level game out of pocketData output', () => {
    const repo = resolve(import.meta.dirname, '../../..');
    const cache = join(repo, 'web/node_modules/.cache');
    mkdirSync(cache, { recursive: true });
    const root = mkdtempSync(join(cache, 'pocket-limits-'));
    try {
      mkdirSync(join(root, 'web'));
      for (const [id, levels] of [
        ['limit128', 128],
        ['limit129', 129],
      ] as const) {
        const disk = join(root, 'games', id, 'disk');
        mkdirSync(disk, { recursive: true });
        writeFileSync(join(root, 'games', id, 'about.json'), JSON.stringify({ title: id, series: 'starter', version: '1.0' }));
        for (const [name, bytes] of playableGame(levels).entries()) writeFileSync(join(disk, name), bytes);
      }
      const output = execFileSync(join(repo, 'node_modules/.bin/vite-node'), [join(repo, 'web/scripts/pocketData.ts')], {
        cwd: join(root, 'web'),
        encoding: 'utf8',
        timeout: 20000,
        env: { ...process.env, GM_SKIP_GAME_BUILD: '1' },
      });
      expect(output).toMatch(/limit128\s+pack/);
      expect(output).toMatch(/limit129\s+left out: too many levels/);
      const out = join(root, 'pocket-out/data');
      expect(readFileSync(join(out, 'games.txt'), 'utf8')).toBe('limit128|limit128|128\n');
      const bundle = readBundle(new Uint8Array(readFileSync(join(out, 'small.pak'))));
      expect(bundle.has('limit128.cfg')).toBe(true);
      expect(bundle.has('limit129.cfg')).toBe(false);
      const cfg = new TextDecoder().decode(bundle.get('limit128.cfg')!.bytes);
      expect(levelLines(cfg.split('\n'))).toHaveLength(128);
      const records = readFileSync(join(out, 'library.jsonl'), 'utf8')
        .trim()
        .split('\n')
        .slice(1)
        .map((line) => JSON.parse(line) as { id: string });
      expect(records.map((record) => record.id)).toEqual(['limit128']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30000);
});
