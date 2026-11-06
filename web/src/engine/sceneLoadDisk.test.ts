// A scene load on every "Run like a" preset keeps the screen black for the emulated disk read
// (slowPc.ts sceneLoadMs, scene.ts sceneReads); Today and the desk turbo load it at once, as before.
import { describe, expect, it } from 'vitest';
import { Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { Recorder } from '@lewismoten/gamemaker-sandbox-engine/engine/recorder';
import { playScene, sceneReads, type Session } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { sceneLoadMs, SPEED_PRESETS, TURBO_OFF, type PcCosts } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPc';
import { newCharInfo } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { PALETTE_SIZE } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { GameFiles } from '../project/files';
import { testGame } from '../editor/check/testGame';
import { headlessCanvas, WalkAudio } from '../walkthrough/runtime';

const FRAME_MS = 1000 / 60;

/** A Machine on a clock of its own that moves only when the test steps it. */
class StepMachine extends Machine {
  time = 0;
  asked?: () => void;
  override now(): number {
    return this.time;
  }
  override frame(): Promise<void> {
    const p = super.frame();
    this.asked?.();
    return p;
  }
}

const ROWS = ['##########', '#S......E#', '##########'];

/**
 * Starts the test game's level on `pc` and returns the clock (ms) at the first frame of play, the
 * Session (for its sceneLoad record) and how many times the scene was entered (2 with `restart`).
 */
async function firstPlayFrame(pc: PcCosts | undefined, opts: { card?: boolean; restart?: boolean } = {}) {
  const t = testGame(ROWS);
  const audio = new WalkAudio();
  audio.card = opts.card ?? true;
  audio.musicEnabled = opts.card ?? true;
  const m = new StepMachine(headlessCanvas(), new GameFiles(t.files), audio, { frames: 'manual', input: false });
  const s: Session = {
    m,
    game: t.game,
    gameName: 'test',
    ci: newCharInfo(),
    colors: new Uint8Array(PALETTE_SIZE),
    rec: new Recorder(),
    sndClock: 1,
    timerCounter: 1,
    soundOn: true,
    musicOn: false,
    speakerOnly: false,
    speed: { slowPc: pc },
  };
  const starts: number[] = [];
  let entered = 0;
  // the first frame of each visit; with `restart`, Esc leaves the first visit and run() starts the scene again
  let shown = false;
  s.onFrame = (w) => {
    if (!shown) starts.push(m.time);
    shown = true;
    if (opts.restart && starts.length === 1) w.keydn[1] = 1;
  };
  const run = async () => {
    for (;;) {
      entered++;
      shown = false;
      await playScene(s, 2, 0, 0);
      if (!opts.restart) return;
    }
  };
  const asked = () => new Promise<void>((r) => (m.asked = r));
  let next = asked();
  const done = run().catch(() => undefined);
  await next;
  const want = opts.restart ? 2 : 1;
  for (let i = 0; i < 60 * 30 && starts.length < want; i++) {
    m.time += FRAME_MS;
    next = asked();
    m.presentFrame(false);
    await Promise.race([next, done]);
  }
  m.destroy();
  await done;
  return { starts, s, entered };
}

/**
 * Plays the test game's level on `pc`, saves with F5 into the first slot, then loads it with F6, pressing
 * Enter through their menus. Returns the Session (sceneLoad is then the F6 charge), the clock when F6 was
 * pressed and the clock at the first frame of play after it.
 */
async function saveThenLoad(pc: PcCosts | undefined) {
  const t = testGame(ROWS);
  const audio = new WalkAudio();
  audio.card = true;
  audio.musicEnabled = true;
  const m = new StepMachine(headlessCanvas(), new GameFiles(t.files), audio, { frames: 'manual', input: false });
  const s: Session = {
    m,
    game: t.game,
    gameName: 'test',
    ci: newCharInfo(),
    colors: new Uint8Array(PALETTE_SIZE),
    rec: new Recorder(),
    sndClock: 1,
    timerCounter: 1,
    soundOn: true,
    musicOn: false,
    speakerOnly: false,
    speed: { slowPc: pc },
  };
  let phase = 'play' as 'play' | 'save' | 'saved' | 'load' | 'done';
  let pressedF6 = 0;
  let backAt = 0;
  let afterSave: typeof s.sceneLoad;
  s.onFrame = (w) => {
    if (phase === 'play') {
      phase = 'save';
      w.keydn[63] = 1; // F5
    } else if (phase === 'save') {
      phase = 'saved';
      afterSave = s.sceneLoad && { ...s.sceneLoad };
    } else if (phase === 'saved') {
      phase = 'load';
      pressedF6 = m.time;
      w.keydn[64] = 1; // F6
    } else if (phase === 'load') {
      phase = 'done';
      backAt = m.time;
      w.keydn[1] = 1; // Esc: leave the level
    }
  };
  const asked = () => new Promise<void>((r) => (m.asked = r));
  let next = asked();
  const done = playScene(s, 2, 0, 0).catch(() => undefined);
  await next;
  for (let i = 0; i < 60 * 60 && phase !== 'done'; i++) {
    m.time += FRAME_MS;
    // Enter, now and then, picks the first slot and keeps its name in the save and load menus
    if ((phase === 'save' || phase === 'load') && i % 10 === 0) m.keyboard.inject(28, true);
    if ((phase === 'save' || phase === 'load') && i % 10 === 5) m.keyboard.inject(28, false);
    next = asked();
    m.presentFrame(false);
    await Promise.race([next, done]);
  }
  m.destroy();
  await done;
  return { s, t, afterSave, pressedF6, backAt, phase };
}

describe('scene-load disk cost (sceneLoadMs)', () => {
  const ps1 = SPEED_PRESETS.ps1;
  const at = SPEED_PRESETS['286'];

  it('is a fixed open per file plus its bytes at the disk speed', () => {
    expect(sceneLoadMs(ps1, [1500])).toBeCloseTo(80 + 10, 9);
    expect(sceneLoadMs(at, [4000, 0])).toBeCloseTo(30 + 10 + 30, 9);
    // a Donut level's nine files (cd/gameware/donut: palette, map, blocks, monsters, character, sounds, song)
    const donut = [768, 22000, 63000, 19200, 42000, 7568, 21000, 2430, 19479];
    expect(sceneLoadMs(ps1, donut)).toBeCloseTo(9 * 80 + 197445 / 150, 6); // about 2.0 s
    expect(sceneLoadMs(at, donut)).toBeCloseTo(9 * 30 + 197445 / 400, 6); // about 0.76 s
  });

  it('charges every preset, slowest disk first: only Today and the desk turbo (no disk figures) load at once', () => {
    const reads = [768, 22000, 63000];
    const order = [ps1, at, SPEED_PRESETS['386'], SPEED_PRESETS['486']].map((pc) => sceneLoadMs(pc, reads));
    for (const ms of order) expect(ms).toBeGreaterThan(0);
    for (let i = 1; i < order.length; i++) expect(order[i]).toBeLessThan(order[i - 1]);
    for (const pc of [undefined, TURBO_OFF]) expect(sceneLoadMs(pc, reads)).toBe(0);
  });

  it('costs nothing for a scene that opens no files', () => {
    expect(sceneLoadMs(ps1, [])).toBe(0);
    expect(sceneLoadMs(at, [])).toBe(0);
  });
});

describe('the files a scene load reads (sceneReads)', () => {
  it('reads each named slot, skips blank ones, and the song only with a card', () => {
    const t = testGame(ROWS);
    const s = { game: t.game, m: { files: { get: (n: string) => t.files.get(n) } } };
    const sizes = ['test.map', 'test.bbl', 'test.chr', 'test.cbl'].map((n) => t.files.get(n)!.length);
    expect(sceneReads(s, 2, true)).toEqual(sizes); // pal, mon, mbl, snd and song are blank
    t.game.scenes[2].files[8] = 'tune.cmf';
    t.files.set('tune.cmf', new Uint8Array(1234));
    expect(sceneReads(s, 2, true)).toEqual([...sizes, 1234]);
    expect(sceneReads(s, 2, false)).toEqual(sizes);
    // a named sound set the disk lacks still costs its directory search
    t.game.scenes[2].files[7] = 'gone.snd';
    expect(sceneReads(s, 2, false)).toEqual([...sizes, 0]);
    // a scene with every slot blank reads nothing
    expect(sceneReads(s, 0, true)).toEqual([]);
  });
});

describe('playScene on a slow disk', () => {
  it('holds the black screen for the read on every preset, and not on Today or the desk turbo', async () => {
    const t = testGame(ROWS);
    const bytes = ['test.map', 'test.bbl', 'test.chr', 'test.cbl'].reduce((a, n) => a + t.files.get(n)!.length, 0);
    const today = await firstPlayFrame(undefined);
    expect(today.s.sceneLoad).toBeUndefined();
    const turbo = await firstPlayFrame(TURBO_OFF);
    expect(turbo.starts[0]).toBe(today.starts[0]);
    expect(turbo.s.sceneLoad).toBeUndefined();
    for (const k of ['ps1', '286', '386', '486'] as const) {
      const pc = SPEED_PRESETS[k];
      const ms = 4 * pc.vocOpenMs! + bytes / pc.vocBytesPerMs!;
      const r = await firstPlayFrame(pc);
      expect(r.s.sceneLoad).toMatchObject({ files: 4, bytes });
      expect(r.s.sceneLoad!.ms).toBeCloseTo(ms, 9);
      // the wait is whole frames of the machine's clock: at least the read, less than a frame over
      const late = r.starts[0] - today.starts[0];
      expect(late).toBeGreaterThanOrEqual(ms - FRAME_MS);
      expect(late).toBeLessThan(ms + 2 * FRAME_MS);
    }
  }, 60_000);

  it('reads the scene again each time it starts (no cache)', async () => {
    const pc = SPEED_PRESETS.ps1;
    const r = await firstPlayFrame(pc, { restart: true });
    expect(r.entered).toBeGreaterThanOrEqual(2);
    expect(r.starts.length).toBeGreaterThanOrEqual(2);
    const today = await firstPlayFrame(undefined, { restart: true });
    // the second visit's black screen is as long as the first one's
    const gap = (x: { starts: number[] }) => x.starts[1] - x.starts[0];
    expect(gap(r) - gap(today)).toBeGreaterThanOrEqual(r.s.sceneLoad!.ms - 2 * FRAME_MS);
  }, 60_000);

  it("F6's LoadGame reads the level's files again, all but the map and character, on every preset", async () => {
    const today = await saveThenLoad(undefined);
    expect(today.phase).toBe('done');
    expect(today.s.sceneLoad).toBeUndefined();
    const f6Bytes = (t: ReturnType<typeof testGame>) => ['test.bbl', 'test.cbl'].map((n) => t.files.get(n)!.length);
    for (const k of ['ps1', '286', '386', '486'] as const) {
      const pc = SPEED_PRESETS[k];
      const r = await saveThenLoad(pc);
      expect(r.phase).toBe('done');
      // the level load before the save charged all four named files
      expect(r.afterSave?.files).toBe(4);
      // F6: the blocks and the character's blocks; map and character come from the save (PLAYGAME.C 1798-1806)
      const reads = f6Bytes(r.t);
      expect(r.s.sceneLoad).toMatchObject({ files: 2, bytes: reads[0] + reads[1] });
      expect(r.s.sceneLoad!.ms).toBeCloseTo(sceneLoadMs(pc, reads), 9);
      // the F6 screen lasts at least the read longer than Today's
      expect(r.backAt - r.pressedF6).toBeGreaterThanOrEqual(r.s.sceneLoad!.ms);
    }
  }, 120_000);
});
