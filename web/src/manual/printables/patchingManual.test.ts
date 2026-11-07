// Keep the printed patch directory in step with the engine's fields and the supplied DOS binaries.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { PATCHES, type NumberPatch } from '@lewismoten/gamemaker-sandbox-engine/player/patchTable';
import { frameLimit, readPatch } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';
import { EXT_KINDS } from '@lewismoten/gamemaker-sandbox-engine/player/fileExtensions';
import { applyPlayerPatches } from '@lewismoten/gamemaker-sandbox-archives/player/applyPatches';
import { patchingManualChapters, patchingManualItem } from './patchingManual';
import { PATCHING_DIAGRAMS } from './patchingPlates';
import { blockText, readMarkdown } from './markdownBlocks';

const root = resolve(import.meta.dirname, '../../../..');
const text = readFileSync(resolve(root, 'web/src/programmersGuide/patching1994.md'), 'utf8');
const exe = new Uint8Array(readFileSync(resolve(root, 'cd/gm/xferplay.exe')));
const sections = readMarkdown(text);
const offset = (o: number) => `${o.toString(16).toUpperCase().padStart(5, '0')}h`;
const bytes = (o: number, n: number) => [...exe.slice(o, o + n)].map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

describe('Player Patching Manual', () => {
  it('keeps all chapters, plates and the verification boundary', () => {
    expect(patchingManualChapters(text)).toHaveLength(15);
    expect(patchingManualItem().id).toBe('patching');
    expect([...text.matchAll(/^\[diagram: (\w+)\]$/gm)].map((m) => m[1]).sort()).toEqual(Object.keys(PATCHING_DIAGRAMS).sort());
    expect(text).toContain('have not been run under DOS');
    expect(text).toContain('Inference from the signed-byte accumulators');
    expect(text).not.toMatch(/\bNUL\b|\bweb\b|\bbrowser\b|\bhe\b|PG:\d/);
  });

  it('prints every field with its offsets, widths, stock bytes and limits', () => {
    expect(exe.length).toBe(160598);
    expect(createHash('md5').update(exe).digest('hex')).toBe('fcaf47d50ececa0b59cd22b3fae3cda3');
    const blocks = sections.flatMap((s) => s.blocks);
    const labels = blocks.map(blockText);
    expect([...text.matchAll(/^\*\*([^*]+)\*\* — /gm)].map((m) => m[1])).toEqual(PATCHES.map((e) => e.id));
    for (const e of PATCHES) {
      const start = labels.findIndex((s) => s.startsWith(`${e.id} — `));
      expect(start, e.id).toBeGreaterThanOrEqual(0);
      const table = blocks.slice(start + 1).find((b) => b.tag === 'table');
      if (!table || table.tag !== 'table') throw new Error(e.id);
      const rows = table.rows.map((r) => r.map((c) => blockText({ tag: 'p', kids: c })));
      let fields: { offset: number; size: number; rule: string }[];
      if (e.kind === 'text' || e.kind === 'format') {
        fields = [{ offset: e.offset, size: e.length, rule: `0–${e.length} characters; ${e.kind} rule` }];
        expect(exe[e.offset + e.length], e.id).toBe(0);
      } else if (e.kind === 'number') fields = e.fields.map((f) => ({ ...f, rule: `${e.min}–${e.max}${f.negate ? '; negative copy' : ''}` }));
      else if (e.kind === 'rgb') fields = e.offsets.map((o, i) => ({ offset: o, size: 1, rule: `${['R', 'G', 'B'][i]} 0–63` }));
      else if (e.kind === 'frame') fields = e.fields.map((f, i) => ({ ...f, rule: `${['Left', 'Top', 'Right', 'Bottom'][i]} 0–${frameLimit(e, i)}` }));
      else
        fields = [
          { offset: e.offset, size: 2, rule: e.kind === 'select' ? 'Listed color target only' : `On: ${e.stock.toString(16).toUpperCase()}h; off: 28F9h` },
        ];
      expect(rows, e.id).toEqual(fields.map((f) => [offset(f.offset), String(f.size), bytes(f.offset, f.size), f.rule]));
      expect(readPatch(exe, e), e.id).toEqual(e.kind === 'fkey' ? 'on' : typeof e.stock === 'string' ? e.stock.trimEnd() : e.stock);
    }
  });

  it('locates every extension copy at its dot with its NULL intact', () => {
    for (const k of EXT_KINDS)
      for (const o of k.offsets) {
        expect(text).toContain(offset(o));
        expect(String.fromCharCode(...exe.slice(o, o + 5))).toBe(`.${k.ext}\0`);
      }
  });

  it('checks the separately printed PLAYGAME operands against that executable', () => {
    const play = new Uint8Array(readFileSync(resolve(root, 'cd/gm/playgame.exe')));
    expect(play.length).toBe(163130);
    const table = sections.find((s) => s.title.startsWith('14.'))!.blocks.find((b) => b.tag === 'table')!;
    if (table.tag !== 'table') throw new Error('Missing PLAYGAME directory');
    for (const row of table.rows) {
      const name = blockText({ tag: 'p', kids: row[0] });
      const e = PATCHES.find((p) => p.id === `play.${name}`) as NumberPatch;
      const fields = [...blockText({ tag: 'p', kids: row[1] }).matchAll(/(-?)([0-9A-F]+)h/g)];
      expect(fields.length, name).toBe(e.fields.length);
      const moved = {
        ...e,
        fields: fields.map((m, i) => ({ offset: parseInt(m[2], 16), size: e.fields[i].size, ...(m[1] ? { negate: true as const } : {}) })),
      };
      expect(readPatch(play, moved), name).toBe(e.stock);
    }
  });

  it('checks the Sandbox workshop bytes in memory without changing a game', () => {
    for (const [id, name] of [
      ['loaf', 'LOAF.EXE'],
      ['loofah', 'LOOFAH.EXE'],
    ]) {
      const about = JSON.parse(readFileSync(resolve(root, `games/${id}/about.json`), 'utf8')) as { exe: string; secret?: boolean };
      expect(about.secret).not.toBe(true);
      expect(about.exe).toBe(name);
    }
    const out = applyPlayerPatches(exe, {
      'str.menu.play': 'Roll',
      'str.invent.hitpoints': 'Energy: %d',
      'layout.menu.play.x': 88,
      'color.select.menu': 'purple',
      'timing.saveMessage': 5,
    });
    expect(String.fromCharCode(...out.slice(0x2575b, 0x25760))).toBe('Roll\0');
    expect([...out.slice(0x25b59, 0x25b66)]).toEqual([0x45, 0x6e, 0x65, 0x72, 0x67, 0x79, 0x3a, 0x20, 0x25, 0x64, 0x20, 0x20, 0x20]);
    expect(out[0x25b66]).toBe(0);
    expect(out[0xb6be]).toBe(0x58);
    expect([...out.slice(0xaf84, 0xaf86)]).toEqual([0x78, 0x02]);
    expect(out[0xdcf6]).toBe(5);
    const allowed = new Set([0x2575b, 0x2575c, 0x2575d, 0x2575e, ...Array.from({ length: 13 }, (_, i) => 0x25b59 + i), 0xb6be, 0xaf84, 0xaf85, 0xdcf6]);
    expect(out.every((b, i) => b === exe[i] || allowed.has(i))).toBe(true);
    const speed = applyPlayerPatches(exe, { 'play.maxSpeed': 9 });
    expect([speed[0xf507], speed[0xf512], ...speed.slice(0xf518, 0xf51a)]).toEqual([9, 247, 247, 255]);
  });
});
