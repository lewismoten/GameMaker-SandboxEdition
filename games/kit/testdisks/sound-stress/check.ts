// Checks actual native output, independent rebuilds, real movement, nine OPL2 voices and two loops.
// Optional --out <private evidence dir> writes actual engine frames and a software-OPL WAV.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { parseCmf } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { renderWorld } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { Opl2 } from '@lewismoten/gamemaker-sandbox-engine/audio/opl';
import { CmfPlayer, TICK_RATE } from '@lewismoten/gamemaker-sandbox-engine/audio/cmfPlayer';
import { StarterBot } from '../../starter/bot';
import { makeDisk } from './disk';
import { LOOP_TICKS } from './audio';

const outIndex = process.argv.indexOf('--out');
const out = outIndex < 0 ? undefined : process.argv[outIndex + 1];
if (out) mkdirSync(out, { recursive: true });
const here = import.meta.dirname;
const temp = mkdtempSync(join(tmpdir(), 'sound-stress-check-'));
try {
  const source = readDisk(join(here, 'disk'));
  for (const name of ['a', 'b']) {
    const rebuilt = makeDisk(join(temp, name));
    rebuilt.write();
    assert.deepEqual(readDisk(rebuilt.dir), source);
  }
  const sim = new GameSim(source);
  const bot = new StarterBot(sim);
  const ctx = { createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }) };
  const screen = new Screen({ getContext: () => ctx } as unknown as HTMLCanvasElement);
  screen.setPalette(parsePalette(source.get('test.pal')!));
  const shot = (name: string) => {
    if (!out) return;
    renderWorld(screen, sim.w);
    const pixels = new Pixels(320, 200);
    pixels.px.set(screen.pixels);
    writePng(join(out, name + '.png'), pixels, screen.palette, 2);
  };
  await bot.land();
  shot('band-start');
  for (const x of [16, 24, 32, 42, 52]) {
    assert.equal(await bot.walk(x), undefined);
    shot(`band-${x}`);
  }
  assert.equal(await bot.walk(62), 'link');
  assert.equal(sim.scene, 3);
  await bot.land();
  shot('effects-start');
  for (const x of [14, 24, 34, 38, 44, 56]) {
    assert.equal(await bot.walk(x), undefined);
    shot(`effects-${x}`);
  }
  assert.equal(await bot.walk(62), 'link');
  assert.equal(sim.scene, 2);
  assert.equal(sim.deaths, 0);
  const cmf = parseCmf(source.get('band.cmf')!);
  const opl = new Opl2(8000);
  const player = new CmfPlayer(opl);
  player.load(cmf.music, cmf.instruments);
  const pcm: number[] = [];
  let peakVoices = 0;
  let energy = 0;
  for (let tick = 0; tick < LOOP_TICKS * 2 + 16; tick++) {
    player.tick();
    const voices = Array.from({ length: 9 }, (_, n) => Number(!!(opl.read(0xb0 + n) & 32))).reduce((a, b) => a + b, 0);
    peakVoices = Math.max(peakVoices, voices);
    const frame = new Float32Array(Math.floor(((tick + 1) * 8000) / TICK_RATE) - Math.floor((tick * 8000) / TICK_RATE));
    opl.render(frame);
    for (const value of frame) {
      assert.ok(Number.isFinite(value));
      energy += value * value;
      if (out) pcm.push(Math.max(-32768, Math.min(32767, Math.round(value * 32767))));
    }
  }
  assert.equal(peakVoices, 9);
  assert.ok(energy > 1);
  assert.ok(player.playing);
  if (out) {
    const wav = Buffer.alloc(44 + pcm.length * 2);
    wav.write('RIFF', 0);
    wav.writeUInt32LE(wav.length - 8, 4);
    wav.write('WAVEfmt ', 8);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(8000, 24);
    wav.writeUInt32LE(16000, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write('data', 36);
    wav.writeUInt32LE(pcm.length * 2, 40);
    pcm.forEach((sample, i) => wav.writeInt16LE(sample, 44 + i * 2));
    writeFileSync(join(out, 'software-opl-two-loops.wav'), wav);
    writeFileSync(join(out, 'howto.txt'), readFileSync(join(here, 'disk/howto.txt')));
  }
  console.log(
    JSON.stringify({
      pass: true,
      files: source.size,
      reproducibleBuilds: 2,
      trail: sim.trail,
      deaths: sim.deaths,
      peakOpl2Voices: peakVoices,
      renderedMusicTicks: LOOP_TICKS * 2 + 16,
      softwareOplEnergy: energy,
      hardwareTimingVerified: false,
    }),
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
