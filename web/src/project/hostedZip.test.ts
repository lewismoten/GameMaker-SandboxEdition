// hostedZip's check for the CD's own player: it must agree with adoptPlayer's md5 test, or a hand-edited player would be missed.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { onlyStockPlayers } from './hostedZip';

const path = new URL('../../../cd/gm/xferplay.exe', import.meta.url);
const stock = existsSync(path) ? new Uint8Array(readFileSync(path)) : undefined;

describe('onlyStockPlayers', () => {
  it.skipIf(!stock)('accepts the CD player and nothing else of its size', async () => {
    expect(await onlyStockPlayers([{ bytes: stock! }])).toBe(true);
    const edited = stock!.slice();
    edited[1000] ^= 1;
    expect(await onlyStockPlayers([{ bytes: stock! }, { bytes: edited }])).toBe(false);
  });
  it('ignores programs that are not the size of a player', async () => {
    expect(await onlyStockPlayers([{ bytes: new Uint8Array(100) }])).toBe(true);
  });
});
