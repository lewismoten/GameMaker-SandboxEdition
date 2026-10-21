// Tests: Playing CMF music through the OPL2 emulation (audio/cmfPlayer.ts, audio/opl.ts).
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCmf, CMF_GAMEMAKER_CLOCK } from '../src/formats/cmf';
import { Opl2 } from '../src/audio/opl';
import { CmfPlayer, TICK_RATE } from '../src/audio/cmfPlayer';

const song = resolve(__dirname, '../../cd/gameware/sample/gmsong1.cmf');

describe('cmf music', () => {
  it.skipIf(!existsSync(song))('renders a sample song to audible, finite audio', () => {
    const cmf = parseCmf(new Uint8Array(readFileSync(song)));
    expect(cmf.clockTicks).toBe(CMF_GAMEMAKER_CLOCK);
    expect(cmf.instruments.length).toBeGreaterThan(0);

    const rate = 22050;
    const opl = new Opl2(rate);
    const player = new CmfPlayer(opl);
    player.load(cmf.music, cmf.instruments);
    const out = new Float32Array(rate * 4);
    const perTick = rate / TICK_RATE;
    let next = 0;
    for (let i = 0; i < out.length; i += 64) {
      while (next <= i) {
        player.tick();
        next += perTick;
      }
      opl.render(out.subarray(i, i + 64));
    }
    let peak = 0;
    for (const v of out) {
      expect(Number.isFinite(v)).toBe(true);
      peak = Math.max(peak, Math.abs(v));
    }
    expect(peak).toBeGreaterThan(0.01);
    expect(peak).toBeLessThan(4);
  });
});
