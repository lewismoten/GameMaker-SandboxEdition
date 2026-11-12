// Carl's basic-key actions and full route, without removing his original controls.
import { describe, expect, it, vi } from 'vitest';
import { Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { runGame } from '@lewismoten/gamemaker-sandbox-engine/engine/game';
import { diskFiles, replay } from '../../games/kit/walkthrough';
import { headlessCanvas, WalkAudio } from '../src/walkthrough/runtime';
import { decodeKeys, type Walkthrough } from '../src/walkthrough/format';
import walkthrough from '../../games/carl/walkthrough.json';
import { buildCarl } from '../../games/carl/src/characters';
import { buildPalette } from '../../games/carl/src/art/pal';
import { buildCharBlocks } from '../../games/carl/src/sprites/sprites';
import { Bot } from '../../games/carl/tools/bot';
import { GameSim } from '../../games/carl/tools/sim';
import { theAux, theBed, theCouch, theWalls, theWild, theWindow } from '../../games/carl/tools/route';
import { SEQ } from '../../games/carl/src/ids';

describe('Carl keyboard traversal', () => {
  it('replays the shipped basic-only walkthrough through menus, every level, ending and credits', async () => {
    const walk = walkthrough as Walkthrough;
    const downs = walk.segments
      .flatMap((s) => decodeKeys(s.keys))
      .map((e) => e.key)
      .filter((k) => !(k & 0x80));
    expect(downs.every((k) => [72, 80, 75, 77, 57, 28].includes(k))).toBe(true);
    const result = await replay('carl', walk, { clips: true });
    expect(result.error).toBeUndefined();
    expect(result.won).toBe(true);
    expect(result.scenes).toEqual([2, 3, 4, 5, 6, 7, 1]);
    expect(result.keysLeft).toBe(0);
    expect(result.clipCuts).toEqual([]);
    expect(result.chapters.map((c) => c.title)).toContain('Credits');
  }, 30000);

  it('returns from a lost game and starts fresh using Enter alone', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    class SteppedMachine extends Machine {
      time = 0;
      override now(): number {
        return this.time;
      }
    }
    const m = new SteppedMachine(headlessCanvas(), diskFiles('carl'), new WalkAudio(), { frames: 'manual', input: false });
    const starts: { hp: number; lives: number; score: number }[] = [];
    let playing = false;
    let fresh = false;
    let entries = 0;
    const ended = runGame(m, 'carl.gam', {
      skipTitle: true,
      onSession: (s) => {
        s.onScene = (scene) => {
          playing = scene > 1;
          if (scene === 2) entries++;
        };
      },
      onFrame: (w) => {
        if (fresh || entries <= starts.length) return;
        starts.push({ hp: w.ci.hitpts, lives: w.ci.lives, score: w.ci.score });
        if (starts.length === 1) {
          w.ci.hitpts = 0;
          w.ci.lives = 0;
          playing = false;
        } else fresh = true;
      },
    }).catch((e: unknown) => {
      if (!m.aborted) throw e;
    });
    try {
      for (let i = 0; i < 5000 && !fresh; i++) {
        if (!playing && i % 20 === 0) {
          m.keyboard.inject(28, true);
          m.keyboard.inject(28, false);
        }
        m.time += 1000 / 60;
        m.presentFrame(false);
        await vi.advanceTimersByTimeAsync(0);
      }
      expect(fresh).toBe(true);
      expect(starts).toEqual([
        { hp: 100, lives: 3, score: 0 },
        { hp: 100, lives: 3, score: 0 },
      ]);
    } finally {
      m.destroy();
      await ended;
      vi.useRealTimers();
    }
  }, 30000);
  it('wins all six levels with arrows, Space and Enter, including every required counter gate', async () => {
    const sim = new GameSim(undefined, 1);
    const bot = new Bot(sim, true);
    for (const route of [theCouch, theWalls, theBed, theWindow, theWild, theAux]) await route(bot);
    expect(sim.ended).toBe('won');
    expect(sim.deaths).toBe(0);
    const downs = sim.segments
      .flatMap((s) => s.keys)
      .map((e) => e.key)
      .filter((k) => !(k & 0x80));
    expect(downs).toContain(28);
    expect(downs.every((k) => [72, 80, 75, 77, 57, 28].includes(k))).toBe(true);
  }, 30000);
  it('flies a two-axis route and buzzes using only basic keys in basic mode', async () => {
    const sim = new GameSim(undefined, 1);
    const bot = new Bot(sim, true);
    expect(await bot.fly(3, 8)).toBeUndefined();
    expect(await bot.fly(4, 4)).toBeUndefined();
    expect(await bot.tap('b', 14)).toBeUndefined();
    const downs = sim.segments
      .flatMap((s) => s.keys)
      .map((e) => e.key)
      .filter((key) => !(key & 0x80));
    expect(downs).toContain(28);
    expect(
      downs.every((key) => [72, 80, 75, 77, 57, 28].includes(key)),
      `non-basic presses: ${downs.join(',')}`,
    ).toBe(true);
  });
  it('buzzes with Enter as well as B, preserving the original sequence and joystick', () => {
    const ch = buildCarl(buildCharBlocks(buildPalette('plain')));
    const original = ch.sequences[SEQ.buzz];
    const enter = ch.sequences.find((s) => s.key === 0x1c0d);
    expect(enter, 'the required buzz needs a basic-key binding').toBeDefined();
    expect(original.key).toBe(0x3062);
    expect(original.jstkBut).toBe(2);
    expect(enter!.jstkBut).toBe(4);
    for (const scan of [16, 18, 44, 46, 71, 73, 79, 81, 48]) expect(ch.sequences.some((s) => s.key >> 8 === scan)).toBe(true);
    expect(
      ch.sequences
        .filter((s) => s.jstkMov > 0)
        .map((s) => s.jstkMov)
        .sort(),
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(enter!.frames).toEqual(original.frames);
    expect(enter!.sound).toBe(original.sound);
    expect(enter!.norepeat).toBe(original.norepeat);
    expect(enter!.ground).toBe(original.ground);
  });
});
