// The diagnostic stays a real nine-voice CMF, not sixteen MIDI slots mistaken for OPL2 voices.
import { parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { describe, expect, it } from 'vitest';
import { parseCmf } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { buildSong, bandEvents, LOOP_TICKS } from '../../games/kit/testdisks/sound-stress/audio';

import { buildEffects, EFFECTS } from '../../games/kit/testdisks/sound-stress/effects';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';

import { makeDisk } from '../../games/kit/testdisks/sound-stress/disk';
import { GameSim } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { StarterBot } from '../../games/kit/starter/bot';

it('initializes each text-list palette with a paper GIF before DOS matches its text ink', () => {
  const disk = makeDisk('unused');
  for (const base of ['howto', 'credits']) {
    const entries = parseSlideList(disk.files.get(`${base}.lst`)!);
    expect(entries.map((entry) => entry.name)).toEqual(['paper.gif', `${base}.txt`]);
    expect(disk.files.has(entries[0].name)).toBe(true);
  }
});

it('builds the same standalone disk twice and plays both rooms, pads, score and reset doors', async () => {
  const a = makeDisk('unused');
  expect(a.files).toEqual(makeDisk('unused').files);
  const sim = new GameSim(a.files);
  const bot = new StarterBot(sim);
  expect(sim.scene).toBe(2);
  expect(await bot.walk(62)).toBe('link');
  expect(sim.scene).toBe(3);
  const heard: number[] = [];
  const original = sim.w.sound.play.bind(sim.w.sound);
  sim.w.sound.play = (n) => {
    heard.push(n);
    return original(n);
  };
  expect(await bot.walk(36)).toBeUndefined();
  expect(sim.clip?.name).toBe('five');
  expect(await bot.walk(38)).toBeUndefined();
  expect(heard).toContain(5);
  expect(sim.clip?.name).toBe('five');
  expect(await bot.walk(56)).toBeUndefined();
  for (const n of [2, 3, 7, 8, 5]) expect(heard).toContain(n);
  expect(heard.filter((n) => n === 7)).toHaveLength(3);
  expect(await bot.walk(62)).toBe('link');
  expect(sim.scene).toBe(2);
  expect(sim.deaths).toBe(0);
  expect(new TextDecoder().decode(a.files.get('howto.txt'))).toContain('.for-lewis/86box/README.md');
  for (const file of ['howto.txt', 'credits.txt'])
    expect(
      new TextDecoder()
        .decode(a.files.get(file))
        .split(/\r?\n/)
        .every((line) => line.length <= 30),
    ).toBe(true);
}, 20000);

it('makes deterministic 0.25s, 1s, 5s and exact 64KiB boundary VOCs plus an independent score sound', () => {
  const a = buildEffects();
  const b = buildEffects();
  expect(a.vocs).toEqual(b.vocs);
  expect(EFFECTS.map((p) => a.vocs[p.name].length)).toEqual([2789, 11058, 55158, 65536]);
  for (const pad of EFFECTS) {
    const voc = decodeVoc(a.vocs[pad.name]);
    expect(voc.sampleRate).toBe(10989);
    expect(voc.samples.length).toBe(a.vocs[pad.name].length - 33);
    expect(a.sounds.digital[pad.sound]).toBe(pad.name);
  }
  expect(a.sounds.digital[5]).toBe('');
  expect(a.sounds.freqs[5].some((n) => n > 0)).toBe(true);
});

describe('sound stress band', () => {
  it('fills all nine melodic voices together and releases every note across a 32-bar loop', () => {
    const cmf = parseCmf(buildSong());
    expect(cmf.clockTicks).toBe(146);
    expect(cmf.ticksPerBeat).toBe(48);
    expect(LOOP_TICKS).toBe(32 * 4 * 48);
    expect([...cmf.channelUsed]).toEqual([...Array<number>(9).fill(1), ...Array<number>(7).fill(0)]);
    expect(new Set(cmf.instruments.map((x) => [...x].join(','))).size).toBe(9);
    const active = new Set<number>();
    let peak = 0;
    let starts = 0;
    for (const event of bandEvents()) {
      const [status] = event.data;
      if ((status & 0xf0) === 0x90) {
        active.add(status & 15);
        starts++;
      }
      if ((status & 0xf0) === 0x80) active.delete(status & 15);
      peak = Math.max(peak, active.size);
    }
    expect(peak).toBe(9);
    expect(active.size).toBe(0);
    expect(starts).toBeGreaterThan(1500);
    expect(bandEvents().at(-1)?.tick).toBe(LOOP_TICKS);
  });
});
