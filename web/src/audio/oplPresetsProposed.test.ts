// The eight presets proposed from the second archive survey (Distant Choir, Fuzz Stab, Whistle
// Lead, Wobble Organ (low), Low Brass Swell, Reed Swell, Steel Clank, Sparkle Bell): each is a
// valid patch, its preview is a Game-Maker CMF the song reader takes back with the patch as
// written, and it sounds through the engine's OPL2 and CMF player.
import { describe, expect, it } from 'vitest';
import { Opl2 } from '@lewismoten/gamemaker-sandbox-engine/audio/opl';
import { CmfPlayer, TICK_RATE } from '@lewismoten/gamemaker-sandbox-engine/audio/cmfPlayer';
import { parseCmf } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { readSong } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import { presetById } from './oplPresets';
import { validPatch } from './oplPatch';
import { presetPreview } from './oplPresetPreview';

const PROPOSED = ['choir-distant', 'fuzz-stab', 'whistle-lead', 'organ-wobble', 'brass-swell', 'reed-swell', 'steel-clank', 'sparkle-bell'];
const SR = 11025;

function rms(bytes: Uint8Array, seconds: number): number {
  const cmf = parseCmf(bytes);
  const opl = new Opl2(SR);
  const player = new CmfPlayer(opl);
  player.load(cmf.music, cmf.instruments);
  const out = new Float32Array(Math.round(seconds * SR));
  const perTick = Math.round(SR / TICK_RATE);
  for (let i = 0; i < out.length; i += perTick) {
    player.tick();
    opl.render(out.subarray(i, Math.min(out.length, i + perTick)));
  }
  let e = 0;
  for (const v of out) e += v * v;
  return Math.sqrt(e / out.length);
}

describe('proposed presets from the archive survey', () => {
  it.each(PROPOSED)('%s parses and renders', (id) => {
    const p = presetById(id);
    expect(p, id).toBeDefined();
    expect(validPatch(p!.patch)).toBe(true);
    const { bytes, seconds } = presetPreview(p!);
    const song = readSong(bytes);
    expect([...song.instruments[0].subarray(0, 11)]).toEqual([...p!.patch.subarray(0, 11)]);
    expect(song.notes.length).toBeGreaterThan(0);
    expect(rms(bytes, seconds)).toBeGreaterThan(0.002);
  });
});
