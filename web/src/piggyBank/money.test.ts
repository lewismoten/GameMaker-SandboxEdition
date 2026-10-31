// The piggy bank remembers only a sane, visible amount and leaves the record backup-friendly.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const saves: Record<string, Record<string, Uint8Array>> = {};
vi.mock('../project/storage', () => ({
  loadSaveData: async (id: string) => ({ ...(saves[id] ?? {}) }),
  writeSaveFile: async (id: string, name: string, bytes: Uint8Array) => void ((saves[id] ??= {})[name] = bytes),
}));

import { FILE, SAVE_ID, loadMoney, parseMoney, recordMoney } from './money';

beforeEach(() => {
  for (const id of Object.keys(saves)) delete saves[id];
});

describe('piggy-bank money', () => {
  it('keeps each winning game’s visible money and clamps bad amounts', async () => {
    await recordMoney('teddy', 17);
    await recordMoney('realm', 8.9);
    await recordMoney('teddy', -4);
    expect(await loadMoney()).toEqual({ teddy: 0, realm: 8 });
    expect(saves[SAVE_ID][FILE]).toBeDefined();
  });

  it('drops malformed saved entries without discarding good ones', () => {
    const bytes = new TextEncoder().encode('{"teddy":12,"bad":-1,"also":"no","fraction":3.8}');
    expect(parseMoney(bytes)).toEqual({ teddy: 12, fraction: 3 });
    expect(parseMoney(new TextEncoder().encode('nope'))).toEqual({});
  });
});
