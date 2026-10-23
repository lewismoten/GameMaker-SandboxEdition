// Tests: HEXEDIT's maps of Game-Maker's files (retro/hexedit/structure*.ts) agree with the
// format modules: every value the map names (by its key) reads the same as the parser read
// it, on the Sandbox games' disks and the CD's games.
import { describe as group, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe } from '../src/retro/hexedit/structureMedia';
import { leafAt, leaves, type Structure } from '../src/retro/hexedit/structure';
import { parseGame } from '../src/formats/game';
import { parseMap } from '../src/formats/map';
import { parseBlocks } from '../src/formats/blocks';
import { parseCharacter } from '../src/formats/character';
import { parseMonsters } from '../src/formats/monster';
import { parsePalette } from '../src/formats/palette';
import { parseHighScores, serializeHighScores } from '../src/formats/highscore';
import { parseSoundSet } from '../src/formats/sound';
import { parseRecording } from '../src/formats/recording';
import { parseCmf } from '../src/formats/cmf';
import { parseFli } from '../src/formats/fli';
import { decodeGif } from '../src/formats/gif';
import { parseSlotNames } from '../src/project/saveData/saveGame';

const root = resolve(__dirname, '../..');
const dirs = [
  ...readdirSync(join(root, 'games'))
    .map((g) => join(root, 'games', g, 'disk'))
    .filter(existsSync),
  ...(existsSync(join(root, 'cd/gameware')) ? readdirSync(join(root, 'cd/gameware')).map((g) => join(root, 'cd/gameware', g)) : []),
];
const files = dirs.flatMap((d) => readdirSync(d).map((f) => join(d, f)));
const byExt = (ext: string, max = 12) => files.filter((f) => f.toLowerCase().endsWith(`.${ext}`)).slice(0, max);

const PARSERS: Record<string, (b: Uint8Array) => unknown> = {
  gam: parseGame,
  map: parseMap,
  bbl: (b) => parseBlocks(b, 150),
  mbl: (b) => parseBlocks(b, 100),
  cbl: (b) => parseBlocks(b, 50),
  chr: parseCharacter,
  mon: parseMonsters,
  pal: parsePalette,
  his: parseHighScores,
  snd: parseSoundSet,
  rec: parseRecording,
  cmf: parseCmf,
  fli: parseFli,
  gif: decodeGif,
};

const at = (o: unknown, key: string): unknown => key.split('.').reduce<unknown>((v, k) => (v == null ? undefined : (v as Record<string, unknown>)[k]), o);

/** Fields in order, inside the file, never overlapping. */
function wellFormed(st: Structure, size: number): void {
  let end = 0;
  for (const f of st.fields) {
    expect(f.off).toBeGreaterThanOrEqual(end);
    expect(f.len).toBeGreaterThan(0);
    end = f.off + f.len;
  }
  expect(end).toBeLessThanOrEqual(size);
}

/** Checks every keyed value against the parser; returns how many were checked. */
function matchesParser(name: string, bytes: Uint8Array): number {
  const st = describe(name, bytes)!;
  expect(st, name).toBeDefined();
  wellFormed(st, bytes.length);
  const parsed = PARSERS[name.slice(name.lastIndexOf('.') + 1).toLowerCase()](bytes);
  let n = 0;
  const wrong: string[] = [];
  for (const leaf of leaves(st, bytes)) {
    if (!leaf.key) continue;
    const want = at(parsed, leaf.key);
    if (leaf.value !== want && wrong.length < 5) wrong.push(`${leaf.group} ${leaf.name} (${leaf.key}): ${leaf.value} != ${want}`);
    n++;
  }
  expect(wrong, name).toEqual([]);
  return n;
}

group('HEXEDIT structure maps', () => {
  for (const ext of Object.keys(PARSERS)) {
    const list = byExt(ext);
    it.skipIf(!list.length)(`.${ext} values match the parser`, () => {
      for (const f of list) {
        const bytes = new Uint8Array(readFileSync(f));
        if (ext === 'fli' && bytes.length === 16384) continue; // truncated on the CD image
        expect(matchesParser(f, bytes), f).toBeGreaterThan(0);
      }
    });
  }

  it('maps every byte of the fixed-size formats, with no gaps', () => {
    for (const ext of ['gam', 'map', 'bbl', 'mbl', 'cbl', 'chr', 'mon', 'pal', 'snd']) {
      for (const f of byExt(ext, 4)) {
        const bytes = new Uint8Array(readFileSync(f));
        const st = describe(f, bytes)!;
        expect(
          st.fields.reduce((n, x) => n + x.len, 0),
          f,
        ).toBe(bytes.length);
      }
    }
  });

  it('names the field under a byte (a .GAM scene, a map cell, a block attribute)', () => {
    const gamFile = byExt('gam')[0];
    const gam = new Uint8Array(readFileSync(gamFile));
    const st = describe('x.gam', gam)!;
    expect(leafAt(st, gam, 0)?.group).toBe('Signature');
    expect(leafAt(st, gam, 2)).toMatchObject({ group: 'Version', value: 300 });
    // scene 1's description, 23 bytes into its record
    const desc = leafAt(st, gam, 256 + 6 + 283 + 23 + 4)!;
    expect(desc).toMatchObject({ group: 'Description', key: 'scenes.1.desc', off: 256 + 6 + 283 + 23, len: 20 });
    expect(st.sections[st.sections.length - 1].name).toBe('SceneFiles pool');
    expect(desc.sect).toBe(st.sections.findIndex((s) => s.name.startsWith('Scene 1:')));

    const map = new Uint8Array(readFileSync(byExt('map')[0]));
    const ms = describe('x.map', map)!;
    expect(leafAt(ms, map, (3 * 100 + 12) * 2 + 1)).toMatchObject({ group: 'Map grid', name: 'Cell (12,3) monster', key: 'mons.312' });
    expect(leafAt(ms, map, 20000 + 10 * 7 + 4)).toMatchObject({ name: '[7] x', key: 'monsters.7.curx', len: 2 });

    const bbl = new Uint8Array(readFileSync(byExt('bbl')[0]));
    const bs = describe('x.bbl', bbl)!;
    expect(leafAt(bs, bbl, 420 * 5 + 405)).toMatchObject({ group: 'Solid sides', key: '5.solid' });
    expect(bs.sections[5]).toEqual({ name: 'Block 5', off: 2100 });
  });

  it('finds every frame of an .FLI where the player does', () => {
    for (const f of byExt('fli')) {
      const bytes = new Uint8Array(readFileSync(f));
      const frames = describe(f, bytes)!
        .sections.filter((s) => /^Frame \d+$/.test(s.name))
        .map((s) => s.off);
      expect(frames.slice(0, parseFli(bytes).frames.length), f).toEqual(parseFli(bytes).frames);
    }
  });

  it('walks a .VOC block by block and a .CMF event by event to their ends', () => {
    for (const f of byExt('voc')) {
      const bytes = new Uint8Array(readFileSync(f));
      const st = describe(f, bytes)!;
      wellFormed(st, bytes.length);
      const last = st.fields[st.fields.length - 1];
      expect(last.name === 'Block type' || last.off + last.len === bytes.length, f).toBe(true);
    }
    for (const f of byExt('cmf')) {
      const bytes = new Uint8Array(readFileSync(f));
      const st = describe(f, bytes)!;
      expect(
        st.fields.some((x) => x.name.endsWith('end of song')),
        f,
      ).toBe(true);
      expect(
        st.fields.some((x) => x.name === 'Unreadable event'),
        f,
      ).toBe(false);
    }
  });

  it('reads high scores, SAVNAMES.DAT and text files', () => {
    const his = serializeHighScores([
      { score: 12345, name: 'TEDDY' },
      { score: 99, name: 'GWINN' },
    ]);
    expect(matchesParser('teddy.his', his)).toBe(20);
    const names = new Uint8Array(210);
    names.set(
      [...'Forest'].map((c) => c.charCodeAt(0)),
      21,
    );
    const st = describe('SAVNAMES.DAT', names)!;
    const want = parseSlotNames(names);
    for (const l of leaves(st, names)) if (l.key) expect(l.value).toBe(want[Number(l.key)]);
    expect(leafAt(st, names, 22)).toMatchObject({ name: 'GAME1.SAV name', value: 'Forest' });
    const txt = new TextEncoder().encode('LINE ONE\r\nTWO\r\n\x1a');
    const ts = describe('readme.txt', txt)!;
    expect(ts.fields.map((f) => [f.name, f.len])).toEqual([
      ['Line 1', 10],
      ['Line 2', 5],
      ['End of file (Ctrl-Z)', 1],
    ]);
    expect(leafAt(ts, txt, 3)?.value).toBe('LINE ONE');
    expect(describe('thing.xyz', txt)).toBeUndefined();
  });

  it('marks a short file as cut short and extra bytes as extra', () => {
    const pal = new Uint8Array(770);
    const st = describe('x.pal', pal)!;
    expect(st.fields[st.fields.length - 1]).toMatchObject({ off: 768, len: 2, name: 'Extra bytes (past what the format holds)' });
    const short = describe('x.pal', new Uint8Array(100))!;
    expect(short.fields.map((f) => [f.off, f.len])).toEqual([
      [0, 99],
      [99, 1],
    ]);
  });
});
