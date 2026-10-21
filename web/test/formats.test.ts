// Tests: Reading and writing Game-Maker's binary formats (formats/): blocks, characters, monsters, maps, sounds, games.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseBlocks, serializeBlocks, BLOCK_COUNTS, BLOCK_SIZE, type BlockKind } from '../src/formats/blocks';
import { parseCharacter, serializeCharacter } from '../src/formats/character';
import { parseMonsters, serializeMonsters } from '../src/formats/monster';
import { parseMap, serializeMap } from '../src/formats/map';
import { parseSoundSet, serializeSoundSet } from '../src/formats/sound';
import { parseGame, serializeGame, STARTTYPE, ENDTYPE } from '../src/formats/game';

const CD = resolve(__dirname, '../../cd');
const gameware = join(CD, 'gameware');

// Files on the CD image that were cut off at 16 KiB.
const truncated = (bytes: Uint8Array) => bytes.length === 16384;

function filesWith(ext: string, root = gameware): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  for (const dir of readdirSync(root, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const f of readdirSync(join(root, dir.name))) if (f.toLowerCase().endsWith(ext)) out.push(join(root, dir.name, f));
  }
  return out;
}

const roundTrip = (ext: string, parse: (b: Uint8Array) => Uint8Array) => {
  const files = filesWith(ext);
  it.skipIf(files.length === 0)(`round-trips every ${ext} file byte for byte`, () => {
    for (const f of files) {
      const bytes = new Uint8Array(readFileSync(f));
      if (truncated(bytes)) continue;
      const out = parse(bytes);
      // Short files (older .snd without digital names, a trimmed .cbl) are written at full size.
      expect(out.length, f).toBeGreaterThanOrEqual(bytes.length);
      expect(out.subarray(0, bytes.length), f).toEqual(bytes);
      expect(out.subarray(bytes.length).every((v) => v === 0), f).toBe(true);
    }
    // reads every such file on the CD: give it room on a busy machine
  }, 30_000);
};

describe('binary formats', () => {
  for (const kind of ['bbl', 'mbl', 'cbl'] as BlockKind[]) {
    roundTrip(`.${kind}`, (b) => serializeBlocks(parseBlocks(b, Math.ceil(b.length / BLOCK_SIZE))));
    it(`reads ${kind} with the expected block count`, () => {
      const f = filesWith(`.${kind}`)[0];
      if (!f) return;
      expect(parseBlocks(new Uint8Array(readFileSync(f)), BLOCK_COUNTS[kind])).toHaveLength(BLOCK_COUNTS[kind]);
    });
  }
  roundTrip('.chr', (b) => serializeCharacter(parseCharacter(b)));
  roundTrip('.mon', (b) => serializeMonsters(parseMonsters(b)));
  roundTrip('.map', (b) => serializeMap(parseMap(b)));
  roundTrip('.snd', (b) => serializeSoundSet(parseSoundSet(b)));
  roundTrip('.gam', (b) => serializeGame(parseGame(b)));

  it('reads the sample game scene graph', () => {
    const f = join(gameware, 'sample/sample.gam');
    if (!existsSync(f)) return;
    const g = parseGame(new Uint8Array(readFileSync(f)));
    expect(g.scenes[0].gametype).toBe(STARTTYPE);
    expect(g.scenes[1].gametype).toBe(ENDTYPE);
    expect(g.scenes[0].desc).toBe('SAMPLE GAME');
    expect(g.scenes[2].files[1]).toMatch(/\.map$/);
  });

  it('converts pre-3.00 shareware games', () => {
    const f = join(CD, 'sharware/orb/orb.gam');
    if (!existsSync(f)) return;
    const g = parseGame(new Uint8Array(readFileSync(f)));
    expect(g.converted).toBe(true);
    expect(g.scenes[0].gametype).toBe(STARTTYPE);
    const level = g.scenes.find((s) => s.gametype === 10)!;
    expect(level.files[0]).toMatch(/\.pal$/);
    // Converting and re-reading keeps the scene graph.
    const again = parseGame(serializeGame(g));
    expect(again.scenes.map((s) => s.files)).toEqual(g.scenes.map((s) => s.files));
  });
});
