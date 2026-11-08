// PATCHING.TXT fits 79 columns in CP437, names only tools that exist on the desk, keeps its three rules and teaches no registration.
import { describe, expect, it } from 'vitest';
import { toCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import { DIZ_LINES, DIZ_WIDTH } from '../bbs/fileId';
import { WAREZ } from '../bbs/warezList';
import { PATCHING_DIZ, PATCHING_TXT } from './patchingText';

const all = PATCHING_TXT.join('\n');

describe('PATCHING.TXT', () => {
  it('fits 79 columns and CP437', () => {
    for (const l of PATCHING_TXT) {
      expect(l.length, l).toBeLessThanOrEqual(79);
      expect(
        [...l].every((c) => toCp437(c).charCodeAt(0) <= 255),
        l,
      ).toBe(true);
    }
    expect(PATCHING_DIZ.length).toBeLessThanOrEqual(DIZ_LINES);
    for (const l of PATCHING_DIZ) expect(l.length, l).toBeLessThanOrEqual(DIZ_WIDTH);
  });

  it('names HEXEDIT and PLAYHACK, which exist on the desk', () => {
    expect(all).toContain('HEXEDIT.EXE');
    expect(all).toContain('PLAYHACK.EXE');
    expect(WAREZ.find((r) => r.id === 'playhack')!.files.some((f) => f.name === 'PLAYHACK.EXE')).toBe(true);
    expect(WAREZ.find((r) => r.id === 'patching')!.files[0].name).toBe('PATCHING.TXT');
  });

  it('says back up first, same length, your own copy and no registration', () => {
    expect(all).toMatch(/BACK UP FIRST/);
    expect(all).toMatch(/SAME LENGTH/);
    expect(all).toMatch(/YOUR game, only YOUR copy|Only YOUR game/);
    expect(all).toMatch(/Registration is NOT in this file/);
  });

  it('has no registration offsets, serials or real names', () => {
    expect(all).not.toMatch(/keygen|serial|CHKREG|0x[0-9a-f]{4}/i);
    expect(all).not.toMatch(/Acord|A-J|Virtual Mario|Builder|Rodip/);
  });
});
