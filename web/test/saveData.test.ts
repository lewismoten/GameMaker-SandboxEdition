// Tests: the save editors' core (project/saveData): saves, slot names and high-score files read
// and written back byte for byte, field limits, Max all, and labels from a game's own files.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import {
  changedFields,
  cloneSave,
  fieldWarnings,
  gameLabels,
  getField,
  highScoreFileName,
  highScoreWarnings,
  maxAll,
  parseHighScoreTable,
  parseSave,
  parseSlotNames,
  saveFields,
  SaveFormatError,
  serializeHighScoreTable,
  serializeSave,
  serializeSlotNames,
  setField,
  sortHighScores,
  slotOfFile,
  summarize,
  UNLIMITED,
} from '../src/project/saveData';
import { INF_REPEAT } from '../src/formats/character';

const root = join(__dirname, '..', '..');
const fixtures = join(__dirname, 'fixtures', 'saves');
const saves = readdirSync(fixtures).filter((f) => f.endsWith('.sav'));
const read = (f: string) => new Uint8Array(readFileSync(f));

/** A game's disk as a file source (names as the .gam writes them, any case). */
function disk(id: string) {
  const dir = join(root, 'games', id, 'disk');
  const byName = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), join(dir, n)]));
  return { get: (n: string) => (byName.has(n.toLowerCase()) ? read(byName.get(n.toLowerCase())!) : undefined) };
}

describe('saved games', () => {
  it('read and write back byte for byte (real saves)', () => {
    expect(saves.length).toBeGreaterThan(0);
    for (const f of saves) {
      const bytes = read(join(fixtures, f));
      expect(Buffer.from(serializeSave(parseSave(bytes))).equals(Buffer.from(bytes)), f).toBe(true);
    }
  });

  it('refuses what is not a save', () => {
    expect(() => parseSave(new Uint8Array([0x4d, 0x5a, 1, 2]))).toThrow(SaveFormatError);
    expect(() => parseSave(new TextEncoder().encode('{"a":1}'))).toThrow(SaveFormatError);
  });

  it('knows its slot names', () => {
    expect(slotOfFile('game3.sav')).toBe(3);
    expect(slotOfFile('GAME0.SAV')).toBe(0);
    expect(slotOfFile('data1.rec')).toBeUndefined();
  });

  it('edits only what was edited', () => {
    const bytes = read(join(fixtures, 'maximus-game0.sav'));
    const save = parseSave(bytes);
    const before = cloneSave(save);
    setField(save, 'score', 1234);
    setField(save, 'lives', 9);
    expect(changedFields(before, save).sort()).toEqual(['lives', 'score']);
    const again = parseSave(serializeSave(save));
    expect(getField(again, 'score')).toBe(1234);
    expect(again.world.ci.lives).toBe(9);
    // the rest of the file is untouched
    const strip = (s: string) => s.replace(/"score":\d+/, '').replace(/"lives":\d+/, '');
    expect(strip(new TextDecoder().decode(serializeSave(save)))).toBe(strip(new TextDecoder().decode(bytes)));
  });

  it('shows money and counters without their stored +1, and clamps to what they hold', () => {
    const save = parseSave(read(join(fixtures, 'sandcast-game0.sav')));
    expect(save.world.ci.meter[3]).toBe(2);
    expect(getField(save, 'money')).toBe(1);
    expect(getField(save, 'counter:2')).toBe(198);
    setField(save, 'counter:2', 5);
    expect(save.world.ci.meter[21]).toBe(6);
    setField(save, 'money', 99999);
    expect(save.world.ci.meter[3]).toBe(INF_REPEAT - 1);
    setField(save, 'hitpts', 1e9);
    expect(save.world.ci.hitpts).toBe(32767);
    expect(fieldWarnings(save, saveFields(save).find((f) => f.id === 'hitpts')!).length).toBeGreaterThan(0);
    setField(save, 'counter:3', UNLIMITED);
    expect(save.world.ci.meter[22]).toBe(INF_REPEAT);
    expect(getField(save, 'counter:3')).toBe(UNLIMITED);
  });

  it('leaves out money a game has none of, and sequences the character lacks', () => {
    const save = parseSave(read(join(fixtures, 'blaster-game0.sav')));
    const ids = saveFields(save).map((f) => f.id);
    expect(ids).not.toContain('money');
    expect(ids).toContain('uses:5');
    expect(ids.filter((i) => i.startsWith('inv:'))).toHaveLength(10);
  });

  it('Max all raises counting values to the safe top and leaves unlimited ones', () => {
    const save = parseSave(read(join(fixtures, 'maximus-game0.sav')));
    const changed = maxAll(save);
    expect(changed).toContain('score');
    expect(save.world.ci.score).toBe(999_999_999);
    expect(save.world.ci.lives).toBe(32000);
    expect(save.world.ci.meter[10]).toBe(INF_REPEAT - 1); // a limited sequence
    expect(save.world.ci.meter[2]).toBe(INF_REPEAT); // unused meter left alone
    for (const f of saveFields(save)) expect(fieldWarnings(save, f).filter((w) => w.startsWith('Above'))).toEqual([]);
  });
});

describe('labels from the game', () => {
  it('names levels, sequences, items, and counts counter blocks', () => {
    const save = parseSave(read(join(fixtures, 'maximus-game0.sav')));
    const labels = gameLabels(disk('maximus'), 'maximus.gam')!;
    expect(labels).toBeDefined();
    expect(labels.sceneName(save.doscene)).toBeTruthy();
    expect(labels.blocks(save.doscene)).toHaveLength(150);
    expect(labels.palette(save.doscene)).toHaveLength(768);
    const chr = labels.character(save.doscene)!;
    expect(chr.sequences).toHaveLength(20);
    const fields = saveFields(save, labels);
    expect(fields.find((f) => f.id === 'scene')!.note).toContain(labels.sceneName(save.doscene)!);
    expect(fields.find((f) => f.id === 'counter:1')!.label).toMatch(/\(\d+ blocks?\)/);
    expect([...labels.counterUse.keys()].every((k) => k > 2 && k < 30)).toBe(true);
    const blaster = gameLabels(disk('blaster'), 'blaster.gam')!;
    const bsave = parseSave(read(join(fixtures, 'blaster-game0.sav')));
    expect(saveFields(bsave, blaster).find((f) => f.id === 'counter:1')!.label).toBe('Counter 1 (unused)');
    expect(saveFields(bsave, blaster).find((f) => f.id === 'uses:5')!.label).toBe('Sequence 5 (Space)');
    // an item tied to a sequence turns it on and off
    const tied = chr.sequences.findIndex((s) => s.bloc !== 150);
    if (tied >= 0) {
      setField(save, 'inv:9', chr.sequences[tied].bloc, labels);
      expect(save.world.ci.seqon[tied]).toBe(true);
      setField(save, 'inv:9', 150, labels);
      if (!save.world.ci.inv.includes(chr.sequences[tied].bloc)) expect(save.world.ci.seqon[tied]).toBe(false);
    }
  });
});

describe('slot names', () => {
  it('keep a name’s bytes unless it changes', () => {
    const raw = new Uint8Array(210).fill(0x41);
    for (let i = 0; i < 10; i++) raw[i * 21 + 5] = 0; // "AAAAA", then junk after the NUL
    expect(parseSlotNames(raw)[0]).toBe('AAAAA');
    expect(Buffer.from(serializeSlotNames(parseSlotNames(raw), raw)).equals(Buffer.from(raw))).toBe(true);
    const names = parseSlotNames(raw);
    names[2] = 'Castle';
    const out = serializeSlotNames(names, raw);
    expect(parseSlotNames(out)[2]).toBe('Castle');
    expect(Buffer.from(out.subarray(0, 42)).equals(Buffer.from(raw.subarray(0, 42)))).toBe(true);
    expect(parseSlotNames(undefined)).toEqual(new Array(10).fill(''));
  });
});

describe('high-score files', () => {
  const his = execSync('git ls-files "*.his" "*.HIS"', { cwd: root }).toString().trim().split('\n').filter(Boolean);

  it('read and write back byte for byte (every .his in the repo)', () => {
    expect(his.length).toBeGreaterThan(5);
    for (const f of his) {
      const bytes = read(join(root, f));
      if (bytes.length !== 340) continue;
      expect(Buffer.from(serializeHighScoreTable(parseHighScoreTable(bytes))).equals(Buffer.from(bytes)), f).toBe(true);
    }
  });

  it('changes only the entry edited', () => {
    const bytes = read(join(root, 'cd/gameware/volume/volume.his'));
    const t = parseHighScoreTable(bytes);
    expect(t.entries[0].name).toBe('Andy');
    t.entries[3] = { score: 777, name: 'Teddy' };
    const out = serializeHighScoreTable(t);
    expect(out.length).toBe(340);
    for (let i = 0; i < 340; i++) if (i < 3 * 34 || i >= 4 * 34) expect(out[i], `byte ${i}`).toBe(bytes[i]);
    expect(parseHighScoreTable(out).entries[3]).toEqual({ score: 777, name: 'Teddy' });
  });

  it('sorts, names the file and warns', () => {
    expect(highScoreFileName('NEBULA.GAM')).toBe('nebula.his');
    expect(sortHighScores([{ score: 5, name: 'a' }, { score: 9, name: 'b' }, { score: 5, name: 'c' }]).map((e) => e.name)).toEqual(['b', 'a', 'c']);
    expect(highScoreWarnings({ score: 100, name: 'x'.repeat(25) })).toHaveLength(1);
    expect(highScoreWarnings({ score: 100, name: 'Gwinn' })).toEqual([]);
  });
});

describe('backups', () => {
  it('summarize lists slots and size', () => {
    const s = summarize({ id: 'a', game: 'game:x', when: 1, label: 'L', files: { 'game2.sav': new Uint8Array(3), 'savnames.dat': new Uint8Array(210), 'game0.sav': new Uint8Array(1) } });
    expect(s.slots).toEqual([0, 2]);
    expect(s.bytes).toBe(214);
    expect('files' in s).toBe(false);
  });
});
