// Exercise the real scene loop: VOC reads stall gameplay and delay the sample, not FM's timer.
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { GameAborted, Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { Recorder } from '@lewismoten/gamemaker-sandbox-engine/engine/recorder';
import { playScene, type Session } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { SPEED_PRESETS, TURBO_OFF, vocStallMs, type PcCosts } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPc';
import { newCharInfo } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { parseCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { newSoundSet, serializeSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { encodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { GameFiles } from '../project/files';
import { RIGHT, testGame } from '../editor/check/testGame';
import { headlessCanvas, WalkAudio } from '../walkthrough/runtime';

const FRAME_MS = 5;
class StepMachine extends Machine {
  time = 0;
  asked?: () => void;
  override now(): number {
    return this.time;
  }
  override frame(): Promise<void> {
    const frame = super.frame();
    this.asked?.();
    return frame;
  }
}

async function readVoice(pc: PcCosts | undefined, speakerOnly = false, samples = 60000) {
  const t = testGame(['##############################', '#S..........................E#', '##############################']);
  const chr = parseCharacter(t.files.get('test.chr')!);
  chr.sequences[5].sound = 0; // pressing Right starts one VOC on the game tick, not from onFrame
  t.files.set('test.chr', serializeCharacter(chr));
  const sounds = newSoundSet();
  sounds.digital[0] = 'voice';
  t.files.set('test.snd', serializeSoundSet(sounds));
  t.game.scenes[2].files[7] = 'test.snd';
  t.game.scenes[2].files[8] = 'tune.cmf';
  t.files.set('tune.cmf', new Uint8Array(readFileSync(new URL('../../../cd/gameware/glub/gmsong1.cmf', import.meta.url))));
  const voice = encodeVoc(new Float32Array(samples));
  t.files.set('voice.voc', voice);
  const audio = new WalkAudio();
  const hold = vi.spyOn(audio, 'holdMusic');
  const played: number[] = [];
  // There is no AudioContext in Node; observe the sample-start boundary, not a fabricated PCM device.
  vi.spyOn(audio, 'playVoc').mockImplementation(() => {
    played.push(m.time);
    return true;
  });
  const stopped: number[] = [];
  vi.spyOn(audio, 'stopVoc').mockImplementation(() => {
    stopped.push(m.time);
  });
  const speaker = vi.spyOn(audio, 'playSpeaker');
  const m = new StepMachine(headlessCanvas(), new GameFiles(t.files), audio, { frames: 'manual', input: false });
  const s: Session = {
    m,
    game: t.game,
    gameName: 'test',
    ci: newCharInfo(),
    colors: new Uint8Array(768),
    rec: new Recorder(),
    sndClock: 1,
    timerCounter: 1,
    soundOn: true,
    musicOn: true,
    speakerOnly,
    speed: { slowPc: pc },
  };
  const frames: { time: number; clock: number; snd: number; x: number; y: number; pending: boolean }[] = [];
  let pressed = false;
  s.onFrame = (w) => {
    frames.push({ time: m.time, clock: w.clock, snd: s.sndClock, x: w.chr.x[0], y: w.chr.y[0], pending: !!s.vocLate });
    if (!pressed) {
      pressed = true;
      m.keyboard.inject(RIGHT, true);
    }
  };
  const asked = () =>
    new Promise<void>((resolve) => {
      m.asked = resolve;
    });
  let next = asked();
  let finished = false;
  const done = playScene(s, 2, 0, 0).finally(() => {
    finished = true;
  });
  try {
    await next;
    for (let i = 0; i < 4000 && !finished; i++) {
      m.time += FRAME_MS;
      next = asked();
      m.presentFrame(false);
      await Promise.race([next, done]);
      if (frames.length && m.time - frames[0].time > 1200) break;
    }
  } finally {
    // Destroy aborts the outstanding manual frame.
    m.destroy();
    await done.catch((e: unknown) => {
      if (!(e instanceof GameAborted)) throw e;
    });
  }
  return { frames, played, stopped, hold: hold.mock.calls.map(([ms]) => ms), speaker: speaker.mock.calls.length, voice };
}

describe('VOC disk read in playScene', () => {
  it.each(['ps1', '286', '386', '486'] as const)('%s keeps the full gameplay freeze and delayed voice without an FM hold', async (preset) => {
    const pc = SPEED_PRESETS[preset];
    const r = await readVoice(pc);
    expect(r.played).toHaveLength(1);
    const start = r.stopped[0];
    const read = vocStallMs(pc, r.voice.length);
    expect(r.played[0] - start).toBeGreaterThanOrEqual(read);
    expect(r.played[0] - start).toBeLessThan(read + FRAME_MS);
    const frozen = r.frames.filter((f) => f.time >= start && f.time < start + read);
    expect(frozen.length).toBeGreaterThan(3);
    expect(new Set(frozen.map((f) => f.clock)).size).toBe(1);
    expect(new Set(frozen.map((f) => `${f.x},${f.y}`)).size).toBe(1);
    expect(frozen.at(-1)!.snd).toBeGreaterThan(frozen[0].snd); // IRQ clock still advances
    expect(r.frames.some((f) => f.time > start + read && f.clock > frozen[0].clock)).toBe(true);
    expect(r.hold.every((ms) => ms === 0)).toBe(true);
  });

  it('Today and the desk turbo play immediately without a disk hold', async () => {
    for (const pc of [undefined, TURBO_OFF]) {
      const r = await readVoice(pc);
      expect(r.played).toHaveLength(1);
      expect(r.frames.some((f) => f.pending)).toBe(false);
      expect(r.hold.every((ms) => ms === 0)).toBe(true);
    }
  });

  it('speaker fallback never opens a VOC or holds FM', async () => {
    const r = await readVoice(SPEED_PRESETS.ps1, true);
    expect(r.played).toEqual([]);
    expect(r.speaker).toBeGreaterThan(0);
    expect(r.hold.every((ms) => ms === 0)).toBe(true);
  });

  it('an over-heap PS/1 voice still stops the previous sample but never plays the failed read', async () => {
    const r = await readVoice(SPEED_PRESETS.ps1, false, 150001);
    expect(r.stopped.length).toBeGreaterThan(0);
    expect(r.played).toEqual([]);
    expect(vocStallMs(SPEED_PRESETS.ps1, r.voice.length)).toBe(80);
    expect(r.hold.every((ms) => ms === 0)).toBe(true);
  });
});
