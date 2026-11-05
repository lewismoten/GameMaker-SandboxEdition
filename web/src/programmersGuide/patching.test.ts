// The "Patching the player" chapter reads its numbers from patchTable.ts and the CD's XFERPLAY.EXE: counts, offsets and stock bytes can't drift.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PATCHES, type PatchEntry } from '@lewismoten/gamemaker-sandbox-engine/player/patchTable';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const text = readFileSync(join(here, 'chapters/patching.md'), 'utf8');
const exePath = join(root, 'cd/gm/xferplay.exe');

const offsetsOf = (e: PatchEntry): number[] => {
  if ('offsets' in e) return e.offsets;
  if ('fields' in e) return e.fields.map((f) => f.offset);
  return [e.offset];
};

describe('the patching chapter', () => {
  it('states the entry, group and kind counts of the table', () => {
    expect(text).toContain(`${PATCHES.length} entries`);
    for (const g of ['words', 'colors', 'frames', 'positions', 'times', 'keys']) {
      const n = PATCHES.filter((p) => p.group === g).length;
      expect(text, g).toMatch(new RegExp(`\\| ${g}\\s+\\|\\s+${n} \\|`));
    }
    for (const k of ['text', 'format', 'number', 'rgb', 'select', 'frame', 'fkey']) {
      const n = PATCHES.filter((p) => p.kind === k).length;
      expect(text, k).toMatch(new RegExp(`\\| \`${k}\`\\s+\\|\\s+${n} \\|`));
    }
    expect(text).toContain(`${PATCHES.filter((p) => p.safety === 'caution').length} are \`caution\``);
  });

  it('lists the offsets of its example entries as the table has them, and their stock bytes as the file has them', () => {
    const rows = [...text.matchAll(/^\| `([a-z.A-Z0-9]+)`\s+\| `(\w+)`\s+\| `((?:0x[0-9a-f]+ ?)+)`\s*\| (.+?)\s+\|/gm)];
    expect(rows.length).toBe(7);
    const exe = existsSync(exePath) ? readFileSync(exePath) : undefined;
    for (const [, id, kind, offs, bytes] of rows) {
      const e = PATCHES.find((p) => p.id === id)!;
      expect(e, id).toBeDefined();
      expect(e.kind).toBe(kind);
      const listed = [...offs.matchAll(/0x([0-9a-f]+)/g)].map((m) => parseInt(m[1], 16));
      expect(listed, id).toEqual(offsetsOf(e));
      if (!exe) continue;
      // every run of hex pairs in backticks (the first run of each is the stock bytes at the first offset)
      const first = /`((?:[0-9A-F]{2} ?)+)`/.exec(bytes);
      if (first && (e.kind === 'text' || e.kind === 'select' || e.kind === 'fkey')) {
        const want = first[1]
          .trim()
          .split(' ')
          .map((h) => parseInt(h, 16));
        expect([...exe.subarray(listed[0], listed[0] + want.length)], id).toEqual(want);
      }
    }
  });

  it('cites a real size and checksum', () => {
    expect(text).toContain('160,598');
    expect(text).toContain('fcaf47d50ececa0b59cd22b3fae3cda3');
  });

  it('teaches no registration offsets and names no studio', () => {
    expect(text).not.toMatch(/keygen|RESERIAL|CHKREG/i);
    expect(text).not.toMatch(/Acord|A-J Games|Virtual Mario/);
  });
});
