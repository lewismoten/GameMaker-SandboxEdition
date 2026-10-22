import { describe, expect, it } from 'vitest';
import { GM_DISKS, GM_PRICE, SUPPORT, templateKeys } from '../src/manual/printables/gmInserts';

describe('Game-Maker box inserts', () => {
  it('prints only made-up 555 numbers', () => {
    for (const n of [SUPPORT.tech, SUPPORT.install, SUPPORT.sales, SUPPORT.fax, SUPPORT.faxback]) expect(n).toMatch(/555-01\d\d$/);
    expect(SUPPORT.bbs).toMatch(/555-/);
  });

  it('marks the $59.95 list price down to $48.00 at Bits & Bytes', () => {
    expect(GM_PRICE).toEqual({ msrp: '$59.95', store: 'Bits & Bytes Software', sale: '$48.00' });
  });

  it('ships the core software on floppies', () => {
    expect(GM_DISKS.map((d) => d.n)).toEqual([1, 2]);
  });

  it('lays the keyboard template out as Esc and F1-F12, with PLAYGAME keys where they exist', () => {
    const keys = templateKeys();
    expect(keys.map((k) => k.key)).toEqual(['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']);
    expect(keys.find((k) => k.key === 'F5')?.play).toBe('Save the game');
    expect(keys.find((k) => k.key === 'F2')?.play).toBe('Status');
    expect(keys.find((k) => k.key === 'F1')?.design).toBe('Help screen');
    expect(keys.find((k) => k.key === 'F7')?.play).toBeUndefined();
  });
});
